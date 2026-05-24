import request from 'supertest';

import app from '../../src/app.js';
import prisma from '../../src/common/lib/prisma.js';
import {
    InventoryTransactionType,
    ProductInstanceStatus,
    PurchaseOrderStatus,
    WorkOrderStatus,
    WarehouseType
} from '../../src/generated/prisma/index.js';
import { getAuthToken } from '../helpers/auth.helper.js';
import { dbHelper } from '../helpers/db.helper.js';

const uniqueCode = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

describe('Reporting API Tests', () => {
    let reportToken: string;
    let adminEmployeeId: number;
    let componentWarehouseId: number;

    beforeAll(async () => {
        reportToken = await getAuthToken('admin');

        const admin = await prisma.employee.findFirst({
            where: { username: 'admin' },
            select: { employeeId: true }
        });
        if (!admin) throw new Error('Test Data Missing: admin employee not found.');
        adminEmployeeId = admin.employeeId;

        const componentWarehouse = await prisma.warehouse.findFirst({
            where: { warehouseType: WarehouseType.COMPONENT },
            select: { warehouseId: true }
        });
        if (!componentWarehouse) throw new Error('Test Data Missing: COMPONENT warehouse not found.');
        componentWarehouseId = componentWarehouse.warehouseId;
    });

    afterAll(async () => {
        await dbHelper.disconnect();
    });

    const createReportProduct = async () => {
        return prisma.product.create({
            data: {
                productName: uniqueCode('Report Product'),
                code: uniqueCode('RPT-PROD'),
                unit: 'pcs'
            }
        });
    };

    const createProductInstance = async (
        productId: number,
        productionBatchId: number,
        status: ProductInstanceStatus
    ) => {
        return prisma.productInstance.create({
            data: {
                serialNumber: uniqueCode('SN-RPT'),
                productId,
                productionBatchId,
                status
            }
        });
    };

    it('GET /api/costs/materials reports material spend by transaction date, component, and supplier', async () => {
        const supplier = await prisma.supplier.create({
            data: {
                supplierName: uniqueCode('Report Supplier'),
                code: uniqueCode('RPT-SUP'),
                address: 'Reporting test supplier address'
            }
        });
        const component = await prisma.component.create({
            data: {
                componentName: uniqueCode('Report Component'),
                code: uniqueCode('RPT-COMP'),
                unit: 'pcs',
                standardCost: 1
            }
        });

        await prisma.supplierComponent.create({
            data: {
                supplierId: supplier.supplierId,
                componentId: component.componentId
            }
        });

        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                code: uniqueCode('RPT-PO'),
                employeeId: adminEmployeeId,
                supplierId: supplier.supplierId,
                warehouseId: componentWarehouseId,
                status: PurchaseOrderStatus.COMPLETED,
                details: {
                    create: {
                        componentId: component.componentId,
                        quantityOrdered: 10,
                        quantityReceived: 5,
                        unitPrice: 7
                    }
                }
            }
        });

        await prisma.inventoryTransaction.create({
            data: {
                transactionDate: new Date('2099-01-10T08:00:00.000Z'),
                transactionType: InventoryTransactionType.IMPORT_PO,
                quantity: 5,
                componentId: component.componentId,
                warehouseId: componentWarehouseId,
                employeeId: adminEmployeeId,
                purchaseOrderId: purchaseOrder.purchaseOrderId
            }
        });

        const res = await request(app)
            .get('/api/costs/materials')
            .query({
                startDate: '2099-01-01',
                endDate: '2099-01-31',
                componentId: component.componentId,
                supplierId: supplier.supplierId
            })
            .set('Authorization', reportToken);

        expect(res.status).toBe(200);
        expect(res.body.totalMaterialCost).toBe(35);
        expect(res.body.totalQuantityReceived).toBe(5);
        expect(res.body.dailyBreakdown).toEqual(expect.arrayContaining([
            expect.objectContaining({ date: '2099-01-10', totalCost: 35, quantityReceived: 5 })
        ]));
        expect(res.body.componentBreakdown).toEqual(expect.arrayContaining([
            expect.objectContaining({ componentId: component.componentId, totalCost: 35, quantityReceived: 5 })
        ]));
        expect(res.body.supplierBreakdown).toEqual(expect.arrayContaining([
            expect.objectContaining({ supplierId: supplier.supplierId, totalCost: 35, quantityReceived: 5 })
        ]));
    });

    it('GET /api/costs/products reports frozen Work Order costs and QC counts', async () => {
        const product = await createReportProduct();
        const line = await prisma.productionLine.create({
            data: {
                lineName: uniqueCode('RPT Line'),
                location: 'Reporting lab'
            }
        });
        const workOrder = await prisma.workOrder.create({
            data: {
                code: uniqueCode('RPT-WO'),
                productId: product.productId,
                quantity: 4,
                employeeId: adminEmployeeId,
                status: WorkOrderStatus.COMPLETED,
                productionLineId: line.productionLineId,
                laborCost: 10,
                overheadCost: 5,
                totalMaterialCost: 35,
                totalProductionCost: 50
            }
        });
        const batch = await prisma.productionBatch.create({
            data: {
                batchCode: uniqueCode('RPT-BATCH'),
                productionDate: new Date('2099-01-11T08:00:00.000Z'),
                workOrderId: workOrder.workOrderId,
                productionLineId: line.productionLineId
            }
        });

        await createProductInstance(product.productId, batch.productionBatchId, ProductInstanceStatus.PASSED_QC);
        await createProductInstance(product.productId, batch.productionBatchId, ProductInstanceStatus.IN_STOCK_SALES);
        await createProductInstance(product.productId, batch.productionBatchId, ProductInstanceStatus.FAILED_QC);
        await createProductInstance(product.productId, batch.productionBatchId, ProductInstanceStatus.PENDING_QC);

        const res = await request(app)
            .get('/api/costs/products')
            .query({
                startDate: '2099-01-01',
                endDate: '2099-01-31',
                productId: product.productId
            })
            .set('Authorization', reportToken);

        expect(res.status).toBe(200);
        expect(res.body.totalProductionCost).toBe(50);
        expect(res.body.totalMaterialCost).toBe(35);
        expect(res.body.totalConversionCost).toBe(15);
        expect(res.body.totalInstancesCreated).toBe(4);
        expect(res.body.passedCount).toBe(2);
        expect(res.body.failedCount).toBe(1);
        expect(res.body.pendingQcCount).toBe(1);
        expect(res.body.productBreakdown).toEqual(expect.arrayContaining([
            expect.objectContaining({ productId: product.productId, totalProductionCost: 50 })
        ]));
    });

    it('GET /api/production/reports/line-performance groups output by line and unassigned batches', async () => {
        const product = await createReportProduct();
        const line = await prisma.productionLine.create({
            data: {
                lineName: uniqueCode('RPT Perf Line'),
                location: 'Reporting floor'
            }
        });

        const assignedWorkOrder = await prisma.workOrder.create({
            data: {
                code: uniqueCode('RPT-WO-LINE'),
                productId: product.productId,
                quantity: 4,
                employeeId: adminEmployeeId,
                status: WorkOrderStatus.COMPLETED,
                productionLineId: line.productionLineId
            }
        });
        const assignedBatch = await prisma.productionBatch.create({
            data: {
                batchCode: uniqueCode('RPT-BATCH-LINE'),
                productionDate: new Date('2099-01-12T08:00:00.000Z'),
                workOrderId: assignedWorkOrder.workOrderId,
                productionLineId: line.productionLineId
            }
        });

        await createProductInstance(product.productId, assignedBatch.productionBatchId, ProductInstanceStatus.PASSED_QC);
        await createProductInstance(product.productId, assignedBatch.productionBatchId, ProductInstanceStatus.IN_STOCK_SALES);
        await createProductInstance(product.productId, assignedBatch.productionBatchId, ProductInstanceStatus.FAILED_QC);
        await createProductInstance(product.productId, assignedBatch.productionBatchId, ProductInstanceStatus.PENDING_QC);

        const unassignedWorkOrder = await prisma.workOrder.create({
            data: {
                code: uniqueCode('RPT-WO-UNASSIGNED'),
                productId: product.productId,
                quantity: 2,
                employeeId: adminEmployeeId,
                status: WorkOrderStatus.COMPLETED
            }
        });
        const unassignedBatch = await prisma.productionBatch.create({
            data: {
                batchCode: uniqueCode('RPT-BATCH-UNASSIGNED'),
                productionDate: new Date('2099-01-13T08:00:00.000Z'),
                workOrderId: unassignedWorkOrder.workOrderId
            }
        });

        await createProductInstance(product.productId, unassignedBatch.productionBatchId, ProductInstanceStatus.FAILED_QC);
        await createProductInstance(product.productId, unassignedBatch.productionBatchId, ProductInstanceStatus.IN_STOCK_ERROR);

        const res = await request(app)
            .get('/api/production/reports/line-performance')
            .query({
                startDate: '2099-01-01',
                endDate: '2099-01-31',
                productId: product.productId
            })
            .set('Authorization', reportToken);

        expect(res.status).toBe(200);
        expect(res.body.totals).toEqual(expect.objectContaining({
            totalProduced: 6,
            qcCompleted: 5,
            passedCount: 2,
            failedCount: 3,
            pendingQcCount: 1,
            passRate: 40,
            defectRate: 60
        }));

        expect(res.body.lines).toEqual(expect.arrayContaining([
            expect.objectContaining({
                productionLineId: line.productionLineId,
                totalProduced: 4,
                passedCount: 2,
                failedCount: 1,
                pendingQcCount: 1
            }),
            expect.objectContaining({
                productionLineId: null,
                lineName: 'Unassigned',
                totalProduced: 2,
                passedCount: 0,
                failedCount: 2,
                pendingQcCount: 0
            })
        ]));
    });
});
