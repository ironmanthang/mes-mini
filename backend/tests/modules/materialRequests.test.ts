import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/common/lib/prisma.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

interface MaterialFixture {
    workOrderId: number;
    componentWarehouseId: number;
    expectedComponents: Set<number>;
}

const uniqueCode = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const uniqueLot = (componentId: number): string =>
    `LOT-TEST-${componentId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

describe('Material Request Module Tests', () => {
    let adminToken: string;
    let adminEmployeeId: number;

    beforeAll(async () => {
        adminToken = await getAuthToken('admin');
        const adminEmployee = await prisma.employee.findFirst({
            where: { username: 'admin' },
            select: { employeeId: true }
        });
        if (!adminEmployee) {
            throw new Error('Test Data Missing: admin employee not found.');
        }
        adminEmployeeId = adminEmployee.employeeId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    const createInProgressWorkOrderFixture = async (quantity = 2): Promise<MaterialFixture> => {
        const product = await dbHelper.getProductWithBOM();
        const componentWarehouse = await dbHelper.getComponentWarehouse();

        const pr = await prisma.productionRequest.create({
            data: {
                code: uniqueCode('PR-MR'),
                productId: product.productId,
                quantity,
                employeeId: adminEmployeeId,
                status: 'APPROVED',
                details: {
                    create: product.bom.map((bomItem) => ({
                        componentId: bomItem.componentId,
                        quantityPerUnit: bomItem.quantityNeeded,
                        totalRequired: bomItem.quantityNeeded * quantity
                    }))
                }
            },
            include: { details: true }
        });

        const wo = await prisma.workOrder.create({
            data: {
                code: uniqueCode('WO-MR'),
                productId: product.productId,
                quantity,
                employeeId: adminEmployeeId,
                status: 'IN_PROGRESS'
            }
        });

        await prisma.workOrderFulfillment.create({
            data: {
                workOrderId: wo.workOrderId,
                productionRequestId: pr.productionRequestId,
                quantity
            }
        });

        return {
            workOrderId: wo.workOrderId,
            componentWarehouseId: componentWarehouse.warehouseId,
            expectedComponents: new Set(pr.details.map((d) => d.componentId))
        };
    };

    const seedStockLotsForRequest = async (
        requestId: number,
        warehouseId: number,
        mode: 'sufficient' | 'firstLotInsufficient'
    ) => {
        const supplier = await prisma.supplier.findFirst({ select: { supplierId: true } });
        if (!supplier) {
            throw new Error('Test Data Missing: supplier not found.');
        }

        const mr = await prisma.materialRequest.findUnique({
            where: { requestId },
            include: { details: true }
        });
        if (!mr) {
            throw new Error(`Material Request ${requestId} not found.`);
        }

        const consumedLots: { componentId: number; lotCode: string; quantity: number }[] = [];

        for (let i = 0; i < mr.details.length; i++) {
            const detail = mr.details[i];

            const po = await prisma.purchaseOrder.create({
                data: {
                    code: uniqueCode(`PO-MR-${detail.componentId}`),
                    employeeId: adminEmployeeId,
                    supplierId: supplier.supplierId,
                    warehouseId,
                    status: 'ORDERED',
                    totalAmount: 0,
                    details: {
                        create: {
                            componentId: detail.componentId,
                            quantityOrdered: Math.max(detail.quantity, 1),
                            quantityReceived: 0,
                            unitPrice: 1
                        }
                    }
                },
                include: { details: true }
            });

            const lotQuantity =
                mode === 'firstLotInsufficient' && i === 0
                    ? Math.max(detail.quantity - 1, 1)
                    : detail.quantity + 2;

            const lotCode = uniqueLot(detail.componentId);

            await prisma.componentLot.create({
                data: {
                    lotCode,
                    componentId: detail.componentId,
                    poDetailId: po.details[0].poDetailId,
                    warehouseId,
                    initialQuantity: lotQuantity,
                    currentQuantity: lotQuantity
                }
            });

            const aggregateStockQty = detail.quantity + 5;
            await prisma.componentStock.upsert({
                where: {
                    warehouseId_componentId: {
                        warehouseId,
                        componentId: detail.componentId
                    }
                },
                update: { quantity: aggregateStockQty },
                create: {
                    warehouseId,
                    componentId: detail.componentId,
                    quantity: aggregateStockQty
                }
            });

            consumedLots.push({
                componentId: detail.componentId,
                lotCode,
                quantity: detail.quantity
            });
        }

        return { mr, consumedLots };
    };

    describe('TC-MR-01: Create Material Request + Validate Stock (Happy Path)', () => {
        it('Should create MR in PENDING and validate with canIssue=true when stock is sufficient', async () => {
            const fixture = await createInProgressWorkOrderFixture(2);

            const createRes = await request(app)
                .post('/api/warehouse-ops/material-requests')
                .set('Authorization', adminToken)
                .send({ workOrderId: fixture.workOrderId });

            expect(createRes.status).toBe(201);
            expect(createRes.body.status).toBe('PENDING');
            expect(Array.isArray(createRes.body.details)).toBe(true);
            expect(createRes.body.details.length).toBeGreaterThan(0);
            const requestId = createRes.body.requestId as number;

            const detailComponents = new Set<number>(
                createRes.body.details.map((d: { componentId: number }) => d.componentId)
            );
            expect(detailComponents).toEqual(fixture.expectedComponents);

            await seedStockLotsForRequest(requestId, fixture.componentWarehouseId, 'sufficient');

            const txBefore = await prisma.inventoryTransaction.count({
                where: { materialReqId: requestId, transactionType: 'EXPORT_PRODUCTION' }
            });

            const validateRes = await request(app)
                .put(`/api/warehouse-ops/material-requests/${requestId}/validate`)
                .set('Authorization', adminToken)
                .send({ warehouseId: fixture.componentWarehouseId });

            expect(validateRes.status).toBe(200);
            expect(validateRes.body.requestId).toBe(requestId);
            expect(validateRes.body.status).toBe('PENDING');
            expect(validateRes.body.canIssue).toBe(true);
            expect(Array.isArray(validateRes.body.lines)).toBe(true);
            for (const line of validateRes.body.lines) {
                expect(line.missingQuantity).toBe(0);
                expect(line.isSufficient).toBe(true);
            }

            const txAfter = await prisma.inventoryTransaction.count({
                where: { materialReqId: requestId, transactionType: 'EXPORT_PRODUCTION' }
            });
            expect(txAfter).toBe(txBefore);
        });
    });

    describe('TC-MR-02: Complete Material Request Successfully (Happy Path)', () => {
        it('Should deduct stock/lots, create EXPORT_PRODUCTION transactions, and move MR to ISSUED', async () => {
            const fixture = await createInProgressWorkOrderFixture(2);

            const createRes = await request(app)
                .post('/api/warehouse-ops/material-requests')
                .set('Authorization', adminToken)
                .send({ workOrderId: fixture.workOrderId });
            expect(createRes.status).toBe(201);
            const requestId = createRes.body.requestId as number;

            const { mr, consumedLots } = await seedStockLotsForRequest(
                requestId,
                fixture.componentWarehouseId,
                'sufficient'
            );

            const beforeLots = await prisma.componentLot.findMany({
                where: { lotCode: { in: consumedLots.map((l) => l.lotCode) } },
                select: { lotCode: true, currentQuantity: true }
            });
            const beforeByLot = new Map(beforeLots.map((lot) => [lot.lotCode, lot.currentQuantity]));

            const completeRes = await request(app)
                .put(`/api/warehouse-ops/material-requests/${requestId}/complete`)
                .set('Authorization', adminToken)
                .send({
                    warehouseId: fixture.componentWarehouseId,
                    consumedLots
                });

            expect(completeRes.status).toBe(200);
            expect(completeRes.body.result.status).toBe('ISSUED');
            expect(completeRes.body.result.requestId).toBe(requestId);

            const issuedMr = await prisma.materialRequest.findUnique({
                where: { requestId },
                select: { status: true, completedAt: true, completedById: true }
            });
            expect(issuedMr?.status).toBe('ISSUED');
            expect(issuedMr?.completedAt).not.toBeNull();
            expect(issuedMr?.completedById).toBe(adminEmployeeId);

            for (const consumed of consumedLots) {
                const afterLot = await prisma.componentLot.findUnique({
                    where: { lotCode: consumed.lotCode },
                    select: { currentQuantity: true }
                });
                const beforeQty = beforeByLot.get(consumed.lotCode);
                expect(beforeQty).toBeDefined();
                expect(afterLot?.currentQuantity).toBe((beforeQty as number) - consumed.quantity);
            }

            const txCount = await prisma.inventoryTransaction.count({
                where: { materialReqId: requestId, transactionType: 'EXPORT_PRODUCTION' }
            });
            expect(txCount).toBe(consumedLots.length);

            // Defensive check: total provided quantities match MR details (BOM strictness)
            const providedByComponent = new Map<number, number>();
            for (const c of consumedLots) {
                providedByComponent.set(c.componentId, (providedByComponent.get(c.componentId) || 0) + c.quantity);
            }
            for (const detail of mr.details) {
                expect(providedByComponent.get(detail.componentId)).toBe(detail.quantity);
            }
        });
    });

    describe('TC-MR-03: Reject Complete When Lot Quantity Is Insufficient (Negative)', () => {
        it('Should return 400, keep MR PENDING, and keep inventory unchanged (atomicity)', async () => {
            const fixture = await createInProgressWorkOrderFixture(2);

            const createRes = await request(app)
                .post('/api/warehouse-ops/material-requests')
                .set('Authorization', adminToken)
                .send({ workOrderId: fixture.workOrderId });
            expect(createRes.status).toBe(201);
            const requestId = createRes.body.requestId as number;

            const { consumedLots } = await seedStockLotsForRequest(
                requestId,
                fixture.componentWarehouseId,
                'firstLotInsufficient'
            );

            const lotsBefore = await prisma.componentLot.findMany({
                where: { lotCode: { in: consumedLots.map((l) => l.lotCode) } },
                select: { lotCode: true, currentQuantity: true }
            });
            const mrBefore = await prisma.materialRequest.findUnique({
                where: { requestId },
                select: { status: true }
            });
            const txBefore = await prisma.inventoryTransaction.count({
                where: { materialReqId: requestId, transactionType: 'EXPORT_PRODUCTION' }
            });

            const completeRes = await request(app)
                .put(`/api/warehouse-ops/material-requests/${requestId}/complete`)
                .set('Authorization', adminToken)
                .send({
                    warehouseId: fixture.componentWarehouseId,
                    consumedLots
                });

            expect(completeRes.status).toBe(400);
            expect((completeRes.body.message || '').toLowerCase()).toContain('insufficient');

            const mrAfter = await prisma.materialRequest.findUnique({
                where: { requestId },
                select: { status: true }
            });
            expect(mrBefore?.status).toBe('PENDING');
            expect(mrAfter?.status).toBe('PENDING');

            const lotsAfter = await prisma.componentLot.findMany({
                where: { lotCode: { in: consumedLots.map((l) => l.lotCode) } },
                select: { lotCode: true, currentQuantity: true }
            });
            const beforeMap = new Map(lotsBefore.map((lot) => [lot.lotCode, lot.currentQuantity]));
            for (const lot of lotsAfter) {
                expect(lot.currentQuantity).toBe(beforeMap.get(lot.lotCode));
            }

            const txAfter = await prisma.inventoryTransaction.count({
                where: { materialReqId: requestId, transactionType: 'EXPORT_PRODUCTION' }
            });
            expect(txAfter).toBe(txBefore);
        });
    });
});
