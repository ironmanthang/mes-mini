import prisma from '../../common/lib/prisma.js';
import {
    MaterialRequestStatus,
    NotificationType,
    InventoryTransactionType,
    Prisma
} from '../../generated/prisma/index.js';

export interface LotConsumption {
    componentId: number;
    lotCode: string;
    quantity: number;
}

class MaterialRequestService {

    /**
     * Auto-create a Material Export Request for a Work Order.
     *
     * SNAPSHOT-BASED AGGREGATION:
     *   A Work Order can fulfill multiple Production Requests (via WorkOrderFulfillment).
     *   Each PR has its BOM frozen in ProductionRequestDetail at creation time.
     *
     *   Material calculation per fulfillment:
     *     quantity_needed = fulfillment.quantity × snapshot.quantityPerUnit
     *
     *   We then SUM across all fulfillments, grouped by componentId.
     *
     *   WHY NOT master BOM:
     *     - BOM edits after PR creation would silently change shop-floor requirements.
     *     - A WO may only partially fulfill a PR; master BOM totalRequired covers the whole PR.
     *
     *   FALLBACK: If a PR has no snapshot (created before this feature), we fall back
     *   to the master BOM for that fulfillment to avoid breaking existing data.
     */
    async createFromWorkOrder(workOrderId: number, _userId: number) {
        const wo = await prisma.workOrder.findUnique({
            where: { workOrderId },
            include: {
                product: true,
                workOrderFulfillments: {
                    include: {
                        productionRequest: {
                            include: { details: true }
                        }
                    }
                }
            }
        });

        if (!wo) throw new Error("Work Order not found");

        const { WorkOrderStatus } = await import('../../generated/prisma/index.js');
        if (wo.status !== WorkOrderStatus.IN_PROGRESS) {
            throw new Error(`Cannot create Material Request. Work Order status is ${wo.status}, expected IN_PROGRESS.`);
        }

        const existingPendingRequest = await prisma.materialRequest.findFirst({
            where: {
                workOrderId,
                status: MaterialRequestStatus.PENDING
            },
            include: {
                details: {
                    include: { component: true }
                }
            }
        });

        if (existingPendingRequest) {
            return existingPendingRequest;
        }

        // ── Aggregate component quantities across all PR fulfillments ──────────
        // Map<componentId, totalQuantityNeeded>
        const componentTotals = new Map<number, number>();

        if (wo.workOrderFulfillments.length > 0) {
            for (const fulfillment of wo.workOrderFulfillments) {
                const pr = fulfillment.productionRequest;

                if (pr.details && pr.details.length > 0) {
                    // Snapshot path: use frozen BOM requirements
                    for (const detail of pr.details) {
                        const needed = fulfillment.quantity * detail.quantityPerUnit;
                        const current = componentTotals.get(detail.componentId) || 0;
                        componentTotals.set(detail.componentId, current + needed);
                    }
                } else {
                    // Fallback path: PR has no snapshot (legacy data).
                    // Use master BOM × fulfillment quantity.
                    const bom = await prisma.billOfMaterial.findMany({
                        where: { productId: pr.productId }
                    });
                    for (const item of bom) {
                        const needed = fulfillment.quantity * item.quantityNeeded;
                        const current = componentTotals.get(item.componentId) || 0;
                        componentTotals.set(item.componentId, current + needed);
                    }
                }
            }
        } else {
            // ── No linked PRs: standalone WO (Make-to-Stock, not linked to any PR) ──
            // Fall back to master BOM × WO quantity.
            const bom = await prisma.billOfMaterial.findMany({
                where: { productId: wo.productId },
                include: { component: true }
            });

            if (bom.length === 0) {
                throw new Error(`Product ${wo.product.code} has no BOM defined.`);
            }

            for (const item of bom) {
                componentTotals.set(item.componentId, item.quantityNeeded * wo.quantity);
            }
        }

        if (componentTotals.size === 0) {
            throw new Error(`No material requirements found for Work Order ${wo.code}. Ensure the linked Production Requests have a valid BOM.`);
        }

        const code = `MAT-REQ-${wo.code}`;

        return await prisma.materialRequest.create({
            data: {
                code,
                workOrderId,
                status: MaterialRequestStatus.PENDING,
                details: {
                    create: Array.from(componentTotals.entries()).map(([componentId, quantity]) => ({
                        componentId,
                        quantity
                    }))
                }
            },
            include: { details: { include: { component: true } } }
        });
    }

