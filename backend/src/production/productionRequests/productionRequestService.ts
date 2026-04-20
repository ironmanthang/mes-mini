import prisma from '../../common/lib/prisma.js';
import { Priority, ProductionRequestStatus, Prisma } from '../../generated/prisma/index.js';
import MrpService from '../mrp/mrpService.js';
import NotificationService from '../../notifications/notificationService.js';
import { NotificationType } from '../../generated/prisma/index.js';
import { AppError } from '../../common/utils/AppError.js';

interface CreateProductionRequestData {
    productId: number;
    quantity: number;
    priority?: Priority;
    dueDate?: Date;
    soDetailId?: number;
    note?: string;
    asDraft?: boolean;
}

interface UpdateDraftData {
    productId?: number;
    quantity?: number;
    priority?: Priority;
    dueDate?: Date;
    soDetailId?: number;
    note?: string;
}

class ProductionRequestService {
    private isPrivilegedRole(userRoles: { roleCode: string }[] = []): boolean {
        return userRoles.some(r => r.roleCode === 'SYS_ADMIN' || r.roleCode === 'PROD_MGR');
    }

    private generateCode(): string {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `PR-${yyyy}${mm}${dd}-${random}`;
    }

    private async validateProductAndBOM(productId: number, tx?: Prisma.TransactionClient): Promise<void> {
        const db = tx || prisma;
        const product = await db.product.findUnique({
            where: { productId },
            include: { bom: true }
        });
        if (!product) throw new Error("Product not found");
        if (!product.bom || product.bom.length === 0) {
            throw new Error("Cannot create Production Request: Product has no Bill of Materials (BOM).");
        }
    }

    private async validateSOdetail(
        soDetailId: number,
        productId: number,
        requestedQuantity?: number,
        excludePrId?: number,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        const db = tx || prisma;
        const soDetail = await db.salesOrderDetail.findUnique({
            where: { soDetailId },
            include: { salesOrder: true }
        });
        if (!soDetail) throw new Error(`Sales Order Detail ID ${soDetailId} not found`);

        if (soDetail.salesOrder.status !== 'APPROVED' && soDetail.salesOrder.status !== 'IN_PROGRESS') {
            throw new Error(`Sales Order ${soDetail.salesOrder.code} is not in APPROVED or IN_PROGRESS status (current: ${soDetail.salesOrder.status})`);
        }

        if (soDetail.productId !== productId) {
            throw new Error(`Product ID ${productId} does not match Sales Order Detail (expected productId: ${soDetail.productId})`);
        }

        if (requestedQuantity != null) {
            const remainingDemand = Math.max(soDetail.quantity - soDetail.quantityShipped, 0);
            if (requestedQuantity > remainingDemand) {
                throw new Error(
                    `Production Request quantity (${requestedQuantity}) exceeds remaining Sales Order quantity (${remainingDemand}) for ${soDetail.salesOrder.code}.`
                );
            }
        }

        const whereClause: any = {
            soDetailId,
            status: { notIn: ['CANCELLED'] }
        };
        if (excludePrId != null) {
            whereClause.productionRequestId = { not: excludePrId };
        }
        const existingPR = await db.productionRequest.findFirst({
            where: whereClause
        });
        if (existingPR) {
            throw new Error(`A Production Request (${existingPR.code}) already exists for this line item (status: ${existingPR.status})`);
        }
    }

    private async submitDraftInTransaction(id: number, tx: Prisma.TransactionClient) {
        const pr = await tx.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: { product: { include: { bom: true } } }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== ProductionRequestStatus.DRAFT) {
            throw new Error(`Cannot submit. PR status is ${pr.status}. Only DRAFT PRs can be submitted.`);
        }

        if (pr.product.bom.length === 0) {
            throw new Error("Cannot submit: Product has no Bill of Materials (BOM).");
        }

        if (pr.soDetailId) {
            await this.validateSOdetail(pr.soDetailId, pr.productId, pr.quantity, pr.productionRequestId, tx);
        }

        const mrpResult = await MrpService.calculateRequirements(pr.productId, pr.quantity, undefined, tx);

        const newStatus = mrpResult.canProduce
            ? ProductionRequestStatus.PENDING
            : ProductionRequestStatus.WAITING_MATERIAL;

