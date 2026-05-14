import request from 'supertest';
import app from '../../src/app.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';
import prisma from '../../src/common/lib/prisma.js';

describe('Work Order Module Tests', () => {
    let managerToken: string;
    let salesWhId: number;
    let errorWhId: number;
    let validPrId: number;
    let validProductId: number;

    beforeAll(async () => {
        managerToken = await getAuthToken('manager');

        const salesWh = await prisma.warehouse.findFirst({ where: { warehouseType: 'SALES' } });
        const errorWh = await prisma.warehouse.findFirst({ where: { warehouseType: 'ERROR' } });
        
        if (!salesWh || !errorWh) {
            throw new Error('Test setup failed: SALES or ERROR warehouse not found.');
        }

        salesWhId = salesWh.warehouseId;
        errorWhId = errorWh.warehouseId;

        const product = await dbHelper.getProductWithBOM();
        validProductId = product.productId;

        const manager = await dbHelper.getManager();
        const pr = await prisma.productionRequest.create({
            data: {
                productId: validProductId,
                quantity: 10,
                employeeId: manager!.employeeId,
                status: 'APPROVED',
                code: `PR-TEST-WO-${Date.now()}`
            }
        });
        validPrId = pr.productionRequestId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    describe('TC-WO-01: Tạo mới Work Order thành công (DRAFT)', () => {
        it('Should create a Work Order in DRAFT status linked to a PR', async () => {
            const res = await request(app)
                .post('/api/work-orders')
                .set('Authorization', managerToken)
                .send({
                    productionRequestId: validPrId,
                    productId: validProductId,
                    quantity: 10
                });
            
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('DRAFT');
            expect(res.body.productionRequestId || res.body.workOrderFulfillments?.[0]?.productionRequestId).toBeDefined();
            expect(res.body.code).toMatch(/^WO-/);
        });
    });

    describe('TC-WO-02: Negative - Material Request Completion Gate Violation', () => {
        it('Should return 400 when completing WO while MR is missing or PENDING', async () => {
            const manager = await dbHelper.getManager();
            const pr = await prisma.productionRequest.create({
                data: { productId: validProductId, quantity: 5, employeeId: manager!.employeeId, status: 'APPROVED', code: `PR-TEST-WO2-${Date.now()}` }
            });
            
            const woRes = await request(app)
                .post('/api/work-orders')
                .set('Authorization', managerToken)
                .send({ productionRequestId: pr.productionRequestId, productId: pr.productId, quantity: 5 });
            const woId = woRes.body.workOrderId;

            await request(app).put(`/api/work-orders/${woId}`).set('Authorization', managerToken).send({
                targetSalesWarehouseId: salesWhId, targetErrorWarehouseId: errorWhId
            });
            await request(app).put(`/api/work-orders/${woId}/release`).set('Authorization', managerToken);
            await request(app).put(`/api/work-orders/${woId}/start`).set('Authorization', managerToken);

            const completeRes = await request(app)
                .put(`/api/work-orders/${woId}/complete`)
                .set('Authorization', managerToken)
                .send({ quantityProduced: 5, laborCost: 100, overheadCost: 50 });

            expect(completeRes.status).toBe(400);
            expect(completeRes.body.message || completeRes.body.error).toMatch(/Material Request|ISSUED/i);
        });
    });

    describe('TC-WO-03: State Transition - Cancellation of IN_PROGRESS Work Order', () => {
        it('Should cancel WO, auto-cancel MR, and revert PR', async () => {
            const manager = await dbHelper.getManager();
            const pr = await prisma.productionRequest.create({
                data: { productId: validProductId, quantity: 3, employeeId: manager!.employeeId, status: 'APPROVED', code: `PR-TEST-WO3-${Date.now()}` }
            });
            
            const woRes = await request(app)
                .post('/api/work-orders')
                .set('Authorization', managerToken)
                .send({ productionRequestId: pr.productionRequestId, productId: pr.productId, quantity: 3 });
            const woId = woRes.body.workOrderId;

            await request(app).put(`/api/work-orders/${woId}`).set('Authorization', managerToken).send({
                targetSalesWarehouseId: salesWhId, targetErrorWarehouseId: errorWhId
            });
            await request(app).put(`/api/work-orders/${woId}/release`).set('Authorization', managerToken);
            await request(app).put(`/api/work-orders/${woId}/start`).set('Authorization', managerToken);

            await prisma.materialRequest.create({
                data: {
                    workOrderId: woId,
                    status: 'PENDING',
                    code: `MR-WO3-${woId}`
                }
            });

            const cancelRes = await request(app)
                .put(`/api/work-orders/${woId}/cancel`)
                .set('Authorization', managerToken)
                .send({ reason: 'Lỗi dây chuyền sản xuất' });

            expect(cancelRes.status).toBe(200);
            
            const wo = await prisma.workOrder.findUnique({ where: { workOrderId: woId } });
            expect(wo!.status).toBe('CANCELLED');

            const mr = await prisma.materialRequest.findUnique({ where: { workOrderId: woId } });
            expect(mr!.status).toBe('CANCELLED');

            const updatedPr = await prisma.productionRequest.findUnique({ where: { productionRequestId: pr.productionRequestId } });
            expect(updatedPr!.status).toBe('APPROVED');
        });
    });
});
