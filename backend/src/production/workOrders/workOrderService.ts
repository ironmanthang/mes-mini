import prisma from '../../common/lib/prisma.js';
import { WorkOrderStatus } from '../../generated/prisma/index.js';
import MaterialRequestService from '../../warehouse/material-request/materialRequestService.js';

interface CreateWorkOrderData {
    productionRequestId: number;
    productId: number;
    quantity: number;
    productionLineId?: number; // NEW: Optional production line assignment
}

class WorkOrderService {

    private generateCode(): string {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        return `WO-${yyyy}${mm}${dd}-${random}`;
    }

    // Create a Work Order to fulfill a specific Production Request
    async createWorkOrder(data: CreateWorkOrderData, userId: number) {
        // [Refactored to use bulk method for consistency]
        return this.createBulkWorkOrder({
            productionRequestIds: [data.productionRequestId],
            quantities: { [data.productionRequestId]: data.quantity },
            productionLineId: data.productionLineId
        }, userId);
    }

    /**
     * Create a single Work Order from multiple Production Requests (Grouping).
     * Supports Splitting via 'quantities' map.
     */
    async createBulkWorkOrder(data: {
        productionRequestIds: number[],
        quantities?: Record<number, number>, // Map of RequestId -> Quantity to produce (for splitting)
        productionLineId?: number
    }, userId: number) {

        const { productionRequestIds, quantities, productionLineId } = data;

        // 1. Fetch all requests with their EXISTING fulfillments
        const requests = await prisma.productionRequest.findMany({
            where: { productionRequestId: { in: productionRequestIds } },
            include: {
                product: { include: { bom: true } },
                workOrderFulfillments: true // Fetch existing fulfillments here
            }
        });

        if (requests.length !== productionRequestIds.length) throw new Error("Some Production Requests not found");

        // 2. Validation: Must be same Product
        const firstProductId = requests[0].productId;
        if (requests.some(r => r.productId !== firstProductId)) {
            throw new Error("Cannot group requests for different products.");
        }
        if (requests.some(r => r.status !== 'APPROVED' && r.status !== 'PARTIALLY_FULFILLED')) {
            throw new Error("All requests must be APPROVED or PARTIALLY_FULFILLED.");
        }

        // 3. Calculate Total Quantity
        let totalQuantity = 0;
        const fulfillmentsData: any[] = [];
        let earliestDueDate: Date | null = null; // Track earliest due date

        // Prepare status updates map
        const statusUpdates: { id: number, status: 'APPROVED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' }[] = [];

        for (const req of requests) {
            // Track Earliest Due Date logic
            // @ts-ignore
            if (req.dueDate) {
                // @ts-ignore
                if (!earliestDueDate || (req.dueDate && new Date(req.dueDate) < earliestDueDate)) {
                    // @ts-ignore
                    earliestDueDate = new Date(req.dueDate);
                }
            }

            // Calculate Remaining Quantity
            // Cast to any to avoid TS error of potentially missing type def
            const previousFulfilled = req.workOrderFulfillments.reduce((sum, f) => sum + (f as any).quantity, 0);
            const remainingQuantity = req.quantity - previousFulfilled;

            // Determine qty for this specific request
            let qtyForThisReq = 0;

            if (quantities && quantities[req.productionRequestId] !== undefined) {
                qtyForThisReq = quantities[req.productionRequestId];
            } else {
                // Default to Remaining Quantity if not specified
                qtyForThisReq = remainingQuantity;
            }

            // Validation
            if (qtyForThisReq <= 0) {
                // Skip if 0, or throw? Let's throw if they explicitly asked for 0 or negative, 
                // but if remaining is 0, we shouldn't be here if we filtered by status properly.
                // However, request might be APPROVED but fully fulfilled? (Edge case).
                // Let's explicitly check.
                if (remainingQuantity <= 0) {
                    throw new Error(`Production Request ${req.code} is already fully fulfilled.`);
                }
                throw new Error(`Quantity to produce must be greater than 0 for Request ${req.code}`);
            }

            if (qtyForThisReq > remainingQuantity) {
                throw new Error(`Cannot over-fulfill Production Request ${req.code}. Requested: ${qtyForThisReq}, Remaining: ${remainingQuantity}`);
            }

            totalQuantity += qtyForThisReq;

            fulfillmentsData.push({
                productionRequestId: req.productionRequestId,
                quantity: qtyForThisReq
            });

            // Calculate New Status
            const newTotalFulfilled = previousFulfilled + qtyForThisReq;

            let newStatus: 'APPROVED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' = 'APPROVED';
            if (newTotalFulfilled >= req.quantity) {
                newStatus = 'FULFILLED';
            } else if (newTotalFulfilled > 0) {
                newStatus = 'PARTIALLY_FULFILLED';
            }

            if (newStatus !== req.status) {
                statusUpdates.push({ id: req.productionRequestId, status: newStatus });
            }
        }

        if (totalQuantity <= 0) throw new Error("Total quantity must be > 0");

        // 4. Material Availability Check (Just-in-Time Reservation Check)
        // We do NOT reserve yet (that happens at Release), but we check if we CAN.
        const product = requests[0].product;
        // Dynamic Import MrpService to calculate needs
        const MrpService = (await import('../mrp/mrpService.js')).default;
        const mrpResult = await MrpService.calculateRequirements(firstProductId, totalQuantity);

        if (!mrpResult.canProduce) {
            // WARN: Insufficient materials, but we allow creating "PLANNED" orders.
            // The check will be enforced at "RELEASE" or "MATERIAL_REQUEST" stage.
            const missing = mrpResult.requirements.filter((r: any) => r.missingQuantity > 0);
            console.warn(`[WorkOrderService] Planned WO created with missing materials:`,
                missing.map((m: any) => `${m.componentName}: ${m.missingQuantity}`).join(', ')
            );
        }

        // 5. Generate WO Code (Retry loop for safety)
        let code = this.generateCode();
        let retries = 3;

        while (retries > 0) {
            try {
                return await prisma.$transaction(async (tx) => {
                    // 6a. Create Work Order first (without nested fulfillments)
                    const wo = await tx.workOrder.create({
                        data: {
                            code,
                            productId: firstProductId,
                            quantity: totalQuantity,
                            status: 'PLANNED',
                            employeeId: userId,
                            productionLineId: productionLineId || null,
                            // TODO: Use targetDate once Prisma Client is properly regenerated in all environments
                            endDate: earliestDueDate || undefined // Fallback to endDate for now
                        },
                        include: {
                            product: true
                        }
                    });

                    // 6b. Create fulfillment records separately
                    for (const f of fulfillmentsData) {
                        await tx.workOrderFulfillment.create({
                            data: {
                                workOrder: { connect: { workOrderId: wo.workOrderId } },
                                productionRequest: { connect: { productionRequestId: f.productionRequestId } },
                                quantity: f.quantity
                            }
                        });
                    }

                    // 7. Update Production Request Status logic
                    for (const update of statusUpdates) {
                        await tx.productionRequest.update({
                            where: { productionRequestId: update.id },
                            data: { status: update.status }
                        });
                    }

                    // Re-fetch WO with fulfillments
                    return tx.workOrder.findUnique({
                        where: { workOrderId: wo.workOrderId },
                        include: {
                            product: true,
                            workOrderFulfillments: true
                        }
                    });
                });
            } catch (error: any) {
                if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
                    // Collision detected, retry
                    code = this.generateCode();
                    retries--;
                } else {
                    throw error;
                }
            }
        }
        throw new Error("Failed to generate unique Work Order code after multiple retries");
    }

    async getALlWO(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        // @ts-ignore
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
            data: {
                status: 'IN_PROGRESS',
                startDate: new Date()
            }
        });
    }

    // The Big One: Complete WO -> Updates Inventory
    // Inputs: quantityProduced, optional batchCode override, optional expiryDate
    async completeWorkOrder(id: number, quantityProduced: number, userId: number, customBatchCode?: string, expiryDate?: Date, targetWarehouseId?: number) {
        // Fix: Use dynamic warehouse ID
        const warehouseId = targetWarehouseId || (await this.getDefaultWarehouseId());

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
                        warehouseId: warehouseId,
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

    private async getDefaultWarehouseId() {
        const warehouse = await prisma.warehouse.findFirst();
        if (!warehouse) throw new Error("No warehouse available in system to store finished goods.");
        return warehouse.warehouseId;
    }

    /**
     * Cancel a Work Order and revert Production Request status.
     * Fixing the issue where PR remains FULFILLED.
     */
    async cancelWorkOrder(id: number, userId: number, reason?: string) {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({
                where: { workOrderId: id },
                include: { workOrderFulfillments: true }
            });

            if (!wo) throw new Error("Work Order not found");

            // Validate status
            if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(wo.status)) {
                throw new Error(`Cannot cancel Work Order in status ${wo.status}`);
            }

            // 1. Update WO Status
            const noteUpdate = reason ? `${wo.note ? wo.note + '; ' : ''}Cancelled: ${reason}` : wo.note;
            await tx.workOrder.update({
                where: { workOrderId: id },
                data: {
                    status: 'CANCELLED',
                    note: noteUpdate
                }
            });

            // 2. Revert Production Request Status
            for (const fulfillment of wo.workOrderFulfillments) {
                // Get the PR and ALL its ACTIVE fulfillments
                const pr = await tx.productionRequest.findUnique({
                    where: { productionRequestId: fulfillment.productionRequestId },
                    include: { workOrderFulfillments: { include: { workOrder: true } } }
                });

                if (!pr) continue;

                // Calculate Valid Fulfilled Quantity (excluding THIS cancelled WO and any other cancelled ones)
                const activeFulfillments = pr.workOrderFulfillments.filter(f =>
                    f.workOrderId !== id && // Exclude current being cancelled
                    f.workOrder.status !== 'CANCELLED' // Exclude historically cancelled
                );

                const validFulfilledQty = activeFulfillments.reduce((sum, f) => sum + f.quantity, 0);

                let newStatus: 'APPROVED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' = 'APPROVED';

                if (validFulfilledQty >= pr.quantity) {
                    newStatus = 'FULFILLED';
                } else if (validFulfilledQty > 0) {
                    newStatus = 'PARTIALLY_FULFILLED';
                } else {
                    newStatus = 'APPROVED'; // Back to approved
                }

                if (pr.status !== newStatus) {
                    // Fix: Check status constraints (not strict here, just update)
                    await tx.productionRequest.update({
                        where: { productionRequestId: pr.productionRequestId },
                        data: { status: newStatus }
                    });
                }
            }

            return { message: "Work Order Cancelled" };
        });
    }
}

export default new WorkOrderService();