        const updated = await tx.productionRequest.update({
            where: { productionRequestId: id },
            data: {
                status: newStatus,
                details: {
                    create: mrpResult.requirements.map(r => ({
                        componentId: r.componentId,
                        quantityPerUnit: r.quantityPerUnit,
                        totalRequired: r.totalRequired
                    }))
                }
            },
            include: {
                product: true,
                employee: { select: { fullName: true } },
                salesOrderDetail: {
                    include: { salesOrder: { select: { code: true } } }
                },
                details: {
                    include: { component: { select: { code: true, componentName: true, unit: true } } }
                }
            }
        });

        return { ...updated, mrpResult };
    }

    // ─── CREATE ────────────────────────────────────────────────────────

    async createRequest(data: CreateProductionRequestData, userId: number) {
        const { productId, quantity, priority, dueDate, soDetailId, note, asDraft } = data;
        const shouldSaveAsDraft = asDraft !== false;

        if (quantity <= 0) throw new Error("Quantity must be greater than 0");

        const isMTS = !soDetailId;
        const autoNote = isMTS ? "Manual Request (MTS)" : undefined;
        const finalNote = [autoNote, note].filter(Boolean).join(' — ') || undefined;

        let code = this.generateCode();
        let retries = 3;
        while (retries > 0) {
            try {
                if (shouldSaveAsDraft) {
                    await this.validateProductAndBOM(productId);

                    if (soDetailId) {
                        await this.validateSOdetail(soDetailId, productId, quantity);
                    }

                    return prisma.productionRequest.create({
                        data: {
                            code,
                            productId,
                            quantity,
                            priority: priority || 'MEDIUM',
                            dueDate: dueDate ? new Date(dueDate) : undefined,
                            note: finalNote,
                            status: ProductionRequestStatus.DRAFT,
                            employeeId: userId,
                            soDetailId: soDetailId || null
                        },
                        include: {
                            product: true,
                            employee: { select: { fullName: true } },
                            salesOrderDetail: {
                                include: { salesOrder: { select: { code: true } } }
                            }
                        }
                    });
                }

                return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                    await this.validateProductAndBOM(productId, tx);

                    if (soDetailId) {
                        await this.validateSOdetail(soDetailId, productId, quantity, undefined, tx);
                    }

                    const pr = await tx.productionRequest.create({
                        data: {
                            code,
                            productId,
                            quantity,
                            priority: priority || 'MEDIUM',
                            dueDate: dueDate ? new Date(dueDate) : undefined,
                            note: finalNote,
                            status: ProductionRequestStatus.DRAFT,
                            employeeId: userId,
                            soDetailId: soDetailId || null
                        }
                    });

                    return this.submitDraftInTransaction(pr.productionRequestId, tx);
                });
            } catch (error: any) {
                if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
                    code = this.generateCode();
                    retries--;
                } else {
                    throw error;
                }
            }
        }
        throw new Error("Failed to generate unique Production Request code after multiple retries");
    }

    // ─── UPDATE DRAFT ──────────────────────────────────────────────────

    async updateDraft(id: number, data: UpdateDraftData, userId: number) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== ProductionRequestStatus.DRAFT) {
            throw new Error(`Cannot update draft. PR status is ${pr.status}. Only DRAFT PRs can be updated.`);
        }

        if (pr.employeeId !== userId) {
            throw new Error("Only the creator can update this draft Production Request.");
        }

        if (data.productId != null) {
            await this.validateProductAndBOM(data.productId);
        }

        const targetProductId = data.productId ?? pr.productId;
        const targetQuantity = data.quantity ?? pr.quantity;
        const targetSoDetailId = data.soDetailId !== undefined ? data.soDetailId : pr.soDetailId;

        if (targetSoDetailId != null) {
            await this.validateSOdetail(targetSoDetailId, targetProductId, targetQuantity, id);
        }

        const updatePayload: any = {};
        if (data.productId !== undefined) updatePayload.productId = data.productId;
        if (data.quantity !== undefined) {
            if (data.quantity <= 0) throw new Error("Quantity must be greater than 0");
            updatePayload.quantity = data.quantity;
        }
        if (data.priority !== undefined) updatePayload.priority = data.priority;
        if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
        if (data.soDetailId !== undefined) updatePayload.soDetailId = data.soDetailId;
        if (data.note !== undefined) updatePayload.note = data.note;

        return prisma.productionRequest.update({
            where: { productionRequestId: id },
            data: updatePayload,
            include: {
                product: true,
                employee: { select: { fullName: true } },
                salesOrderDetail: {
                    include: { salesOrder: { select: { code: true } } }
                }
            }
        });
    }

    // ─── SUBMIT ────────────────────────────────────────────────────────

    async submitRequest(id: number, actorId: number) {
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const pr = await tx.productionRequest.findUnique({
                where: { productionRequestId: id },
                select: { employeeId: true }
            });
            if (!pr) throw new Error("Production Request not found");

            if (pr.employeeId !== actorId) {
                throw new AppError("Only the creator can submit this draft Production Request.", 403);
            }

            return this.submitDraftInTransaction(id, tx);
        });
    }

    // ─── APPROVE ───────────────────────────────────────────────────────

    async approveRequest(id: number, approverId: number) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== ProductionRequestStatus.PENDING) {
            throw new Error(`Cannot approve. PR status is ${pr.status}. Only PENDING PRs can be approved.`);
        }

        // Self-approval guard — route already checked PERM.PR_APPROVE
        if (pr.employeeId === approverId) {
            throw new Error("Violation: You cannot approve a Production Request that you created yourself.");
        }

        const updated = await prisma.productionRequest.update({
            where: { productionRequestId: id },
            data: {
                status: ProductionRequestStatus.APPROVED,
                approverId,
                approvedAt: new Date()
            },
            include: {
                product: true,
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                salesOrderDetail: {
                    include: { salesOrder: { select: { code: true } } }
                }
            }
        });

        await NotificationService.createNotification({
            type: NotificationType.PO_APPROVED,
            title: 'Production Request Approved',
            message: `Your Production Request ${pr.code} has been approved.`,
            employeeId: pr.employeeId,
            relatedEntityType: 'ProductionRequest',
            relatedEntityId: id
        });

        return updated;
    }

    // ─── RE-CHECK FEASIBILITY ──────────────────────────────────────────

    async recheckFeasibility(id: number, actorId: number, userRoles: { roleCode: string }[] = []) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: { product: true }
        });
        if (!pr) throw new Error("Production Request not found");

        const isCreator = pr.employeeId === actorId;
        const isPrivilegedRole = this.isPrivilegedRole(userRoles);
        if (!isCreator && !isPrivilegedRole) {
            throw new AppError(
                "You do not have permission to re-check this Production Request. Only the creator, a Production Manager, or a System Admin can perform this action.",
                403
            );
        }

        if (pr.status !== ProductionRequestStatus.WAITING_MATERIAL) {
            throw new Error(`Cannot re-check: PR status is ${pr.status}. Only WAITING_MATERIAL requests can be re-checked.`);
        }

        const mrpResult = await MrpService.calculateFromSnapshot(pr.productionRequestId);

        if (mrpResult.canProduce) {
            const updated = await prisma.productionRequest.update({
                where: { productionRequestId: id },
                data: { status: ProductionRequestStatus.PENDING },
                include: {
                    product: true,
                    employee: { select: { fullName: true } },
                    salesOrderDetail: {
                        include: { salesOrder: { select: { code: true } } }
                    },
                    details: {
                        include: { component: { select: { code: true, componentName: true, unit: true } } }
                    }
                }
            });
            return { ...updated, mrpResult, transitioned: true };
        }

        return { ...pr, mrpResult, transitioned: false };
    }

    // ─── DRAFT PURCHASE ORDER ──────────────────────────────────────────

    async draftPurchaseOrder(id: number) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: { product: true }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== ProductionRequestStatus.WAITING_MATERIAL) {
            throw new Error(`Cannot draft PO: PR status is ${pr.status}. Only WAITING_MATERIAL requests have shortages.`);
        }

        const mrpResult = await MrpService.calculateFromSnapshot(pr.productionRequestId);

        const shortages = mrpResult.requirements
            .filter(r => r.missingQuantity > 0)
            .map(r => ({
                componentId: r.componentId,
                componentCode: r.componentCode,
                componentName: r.componentName,
                unit: r.unit,
                shortageQty: r.missingQuantity,
                requiredQty: r.totalRequired,
                availableQty: r.availableStock
            }));

        return {
            productionRequestId: pr.productionRequestId,
            productionRequestCode: pr.code,
            productId: pr.productId,
            productName: pr.product.productName,
            components: shortages
        };
    }

    // ─── LIST ALL ──────────────────────────────────────────────────────

    async getAllRequests(query: { page?: number; limit?: number; status?: string } = {}, actorId: number) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        // DRAFT isolation: show all non-DRAFT requests + only the caller's own DRAFTs
        const draftFilter = {
            OR: [
                { status: { not: ProductionRequestStatus.DRAFT } },
                { employeeId: actorId }
            ]
        };

        const where: any = { AND: [draftFilter] };
        if (query.status) {
            (where.AND as any[]).push({ status: query.status });
        }

        const [data, total] = await Promise.all([
            prisma.productionRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: true,
                    salesOrderDetail: {
                        include: { salesOrder: { select: { code: true } } }
                    },
                    employee: { select: { fullName: true } },
                    approver: { select: { fullName: true } }
                }
            }),
            prisma.productionRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    // ─── GET BY ID ─────────────────────────────────────────────────────

    async getRequestById(id: number, actorId: number) {
        const req = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: {
                product: true,
                salesOrderDetail: {
                    include: { salesOrder: { select: { code: true } } }
                },
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                workOrderFulfillments: {
                    include: { workOrder: true }
                },
                purchaseOrderDetails: {
                    include: {
                        component: true,
                        purchaseOrder: { select: { code: true, status: true } }
                    }
                },
                details: {
                    include: {
                        component: { select: { code: true, componentName: true, unit: true } }
                    }
                }
            }
        });

        if (!req) throw new Error("Production Request not found");

        if (req.status === ProductionRequestStatus.DRAFT && req.employeeId !== actorId) {
            throw new AppError("You do not have permission to view this Production Request.", 403);
        }

        // Calculate remaining quantity to schedule
        const fulfilledQuantity = req.workOrderFulfillments.reduce((sum, f) => sum + f.quantity, 0);
        const remainingQtyToSchedule = req.quantity - fulfilledQuantity;

        return {
            ...req,
            fulfilledQuantity,
            remainingQtyToSchedule
        };
    }

    // ─── CANCEL ────────────────────────────────────────────────────────

    async cancelRequest(
        id: string | number,
        reason: string | undefined,
        actorId: number,
        userRoles: { roleCode: string }[] = []
    ) {
        const requestId = typeof id === 'string' ? parseInt(id) : id;

        const req = await prisma.productionRequest.findUnique({
            where: { productionRequestId: requestId },
            include: {
                purchaseOrderDetails: {
                    include: { purchaseOrder: { select: { code: true, status: true } } }
                }
            }
        });
        if (!req) throw new Error("Request not found");

        const isCreator = req.employeeId === actorId;
        const isPrivilegedRole = this.isPrivilegedRole(userRoles);
        if (!isCreator && !isPrivilegedRole) {
            throw new AppError(
                "You do not have permission to cancel this Production Request. Only the creator, a Production Manager, or a System Admin can cancel.",
                403
            );
        }

        if (req.status === ProductionRequestStatus.FULFILLED || req.status === ProductionRequestStatus.CANCELLED) {
            throw new Error(`Cannot cancel. Request is already ${req.status}`);
        }

        const fulfillments = await prisma.workOrderFulfillment.findMany({
            where: { productionRequestId: requestId },
            include: { workOrder: true }
        });

        const hasActiveWO = fulfillments.length > 0;
        if (hasActiveWO) {
            throw new Error("Cannot cancel Production Request because it has associated Work Orders. Please cancel the Work Orders first.");
        }

        let noteUpdate = reason ? `${req.note ? req.note + '; ' : ''}Cancelled: ${reason}` : req.note;

        if (req.purchaseOrderDetails.length > 0) {
            const linkedPOs = req.purchaseOrderDetails.map(d => d.purchaseOrder.code).join(', ');
            noteUpdate = `${noteUpdate ? noteUpdate + '; ' : ''}Warning: Linked PO(s): ${linkedPOs}`;
        }

        return prisma.productionRequest.update({
            where: { productionRequestId: requestId },
            data: {
                status: ProductionRequestStatus.CANCELLED,
                note: noteUpdate
            }
        });
    }
}

export default new ProductionRequestService();