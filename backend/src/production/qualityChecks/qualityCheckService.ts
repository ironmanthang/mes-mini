import prisma from '../../common/lib/prisma.js';
import { 
    ProductInstanceStatus, 
    QualityCheckResult,
    Prisma
} from '../../generated/prisma/index.js';

interface InspectionResultInput {
    inspectionPointId: number;
    passed: boolean;
    measuredValue?: number;
    notes?: string;
}

interface CreateCheckData {
    serialNumber: string;
    checkDate?: string | Date;
    notes?: string;
    inspectionResults: InspectionResultInput[];
}

class QualityCheckService {

    async createCheck(data: CreateCheckData, userId: number): Promise<any> {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Fetch ProductInstance with product → checklist → inspectionPoints
                const instance = await tx.productInstance.findUnique({
                    where: { serialNumber: data.serialNumber },
                    include: {
                        product: {
                            include: {
                                checklist: {
                                    include: {
                                        inspectionPoints: {
                                            orderBy: { sortOrder: 'asc' }
                                        }
                                    }
                                }
                            }
                        },
                        productionBatch: {
                            select: { productionBatchId: true, workOrderId: true }
                        }
                    }
                });

                if (!instance) {
                    throw new Error(`Product instance with serial number ${data.serialNumber} not found.`);
                }

                if (instance.status !== ProductInstanceStatus.PENDING_QC) {
                    throw new Error(`Cannot perform QC on instance. Current status is ${instance.status}.`);
                }

                // 2. Resolve checklist from Product → Checklist FK (not hardcoded)
                const checklist = instance.product.checklist;
                if (!checklist) {
                    throw new Error(
                        `Product "${instance.product.productName}" has no QC checklist assigned. ` +
                        `Assign a checklist before performing QC.`
                    );
                }

                const inspectionPoints = checklist.inspectionPoints;
                if (inspectionPoints.length === 0) {
                    throw new Error(
                        `Checklist "${checklist.checklistName}" has no inspection points defined.`
                    );
                }

                // 3. Validate submitted results cover ALL required inspection points
                const requiredPointIds = new Set(
                    inspectionPoints.map(p => p.inspectionPointId)
                );
                const submittedPointIds = new Set(
                    data.inspectionResults.map(r => r.inspectionPointId)
                );

                const missingPoints = [...requiredPointIds].filter(
                    id => !submittedPointIds.has(id)
                );
                if (missingPoints.length > 0) {
                    throw new Error(
                        `Missing inspection results for point IDs: ${missingPoints.join(', ')}. ` +
                        `All ${requiredPointIds.size} points must be evaluated.`
                    );
                }

                const extraPoints = [...submittedPointIds].filter(
                    id => !requiredPointIds.has(id)
                );
                if (extraPoints.length > 0) {
                    throw new Error(
                        `Unknown inspection point IDs: ${extraPoints.join(', ')}. ` +
                        `These do not belong to checklist "${checklist.checklistName}".`
                    );
                }

                // 4. One Fail = Total Fail — derive overall result
                const allPassed = data.inspectionResults.every(r => r.passed);
                const overallResult = allPassed 
                    ? QualityCheckResult.PASSED 
                    : QualityCheckResult.FAILED;

                // 5. Create QualityCheck + nested InspectionResult records
                const qualityCheck = await tx.qualityCheck.create({
                    data: {
                        productInstanceId: instance.productInstanceId,
                        employeeId: userId,
                        checklistId: checklist.checklistId,
                        result: overallResult,
                        checkDate: data.checkDate 
                            ? new Date(data.checkDate) 
                            : new Date(),
                        notes: data.notes,
                        inspectionResults: {
                            create: data.inspectionResults.map(r => ({
                                inspectionPointId: r.inspectionPointId,
                                passed: r.passed,
                                measuredValue: r.measuredValue,
                                notes: r.notes
                            }))
                        }
                    },
                    include: {
                        inspectionResults: {
                            include: {
                                inspectionPoint: {
                                    select: { pointName: true, pointType: true }
                                }
                            }
                        },
                        checklist: { select: { checklistName: true } },
                        employee: { select: { fullName: true } }
                    }
                });

                // 6. Update ProductInstance status — ONLY PASSED_QC or FAILED_QC
                //    No warehouse routing, no inventory transaction, no PR attribution.
                //    Those responsibilities belong to the Product Induction service (Phase 3).
                const targetStatus = overallResult === QualityCheckResult.PASSED
                    ? ProductInstanceStatus.PASSED_QC
                    : ProductInstanceStatus.FAILED_QC;

                await tx.productInstance.update({
                    where: { productInstanceId: instance.productInstanceId },
                    data: { status: targetStatus }
                });

                await this.checkBatchCostAbsorption(
                    instance.productionBatch.productionBatchId,
                    instance.productionBatch.workOrderId,
                    tx
                );

                return {
                    ...qualityCheck,
                    instanceStatus: targetStatus
                };
            });
        } catch (error) {
            // Unique constraint violation (@@unique on productInstanceId) = duplicate QC
            if (
                error instanceof Prisma.PrismaClientKnownRequestError && 
                error.code === 'P2002'
            ) {
                throw new Error(
                    'This product instance has already been inspected. ' +
                    'Duplicate QC is not allowed.'
                );
            }
            throw error;
        }
    }

    /**
     * Cost absorption trigger — called after each QC result.
     * Checks if all instances in the batch have been inspected.
     * If yes, calculates and distributes unit production costs.
     */
    private async checkBatchCostAbsorption(
        productionBatchId: number,
        workOrderId: number,
        tx: Prisma.TransactionClient
    ): Promise<void> {
        // 1. Count total instances in the batch
        const totalInstances = await tx.productInstance.count({
            where: { productionBatchId }
        });

        if (totalInstances === 0) return;

        // 2. Count instances still PENDING_QC
        const pendingCount = await tx.productInstance.count({
            where: { 
                productionBatchId, 
                status: ProductInstanceStatus.PENDING_QC 
            }
        });

        // 3. If PENDING_QC > 0 → return (not all checked yet)
        if (pendingCount > 0) return;

        // 4. If all checked: Fetch WorkOrder
        const workOrder = await tx.workOrder.findUnique({
            where: { workOrderId }
        });

        if (!workOrder) return;

        // Block on Missing Costs
        if (workOrder.laborCost === null || workOrder.overheadCost === null) {
            throw new Error(`Work Order ${workOrder.code} is missing laborCost or overheadCost. Cannot complete QC cost absorption.`);
        }

        // 5. Calculate Total Material Cost
        const materialRequest = await tx.materialRequest.findUnique({
            where: { workOrderId }
        });

        let totalMaterialCost = new Prisma.Decimal(0);

        if (materialRequest) {
            const transactions = await tx.inventoryTransaction.findMany({
                where: {
                    materialReqId: materialRequest.requestId,
                    transactionType: 'EXPORT_PRODUCTION'
                },
                include: {
                    componentLot: {
                        include: {
                            poDetail: true
                        }
                    },
                    component: true
                }
            });

            for (const t of transactions) {
                if (t.componentLot && t.componentLot.poDetail) {
                    const cost = new Prisma.Decimal(t.quantity).mul(t.componentLot.poDetail.unitPrice);
                    totalMaterialCost = totalMaterialCost.add(cost);
                } else if (t.component) {
                    const cost = new Prisma.Decimal(t.quantity).mul(t.component.standardCost);
                    totalMaterialCost = totalMaterialCost.add(cost);
                }
            }
        }

        const laborCost = new Prisma.Decimal(workOrder.laborCost as any);
        const overheadCost = new Prisma.Decimal(workOrder.overheadCost as any);
        const batchTotalCost = laborCost.add(overheadCost).add(totalMaterialCost);

        // 6. Count PASSED_QC instances
        const passedCount = await tx.productInstance.count({
            where: { 
                productionBatchId, 
                status: ProductInstanceStatus.PASSED_QC 
            }
        });

        // 7. Zero Yield Guard
        if (passedCount === 0) {
            await tx.workOrder.update({
                where: { workOrderId },
                data: {
                    totalMaterialCost,
                    totalProductionCost: batchTotalCost
                }
            });

            await tx.productInstance.updateMany({
                where: { productionBatchId },
                data: { unitProductionCost: 0 }
            });
            return;
        }

        // 8. Distribute Costs
        const unitCost = batchTotalCost.dividedBy(passedCount);

        await tx.productInstance.updateMany({
            where: { 
                productionBatchId,
                status: ProductInstanceStatus.PASSED_QC 
            },
            data: { unitProductionCost: unitCost }
        });

        await tx.productInstance.updateMany({
            where: { 
                productionBatchId,
                status: ProductInstanceStatus.FAILED_QC 
            },
            data: { unitProductionCost: 0 }
        });

        await tx.workOrder.update({
            where: { workOrderId },
            data: {
                totalMaterialCost,
                totalProductionCost: batchTotalCost
            }
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
                productInstance: { select: { serialNumber: true, status: true } },
                checklist: { select: { checklistName: true } },
                inspectionResults: {
                    include: {
                        inspectionPoint: {
                            select: { pointName: true, pointType: true }
                        }
                    }
                }
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
                productInstance: { select: { serialNumber: true, status: true } },
                checklist: { select: { checklistName: true } },
                inspectionResults: {
                    include: {
                        inspectionPoint: {
                            select: { pointName: true, pointType: true }
                        }
                    }
                }
            },
            orderBy: { checkDate: 'desc' }
        });
    }
}

export default new QualityCheckService();
