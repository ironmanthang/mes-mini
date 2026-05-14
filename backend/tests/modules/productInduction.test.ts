import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/common/lib/prisma.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

const uniqueCode = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

interface InductionFixture {
    passedSerials: string[];
    failedSerials: string[];
    salesWarehouseId: number;
    errorWarehouseId: number;
}

describe('Product Induction Module Tests', () => {
    let inductToken: string;
    let adminEmployeeId: number;

    beforeAll(async () => {
        inductToken = await getAuthToken('admin');
        const admin = await prisma.employee.findFirst({
            where: { username: 'admin' },
            select: { employeeId: true }
        });
        if (!admin) {
            throw new Error('Test Data Missing: admin employee not found.');
        }
        adminEmployeeId = admin.employeeId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    const createQcReadyInstances = async (
        counts: { passed: number; failed: number }
    ): Promise<InductionFixture> => {
        const product = await dbHelper.getProductWithBOM();
        const salesWarehouse = await prisma.warehouse.findFirst({
            where: { warehouseType: 'SALES' },
            select: { warehouseId: true }
        });
        const errorWarehouse = await prisma.warehouse.findFirst({
            where: { warehouseType: 'ERROR' },
            select: { warehouseId: true }
        });

        if (!salesWarehouse || !errorWarehouse) {
            throw new Error('Test Data Missing: SALES/ERROR warehouse not found.');
        }

        const wo = await prisma.workOrder.create({
            data: {
                code: uniqueCode('WO-IND'),
                productId: product.productId,
                quantity: Math.max(counts.passed + counts.failed, 1),
                employeeId: adminEmployeeId,
                status: 'COMPLETED',
                targetSalesWarehouseId: salesWarehouse.warehouseId,
                targetErrorWarehouseId: errorWarehouse.warehouseId,
                laborCost: 100,
                overheadCost: 100
            }
        });

        const batch = await prisma.productionBatch.create({
            data: {
                batchCode: uniqueCode('BATCH-IND'),
                productionDate: new Date(),
                workOrderId: wo.workOrderId
            }
        });

        const passedSerials: string[] = [];
        const failedSerials: string[] = [];

        for (let i = 0; i < counts.passed; i++) {
            const serial = uniqueCode(`SN-PASS-${i + 1}`);
            passedSerials.push(serial);
            await prisma.productInstance.create({
                data: {
                    serialNumber: serial,
                    productId: product.productId,
                    productionBatchId: batch.productionBatchId,
                    status: 'PASSED_QC'
                }
            });
        }

        for (let i = 0; i < counts.failed; i++) {
            const serial = uniqueCode(`SN-FAIL-${i + 1}`);
            failedSerials.push(serial);
            await prisma.productInstance.create({
                data: {
                    serialNumber: serial,
                    productId: product.productId,
                    productionBatchId: batch.productionBatchId,
                    status: 'FAILED_QC'
                }
            });
        }

        return {
            passedSerials,
            failedSerials,
            salesWarehouseId: salesWarehouse.warehouseId,
            errorWarehouseId: errorWarehouse.warehouseId
        };
    };

    describe('TC-IND-01: Induct PASSED_QC into SALES Warehouse (Happy Path)', () => {
        it('Should move PASSED_QC instance to IN_STOCK_SALES and create IMPORT_PRODUCTION transaction', async () => {
            const fixture = await createQcReadyInstances({ passed: 1, failed: 0 });
            const serial = fixture.passedSerials[0];

            const res = await request(app)
                .post('/api/warehouse-ops/product-induction')
                .set('Authorization', inductToken)
                .send({ serialNumbers: [serial] });

            expect(res.status).toBe(200);
            expect(res.body.totalInducted).toBe(1);
            expect(res.body.inducted[0].serialNumber).toBe(serial);
            expect(res.body.inducted[0].status).toBe('IN_STOCK_SALES');
            expect(res.body.inducted[0].warehouseId).toBe(fixture.salesWarehouseId);

            const instance = await prisma.productInstance.findUnique({
                where: { serialNumber: serial },
                select: { status: true, warehouseId: true, receivedAt: true, productInstanceId: true }
            });
            expect(instance?.status).toBe('IN_STOCK_SALES');
            expect(instance?.warehouseId).toBe(fixture.salesWarehouseId);
            expect(instance?.receivedAt).not.toBeNull();

            const txCount = await prisma.inventoryTransaction.count({
                where: {
                    productInstanceId: instance?.productInstanceId,
                    transactionType: 'IMPORT_PRODUCTION',
                    warehouseId: fixture.salesWarehouseId
                }
            });
            expect(txCount).toBe(1);
        });
    });

    describe('TC-IND-02: Induct Mixed PASSED_QC + FAILED_QC Batch (Happy Path)', () => {
        it('Should route passed items to SALES and failed items to ERROR warehouse', async () => {
            const fixture = await createQcReadyInstances({ passed: 1, failed: 1 });
            const passedSerial = fixture.passedSerials[0];
            const failedSerial = fixture.failedSerials[0];

            const res = await request(app)
                .post('/api/warehouse-ops/product-induction')
                .set('Authorization', inductToken)
                .send({ serialNumbers: [passedSerial, failedSerial] });

            expect(res.status).toBe(200);
            expect(res.body.totalInducted).toBe(2);

            const bySerial = new Map(
                (res.body.inducted as Array<{ serialNumber: string; status: string; warehouseId: number }>)
                    .map((row) => [row.serialNumber, row])
            );

            expect(bySerial.get(passedSerial)?.status).toBe('IN_STOCK_SALES');
            expect(bySerial.get(passedSerial)?.warehouseId).toBe(fixture.salesWarehouseId);
            expect(bySerial.get(failedSerial)?.status).toBe('IN_STOCK_ERROR');
            expect(bySerial.get(failedSerial)?.warehouseId).toBe(fixture.errorWarehouseId);

            const passedDb = await prisma.productInstance.findUnique({
                where: { serialNumber: passedSerial },
                select: { status: true, warehouseId: true, productInstanceId: true }
            });
            const failedDb = await prisma.productInstance.findUnique({
                where: { serialNumber: failedSerial },
                select: { status: true, warehouseId: true, productInstanceId: true }
            });

            expect(passedDb?.status).toBe('IN_STOCK_SALES');
            expect(passedDb?.warehouseId).toBe(fixture.salesWarehouseId);
            expect(failedDb?.status).toBe('IN_STOCK_ERROR');
            expect(failedDb?.warehouseId).toBe(fixture.errorWarehouseId);

            const txCount = await prisma.inventoryTransaction.count({
                where: {
                    productInstanceId: {
                        in: [passedDb?.productInstanceId, failedDb?.productInstanceId].filter(
                            (id): id is number => typeof id === 'number'
                        )
                    },
                    transactionType: 'IMPORT_PRODUCTION'
                }
            });
            expect(txCount).toBe(2);
        });
    });

    describe('TC-IND-03: Batch Rejection on Invalid Serial (Negative / Atomicity)', () => {
        it('Should reject the whole request when one serial is invalid and keep valid serial unchanged', async () => {
            const fixture = await createQcReadyInstances({ passed: 1, failed: 0 });
            const validSerial = fixture.passedSerials[0];
            const invalidSerial = uniqueCode('SN-NOT-FOUND');

            const validBefore = await prisma.productInstance.findUnique({
                where: { serialNumber: validSerial },
                select: { status: true, productInstanceId: true }
            });
            expect(validBefore?.status).toBe('PASSED_QC');

            const txBefore = await prisma.inventoryTransaction.count({
                where: {
                    productInstanceId: validBefore?.productInstanceId,
                    transactionType: 'IMPORT_PRODUCTION'
                }
            });

            const res = await request(app)
                .post('/api/warehouse-ops/product-induction')
                .set('Authorization', inductToken)
                .send({ serialNumbers: [validSerial, invalidSerial] });

            expect(res.status).toBe(400);
            expect((res.body.message || '').toLowerCase()).toContain('not found');

            const validAfter = await prisma.productInstance.findUnique({
                where: { serialNumber: validSerial },
                select: { status: true, warehouseId: true, receivedAt: true, productInstanceId: true }
            });
            expect(validAfter?.status).toBe('PASSED_QC');
            expect(validAfter?.warehouseId).toBeNull();
            expect(validAfter?.receivedAt).toBeNull();

            const txAfter = await prisma.inventoryTransaction.count({
                where: {
                    productInstanceId: validAfter?.productInstanceId,
                    transactionType: 'IMPORT_PRODUCTION'
                }
            });
            expect(txAfter).toBe(txBefore);
        });
    });
});
