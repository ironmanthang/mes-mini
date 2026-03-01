import prisma from '../../common/lib/prisma.js';
import { Priority } from '../../generated/prisma/index.js';
import MrpService, { MrpResult } from '../mrp/mrpService.js';
import { Priority } from '../../generated/prisma/index.js';
import MrpService, { MrpResult } from '../mrp/mrpService.js';

interface CreateProductionRequestData {
    productId: number;
    quantity: number;
    priority?: Priority;
    dueDate?: Date;
    soDetailId?: number;
    note?: string;
}

class ProductionRequestService {
    private generateCode(): string {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `PR-${yyyy}${mm}${dd}-${random}`;
    }

    // ─── CREATE ────────────────────────────────────────────────────────

    async createRequest(data: CreateProductionRequestData, userId: number) {
        const { productId, quantity, priority, dueDate, soDetailId, note } = data;

        if (quantity <= 0) throw new Error("Quantity must be greater than 0");

        // 1. Validate Product & BOM
        const product = await prisma.product.findUnique({
            where: { productId },
            include: { bom: true }
        });
        if (!product) throw new Error("Product not found");

        if (!product.bom || product.bom.length === 0) {
            throw new Error("Cannot create Production Request: Product has no Bill of Materials (BOM).");
        }

        // 2. Validate SalesOrderDetail (if MTO)
        if (soDetailId) {
            const soDetail = await prisma.salesOrderDetail.findUnique({
                where: { soDetailId },
                include: { salesOrder: true }
            });
            if (!soDetail) throw new Error(`Sales Order Detail ID ${soDetailId} not found`);

            if (soDetail.salesOrder.status !== 'APPROVED' && soDetail.salesOrder.status !== 'IN_PROGRESS') {
                throw new Error(`Sales Order ${soDetail.salesOrder.code} is not in APPROVED or IN_PROGRESS status (current: ${soDetail.salesOrder.status})`);
            }

            // Validate product matches the SO line item
            if (soDetail.productId !== productId) {
                throw new Error(`Product ID ${productId} does not match Sales Order Detail (expected productId: ${soDetail.productId})`);
            }

            // Enforce one active PR per soDetailId
            const existingPR = await prisma.productionRequest.findFirst({
                where: {
                    soDetailId,
                    status: { notIn: ['CANCELLED'] }
                }
            });
            if (existingPR) {
                throw new Error(`A Production Request (${existingPR.code}) already exists for this line item (status: ${existingPR.status})`);
            }
        }

        // 3. Run BOM Check (MRP)
        const mrpResult = await MrpService.calculateRequirements(productId, quantity);

        // 4. Determine status based on BOM check
        const status = mrpResult.canProduce ? 'APPROVED' : 'WAITING_MATERIAL';

        // 5. Build note
        const isMTS = !soDetailId;
        const autoNote = isMTS ? "Manual Request (MTS)" : undefined;
        const finalNote = [autoNote, note].filter(Boolean).join(' — ') || undefined;

        // 6. Create PR with retry for code collision
        let code = this.generateCode();
        let retries = 3;
        while (retries > 0) {
            try {
                const pr = await prisma.productionRequest.create({
                    data: {
                        code,
                        productId,
                        quantity,
                        priority: priority || 'MEDIUM',
                        requestDate: new Date(),
                        dueDate: dueDate ? new Date(dueDate) : undefined,
                        note: finalNote,
                        status,
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

                return { ...pr, mrpResult };
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

    // ─── RE-CHECK FEASIBILITY ──────────────────────────────────────────

    async recheckFeasibility(id: number) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: { product: true }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== 'WAITING_MATERIAL') {
            throw new Error(`Cannot re-check: PR status is ${pr.status}. Only WAITING_MATERIAL requests can be re-checked.`);
        }

        // Re-run BOM check
        const mrpResult = await MrpService.calculateRequirements(pr.productId, pr.quantity, pr.productionRequestId);

        if (mrpResult.canProduce) {
            // Transition to APPROVED
            const updated = await prisma.productionRequest.update({
                where: { productionRequestId: id },
                data: { status: 'APPROVED' },
                include: {
                    product: true,
                    employee: { select: { fullName: true } },
                    salesOrderDetail: {
                        include: { salesOrder: { select: { code: true } } }
                    }
                }
            });
            return { ...updated, mrpResult, transitioned: true };
        }

        // Still WAITING_MATERIAL — return current state + MRP result
        return { ...pr, mrpResult, transitioned: false };
    }

    // ─── DRAFT PURCHASE ORDER ──────────────────────────────────────────

    async draftPurchaseOrder(id: number) {
        const pr = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: { product: true }
        });
        if (!pr) throw new Error("Production Request not found");

        if (pr.status !== 'WAITING_MATERIAL') {
            throw new Error(`Cannot draft PO: PR status is ${pr.status}. Only WAITING_MATERIAL requests have shortages.`);
        }

        // Run MRP to get current shortages
        const mrpResult = await MrpService.calculateRequirements(pr.productId, pr.quantity, pr.productionRequestId);

        // Filter to only components with shortages
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

    async getAllRequests(query: { page?: number; limit?: number; status?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.status) {
            where.status = query.status;
        }

        const [data, total] = await Promise.all([
            prisma.productionRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestDate: 'desc' },
                include: {
                    product: true,
                    salesOrderDetail: {
                        include: { salesOrder: { select: { code: true } } }
                    },
                    employee: { select: { fullName: true } }
                }
            }),
            prisma.productionRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    // ─── GET BY ID ─────────────────────────────────────────────────────

    async getRequestById(id: number) {
        const req = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: {
                product: true,
                salesOrderDetail: {
                    include: { salesOrder: { select: { code: true } } }
                },
                employee: { select: { fullName: true } },
                workOrderFulfillments: {
                    include: { workOrder: true }
                },
                purchaseOrderDetails: {
                    include: {
                        component: true,
                        purchaseOrder: { select: { code: true, status: true } }
                    }
                }
            }
        });

        if (!req) throw new Error("Production Request not found");
        return req;
    }

    // ─── CANCEL ────────────────────────────────────────────────────────

    async cancelRequest(id: string | number, reason?: string) {
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

        if (req.status === 'FULFILLED' || req.status === 'CANCELLED') {
            throw new Error(`Cannot cancel. Request is already ${req.status}`);
        }

        // Ensure no work orders are already active/completed for this request
        const fulfillments = await prisma.workOrderFulfillment.findMany({
            where: { productionRequestId: requestId },
            include: { workOrder: true }
        });

        const hasActiveWO = fulfillments.length > 0;
        if (hasActiveWO) {
            throw new Error("Cannot cancel Production Request because it has associated Work Orders. Please cancel the Work Orders first.");
        }

        // Build note with warnings about linked POs
        let noteUpdate = reason ? `${req.note ? req.note + '; ' : ''}Cancelled: ${reason}` : req.note;

        if (req.purchaseOrderDetails.length > 0) {
            const linkedPOs = req.purchaseOrderDetails.map(d => d.purchaseOrder.code).join(', ');
            noteUpdate = `${noteUpdate ? noteUpdate + '; ' : ''}Warning: Linked PO(s): ${linkedPOs}`;
        }

        return prisma.productionRequest.update({
            where: { productionRequestId: requestId },
            data: {
                status: 'CANCELLED',
                note: noteUpdate
            }
        });
    }
}

export default new ProductionRequestService();