    // Step 1. Warehouse staff validates sufficiency before issuing stock
    async validateRequest(requestId: number, warehouseId: number) {
        const req = await prisma.materialRequest.findUnique({
            where: { requestId },
            include: {
                details: {
                    include: {
                        component: {
                            select: {
                                code: true,
                                componentName: true,
                                unit: true
                            }
                        }
                    }
                }
            }
        });

        if (!req) throw new Error('Request not found');
        if (req.status !== MaterialRequestStatus.PENDING) {
            throw new Error(`Cannot validate. Status is ${req.status}`);
        }

        const lineChecks = await Promise.all(req.details.map(async (detail) => {
            const stock = await prisma.componentStock.findUnique({
                where: {
                    warehouseId_componentId: {
                        warehouseId,
                        componentId: detail.componentId
                    }
                }
            });

            const available = stock?.quantity || 0;
            const missingQuantity = Math.max(detail.quantity - available, 0);

            const availableLots = await prisma.componentLot.findMany({
                where: { 
                    warehouseId, 
                    componentId: detail.componentId,
                    currentQuantity: { gt: 0 }
                },
                select: {
                    lotCode: true,
                    currentQuantity: true
                }
            });

            return {
                componentId: detail.componentId,
                componentCode: detail.component.code,
                componentName: detail.component.componentName,
                unit: detail.component.unit,
                requiredQuantity: detail.quantity,
                availableQuantity: available,
                missingQuantity,
                isSufficient: missingQuantity === 0,
                availableLots
            };
        }));

        return {
            requestId: req.requestId,
            code: req.code,
            status: req.status,
            warehouseId,
            canIssue: lineChecks.every(line => line.isSufficient),
            lines: lineChecks
        };
    }

    // Step 2. Complete issue and deduct stock atomically
    async completeRequest(requestId: number, approverId: number, warehouseId: number, consumedLots: LotConsumption[]) {
        const completionResult = await prisma.$transaction(async (tx) => {
            const req = await tx.materialRequest.findUnique({
                where: { requestId },
                include: { details: true }
            });

            if (!req) throw new Error("Request not found");
            if (req.status !== MaterialRequestStatus.PENDING) throw new Error(`Cannot complete issue. Status is ${req.status}`);

            // A. Validate stock sufficiency and Lot mapping
            const aggregatedLots = new Map<number, number>();
            for (const lot of consumedLots) {
                if (lot.quantity <= 0) throw new Error(`Lot ${lot.lotCode} must have a positive consumption quantity.`);
                const current = aggregatedLots.get(lot.componentId) || 0;
                aggregatedLots.set(lot.componentId, current + lot.quantity);
            }

            for (const detail of req.details) {
                const consumedTotal = aggregatedLots.get(detail.componentId) || 0;
                if (consumedTotal !== detail.quantity) {
                    throw new Error(
                        `Lot quantities provided do not match the required amount for Component ID ${detail.componentId}. ` +
                        `Required: ${detail.quantity}, Provided: ${consumedTotal}`
                    );
                }

                // Aggregate check is still good to ensure we don't go negative overall
                const stock = await tx.componentStock.findUnique({
                    where: {
                        warehouseId_componentId: {
                            warehouseId,
                            componentId: detail.componentId
                        }
                    }
                });

                if (!stock || stock.quantity < detail.quantity) {
                    throw new Error(`Insufficient aggregate stock for Component ID ${detail.componentId}. Needed: ${detail.quantity}, Available: ${stock?.quantity || 0}`);
                }
            }

            // A.2 Validate specific Lots
            for (const lot of consumedLots) {
                const dbLot = await tx.componentLot.findUnique({
                    where: { lotCode: lot.lotCode }
                });

                if (!dbLot) throw new Error(`Lot ${lot.lotCode} does not exist.`);
                if (dbLot.warehouseId !== warehouseId) throw new Error(`Lot ${lot.lotCode} is not in warehouse ${warehouseId}.`);
                if (dbLot.componentId !== lot.componentId) throw new Error(`Lot ${lot.lotCode} does not contain Component ID ${lot.componentId}.`);
                if (dbLot.currentQuantity < lot.quantity) {
                    throw new Error(`Lot ${lot.lotCode} has insufficient quantity. Needed: ${lot.quantity}, Available: ${dbLot.currentQuantity}`);
                }
            }

            // B. Deduct stock and write immutable inventory transactions
            // 1. Decrement aggregate stock
            for (const detail of req.details) {
                const updatedStock = await tx.componentStock.updateMany({
                    where: {
                        warehouseId,
                        componentId: detail.componentId,
                        quantity: { gte: detail.quantity }
                    },
                    data: { quantity: { decrement: detail.quantity } }
                });

                if (updatedStock.count === 0) {
                    throw new Error(`Concurrent stock update detected for Component ID ${detail.componentId}.`);
                }
            }

            // 2. Decrement lots and write lot-specific transactions
            for (const lot of consumedLots) {
                const dbLot = await tx.componentLot.update({
                    where: { lotCode: lot.lotCode },
                    data: { currentQuantity: { decrement: lot.quantity } },
                    select: { componentLotId: true }
                });

                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.EXPORT_PRODUCTION,
                        quantity: lot.quantity,
                        componentId: lot.componentId,
                        componentLotId: dbLot.componentLotId,
                        warehouseId,
                        employeeId: approverId,
                        materialReqId: requestId,
                        note: `Issued for Request ${req.code}.`
                    }
                });
            }

