import prisma from '../../common/lib/prisma.js';
import { NotificationType, PurchaseOrderStatus, ProductionRequestStatus, Priority, Prisma } from '../../generated/prisma/index.js';
import { AppError } from '../../common/utils/AppError.js';
import MaterialRequestService from '../../warehouse-ops/material-request/materialRequestService.js';
import NotificationService from '../../notifications/notificationService.js';
import AttachmentService from '../../common/services/attachmentService.js';

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

interface PODetailItem {
    componentId: number;
    quantity: number;
    unitPrice: number;
    productionRequestId?: number;
    productionRequestId?: number;
}

interface POCreateData {
    status?: 'DRAFT' | 'PENDING';
    supplierId: number;
    warehouseId: number;
    orderDate?: Date;
    expectedDeliveryDate?: Date;
    taxRate: number;
    shippingCost: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    priority?: Priority;
    note?: string;
    details: PODetailItem[];
}

interface POUpdateData {
    expectedDeliveryDate?: Date;
    warehouseId?: number;
    taxRate?: number;
    shippingCost?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    priority?: Priority;
    note?: string;
    details?: PODetailItem[];
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

class PurchaseOrderService {

    // ── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Generates an official sequential PO code (e.g. PO-2026-001).
     * MUST be called inside a prisma.$transaction to prevent race conditions
     * between concurrent create/submit calls.
     */
    private async generateOfficialPOCode(tx: Prisma.TransactionClient): Promise<string> {
        const year = new Date().getFullYear();
        const scope = `PO-${year}`;

        // Upsert returns the mutated row directly (Race-condition safe)
        const row = await tx.codeSequence.upsert({
            where: { scope },
            create: { scope, currentValue: 1 },
            update: { currentValue: { increment: 1 } }
        });

        return `PO-${year}-${String(row.currentValue).padStart(3, '0')}`;
    }

    /**
     * Generates a sequential lot code (e.g. LOT-260329-001).
     * Scope resets daily. MUST be called inside a prisma.$transaction.
     */
    private async generateLotCode(tx: Prisma.TransactionClient): Promise<string> {
        const dateStamp = this.getDateStamp();
        const scope = `LOT-${dateStamp}`;

        const row = await tx.codeSequence.upsert({
            where: { scope },
            create: { scope, currentValue: 1 },
            update: { currentValue: { increment: 1 } }
        });

        return `LOT-${dateStamp}-${String(row.currentValue).padStart(3, '0')}`;
    }

