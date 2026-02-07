import prisma from '../../common/lib/prisma.js';
import { WorkOrder, WorkOrderStatus } from '../../generated/prisma/index.js';
import MaterialRequestService from '../../warehouse/material-request/materialRequestService.js';

interface CreateWorkOrderData {
    productionRequestId: number;
    productId: number;
    quantity: number;
    productionLineId?: number; // NEW: Optional production line assignment
}

class WorkOrderService {

    // Create a Work Order to fulfill a specific Production Request
    async createWorkOrder(data: CreateWorkOrderData, userId: number) {
        const { productionRequestId, productId, quantity } = data;

        // 1. Verify Request
        const request = await prisma.productionRequest.findUnique({
            where: { productionRequestId }
        });

        if (!request) throw new Error("Production Request not found");
        if (request.status !== 'APPROVED') throw new Error("Production Request must be APPROVED first.");
        if (request.productId !== productId) throw new Error("Product Mismatch between Request and Work Order data.");

        // 2. Generate WO Code
        const count = await prisma.workOrder.count();
        const code = `WO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // 3. Create WO and Link to Request
        return prisma.workOrder.create({
            data: {
                code,
                productId,
                quantity, // Planned Qty
                status: 'PLANNED',
                employeeId: userId,
                productionLineId: data.productionLineId || null, // NEW
                workOrderFulfillments: {
                    create: {
                        productionRequestId: productionRequestId
                    }
                }
            },
            include: {
                product: true,
                productionLine: true, // NEW
                workOrderFulfillments: true
            }
        });
    }

    async getALlWO(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) where.status = query.status;

        const [data, total] = await Promise.all([
            prisma.workOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createDate: 'desc' },
                include: {
                    product: true,
                    employee: { select: { fullName: true } },
                    productionLine: { select: { lineName: true, location: true } } // NEW
                }
            }),
            prisma.workOrder.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getWOById(id: number) {
        const wo = await prisma.workOrder.findUnique({
            where: { workOrderId: id },
            include: {
                product: true,
                employee: { select: { fullName: true } },
                productionLine: true, // NEW
                workOrderFulfillments: {
                    include: { productionRequest: true }
                },
                productionBatches: {
                    include: { productInstances: true }
                },
                materialRequests: {
                    include: { details: true }
                }
            }
        });
        if (!wo) throw new Error("Work Order not found");
        return wo;
    }

    async startWorkOrder(id: number, userId: number) {
        const wo = await prisma.workOrder.findUnique({ where: { workOrderId: id } });
        if (!wo) throw new Error("Work Order not found");

        if (wo.status !== 'PLANNED') throw new Error("Only PLANNED orders can be started.");

        // 1. Create Material Export Request (The "Feeder")
        // logic moved to MaterialRequestService as requested in Plan
        try {
            await MaterialRequestService.createFromWorkOrder(id, userId);
        } catch (e) {
            throw new Error(`Cannot start Work Order (Material Request Failed): ${(e as Error).message}`);
        }

        // 2. Update Status
        return prisma.workOrder.update({
            where: { workOrderId: id },
            data: { status: 'IN_PROGRESS' }
        });
    }

    // The Big One: Complete WO -> Updates Inventory
    // Inputs: quantityProduced, optional batchCode override, optional expiryDate
    async completeWorkOrder(id: number, quantityProduced: number, userId: number, customBatchCode?: string, expiryDate?: Date) {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({
                where: { workOrderId: id },
                include: { product: true }
            });

            if (!wo) throw new Error("Work Order not found");
            if (wo.status !== 'IN_PROGRESS') throw new Error(`Cannot complete. Status is ${wo.status}`);
            if (quantityProduced <= 0) throw new Error("Quantity produced must be > 0");

            // A. Create Production Batch
            // Batch Configuration: Use custom code if provided, else generate
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const batchCode = customBatchCode || `BATCH-${wo.code}-${dateStr}`;

            const batch = await tx.productionBatch.create({
                data: {
                    batchCode,
                    productionDate: new Date(),
                    expiryDate: expiryDate || null,
                    workOrderId: id,
                    // productionLineId: 1 // Optional
                }
            });

            // B. Generate Serial Numbers & Register Product Instances
            // Requirement: Barcode/Serial Number generation
            // Format: SN-{PRD_CODE}-{BATCH_CODE}-{SEQ}
            for (let i = 1; i <= quantityProduced; i++) {
                const seq = i.toString().padStart(3, '0');
                const serialNumber = `SN-${wo.product.code}-${batchCode}-${seq}`;

                const instance = await tx.productInstance.create({
                    data: {
                        serialNumber,
                        productId: wo.productId,
                        productionBatchId: batch.productionBatchId,
                        status: 'IN_STOCK',
                        // warehouseId: 1, // Assumed Main Warehouse
                    }
                });

                // C. Log Inventory Transaction (Per Item for Traceability)
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: 'IMPORT_PRODUCTION',
                        quantity: 1, // Individual Unit
                        productInstanceId: instance.productInstanceId,
                        warehouseId: 1, // Main Warehouse
                        employeeId: userId,
                        note: `Production Output from WO ${wo.code}`,
                    }
                });
            }

            // D. Update Work Order Status
            return await tx.workOrder.update({
                where: { workOrderId: id },
                data: { status: 'COMPLETED' }
            });
        });
    }
}

export default new WorkOrderService();
