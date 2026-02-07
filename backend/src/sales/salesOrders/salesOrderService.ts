import prisma from '../../common/lib/prisma.js';
import { NotificationType, SalesOrderStatus, Priority, Prisma } from '../../generated/prisma/index.js';

interface SODetailItem {
    productId: number;
    quantity: number;
    salePrice: number;
}

interface SOCreateData {
    // code is no longer accepted - always auto-generated as D-YYMMDD-ID
    status?: SalesOrderStatus;
    agentId: number;
    orderDate?: Date;
    expectedShipDate?: Date;
    discount: number;
    agentShippingPrice: number; // Renamed
    tax: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    note?: string;
    priority?: Priority;
    details: SODetailItem[];
}

interface SOUpdateData {
    expectedShipDate?: Date;
    discount?: number;
    agentShippingPrice?: number; // Renamed
    tax?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    note?: string;
    priority?: Priority;
    status?: never; // Explicitly forbid status updates here
    details?: SODetailItem[]; // Allow updating line items
}

class SalesOrderService {

    /**
     * Get the count of available (IN_STOCK) units for a product.
     */
    async getAvailableStock(productId: number): Promise<number> {
        return prisma.productInstance.count({
            where: {
                productId: productId,
                status: 'IN_STOCK'
            }
        });
    }

    /**
     * Optimized: Get available stock counts for multiple products in ONE query.
     * Prevents N+1 performance bottleneck.
     */
    async getBulkAvailableStock(productIds: number[], tx?: Prisma.TransactionClient): Promise<Map<number, number>> {
            const db = tx || prisma;
        const counts = await db.productInstance.groupBy({
            by: ['productId'],
            where: {
                productId: { in: productIds },
                status: 'IN_STOCK'
            },
            _count: {
                productId: true
            }
        });

        const stockMap = new Map<number, number>();
        productIds.forEach(id => stockMap.set(id, 0)); // Default to 0
        counts.forEach(c => stockMap.set(c.productId, c._count.productId));
        return stockMap;
    }

