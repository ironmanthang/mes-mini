import request from 'supertest';
import app from '../../src/app.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';
import prisma from '../../src/common/lib/prisma.js';

describe('Purchase Order - Receive Goods Tests', () => {
    let purchaserToken: string;
    let validSupplierId: number;
    let validWarehouseId: number;
    let validComponentId: number;

    let poOrderedId: number;
    let poReceivingId: number;
    let poApprovedId: number;
    let prWaitingMaterialId: number;

    beforeAll(async () => {
        purchaserToken = await getAuthToken('admin');

        const supplierComponent = await dbHelper.getSupplierAndComponent();
        validSupplierId = supplierComponent.supplierId;
        validComponentId = supplierComponent.componentId;

        const warehouse = await dbHelper.getComponentWarehouse();
        validWarehouseId = warehouse.warehouseId;

        const product = await dbHelper.getProductWithBOM();
        const adminEmployee = await prisma.employee.findFirst({ where: { username: 'admin' } });
        if (!adminEmployee) throw new Error('Test Data Missing: admin employee not found in seed');
        const employeeId = adminEmployee.employeeId;

        // Setup PR for TC-RCV-02 (WAITING_MATERIAL → PENDING after full receipt)
        const pr = await prisma.productionRequest.create({
            data: {
                code: 'PR-TEST-RCV-' + Date.now(),
                productId: product.productId,
                employeeId,
                quantity: 10,
                status: 'WAITING_MATERIAL',
                details: {
                    create: {
                        componentId: validComponentId,
                        quantityPerUnit: 10,
                        totalRequired: 100
                    }
                }
            }
        });
        prWaitingMaterialId = pr.productionRequestId;

        // PO for TC-RCV-01 (ORDERED, 100 items)
        const po1 = await prisma.purchaseOrder.create({
            data: {
                code: 'PO-TEST-ORD-' + Date.now(),
                employeeId,
                supplierId: validSupplierId,
                warehouseId: validWarehouseId,
                status: 'ORDERED',
                orderDate: new Date(),
                totalAmount: 10000,
                details: {
                    create: {
                        componentId: validComponentId,
                        quantityOrdered: 100,
                        quantityReceived: 0,
                        unitPrice: 100
                    }
                }
            }
        });
        poOrderedId = po1.purchaseOrderId;

        // PO for TC-RCV-02 (RECEIVING, ordered 100, received 40)
        const po2 = await prisma.purchaseOrder.create({
            data: {
                code: 'PO-TEST-RCV-' + Date.now(),
                employeeId,
                supplierId: validSupplierId,
                warehouseId: validWarehouseId,
                status: 'RECEIVING',
                orderDate: new Date(),
                totalAmount: 10000,
                details: {
                    create: {
                        componentId: validComponentId,
                        quantityOrdered: 100,
                        quantityReceived: 40,
                        unitPrice: 100,
                        productionRequestId: prWaitingMaterialId
                    }
                }
            }
        });
        poReceivingId = po2.purchaseOrderId;

        // PO for TC-RCV-03 (APPROVED — invalid state for receiving)
        const po3 = await prisma.purchaseOrder.create({
            data: {
                code: 'PO-TEST-APP-' + Date.now(),
                employeeId,
                supplierId: validSupplierId,
                warehouseId: validWarehouseId,
                status: 'APPROVED',
                orderDate: new Date(),
                totalAmount: 10000,
                details: {
                    create: {
                        componentId: validComponentId,
                        quantityOrdered: 100,
                        quantityReceived: 0,
                        unitPrice: 100
                    }
                }
            }
        });
        poApprovedId = po3.purchaseOrderId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    describe('TC-RCV-01: Nhập kho một phần thành công (Partial Receipt)', () => {
        it('Trả về 200, tạo ComponentLot, cập nhật trạng thái PO thành RECEIVING', async () => {
            const res = await request(app)
                .post(`/api/purchase-orders/${poOrderedId}/receive`)
                .set('Authorization', purchaserToken)
                .send({
                    items: [
                        {
                            componentId: validComponentId,
                            initialQuantity: 40,
                            warehouseId: validWarehouseId
                        }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.purchaseOrder.status).toBe('RECEIVING');

            const updatedPo = await prisma.purchaseOrder.findUnique({
                where: { purchaseOrderId: poOrderedId },
                include: { details: true }
            });
            expect(updatedPo?.status).toBe('RECEIVING');
            expect(updatedPo?.details[0].quantityReceived).toBe(40);

            const lots = await prisma.componentLot.findMany({
                where: { poDetailId: updatedPo!.details[0].poDetailId }
            });
            expect(lots.length).toBe(1);
            expect(lots[0].initialQuantity).toBe(40);

            const transaction = await prisma.inventoryTransaction.findFirst({
                where: { purchaseOrderId: poOrderedId, transactionType: 'IMPORT_PO' }
            });
            expect(transaction).not.toBeNull();
            expect(transaction?.quantity).toBe(40);
        });
    });

    describe('TC-RCV-02: Nhập đủ số lượng còn lại và tự động cập nhật PR', () => {
        it('Trả về 200, PO chuyển sang COMPLETED, PR liên kết chuyển sang PENDING', async () => {
            const res = await request(app)
                .post(`/api/purchase-orders/${poReceivingId}/receive`)
                .set('Authorization', purchaserToken)
                .send({
                    items: [
                        {
                            componentId: validComponentId,
                            initialQuantity: 60,
                            warehouseId: validWarehouseId
                        }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.purchaseOrder.status).toBe('COMPLETED');

            const updatedPo = await prisma.purchaseOrder.findUnique({
                where: { purchaseOrderId: poReceivingId },
                include: { details: true }
            });
            expect(updatedPo?.status).toBe('COMPLETED');
            expect(updatedPo?.details[0].quantityReceived).toBe(100);

            const updatedPr = await prisma.productionRequest.findUnique({
                where: { productionRequestId: prWaitingMaterialId }
            });
            expect(updatedPr?.status).toBe('PENDING');
        });
    });

    describe('TC-RCV-03: Từ chối nhập kho khi PO ở trạng thái không hợp lệ', () => {
        it('Trả về 400 nếu PO đang ở trạng thái APPROVED', async () => {
            const res = await request(app)
                .post(`/api/purchase-orders/${poApprovedId}/receive`)
                .set('Authorization', purchaserToken)
                .send({
                    items: [
                        {
                            componentId: validComponentId,
                            initialQuantity: 50,
                            warehouseId: validWarehouseId
                        }
                    ]
                });

            expect(res.status).toBe(400);

            const updatedPo = await prisma.purchaseOrder.findUnique({
                where: { purchaseOrderId: poApprovedId }
            });
            expect(updatedPo?.status).toBe('APPROVED');
        });
    });
});