    /**
     * Returns YYMMDD string for today (used in draft and lot codes).
     */
    private getDateStamp(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yy}${mm}${dd}`;
    }

    // ── Shared Validation Helper ──────────────────────────────────────────────

    /**
     * Validates all detail items: supplier relationship + optional BOM check.
     * Returns the computed subtotal.
     */
    private async validateDetailsAndComputeSubtotal(
        supplierId: number,
        details: PODetailItem[]
    ): Promise<number> {
        let subtotal = 0;

        // O(1) Data Fetching to avoid N+1 traps
        const componentIds = details.map(d => d.componentId);
        const prIds = [...new Set(details.map(d => d.productionRequestId).filter((id): id is number => id != null))];

        const [supplierTokens, prs, prDetails] = await Promise.all([
            prisma.supplierComponent.findMany({
                where: { supplierId, componentId: { in: componentIds } }
            }),
            prisma.productionRequest.findMany({
                where: { productionRequestId: { in: prIds } }
            }),
            prisma.productionRequestDetail.findMany({
                where: { productionRequestId: { in: prIds }, componentId: { in: componentIds } }
            })
        ]);

        const validComponents = new Set(supplierTokens.map(sc => sc.componentId));
        const validPRs = new Map(prs.map(pr => [pr.productionRequestId, pr.status]));

        const validBOMs = new Set(prDetails.map(prd => `${prd.productionRequestId}_${prd.componentId}`));

        for (const item of details) {
            if (!validComponents.has(item.componentId)) {
                throw new AppError(`Component ID ${item.componentId} is not provided by this Supplier.`, 400);
            }

            if (item.productionRequestId != null) {
                const prStatus = validPRs.get(item.productionRequestId);
                if (!prStatus) {
                    throw new AppError(`ProductionRequest ID ${item.productionRequestId} not found.`, 404);
                }
                if (prStatus !== 'APPROVED' && prStatus !== 'WAITING_MATERIAL') {
                    throw new AppError(`Cannot link to PR ${item.productionRequestId} because its status is ${prStatus}. Only APPROVED or WAITING_MATERIAL PRs can be linked.`, 400);
                }
                if (!validBOMs.has(`${item.productionRequestId}_${item.componentId}`)) {
                    throw new AppError(
                        `Component ID ${item.componentId} is not in the BOM of ProductionRequest ${item.productionRequestId}.`,
                        400
                    );
                }
            }

            subtotal += item.quantity * item.unitPrice;
        }

        return subtotal;
    }

    // ── Public Methods ────────────────────────────────────────────────────────

    async createPO(data: POCreateData, creatorId: number) {
        const {
            status = 'DRAFT',
            supplierId, warehouseId, orderDate, expectedDeliveryDate,
            shippingCost, taxRate,
            paymentTerms, deliveryTerms, priority, note,
            details
        } = data;

        // 1. Duplicate component guard
        const componentIds = details.map(item => item.componentId);
        const uniqueIds = new Set(componentIds);
        if (uniqueIds.size !== componentIds.length) {
            throw new AppError('Duplicate components found in list. Please combine them into a single line item.', 400);
        }

        // 2. Supplier exists check
        const supplier = await prisma.supplier.findUnique({ where: { supplierId } });
        if (!supplier) throw new AppError('Supplier not found', 404);

        // 2b. Warehouse type check
        const warehouse = await prisma.warehouse.findUnique({ where: { warehouseId } });
        if (!warehouse) throw new AppError('Warehouse not found', 404);
        if (warehouse.warehouseType !== 'COMPONENT') {
            throw new AppError(`Destination warehouse must be of type 'COMPONENT'. Selected warehouse is of type '${warehouse.warehouseType}'.`, 400);
        }

        // 3. Validate items + BOM + compute subtotal
        const subtotal = await this.validateDetailsAndComputeSubtotal(supplierId, details);
        const taxAmount = subtotal * (taxRate / 100);
        const finalTotal = subtotal + taxAmount + shippingCost;
        
        if (finalTotal < 0) {
            throw new AppError('Total amount cannot be negative.', 400);
        }

        const detailCreatePayload = details.map(item => ({
            componentId: item.componentId,
            quantityOrdered: item.quantity,
            unitPrice: item.unitPrice,
            quantityReceived: 0,
            productionRequestId: item.productionRequestId ?? null
        }));

        // ── DRAFT path: 2-step create-then-update inside $transaction ──────────
        if (status === 'DRAFT') {
            return await prisma.$transaction(async (tx) => {
                const dateStamp = this.getDateStamp();

                // Step 1: Create with a temp unique placeholder
                const newPO = await tx.purchaseOrder.create({
                    data: {
                        code: `DRAFT-TMP-${Date.now()}`,
                        supplier: { connect: { supplierId } },
                        warehouse: { connect: { warehouseId } },
                        employee: { connect: { employeeId: creatorId } },
                        orderDate,
                        expectedDeliveryDate,
                        status: PurchaseOrderStatus.DRAFT,
                        shippingCost,
                        taxRate,
                        totalAmount: finalTotal,
                        paymentTerms,
                        deliveryTerms,
                        priority,
                        note,
                        details: { create: detailCreatePayload }
                    },
                    include: { details: { include: { component: true } } }
                });

                // Step 2: Update code using the now-known autoincrement PK
                const draftCode = `D-PO-${dateStamp}-${newPO.purchaseOrderId}`;
                const updatedPO = await tx.purchaseOrder.update({
                    where: { purchaseOrderId: newPO.purchaseOrderId },
                    data: { code: draftCode },
                    include: { details: { include: { component: true } } }
                });

                return updatedPO;
            });
        }

        // ── PENDING path (direct submit): generate official code inside $transaction ──
        return await prisma.$transaction(async (tx) => {
            const officialCode = await this.generateOfficialPOCode(tx);

            const newPO = await tx.purchaseOrder.create({
                data: {
                    code: officialCode,
                    supplier: { connect: { supplierId } },
                    warehouse: { connect: { warehouseId } },
                    employee: { connect: { employeeId: creatorId } },
                    orderDate,
                    expectedDeliveryDate,
                    status: PurchaseOrderStatus.PENDING,
                    shippingCost,
                    taxRate,
                    totalAmount: finalTotal,
                    paymentTerms,
                    deliveryTerms,

                    details: {
                        create: details.map(item => ({
                            componentId: item.componentId,
                            quantityOrdered: item.quantity,
                            unitPrice: item.unitPrice,
                            quantityReceived: 0,
                            productionRequestId: item.productionRequestId || null
                        }))
                    }
                },
                include: {
                    details: { include: { component: true } },
                    supplier: true,
                    employee: { select: { fullName: true } }
                }
            });
        });
    }


    async updatePO(id: string | number, data: POUpdateData, userId: number) {
        const poId = typeof id === 'string' ? parseInt(id) : id;

        // Eager-load details — needed for totalAmount recalculation in DRAFT
        const po = await prisma.purchaseOrder.findUnique({
            where: { purchaseOrderId: poId },
            include: { details: true }
        });

        if (!po) throw new AppError('Purchase Order not found', 404);

        // ── Status lock guard ────────────────────────────────────────────────
        const lockedStatuses: PurchaseOrderStatus[] = [
            PurchaseOrderStatus.ORDERED,
            PurchaseOrderStatus.RECEIVING,
            PurchaseOrderStatus.COMPLETED,
            PurchaseOrderStatus.CANCELLED
        ];
        if (lockedStatuses.includes(po.status)) {
            throw new AppError(
                `Cannot edit Purchase Order. Status is '${po.status}' — edits are no longer permitted.`,
                400
            );
        }

        // ── Ownership guard ──────────────────────────────────────────────────
        if (po.employeeId !== userId) {
            throw new AppError('You can only edit your own Purchase Order.', 403);
        }

        // ── Field-mutability matrix ──────────────────────────────────────────
        // Fields frozen in PENDING and APPROVED states
        const financialFields: (keyof POUpdateData)[] = ['shippingCost', 'taxRate', 'paymentTerms', 'deliveryTerms', 'warehouseId', 'details'];
        const pendingFrozenFields: (keyof POUpdateData)[] = [...financialFields];
        const approvedFrozenFields: (keyof POUpdateData)[] = [...financialFields, 'priority'];

        if (po.status === PurchaseOrderStatus.PENDING) {
            for (const field of pendingFrozenFields) {
                if (data[field] !== undefined) {
                    throw new AppError(
                        `The '${field}' field is frozen while the PO is in PENDING approval. ` +
                        `Financial fields cannot be changed during manager review.`,
                        400
                    );
                }
            }
        }

        if (po.status === PurchaseOrderStatus.APPROVED) {
            for (const field of approvedFrozenFields) {
                if (data[field] !== undefined) {
                    throw new AppError(
                        `The '${field}' field is frozen while the PO is in APPROVED state. ` +
                        `Only 'note' and 'expectedDeliveryDate' may be updated during supplier negotiation.`,
                        400
                    );
                }
            }
        }

        // ── Build update payload ─────────────────────────────────────────────
        const updatePayload: Prisma.PurchaseOrderUpdateInput = {};

        // Fields allowed in ALL editable states (DRAFT, PENDING, APPROVED)
        if (data.note !== undefined)                 updatePayload.note = data.note;
        if (data.expectedDeliveryDate !== undefined) updatePayload.expectedDeliveryDate = data.expectedDeliveryDate;

        // Fields allowed in DRAFT and PENDING only
        if (po.status === PurchaseOrderStatus.DRAFT || po.status === PurchaseOrderStatus.PENDING) {
            if (data.priority !== undefined) updatePayload.priority = data.priority;
        }

        // Financial fields — DRAFT only
        if (po.status === PurchaseOrderStatus.DRAFT) {
            if (data.warehouseId !== undefined) {
                const warehouse = await prisma.warehouse.findUnique({ where: { warehouseId: data.warehouseId } });
                if (!warehouse) throw new AppError('Warehouse not found', 404);
                if (warehouse.warehouseType !== 'COMPONENT') {
                    throw new AppError(`Destination warehouse must be of type 'COMPONENT'. Selected warehouse is of type '${warehouse.warehouseType}'.`, 400);
                }
                updatePayload.warehouse = { connect: { warehouseId: data.warehouseId } };
            }
            if (data.shippingCost !== undefined) updatePayload.shippingCost = data.shippingCost;
            if (data.taxRate !== undefined)      updatePayload.taxRate = data.taxRate;
            if (data.paymentTerms !== undefined) updatePayload.paymentTerms = data.paymentTerms;
            if (data.deliveryTerms !== undefined) updatePayload.deliveryTerms = data.deliveryTerms;
            
            // Nested items update
            if (data.details && data.details.length > 0) {
                await this.validateDetailsAndComputeSubtotal(po.supplierId, data.details);
                updatePayload.details = {
                    deleteMany: {},
                    create: data.details.map(item => ({
                        componentId: item.componentId,
                        quantityOrdered: item.quantity,
                        unitPrice: item.unitPrice,
                        quantityReceived: 0,
                        productionRequestId: item.productionRequestId ?? null
                    }))
                };
            }

            // ── totalAmount recalculation (DRAFT only) ───────────────────────
            const financialChanged = data.shippingCost !== undefined ||
                                     data.taxRate !== undefined ||
                                     data.details !== undefined;

            if (financialChanged) {
                const subtotal = data.details 
                    ? data.details.reduce((sum, d) => sum + d.quantity * Number(d.unitPrice), 0)
                    : po.details.reduce((sum, d) => sum + d.quantityOrdered * Number(d.unitPrice), 0);
                    
                const effectiveTax       = data.taxRate      ?? Number(po.taxRate);
                const effectiveShipping  = data.shippingCost ?? Number(po.shippingCost);

                const taxAmount = subtotal * (effectiveTax / 100);
                const newTotal = subtotal + taxAmount + effectiveShipping;

                if (newTotal < 0) {
                    throw new AppError(`Total amount cannot be negative.`, 400);
                }

                updatePayload.totalAmount = newTotal;
            }
        }

        return prisma.purchaseOrder.update({
            where: { purchaseOrderId: poId },
            data: updatePayload,
            include: {
                supplier: true,
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                details: { include: { component: true } }
            }
        });
    }


    async getAllPOs(query: { page?: number; limit?: number; search?: string; status?: string; priority?: Priority } = {}, userId: number) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        // DRAFT isolation: show all non-DRAFT POs + only the caller's own DRAFTs
        const draftFilter = {
            OR: [
                { status: { not: PurchaseOrderStatus.DRAFT } },
                { employeeId: userId }
            ]
        };

        const where: Prisma.PurchaseOrderWhereInput = { AND: [draftFilter] };

        // ── Status Filter (Comma-separated) ──────────────────────────────────
        if (query.status) {
            const statuses = query.status.split(',') as PurchaseOrderStatus[];
            (where.AND as Prisma.PurchaseOrderWhereInput[]).push({
                status: { in: statuses }
            });
        }

        // ── Priority Filter ──────────────────────────────────────────────────
        if (query.priority) {
            (where.AND as Prisma.PurchaseOrderWhereInput[]).push({
                priority: query.priority
            });
        }

        // ── Global Search ──────────────────────────────────────────────────
        if (query.search) {
            (where.AND as Prisma.PurchaseOrderWhereInput[]).push({
                OR: [
                    { code: { contains: query.search, mode: 'insensitive' } },
                    { supplier: { supplierName: { contains: query.search, mode: 'insensitive' } } }
                ]
            });
        }

        const [data, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    purchaseOrderId: true,
                    code: true,
                    orderDate: true,
                    expectedDeliveryDate: true,
                    status: true,
                    totalAmount: true,
                    priority: true,
                    supplier: {
                        select: { supplierName: true, code: true }
                    },
                    employee: {
                        select: { fullName: true }
                    },
                    _count: { select: { details: true } }
                }
            }),
            prisma.purchaseOrder.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }


    async getPOById(id: string | number, userId: number) {
        const purchaseOrderId = typeof id === 'string' ? parseInt(id) : id;
        const po = await prisma.purchaseOrder.findUnique({
            where: { purchaseOrderId },
            include: {
                supplier: true,
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                details: { include: { component: true } }
            }
        });
        if (!po) throw new AppError('Purchase Order not found', 404);

        // DRAFT isolation: only the creator can view a DRAFT PO (doc 01_logic.md line 102)
        if (po.status === PurchaseOrderStatus.DRAFT && po.employeeId !== userId) {
            throw new AppError('You do not have permission to view this Purchase Order.', 403);
        }

        return po;
    }


    async approvePO(poId: string | number, approverId: number) {
        const id = parseInt(String(poId));
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });

        if (!po) throw new AppError('Order not found', 404);

        // B1/B2 fix: guard now checks PENDING (not old PENDING_APPROVAL)
        if (po.status !== PurchaseOrderStatus.PENDING) {
            throw new AppError(`Cannot approve order. Status is ${po.status}. Only PENDING orders can be approved.`, 400);
        }

        if (po.employeeId === approverId) {
            throw new AppError('Violation: You cannot approve a Purchase Order that you created yourself.', 403);
        }

        // B1/B2 fix: sets status to APPROVED (not old SENT_TO_SUPPLIER / ORDERED)
        const updatedPO = await prisma.purchaseOrder.update({
            where: { purchaseOrderId: id },
            data: {
                status: PurchaseOrderStatus.APPROVED,
                approverId: Number(approverId),
                approvedAt: new Date()
            }
        });

        const NotificationService = (await import('../../notifications/notificationService.js')).default;
        await NotificationService.createNotification({
            type: NotificationType.PO_APPROVED,
            title: 'Purchase Order Approved',
            message: `Your Purchase Order ${po.code} has been approved.`,
            employeeId: po.employeeId,
            relatedEntityType: 'PurchaseOrder',
            relatedEntityId: id
        });

        return updatedPO;
    }


    async sendToSupplier(poId: string | number, data: { note?: string }, userId: number) {
        const id = parseInt(String(poId));
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });

        if (!po) throw new AppError('Order not found', 404);
        if (po.status !== PurchaseOrderStatus.APPROVED) {
            throw new AppError(`Cannot send to supplier. Status is ${po.status}. Only APPROVED orders can be sent.`, 400);
        }
        if (po.employeeId !== userId) {
            throw new AppError('Only the creator of this Purchase Order can send it to the supplier.', 403);
        }

        return prisma.purchaseOrder.update({
            where: { purchaseOrderId: id },
            data: {
                status: PurchaseOrderStatus.ORDERED,
                ...(data.note != null && { note: data.note })
            }
        });
    }



    async cancelPO(poId: string | number, userId: number, userRoles: { roleName: string }[], note?: string) {
        const id = typeof poId === 'string' ? parseInt(poId) : poId;
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });

        if (!po) throw new AppError('Purchase Order not found', 404);

        // ── Status guard ─────────────────────────────────────────────────────
        if (po.status === PurchaseOrderStatus.DRAFT) {
            throw new AppError(
                `Cannot cancel a DRAFT Purchase Order. Use the DELETE endpoint to remove drafts instead.`,
                400
            );
        }

        const legalLockStatuses: PurchaseOrderStatus[] = [
            PurchaseOrderStatus.ORDERED,
            PurchaseOrderStatus.RECEIVING,
            PurchaseOrderStatus.COMPLETED
        ];
        if (legalLockStatuses.includes(po.status)) {
            throw new AppError(
                `Cannot cancel. The Purchase Order is in '${po.status}' status, ` +
                `which represents a legally binding contract with the supplier. ` +
                `Any disputes must be resolved outside the system.`,
                400
            );
        }

        if (po.status === PurchaseOrderStatus.CANCELLED) {
            throw new AppError('This Purchase Order has already been cancelled.', 400);
        }

        // ── RBAC guard (creator OR Admin/Manager) ────────────────────────────
        const isCreator = po.employeeId === userId;
        const isPrivilegedRole = userRoles.some(r =>
            r.roleName === 'System Admin' || r.roleName === 'Production Manager'
        );
        if (!isCreator && !isPrivilegedRole) {
            throw new AppError(
                'You do not have permission to cancel this Purchase Order. ' +
                'Only the creator, a Production Manager, or a System Admin can cancel.',
                403
            );
        }

        return prisma.purchaseOrder.update({
            where: { purchaseOrderId: id },
            data: {
                status: PurchaseOrderStatus.CANCELLED,
                ...(note != null && { note })
            }
        });
    }


    async deletePO(poId: string | number, userId: number) {
        const id = typeof poId === 'string' ? parseInt(poId) : poId;
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });

        if (!po) throw new AppError('Purchase Order not found', 404);

        // ── Status guard ─────────────────────────────────────────────────────
        if (po.status !== PurchaseOrderStatus.DRAFT) {
            throw new AppError(
                `Cannot delete. Only DRAFT Purchase Orders can be hard-deleted. ` +
                `This PO is in '${po.status}' status — use the cancel endpoint instead to preserve the audit trail.`,
                400
            );
        }

        // ── Ownership guard ──────────────────────────────────────────────────
        if (po.employeeId !== userId) {
            throw new AppError('Only the creator can delete a draft Purchase Order.', 403);
        }

        // ── Cascade: Delete attachments from R2 + DB first ───────────────────
        // The Attachment table uses a polymorphic (entityType, entityId) pattern
        // with no real FK — so onDelete: Cascade does NOT apply here.
        // We must clean up manually before removing the PO.
        await AttachmentService.deleteAllForEntity('PURCHASE_ORDER', id);

        // Hard-delete the PO — PurchaseOrderDetail cascade is handled by onDelete: Cascade in schema.
        // DRAFTs have no InventoryTransaction records (receiveGoods blocks DRAFT status), so no FK risk.
        await prisma.purchaseOrder.delete({ where: { purchaseOrderId: id } });

        return { message: `Draft Purchase Order deleted successfully.` };
    }


    async receiveGoods(poId: string | number, items: { componentId: number; quantity: number; warehouseId: number }[], userId: number) {
        const id = typeof poId === 'string' ? parseInt(poId) : poId;

        // Fetch PO outside transaction for notification data (po.code, po.employeeId)
        const poForNotification = await prisma.purchaseOrder.findUnique({
            where: { purchaseOrderId: id },
            select: { code: true, employeeId: true }
        });

        // 1. Pre-aggregate items to validate total received per component before DB mutations
        // This solves the stale JS memory issue when multiple boxes of the same component are passed.
        const aggregatedReceipts = new Map<number, number>();
        for (const item of items) {
            aggregatedReceipts.set(item.componentId, (aggregatedReceipts.get(item.componentId) || 0) + item.quantity);
        }

        const result = await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: id },
                include: { details: true }
            });

            if (!po) throw new AppError('Purchase Order not found', 404);

            const allowedStatuses = [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.RECEIVING];
            if (!(allowedStatuses as any[]).includes(po.status)) {
                throw new AppError(
                    `Cannot receive goods. Order status is '${po.status}'. Must be ORDERED or RECEIVING.`,
                    400
                );
            }

            // 2. Validate aggregated quantities against the PO details
            for (const [componentId, totalReceivedQty] of aggregatedReceipts.entries()) {
                const detail = po.details.find(d => d.componentId === componentId);
                if (!detail) {
                    throw new AppError(`Component ID ${componentId} is not in this Purchase Order.`, 400);
                }
                const remaining = detail.quantityOrdered - detail.quantityReceived;
                if (totalReceivedQty > remaining) {
                    throw new AppError(
                        `Cannot receive total ${totalReceivedQty} for Component ${componentId}. Only ${remaining} remaining.`,
                        400
                    );
                }
            }

            // 2b. Validate Split-Routing rule (enforce item.warehouseId === po.warehouseId)
            for (const item of items) {
                if (item.warehouseId !== po.warehouseId) {
                    throw new AppError(
                        `This is not the destination warehouse of this Purchase Order`,
                        400
                    );
                }
            }

            const generatedLots: any[] = []; // To collect lot codes for the frontend

            // 3. Process individual boxes (items)
            for (const item of items) {
                const detail = po.details.find(d => d.componentId === item.componentId)!;

                // A. Update PO Detail (quantityReceived) - Optimistic Lock Guard
                const updateRes = await tx.purchaseOrderDetail.updateMany({
                    where: {
                        purchaseOrderId: id,
                        componentId: item.componentId,
                        // Guard: ensures we do not over-receive via concurrent race condition
                        quantityReceived: { lte: detail.quantityOrdered - item.quantity }
                    },
                    data: { quantityReceived: { increment: item.quantity } }
                });

                if (updateRes.count === 0) {
                    throw new AppError(
                        `Concurrent update detected or over-receive attempted for Component ${item.componentId}.`,
                        409
                    );
                }

                // B. Upsert ComponentStock
                await tx.componentStock.upsert({
                    where: {
                        warehouseId_componentId: {
                            warehouseId: item.warehouseId,
                            componentId: item.componentId
                        }
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: {
                        warehouseId: item.warehouseId,
                        componentId: item.componentId,
                        quantity: item.quantity
                    }
                });

                // C. Create Inventory Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: 'IMPORT_PO',
                        quantity: item.quantity,
                        componentId: item.componentId,
                        warehouseId: item.warehouseId,
                        employeeId: userId,
                        purchaseOrderId: id,
                        note: `Received from PO ${po.code}`
                    }
                });

                // D. Create ComponentLot (box-level traceability)
                const lotCode = await this.generateLotCode(tx);
                const newLot = await tx.componentLot.create({
                    data: {
                        lotCode,
                        componentId: item.componentId,
                        poDetailId: detail.poDetailId,
                        warehouseId: item.warehouseId,
                        quantity: item.quantity
                    }
                });

                // Collect generated lot code
                generatedLots.push({
                    lotCode: newLot.lotCode,
                    componentId: newLot.componentId,
                    quantity: newLot.quantity
                });
            }

            // Completion check: ALL details fully received → COMPLETED, else RECEIVING
            const updatedDetails = await tx.purchaseOrderDetail.findMany({
                where: { purchaseOrderId: id }
            });

            const allReceived = updatedDetails.every(d => d.quantityReceived >= d.quantityOrdered);
            const newStatus = allReceived ? PurchaseOrderStatus.COMPLETED : PurchaseOrderStatus.RECEIVING;

            const finalPO = await tx.purchaseOrder.update({
                where: { purchaseOrderId: id },
                data: { status: newStatus },
                include: { details: { include: { component: true } } }
            });

            // ── Unblock Production Requests if relevant ──
            const prIds = [...new Set(updatedDetails.map(d => d.productionRequestId).filter(id => id != null))] as number[];
            
            if (prIds.length > 0) {
                const waitingPRs = await tx.productionRequest.findMany({
                    where: { 
                        productionRequestId: { in: prIds },
                        status: ProductionRequestStatus.WAITING_MATERIAL 
                    }
                });

                for (const pr of waitingPRs) {
                    const linkedDetails = await tx.purchaseOrderDetail.findMany({
                        where: { productionRequestId: pr.productionRequestId }
                    });
                    
                    const prFullyReceived = linkedDetails.length > 0 && linkedDetails.every(d => d.quantityReceived >= d.quantityOrdered);
                    
                    if (prFullyReceived) {
                        await tx.productionRequest.update({
                            where: { productionRequestId: pr.productionRequestId },
                            data: { status: ProductionRequestStatus.APPROVED }
                        });
                    }
                }
            }

            return { po: finalPO, generatedLots };
        });

        // PO_RECEIVED notification — OUTSIDE transaction (failure must NOT roll back receive)
        if (poForNotification) {
            try {
                const NotificationService = (await import('../../notifications/notificationService.js')).default;
                await NotificationService.createNotification({
                    type: NotificationType.PO_RECEIVED,
                    title: 'Goods Received',
                    message: `Goods received for PO ${poForNotification.code}: ${items.length} box(es)`,
                    employeeId: poForNotification.employeeId,
                    relatedEntityType: 'PurchaseOrder',
                    relatedEntityId: id
                });
            } catch {
                // Notification failure is non-critical — the receive already committed successfully.
            }
        }

        return result;
    }

    /**
     * Gets all ComponentLots generated for a specific Purchase Order.
     * Used so workers can view/reprint barcode labels after initial receipt.
     */
    async getLotsByPO(poId: string | number, userId: number) {
        const id = typeof poId === 'string' ? parseInt(poId) : poId;
        
        // Fetch lots using the relationship poDetail.purchaseOrderId
        const lots = await prisma.componentLot.findMany({
            where: {
                poDetail: {
                    purchaseOrderId: id
                }
            },
            include: {
                component: { select: { componentName: true, code: true } },
                warehouse: { select: { warehouseName: true, code: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return lots;
    }
}

export default new PurchaseOrderService();
