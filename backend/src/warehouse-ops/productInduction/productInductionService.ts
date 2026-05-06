import prisma from '../../common/lib/prisma.js';
import {
    ProductInstanceStatus,
    InventoryTransactionType,
    ProductionRequestStatus
} from '../../generated/prisma/index.js';

interface InductionResult {
    serialNumber: string;
    status: ProductInstanceStatus;
    warehouseId: number;
}

interface InductProductsResponse {
    inducted: InductionResult[];
    totalInducted: number;
}

class ProductInductionService {

    async inductProducts(
        serialNumbers: string[],
        userId: number
    ): Promise<InductProductsResponse> {
        return prisma.$transaction(async (tx) => {

            // ── 1. Fetch all instances ──────────────────────────────────────────
            const instances = await tx.productInstance.findMany({
                where: { serialNumber: { in: serialNumbers } },
                include: {
                    productionBatch: {
                        select: { workOrderId: true }
                    }
                }
            });

            // ── 2. Validate: all serial numbers must exist ──────────────────────
            const foundSerials = new Set(instances.map(i => i.serialNumber));
            const notFound = serialNumbers.filter(sn => !foundSerials.has(sn));
            if (notFound.length > 0) {
                throw new Error(
                    `Serial numbers not found: ${notFound.join(', ')}.`
                );
            }

            // ── 3. Validate: all instances must be in QC-complete status ────────
            const validStatuses: ProductInstanceStatus[] = [
                ProductInstanceStatus.PASSED_QC,
                ProductInstanceStatus.FAILED_QC
            ];

            const invalidInstances = instances.filter(
                i => !validStatuses.includes(i.status)
            );
            if (invalidInstances.length > 0) {
                const detail = invalidInstances
                    .map(i => `${i.serialNumber} (${i.status})`)
                    .join(', ');
                throw new Error(
                    `The following instances are not ready for induction: ${detail}. ` +
                    `Only PASSED_QC and FAILED_QC instances can be inducted.`
                );
            }

            // ── 4. Collect unique WorkOrder IDs and validate target warehouses ──
            const workOrderIds = [
                ...new Set(instances.map(i => i.productionBatch.workOrderId))
            ];

            const workOrders = await tx.workOrder.findMany({
                where: { workOrderId: { in: workOrderIds } },
                select: {
                    workOrderId: true,
                    code: true,
                    targetSalesWarehouseId: true,
                    targetErrorWarehouseId: true
                }
            });

            const workOrderMap = new Map(
                workOrders.map(wo => [wo.workOrderId, wo])
            );

            // Collect all target warehouse IDs that need to exist
            const requiredWarehouseIds = new Set<number>();
            for (const wo of workOrders) {
                if (!wo.targetSalesWarehouseId) {
                    throw new Error(
                        `Work Order ${wo.code} has no targetSalesWarehouseId configured.`
                    );
                }
                if (!wo.targetErrorWarehouseId) {
                    throw new Error(
                        `Work Order ${wo.code} has no targetErrorWarehouseId configured.`
                    );
                }
                requiredWarehouseIds.add(wo.targetSalesWarehouseId);
                requiredWarehouseIds.add(wo.targetErrorWarehouseId);
            }

            // Validate warehouses actually exist in the database
            const existingWarehouses = await tx.warehouse.findMany({
                where: { warehouseId: { in: [...requiredWarehouseIds] } },
                select: { warehouseId: true }
            });
            const existingWarehouseIds = new Set(
                existingWarehouses.map(w => w.warehouseId)
            );

            const missingWarehouseIds = [...requiredWarehouseIds].filter(
                id => !existingWarehouseIds.has(id)
            );
            if (missingWarehouseIds.length > 0) {
                throw new Error(
                    `Target warehouses no longer exist: IDs ${missingWarehouseIds.join(', ')}. ` +
                    `Induction rejected. Update the Work Order configuration.`
                );
            }

            // ── 5. Route and update each instance ──────────────────────────────
            const inductionResults: InductionResult[] = [];
            const now = new Date();

            for (const instance of instances) {
                const workOrder = workOrderMap.get(
                    instance.productionBatch.workOrderId
                )!;

                const isPassed = instance.status === ProductInstanceStatus.PASSED_QC;
                const targetStatus = isPassed
                    ? ProductInstanceStatus.IN_STOCK_SALES
                    : ProductInstanceStatus.IN_STOCK_ERROR;
                const targetWarehouseId = isPassed
                    ? workOrder.targetSalesWarehouseId!
                    : workOrder.targetErrorWarehouseId!;

                // Update instance: status + warehouse + receivedAt for ALL (Gap I)
                await tx.productInstance.update({
                    where: { productInstanceId: instance.productInstanceId },
                    data: {
                        status: targetStatus,
                        warehouseId: targetWarehouseId,
                        receivedAt: now  // Set for BOTH passed and failed (Gap I fix)
                    }
                });

                // Create IMPORT_PRODUCTION inventory transaction (Gap C fix)
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.IMPORT_PRODUCTION,
                        quantity: 1,
                        productInstanceId: instance.productInstanceId,
                        warehouseId: targetWarehouseId,
                        employeeId: userId,
                        note: `Product induction: ${instance.serialNumber} → WH ${targetWarehouseId} (WO ${workOrder.code})`
                    }
                });

                inductionResults.push({
                    serialNumber: instance.serialNumber,
                    status: targetStatus,
                    warehouseId: targetWarehouseId
                });
            }