    /**
     * Generate sequential SO code: SO-YYYY-XXX
     * Called only when submitting a draft for approval.
     */
    async generateSOCode(): Promise<string> {
        const year = new Date().getFullYear();
        const yearPrefix = `SO-${year}-`;

        const lastSO = await prisma.salesOrder.findFirst({
            where: { code: { startsWith: yearPrefix } },
            orderBy: { code: 'desc' },
            select: { code: true }
        });

        let nextNumber = 1;
        if (lastSO) {
            const lastNumberStr = lastSO.code.replace(yearPrefix, '');
            nextNumber = parseInt(lastNumberStr) + 1;
        }

        return `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    /**
     * Generate a temporary Draft code: D-YYMMDD-{InternalID}
     * Example: D-260201-45
     * This code is replaced with an official SO code upon submission.
     */
    generateDraftCode(internalId: number): string {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        return `D-${yy}${mm}${dd}-${internalId}`;
    }

    /**
     * Enrich SO details with availability and shortage info.
     * Performance: Uses bulk stock check to avoid N+1 queries.
     */
    async enrichDetailsWithAvailability(details: any[], tx?: Prisma.TransactionClient): Promise<any[]> {
        if (details.length === 0) return [];

        const productIds = details.map(d => d.productId);
        const stockMap = await this.getBulkAvailableStock(productIds, tx);

        return details.map(detail => {
            const availableStock = stockMap.get(detail.productId) || 0;
            const quantityNeeded = detail.quantity - (detail.quantityShipped || 0);
            const shortage = Math.max(0, quantityNeeded - availableStock);
            return {
                ...detail,
                availableStock,
                shortage
            };
        });
    }

    async createSO(data: SOCreateData, creatorId: number) {
        const {
            status, agentId, orderDate, expectedShipDate,
            discount, agentShippingPrice, tax, paymentTerms, deliveryTerms, note, priority,
            details
        } = data;

        return await prisma.$transaction(async (tx) => {
            // 1. Check for duplicate products in same order
            const productIds = details.map(item => item.productId);
            const uniqueIds = new Set(productIds);
            if (uniqueIds.size !== productIds.length) {
                throw new Error("Duplicate products found in list. Please combine them into a single line item.");
            }

            // 2. Validate Agent
            const agent = await tx.agent.findUnique({ where: { agentId } });
            if (!agent) throw new Error("Agent not found");

            // 3. Validate products & Subtotal
            let subtotal = 0;
            for (const item of details) {
                const product = await tx.product.findUnique({ where: { productId: item.productId } });
                if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
                subtotal += (item.quantity * item.salePrice);
            }

            const finalTotal = subtotal - discount + tax + agentShippingPrice;

            // 4. Create Order (Step 1: Use placeholder code, we need the ID first)
            const tempSO = await tx.salesOrder.create({
                data: {
                    code: 'PENDING', // Temporary placeholder
                    agentId,
                    employeeId: creatorId,
                    orderDate: orderDate || new Date(),
                    expectedShipDate,
                    status: status || SalesOrderStatus.DRAFT,
                    discount,
                    agentShippingPrice,
                    tax,
                    totalAmount: finalTotal,
                    paymentTerms,
                    deliveryTerms,
                    note,
                    priority: priority || Priority.MEDIUM,
                    details: {
                        create: details.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            salePrice: item.salePrice
                        }))
                    }
                }
            });

            // 5. Update with Correct Code (Step 2: Now we have the ID)
            // Logic: If user clicked "Save & Submit" (PENDING_APPROVAL), generate official SO- Code immediately.
            //        If user clicked "Save Draft" (DRAFT), generate D- Code.
            let finalCode: string;
            if (status === SalesOrderStatus.PENDING_APPROVAL) {
                finalCode = await this.generateSOCode();
            } else {
                finalCode = this.generateDraftCode(tempSO.salesOrderId);
            }

            const createdSO = await tx.salesOrder.update({
                where: { salesOrderId: tempSO.salesOrderId },
                data: { code: finalCode },
                include: {
                    // Optimized: Select only what UI needs
                    agent: {
                        select: {
                            agentName: true,
                            code: true,
                            phoneNumber: true,
                            address: true
                        }
                    },
                    employee: { select: { fullName: true } },
                    details: {
                        include: {
                            product: {
                                select: {
                                    code: true,
                                    productName: true,
                                    unit: true
                                }
                            }
                        }
                    }
                }
            });

            // 6. Enrich
            const enrichedDetails = await this.enrichDetailsWithAvailability(createdSO.details, tx);
            const hasShortage = enrichedDetails.some(d => d.shortage > 0);

            return {
                ...createdSO,
                details: enrichedDetails,
                hasShortage
            };
        });
    }

    async updateSO(id: string | number, data: SOUpdateData, userId: number) {
        const soId = typeof id === 'string' ? parseInt(id) : id;

        return await prisma.$transaction(async (tx) => {
            const so = await tx.salesOrder.findUnique({ where: { salesOrderId: soId } });
            if (!so) throw new Error("Sales Order not found");

            // BUSINESS RULE: Locked after Approval
            if (so.status !== SalesOrderStatus.DRAFT && so.status !== SalesOrderStatus.PENDING_APPROVAL) {
                throw new Error(`State Lock: Cannot edit order in ${so.status} status.`);
            }

            if (so.employeeId !== userId) {
                throw new Error("Privilege Violation: You can only edit your own orders.");
            }

            // --- 1. Handle Details Update (Full Replacement) ---
            if (data.details && data.details.length > 0) {
                // Delete all existing lines
                await tx.salesOrderDetail.deleteMany({
                    where: { salesOrderId: soId }
                });

                // Check for duplicates in new list
                const productIds = data.details.map(item => item.productId);
                const uniqueIds = new Set(productIds);
                if (uniqueIds.size !== productIds.length) {
                    throw new Error("Duplicate products found in list. Please combine them into a single line item.");
                }

                // Create new lines
                await tx.salesOrderDetail.createMany({
                    data: data.details.map(item => ({
                        salesOrderId: soId,
                        productId: item.productId,
                        quantity: item.quantity,
                        salePrice: item.salePrice
                    }))
                });
            }

            // --- 2. Recalculate Total Amount ---
            // If details changed, we fetch the new lines. If not, we fetch existing ones.
            const currentDetails = await tx.salesOrderDetail.findMany({
                where: { salesOrderId: soId }
            });

            let subtotal = 0;
            for (const item of currentDetails) {
                subtotal += (item.quantity * Number(item.salePrice));
            }

            // Use new values if provided, else fallback to existing SO values
            const discount = data.discount !== undefined ? data.discount : Number(so.discount);
            const tax = data.tax !== undefined ? data.tax : Number(so.tax);
            const agentShippingPrice = data.agentShippingPrice !== undefined ? data.agentShippingPrice : Number(so.agentShippingPrice);

            const newTotalAmount = subtotal - discount + tax + agentShippingPrice;

            // --- 3. Update Header ---
            await tx.salesOrder.update({
                where: { salesOrderId: soId },
                data: {
                    expectedShipDate: data.expectedShipDate,
                    discount: data.discount,
                    agentShippingPrice: data.agentShippingPrice,
                    tax: data.tax,
                    totalAmount: newTotalAmount, // AUTO-CALCULATED
                    paymentTerms: data.paymentTerms,
                    deliveryTerms: data.deliveryTerms,
                    note: data.note,
                    priority: data.priority
                }
            });

            return this.getSOById(soId, tx);
        });
    }

    async deleteSO(id: string | number, userId: number) {
        const soId = typeof id === 'string' ? parseInt(id) : id;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: soId } });

        if (!so) throw new Error("Order not found");

        // CONVENTION: Hybrid Rule
        // 1. If Status is not DRAFT, you can't "delete" it at all (Use Cancel for active orders)
        if (so.status !== SalesOrderStatus.DRAFT) {
            throw new Error(`Audit Trail: Cannot delete non-draft orders. Please cancel it instead.`);
        }

        if (so.employeeId !== userId) {
            throw new Error("Privilege Violation: You can only delete your own drafts.");
        }

        // 2. Hybrid Logic:
        // - Official Code (SO-xxx) -> Soft Delete (Void) to preserve sequence
        // - Draft Code (D-xxx) -> Hard Delete (Clean up trash)
        if (so.code && so.code.startsWith('SO-')) {
            return prisma.salesOrder.update({
                where: { salesOrderId: soId },
                data: {
                    status: SalesOrderStatus.CANCELLED,
                    note: (so.note || '') + `\n[VOIDED by User ${userId} at ${new Date().toISOString()}]`
                }
            });
        }

        // Default: Hard Delete for D-codes
        return prisma.salesOrder.delete({
            where: { salesOrderId: soId }
        });
    }

    async getAllSOs(query: { page?: number; limit?: number; search?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { code: { contains: query.search, mode: 'insensitive' } },
                { agent: { agentName: { contains: query.search, mode: 'insensitive' } } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.salesOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    salesOrderId: true,
                    code: true,
                    orderDate: true,
                    expectedShipDate: true,
                    status: true,
                    totalAmount: true,
                    priority: true,

                    agent: {
                        select: {
                            agentName: true
                        }
                    },

                    employee: {
                        select: {
                            fullName: true
                        }
                    },

                    _count: {
                        select: { details: true }
                    }
                }
            }),
            prisma.salesOrder.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    // UPDATED: Accepts optional 'tx' for Transaction context
    async getSOById(id: string | number, tx?: Prisma.TransactionClient) {
        const salesOrderId = typeof id === 'string' ? parseInt(id) : id;
        const db = tx || prisma; // Use Transaction Client if provided, else Global Client

        const so = await db.salesOrder.findUnique({
            where: { salesOrderId },
            include: {
                // Optimized: Select only what UI needs
                agent: {
                    select: {
                        agentName: true,
                        code: true,
                        phoneNumber: true,
                        address: true
                    }
                },
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                details: {
                    include: {
                        product: {
                            select: {
                                code: true,
                                productName: true,
                                unit: true
                            }
                        }
                    }
                }
            }
        });
        if (!so) throw new Error("Sales Order not found");

        // Enrich with availability data
        const enrichedDetails = await this.enrichDetailsWithAvailability(so.details, db);
        const hasShortage = enrichedDetails.some(d => d.shortage > 0);

        return {
            ...so,
            details: enrichedDetails,
            hasShortage
        };
    }

    async approveSO(soId: string | number, approverId: number) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;

        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            const so = await tx.salesOrder.findUnique({
                where: { salesOrderId: id },
                include: { details: true }
            });

            if (!so) throw new Error("Order not found");
            if (so.status !== SalesOrderStatus.PENDING_APPROVAL) throw new Error(`Process Violation: Cannot approve order in ${so.status} status.`);

            if (so.employeeId === approverId) {
                throw new Error("Audit Violation: You cannot approve your own Sales Order.");
            }

            // --- Hard Stock Reservation Logic (FIFO) ---
            let totalReserved = 0;
            let totalShortage = 0;

            for (const detail of so.details) {
                const quantityNeeded = detail.quantity - (detail.quantityShipped || 0);

                // Find available stock (FIFO by createdAt)
                const availableInstances = await tx.productInstance.findMany({
                    where: {
                        productId: detail.productId,
                        status: 'IN_STOCK',
                        salesOrderId: null // Ensure not already reserved
                    },
                    orderBy: { createdAt: 'asc' },
                    take: quantityNeeded
                });

                // Lock specific Serial Numbers to this SO
                for (const instance of availableInstances) {
                    await tx.productInstance.update({
                        where: { productInstanceId: instance.productInstanceId },
                        data: {
                            status: 'RESERVED',
                            salesOrderId: id
                        }
                    });
                    totalReserved++;
                }

                const shortage = Math.max(0, quantityNeeded - availableInstances.length);
                if (shortage > 0) totalShortage += shortage;
            }

            await tx.salesOrder.update({
                where: { salesOrderId: id },
                data: {
                    status: SalesOrderStatus.APPROVED,
                    approverId: approverId,
                    approvedAt: new Date()
                }
            });

            const updatedSO = await this.getSOById(id, tx);
            return { updatedSO, totalReserved, totalShortage };
        });

        // Notify Creator
        try {
            const NotificationService = (await import('../../notifications/notificationService.js')).default;
            await NotificationService.createNotification({
                type: NotificationType.SO_APPROVED,
                title: 'Sales Order Approved',
                message: `SO ${result.updatedSO.code} is Approved. ${result.totalReserved} units reserved. ${result.totalShortage > 0 ? `Alert: ${result.totalShortage} units shortage!` : ''}`,
                employeeId: result.updatedSO.employeeId,
                relatedEntityType: 'SalesOrder',
                relatedEntityId: id
            });
        } catch (e) {
            console.error("Notification failed", e);
        }

        return {
            ...result.updatedSO,
            reservedCount: result.totalReserved,
            shortage: result.totalShortage
        };
    }

    async submitSO(soId: string | number, userId: number) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== SalesOrderStatus.DRAFT) throw new Error(`Cannot submit. Current status is ${so.status}`);
        if (so.employeeId !== userId) throw new Error("Only the creator can submit this order.");

        // Assign official SO code only if current code is a Draft code (D-YYMMDD-ID)
        // If order was previously submitted, rejected, and resubmitted, keep the existing SO code
        let newCode = so.code;
        if (so.code.startsWith('D-')) {
            newCode = await this.generateSOCode();
        }

        await prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: {
                status: SalesOrderStatus.PENDING_APPROVAL,
                code: newCode
            }
        });

        return this.getSOById(id);
    }

    async rejectSO(soId: string | number, rejecterId: number, reason: string) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== SalesOrderStatus.PENDING_APPROVAL) throw new Error(`Cannot reject. Current status is ${so.status}`);
        if (so.employeeId === rejecterId) throw new Error("You cannot reject your own order.");

        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const rejectionNote = `\n[REJECTED ${timestamp}]: ${reason}`;
        const updatedNote = (so.note || '') + rejectionNote;

        await prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: {
                status: SalesOrderStatus.DRAFT,
                note: updatedNote
            }
        });

        return this.getSOById(id);
    }

    async startProcessing(soId: string | number, userId: number) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId; // Fixed: was self-referencing
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== SalesOrderStatus.APPROVED) {
            throw new Error(`Cannot start processing. Order status must be APPROVED (Current: ${so.status})`);
        }

        await prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: { status: SalesOrderStatus.IN_PROGRESS }
        });

        return this.getSOById(id);
    }

    async shipOrder(
        soId: string | number,
        shipmentItems: { productId: number; serialNumbers: string[] }[],
        userId: number,
        courierShippingCost?: number // NEW: Track actual expense
    ) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;

        return await prisma.$transaction(async (tx) => {
            const so = await tx.salesOrder.findUnique({
                where: { salesOrderId: id },
                include: { details: true }
            });

            if (!so) throw new Error("Sales Order not found");

            // BUSINESS RULE: Must be Approved to ship.
            const allowedShipStatuses: SalesOrderStatus[] = [SalesOrderStatus.APPROVED, SalesOrderStatus.IN_PROGRESS];
            if (!allowedShipStatuses.includes(so.status)) {
                throw new Error(`Process Violation: Cannot ship order in ${so.status} status.`);
            }

            for (const item of shipmentItems) {
                const detail = so.details.find(d => d.productId === item.productId);
                if (!detail) throw new Error(`Product ID ${item.productId} is not on this Order.`);

                const quantityToShip = item.serialNumbers.length;
                const remaining = detail.quantity - detail.quantityShipped;

                if (quantityToShip > remaining) {
                    throw new Error(`Over-shipment: Attempting to ship ${quantityToShip} but only ${remaining} remain.`);
                }

                for (const serial of item.serialNumbers) {
                    const instance = await tx.productInstance.findUnique({
                        where: { serialNumber: serial }
                    });

                    if (!instance) throw new Error(`Serial ${serial} not found.`);
                    if (instance.productId !== item.productId) throw new Error(`Serial ${serial} mismatch for Product ID ${item.productId}.`);

                    // Ensure we only ship what was Reserved for this SO (or at least In Stock)
                    if (instance.status !== 'RESERVED' && instance.status !== 'IN_STOCK') {
                        throw new Error(`Serial ${serial} is in invalid state for shipping: ${instance.status}`);
                    }

                    // A. Update Status
                    await tx.productInstance.update({
                        where: { serialNumber: serial },
                        data: { status: 'SHIPPED', salesOrderId: id }
                    });

                    // B. Log Transaction
                    await tx.inventoryTransaction.create({
                        data: {
                            transactionType: 'EXPORT_SALES',
                            quantity: 1,
                            productInstanceId: instance.productInstanceId,
                            warehouseId: 1, // Defaulting to Main Warehouse
                            employeeId: userId,
                            note: `Shipped for SO ${so.code}`
                        }
                    });
                }

                // C. Update SO Detail Qty
                await tx.salesOrderDetail.update({
                    where: {
                        salesOrderId_productId: { salesOrderId: id, productId: item.productId }
                    },
                    data: { quantityShipped: { increment: quantityToShip } }
                });
            }

            // 5. Check Completion
            const updatedDetails = await tx.salesOrderDetail.findMany({ where: { salesOrderId: id } });
            const allShipped = updatedDetails.every(d => d.quantityShipped >= d.quantity);
            const newStatus = allShipped ? SalesOrderStatus.COMPLETED : SalesOrderStatus.IN_PROGRESS;

            await tx.salesOrder.update({
                where: { salesOrderId: id },
                data: {
                    status: newStatus,
                    courierShippingCost: courierShippingCost || undefined // Update expense if provided
                }
            });

            return this.getSOById(id, tx);
        });
    }
    
    async cancelSO(soId: string | number, userId: number, reason: string) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;

        return await prisma.$transaction(async (tx) => {
            const so = await tx.salesOrder.findUnique({
                where: { salesOrderId: id },
                include: { details: true, employee: true }
            });

            if (!so) throw new Error("Order not found");

            // 1. Status Validation
            const ALLOWED_STATUSES: SalesOrderStatus[] = [SalesOrderStatus.PENDING_APPROVAL, SalesOrderStatus.APPROVED, SalesOrderStatus.IN_PROGRESS];
            if (!ALLOWED_STATUSES.includes(so.status)) {
                // Drafts should be deleted, not cancelled. Shipped/Completed cannot be cancelled.
                throw new Error(`Cannot cancel order in ${so.status} status.`);
            }

            // 2. Privilege Check (Mock Logic - needs Role check in Controller, but here we check Ownership)
            // Sales Staff can cancel their own PENDING/APPROVED.
            // Managers can cancel ANY.
            // For now, we rely on Controller authorization.

            // 3. Logic: Release Stock if it was reserved
            // Statuses that hold stock: APPROVED, IN_PROGRESS
            const stockHoldingStatuses: SalesOrderStatus[] = [SalesOrderStatus.APPROVED, SalesOrderStatus.IN_PROGRESS];
            if (stockHoldingStatuses.includes(so.status)) {
                // Find all reserved instances for this SO
                await tx.productInstance.updateMany({
                    where: { salesOrderId: id },
                    data: {
                        status: 'IN_STOCK',
                        salesOrderId: null
                    }
                });
            }

            // 4. Update Order Status
            const timestamp = new Date().toISOString();
            const cancelNote = `\n[CANCELLED ${timestamp} by User ${userId}]: ${reason}`;
            const updatedNote = (so.note || '') + cancelNote;

            await tx.salesOrder.update({
                where: { salesOrderId: id },
                data: {
                    status: SalesOrderStatus.CANCELLED,
                    note: updatedNote
                }
            });

            return this.getSOById(id, tx);
        });
    }
}

export default new SalesOrderService();
