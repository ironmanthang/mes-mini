import prisma from '../../common/lib/prisma.js';
import {
    WorkOrderStatus,
    ProductionRequestStatus,
    ProductInstanceStatus,
    InventoryTransactionType,
    MaterialRequestStatus,
    SalesOrderStatus,
    WarehouseType
} from '../../generated/prisma/index.js';
import MaterialRequestService from '../../warehouse-ops/material-request/materialRequestService.js';

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
        if (requests.some(r => r.status !== ProductionRequestStatus.APPROVED)) {
            throw new Error("All requests must be APPROVED.");
        }

        // 3. Calculate Total Quantity
        let totalQuantity = 0;
        const fulfillmentsData: any[] = [];
        let earliestDueDate: Date | null = null; // Track earliest due date

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
        }

        if (totalQuantity <= 0) throw new Error("Total quantity must be > 0");

        // 4. Material Availability Check (Just-in-Time Reservation Check)
        // We do NOT reserve yet (that happens at Release), but we check if we CAN.
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
                            status: WorkOrderStatus.DRAFT,
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
        if (query.status) {
            const status = String(query.status).toUpperCase();
            if (!Object.values(WorkOrderStatus).includes(status as WorkOrderStatus)) {
                throw new Error(`Invalid Work Order status: ${query.status}`);
            }
            where.status = status as WorkOrderStatus;
        }

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
                materialRequest: {
                    include: { details: true }
                }
            }
        });
        if (!wo) throw new Error("Work Order not found");
        return wo;
    }

    async updateWorkOrder(id: number, data: {
        productionLineId?: number;
        targetSalesWarehouseId?: number;
        targetErrorWarehouseId?: number;
        note?: string;
    }) {
        const wo = await prisma.workOrder.findUnique({ where: { workOrderId: id } });
        if (!wo) throw new Error('Work Order not found.');
        if (wo.status !== WorkOrderStatus.DRAFT) {
            throw new Error(`Only DRAFT Work Orders can be updated. Current status: ${wo.status}`);
        }

        const updatePayload: any = {};

        if (data.productionLineId !== undefined) {
            const line = await prisma.productionLine.findUnique({ where: { productionLineId: data.productionLineId } });
            if (!line) throw new Error(`Production Line ID ${data.productionLineId} not found.`);
            updatePayload.productionLineId = data.productionLineId;
        }

        if (data.targetSalesWarehouseId !== undefined) {
            const wh = await prisma.warehouse.findUnique({ where: { warehouseId: data.targetSalesWarehouseId } });
            if (!wh) throw new Error(`Warehouse ID ${data.targetSalesWarehouseId} not found.`);
            if (wh.warehouseType !== WarehouseType.SALES) {
                throw new Error(`Target Sales Warehouse must be SALES type. Got: ${wh.warehouseType}`);
            }
            updatePayload.targetSalesWarehouseId = data.targetSalesWarehouseId;
        }

        if (data.targetErrorWarehouseId !== undefined) {
            const wh = await prisma.warehouse.findUnique({ where: { warehouseId: data.targetErrorWarehouseId } });
            if (!wh) throw new Error(`Warehouse ID ${data.targetErrorWarehouseId} not found.`);
            if (wh.warehouseType !== WarehouseType.ERROR) {
                throw new Error(`Target Error Warehouse must be ERROR type. Got: ${wh.warehouseType}`);
            }
            updatePayload.targetErrorWarehouseId = data.targetErrorWarehouseId;
        }

        if (data.note !== undefined) updatePayload.note = data.note;

        return prisma.workOrder.update({
            where: { workOrderId: id },
            data: updatePayload,
            include: {
                product: true,
                productionLine: { select: { lineName: true, location: true } },
                targetSalesWarehouse: { select: { warehouseName: true, code: true } },
                targetErrorWarehouse: { select: { warehouseName: true, code: true } }
            }
        });
    }

    async releaseWorkOrder(id: number) {
        const wo = await prisma.workOrder.findUnique({
            where: { workOrderId: id }
        });

        if (!wo) throw new Error('Work Order not found');
        if (wo.status !== WorkOrderStatus.DRAFT) {
            throw new Error(`Only DRAFT orders can be released. Current status is ${wo.status}`);
        }

        // ── Release Gate: QC Routing must be configured ──
        if (!wo.targetSalesWarehouseId) {
            throw new Error('Cannot release: targetSalesWarehouseId is not configured. Update the Work Order with a SALES warehouse for QC PASSED routing.');
        }
        if (!wo.targetErrorWarehouseId) {
            throw new Error('Cannot release: targetErrorWarehouseId is not configured. Update the Work Order with an ERROR warehouse for QC FAILED routing.');
        }

        return prisma.workOrder.update({
            where: { workOrderId: id },
            data: { status: WorkOrderStatus.RELEASED }
        });
    }

    async startWorkOrder(id: number, userId: number) {
        return prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({
                where: { workOrderId: id },
                include: {
                    workOrderFulfillments: {
                        include: {
                            productionRequest: {
                                select: {
                                    productionRequestId: true,
                                    salesOrderDetail: {
                                        select: { salesOrderId: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!wo) throw new Error("Work Order not found");
            if (wo.status !== WorkOrderStatus.RELEASED) {
                throw new Error(`Only RELEASED orders can be started. Current status is ${wo.status}`);
            }

            let materialRequest;
            try {
                materialRequest = await MaterialRequestService.createFromWorkOrder(id, userId, tx);
            } catch (e) {
                throw new Error(`Cannot start Work Order (Material Request Failed): ${(e as Error).message}`);
            }

            const updatedWorkOrder = await tx.workOrder.update({
                where: { workOrderId: id },
                data: {
                    status: WorkOrderStatus.IN_PROGRESS,
                    startDate: new Date()
                }
            });

            const linkedProductionRequestIds = [
                ...new Set(wo.workOrderFulfillments.map(f => f.productionRequestId))
            ];
            if (linkedProductionRequestIds.length > 0) {
                await tx.productionRequest.updateMany({
                    where: {
                        productionRequestId: { in: linkedProductionRequestIds },
                        status: ProductionRequestStatus.APPROVED
                    },
                    data: { status: ProductionRequestStatus.IN_PROGRESS }
                });
            }

            const linkedSalesOrderIds = [
                ...new Set(
                    wo.workOrderFulfillments
                        .map(f => f.productionRequest.salesOrderDetail?.salesOrderId)
                        .filter((salesOrderId): salesOrderId is number => salesOrderId != null)
                )
            ];

            if (linkedSalesOrderIds.length > 0) {
                await tx.salesOrder.updateMany({
                    where: {
                        salesOrderId: { in: linkedSalesOrderIds },
                        status: SalesOrderStatus.APPROVED
                    },
                    data: { status: SalesOrderStatus.IN_PROGRESS }
                });
            }

            return {
                workOrder: updatedWorkOrder,
                materialRequest
            };
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
                include: {
                    product: true,
                    materialRequest: {
                        select: {
                            requestId: true,
                            status: true
                        }
                    }
                }
            });

            if (!wo) throw new Error("Work Order not found");
            if (wo.status !== WorkOrderStatus.IN_PROGRESS) throw new Error(`Cannot complete. Status is ${wo.status}`);
            if (quantityProduced <= 0) throw new Error("Quantity produced must be > 0");
            if (quantityProduced > wo.quantity) {
                throw new Error(`Quantity produced (${quantityProduced}) cannot exceed planned quantity (${wo.quantity}).`);
            }

            const hasIssuedMaterial = wo.materialRequest?.status === MaterialRequestStatus.ISSUED;
            if (!hasIssuedMaterial) {
                throw new Error("Cannot complete Work Order: linked Material Request must be ISSUED.");
            }

            const hasPendingMaterial = wo.materialRequest?.status === MaterialRequestStatus.PENDING;
            if (hasPendingMaterial) {
                throw new Error("Cannot complete Work Order while a linked Material Request is still PENDING.");
            }

            // A. Create Production Batch
            // Batch Configuration: Use custom code if provided, else generate
            const productionDate = new Date();
            const dateStr = productionDate.toISOString().slice(0, 10).replace(/-/g, '');
            const batchCode = customBatchCode || `BATCH-${wo.code}-${dateStr}`;

            let finalExpiryDate = expiryDate || null;
            if (!finalExpiryDate && wo.product.shelfLifeDays) {
                const calculatedDate = new Date(productionDate);
                calculatedDate.setDate(calculatedDate.getDate() + wo.product.shelfLifeDays);
                finalExpiryDate = calculatedDate;
            }

            const batch = await tx.productionBatch.create({
                data: {
                    batchCode,
                    productionDate,
                    expiryDate: finalExpiryDate,
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
                        status: ProductInstanceStatus.PENDING_QC,
                        warehouseId: warehouseId,
                    }
                });

                // C. Log Inventory Transaction (Per Item for Traceability)
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.IMPORT_PRODUCTION,
                        quantity: 1, // Individual Unit
                        productInstanceId: instance.productInstanceId,
                        warehouseId: warehouseId,
                        employeeId: userId,
                        note: `Production Output from WO ${wo.code}`,
                    }
                });
            }

            // D. Update Work Order Status
            const completedWO = await tx.workOrder.update({
                where: { workOrderId: id },
                data: { status: WorkOrderStatus.COMPLETED }
            });

            return completedWO;
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
                include: {
                    materialRequest: {
                        select: {
                            requestId: true,
                            status: true
                        }
                    },
                    workOrderFulfillments: {
                        include: {
                            productionRequest: {
                                select: {
                                    productionRequestId: true,
                                    salesOrderDetail: {
                                        select: { salesOrderId: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!wo) throw new Error("Work Order not found");

            // Validate status
            const cancellableStatuses: WorkOrderStatus[] = [
                WorkOrderStatus.DRAFT,
                WorkOrderStatus.RELEASED,
                WorkOrderStatus.IN_PROGRESS
            ];
            if (!cancellableStatuses.includes(wo.status)) {
                throw new Error(`Cannot cancel Work Order in status ${wo.status}`);
            }

            if (wo.status === WorkOrderStatus.IN_PROGRESS && (!reason || !reason.trim())) {
                throw new Error("Cancellation reason is required when cancelling an IN_PROGRESS Work Order.");
            }

            // 1. Cancel linked open Material Requests (PENDING only)
            const pendingRequestIds = wo.materialRequest && wo.materialRequest.status === MaterialRequestStatus.PENDING
                ? [wo.materialRequest.requestId] : [];

            if (pendingRequestIds.length > 0) {
                await tx.materialRequest.updateMany({
                    where: {
                        requestId: { in: pendingRequestIds },
                        status: MaterialRequestStatus.PENDING
                    },
                    data: {
                        status: MaterialRequestStatus.CANCELLED,
                        note: 'Auto-cancelled because parent Work Order was cancelled.'
                    }
                });
            }

            const issuedRequestIds = wo.materialRequest && wo.materialRequest.status === MaterialRequestStatus.ISSUED
                ? [wo.materialRequest.requestId] : [];

            const reasonText = reason?.trim();
            const noteParts: string[] = [];
            if (wo.note) noteParts.push(wo.note);
            if (reasonText) noteParts.push(`Cancelled: ${reasonText}`);
            if (issuedRequestIds.length > 0) {
                noteParts.push(`Issued material request(s) kept as irreversible consumption: ${issuedRequestIds.join(', ')}`);
            }

            // 2. Update WO status
            await tx.workOrder.update({
                where: { workOrderId: id },
                data: {
                    status: WorkOrderStatus.CANCELLED,
                    note: noteParts.length > 0 ? noteParts.join('; ') : undefined
                }
            });

            // 3. Recalculate linked Production Request status (keep terminal locks)
            const linkedProductionRequestIds = [
                ...new Set(wo.workOrderFulfillments.map(f => f.productionRequestId))
            ];

            if (linkedProductionRequestIds.length > 0) {
                const linkedProductionRequests = await tx.productionRequest.findMany({
                    where: { productionRequestId: { in: linkedProductionRequestIds } },
                    include: {
                        workOrderFulfillments: {
                            include: {
                                workOrder: {
                                    select: { status: true }
                                }
                            }
                        }
                    }
                });

                for (const pr of linkedProductionRequests) {
                    if (pr.status === ProductionRequestStatus.FULFILLED || pr.status === ProductionRequestStatus.CANCELLED) {
                        continue;
                    }

                    const hasInProgressWorkOrder = pr.workOrderFulfillments.some(
                        fulfillment => fulfillment.workOrder.status === WorkOrderStatus.IN_PROGRESS
                    );

                    const nextStatus = hasInProgressWorkOrder
                        ? ProductionRequestStatus.IN_PROGRESS
                        : ProductionRequestStatus.APPROVED;

                    if (pr.status !== nextStatus) {
                        await tx.productionRequest.update({
                            where: { productionRequestId: pr.productionRequestId },
                            data: { status: nextStatus }
                        });
                    }
                }
            }

            // 4. Roll back linked Sales Order from IN_PROGRESS -> APPROVED when no PR remains IN_PROGRESS
            const linkedSalesOrderIds = [
                ...new Set(
                    wo.workOrderFulfillments
                        .map(f => f.productionRequest.salesOrderDetail?.salesOrderId)
                        .filter((salesOrderId): salesOrderId is number => salesOrderId != null)
                )
            ];

            if (linkedSalesOrderIds.length > 0) {
                const productionRequestsForLinkedSalesOrders = await tx.productionRequest.findMany({
                    where: {
                        salesOrderDetail: {
                            salesOrderId: { in: linkedSalesOrderIds }
                        }
                    },
                    include: {
                        salesOrderDetail: {
                            select: { salesOrderId: true }
                        }
                    }
                });

                const salesOrdersWithInProgressRequests = new Set<number>();
                for (const pr of productionRequestsForLinkedSalesOrders) {
                    const salesOrderId = pr.salesOrderDetail?.salesOrderId;
                    if (salesOrderId != null && pr.status === ProductionRequestStatus.IN_PROGRESS) {
                        salesOrdersWithInProgressRequests.add(salesOrderId);
                    }
                }

                const rollbackSalesOrderIds = linkedSalesOrderIds.filter(
                    salesOrderId => !salesOrdersWithInProgressRequests.has(salesOrderId)
                );

                if (rollbackSalesOrderIds.length > 0) {
                    await tx.salesOrder.updateMany({
                        where: {
                            salesOrderId: { in: rollbackSalesOrderIds },
                            status: SalesOrderStatus.IN_PROGRESS
                        },
                        data: { status: SalesOrderStatus.APPROVED }
                    });
                }
            }

            return { message: "Work Order Cancelled" };
        });
    }
}

export default new WorkOrderService();
