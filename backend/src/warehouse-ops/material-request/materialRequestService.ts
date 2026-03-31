import prisma from '../../common/lib/prisma.js';
import { RequestStatus, NotificationType } from '../../generated/prisma/index.js';

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
    async createFromWorkOrder(workOrderId: number, userId: number) {
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

        return await prisma.materialExportRequest.create({
            data: {
                code,
                workOrderId,
                requesterId: userId,
                status: 'PENDING',
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

    // 2. Warehouse Staff Approves -> Deducts Stock from specified Warehouse
    async approveRequest(requestId: number, approverId: number, warehouseId: number) {
        return await prisma.$transaction(async (tx) => {
            const req = await tx.materialExportRequest.findUnique({
                where: { requestId },
                include: { details: true }
            });

            if (!req) throw new Error("Request not found");
            if (req.status !== 'PENDING') throw new Error(`Cannot approve. Status is ${req.status}`);

            // A. Check & Deduct Stock
            for (const detail of req.details) {
                // Find stock in Main Warehouse (ID 1 for now)
                // In real life, we might search across warehouses or pick specific batch
                const stock = await tx.componentStock.findUnique({
                    where: {
                        warehouseId_componentId: {
                            warehouseId,
                            componentId: detail.componentId
                        }
                    }
                });

                if (!stock || stock.quantity < detail.quantity) {
                    throw new Error(`Insufficient stock for Component ID ${detail.componentId}. Needed: ${detail.quantity}, Available: ${stock?.quantity || 0}`);
                }

                // Update Stock
                await tx.componentStock.update({
                    where: {
                        warehouseId_componentId: {
                            warehouseId,
                            componentId: detail.componentId
                        }
                    },
                    data: { quantity: { decrement: detail.quantity } }
                });

                // B. Log Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: 'EXPORT_PRODUCTION',
                        quantity: detail.quantity,
                        componentId: detail.componentId,
                        warehouseId,
                        employeeId: approverId,
                        materialReqId: requestId,
                        note: `Issued for Request ${req.code}`
                    }
                });
            }

            // C. Update Request Status
            const updatedRequest = await tx.materialExportRequest.update({
                where: { requestId },
                data: {
                    status: 'APPROVED',
                    approverId: approverId
                }
            });

            // D. Notify the requester that materials have been issued
            const NotificationService = (await import('../../notifications/notificationService.js')).default;
            await NotificationService.createNotification({
                type: NotificationType.MATERIAL_ISSUED,
                title: 'Materials Issued',
                message: `Materials for ${req.code} have been issued from warehouse.`,
                employeeId: req.requesterId,
                relatedEntityType: 'MaterialRequest',
                relatedEntityId: requestId
            });

            return updatedRequest;
        });
    }

    async getRequests(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) where.status = query.status;

        const [data, total] = await Promise.all([
            prisma.materialExportRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestDate: 'desc' },
                include: {
                    workOrder: { select: { code: true } },
                    requester: { select: { fullName: true } },
                    _count: { select: { details: true } }
                }
            }),
            prisma.materialExportRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getRequestById(id: number) {
        const req = await prisma.materialExportRequest.findUnique({
            where: { requestId: id },
            include: {
                details: { include: { component: true } },
                workOrder: true,
                requester: { select: { fullName: true } }
            }
        });
        if (!req) throw new Error("Request not found");
        return req;
    }

    /**
     * Get formatted data for Dispatch Slip printing
     */
    async getDispatchSlip(id: number) {
        const req = await prisma.materialExportRequest.findUnique({
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
                requester: { select: { fullName: true } },
                approver: { select: { fullName: true } }
            }
        });

        if (!req) throw new Error("Material Request not found");
        if (req.status !== 'APPROVED') throw new Error("Cannot generate slip for non-approved request");

        // Format for printing
        return {
            slipNumber: req.code,
            status: req.status,
            requestDate: req.requestDate,
            workOrder: req.workOrder?.code || 'N/A',
            product: req.workOrder?.product?.productName || 'N/A',
            productCode: req.workOrder?.product?.code || 'N/A',
            requester: req.requester?.fullName || 'N/A',
            approver: req.approver?.fullName || 'N/A',
            items: req.details.map(d => ({
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
