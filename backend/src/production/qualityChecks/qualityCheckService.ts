import prisma from '../../common/lib/prisma.js';
import { 
    ProductInstanceStatus, 
    QualityCheckResult, 
    InventoryTransactionType, 
    ProductionRequestStatus 
} from '../../generated/prisma/index.js';

interface CreateCheckData {
    serialNumber: string;
    result: QualityCheckResult;
    checkDate?: string | Date;
    notes?: string;
}

class QualityCheckService {

    async createCheck(data: CreateCheckData, userId: number): Promise<any> {
        return prisma.$transaction(async (tx) => {
            // 1. Fetch ProductInstance
            const instance = await tx.productInstance.findUnique({
                where: { serialNumber: data.serialNumber },
                include: {
                    productionBatch: {
                        select: { workOrderId: true }
                    }
                }
            });

            if (!instance) {
                throw new Error(`Product instance with serial number ${data.serialNumber} not found.`);
            }

            if (instance.status !== ProductInstanceStatus.PENDING_QC) {
                throw new Error(`Cannot perform QC on instance. Current status is ${instance.status}.`);
            }

            // 2. Fetch or Create Default Checklist
            let checklist = await tx.qualityChecklist.findFirst({
                where: { checklistName: 'Standard QC' }
            });

            if (!checklist) {
                checklist = await tx.qualityChecklist.create({
                    data: {
                        checklistName: 'Standard QC',
                        description: 'System generated default checklist'
                    }
                });
            }

            // 3. Create QualityCheck Record
            const qualityCheck = await tx.qualityCheck.create({
                data: {
                    productInstanceId: instance.productInstanceId,
                    employeeId: userId,
                    checklistId: checklist.checklistId,
                    result: data.result,
                    checkDate: data.checkDate ? new Date(data.checkDate) : new Date(),
                    notes: data.notes
                }
            });

            // 4. Fetch parent WorkOrder to get explicit routing config
            const workOrder = await tx.workOrder.findUnique({
                where: { workOrderId: instance.productionBatch.workOrderId },
                select: {
                    targetSalesWarehouseId: true,
                    targetErrorWarehouseId: true,
                    code: true
                }
            });

            if (!workOrder) {
                throw new Error('Parent Work Order not found for this production batch.');
            }

            // 5. Route based on QC result using explicit WO configuration
            let targetWarehouseId: number;
            let targetStatus: ProductInstanceStatus;

            if (data.result === QualityCheckResult.PASSED) {
                if (!workOrder.targetSalesWarehouseId) {
                    throw new Error(`Work Order ${workOrder.code} has no targetSalesWarehouseId configured. Cannot route PASSED unit.`);
                }
                targetWarehouseId = workOrder.targetSalesWarehouseId;
                targetStatus = ProductInstanceStatus.IN_STOCK_SALES;
            } else {
                if (!workOrder.targetErrorWarehouseId) {
                    throw new Error(`Work Order ${workOrder.code} has no targetErrorWarehouseId configured. Cannot route FAILED unit.`);
                }
                targetWarehouseId = workOrder.targetErrorWarehouseId;
                targetStatus = ProductInstanceStatus.IN_STOCK_ERROR;
            }

            // 6. Update Product Instance
            const oldWarehouseId = instance.warehouseId;
            
            await tx.productInstance.update({
                where: { productInstanceId: instance.productInstanceId },
                data: {
                    status: targetStatus,
                    warehouseId: targetWarehouseId,
                    receivedAt: targetStatus === ProductInstanceStatus.IN_STOCK_SALES ? new Date() : null
                }
            });

            // 7. Log Inventory Transaction 
            if (oldWarehouseId !== targetWarehouseId) {
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: InventoryTransactionType.TRANSFER,
                        quantity: 1,
                        productInstanceId: instance.productInstanceId,
                        warehouseId: targetWarehouseId,
                        employeeId: userId,
                        note: `QC ${data.result}: Routed to WH ${targetWarehouseId} per WO ${workOrder.code}`
                    }
                });
            }

            // 7. PR Attribution Logic (Only if PASSED)
            if (data.result === QualityCheckResult.PASSED) {
                const workOrderId = instance.productionBatch.workOrderId;
                
                // Fetch fulfillments, sorted by PR priority and createdAt
                const fulfillments = await tx.workOrderFulfillment.findMany({
                    where: { workOrderId },
                    include: {
                        productionRequest: true
                    },
                    orderBy: [
                        { productionRequest: { priority: 'asc' } },
                        { productionRequest: { createdAt: 'asc' } }
                    ]
                });

                let attributedPRId = null;

                for (const fulfillment of fulfillments) {
                    if (fulfillment.productionRequest.status === ProductionRequestStatus.FULFILLED || 
                        fulfillment.productionRequest.status === ProductionRequestStatus.CANCELLED) {
                        continue;
                    }

                    // Attempt atomic update
                    const updated = await tx.workOrderFulfillment.updateMany({
                        where: {
                            workOrderId: fulfillment.workOrderId,
                            productionRequestId: fulfillment.productionRequestId,
                            fulfilledQuantity: { lt: fulfillment.quantity }
                        },
                        data: {
                            fulfilledQuantity: { increment: 1 }
                        }
                    });

                    if (updated.count > 0) {
                        attributedPRId = fulfillment.productionRequestId;
                        break;
                    }
                }

                // If attributed, check if the PR is now fully satisfied
                if (attributedPRId) {
                    const prFulfillments = await tx.workOrderFulfillment.findMany({
                        where: { productionRequestId: attributedPRId }
                    });

                    const totalFulfilled = prFulfillments.reduce((sum, f) => sum + f.fulfilledQuantity, 0);
                    
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

            return qualityCheck;
        });
    }

    async getChecksByProduct(productId: number) {
        return prisma.qualityCheck.findMany({
            where: {
                productInstance: {
                    productId: productId
                }
            },
            include: {
                employee: { select: { fullName: true } },
                productInstance: { select: { serialNumber: true } },
                checklist: { select: { checklistName: true } }
            },
            orderBy: { checkDate: 'desc' }
        });
    }

    async getChecksByWorkOrder(workOrderId: number) {
        return prisma.qualityCheck.findMany({
            where: {
                productInstance: {
                    productionBatch: {
                        workOrderId: workOrderId
                    }
                }
            },
            include: {
                employee: { select: { fullName: true } },
                productInstance: { select: { serialNumber: true } },
                checklist: { select: { checklistName: true } }
            },
            orderBy: { checkDate: 'desc' }
        });
    }
}

export default new QualityCheckService();