            // C. Mark request as issued
            const requestAfterIssue = await tx.materialRequest.update({
                where: { requestId },
                data: {
                    status: MaterialRequestStatus.ISSUED,
                    completedById: approverId,
                    completedAt: new Date()
                }
            });

            return {
                requestAfterIssue,
                issuedRequestCode: req.code
            };
        });

        try {
            const NotificationService = (await import('../../notifications/notificationService.js')).default;
            await NotificationService.createNotification({
                type: NotificationType.MATERIAL_ISSUED,
                title: 'Materials Issued',
                message: `Materials for ${completionResult.issuedRequestCode} have been issued from warehouse.`,
                employeeId: approverId,
                relatedEntityType: 'MaterialRequest',
                relatedEntityId: requestId
            });
        } catch {
            // Non-critical side effect; stock transaction has already committed.
        }

        return completionResult.requestAfterIssue;
    }


    async getRequests(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) {
            const status = String(query.status).toUpperCase();
            if (!Object.values(MaterialRequestStatus).includes(status as MaterialRequestStatus)) {
                throw new Error(`Invalid Material Request status: ${query.status}`);
            }
            where.status = status as MaterialRequestStatus;
        }

        const [data, total] = await Promise.all([
            prisma.materialRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestDate: 'desc' },
                include: {
                    workOrder: { select: { code: true } },
                    completedBy: { select: { fullName: true } },
                    _count: { select: { details: true } }
                }
            }),
            prisma.materialRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getRequestById(id: number) {
        const req = await prisma.materialRequest.findUnique({
            where: { requestId: id },
            include: {
                details: { include: { component: true } },
                workOrder: {
                    select: {
                        code: true,
                        product: { select: { productName: true, code: true } }
                    }
                },
                completedBy: { select: { fullName: true } }
            }
        });
        if (!req) throw new Error("Request not found");
        return req;
    }

    /**
     * Get formatted data for Dispatch Slip printing
     */
    async getDispatchSlip(id: number) {
        const req = await prisma.materialRequest.findUnique({
            where: { requestId: id },
            include: {
                details: {
                    include: {
                        component: {
                            select: {
                                code: true,
                                componentName: true,
                                unit: true
                            }
                        }
                    }
                },
                workOrder: {
                    select: {
                        code: true,
                        product: { select: { productName: true, code: true } }
                    }
                },
                completedBy: { select: { fullName: true } }
            }
        });

        if (!req) throw new Error("Material Request not found");
        if (req.status !== MaterialRequestStatus.ISSUED) throw new Error("Cannot generate slip for non-issued request");

        // Format for printing
        return {
            slipNumber: req.code,
            status: req.status,
            requestDate: req.requestDate,
            workOrder: req.workOrder?.code || 'N/A',
            product: req.workOrder?.product?.productName || 'N/A',
            productCode: req.workOrder?.product?.code || 'N/A',
            requester: 'N/A',
            approver: req.completedBy?.fullName || 'N/A',
            items: req.details.map((d: any) => ({
                code: d.component.code,
                name: d.component.componentName,
                unit: d.component.unit,
                quantity: d.quantity
            })),
            totalItems: req.details.length,
            generatedAt: new Date().toISOString()
        };
    }
}

export default new MaterialRequestService();