            // ── 6. PR Attribution — only for PASSED_QC → IN_STOCK_SALES ────────
            // Grouped per WorkOrder for efficiency (Gap B fix — moved from QC service)
            const passedInstances = instances.filter(
                i => i.status === ProductInstanceStatus.PASSED_QC
            );

            // Group passed instances by WorkOrder
            const passedByWorkOrder = new Map<number, typeof instances>();
            for (const instance of passedInstances) {
                const woId = instance.productionBatch.workOrderId;
                if (!passedByWorkOrder.has(woId)) {
                    passedByWorkOrder.set(woId, []);
                }
                passedByWorkOrder.get(woId)!.push(instance);
            }

            for (const [workOrderId, woInstances] of passedByWorkOrder) {
                // Fetch fulfillments sorted by PR priority then createdAt
                const fulfillments = await tx.workOrderFulfillment.findMany({
                    where: { workOrderId },
                    include: { productionRequest: true },
                    orderBy: [
                        { productionRequest: { priority: 'asc' } },
                        { productionRequest: { createdAt: 'asc' } }
                    ]
                });

                // Attribute each passed instance to a PR
                for (const _instance of woInstances) {
                    let attributedPRId: number | null = null;

                    for (const fulfillment of fulfillments) {
                        const prStatus = fulfillment.productionRequest.status;
                        if (
                            prStatus === ProductionRequestStatus.FULFILLED ||
                            prStatus === ProductionRequestStatus.CANCELLED
                        ) {
                            continue;
                        }

                        // Atomic increment — only succeeds if not yet fully filled
                        const updated = await tx.workOrderFulfillment.updateMany({
                            where: {
                                workOrderId: fulfillment.workOrderId,
                                productionRequestId: fulfillment.productionRequestId,
                                fulfilledQuantity: { lt: fulfillment.quantity }
                            },
                            data: { fulfilledQuantity: { increment: 1 } }
                        });

                        if (updated.count > 0) {
                            attributedPRId = fulfillment.productionRequestId;
                            break;
                        }
                    }

                    // Check if the attributed PR is now fully satisfied
                    if (attributedPRId !== null) {
                        const prFulfillments = await tx.workOrderFulfillment.findMany({
                            where: { productionRequestId: attributedPRId }
                        });

                        const totalFulfilled = prFulfillments.reduce(
                            (sum, f) => sum + f.fulfilledQuantity,
                            0
                        );

                        const pr = await tx.productionRequest.findUnique({
                            where: { productionRequestId: attributedPRId }
                        });

                        if (pr && totalFulfilled >= pr.quantity) {
                            await tx.productionRequest.update({
                                where: { productionRequestId: attributedPRId },
                                data: { status: ProductionRequestStatus.FULFILLED }
                            });
                        }
                    }
                }
            }

            return {
                inducted: inductionResults,
                totalInducted: inductionResults.length
            };
        });
    }
}

export default new ProductInductionService();
