import prisma from '../../common/lib/prisma.js';

interface SODetailItem {
    productId: number;
    quantity: number;
    salePrice: number;
}

interface SOCreateData {
    code: string;
    status?: string;
    agentId: number;
    orderDate?: Date;
    expectedShipDate?: Date;
    discount: number;
    shippingCost: number;
    tax: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    note?: string;
    priority?: string;
    details: SODetailItem[];
}

interface SOUpdateData {
    expectedShipDate?: Date;
    discount?: number;
    shippingCost?: number;
    tax?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    note?: string;
    priority?: string;
    status?: string;
}

class SalesOrderService {

    async createSO(data: SOCreateData, creatorId: number) {
        const {
            code, status, agentId, orderDate, expectedShipDate,
            discount, shippingCost, tax, paymentTerms, deliveryTerms, note, priority,
            details
        } = data;

        // Check for duplicate products in same order
        const productIds = details.map(item => item.productId);
        const uniqueIds = new Set(productIds);
        if (uniqueIds.size !== productIds.length) {
            throw new Error("Duplicate products found in list. Please combine them into a single line item.");
        }

        // 1. Check if Agent exists
        const agent = await prisma.agent.findUnique({ where: { agentId } });
        if (!agent) throw new Error("Agent not found");

        // 2. Validate products exist & calculate subtotal
        let subtotal = 0;

        for (const item of details) {
            const product = await prisma.product.findUnique({
                where: { productId: item.productId }
            });

            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }

            subtotal += (item.quantity * item.salePrice);
        }

        // 3. Calculate Final Total
        const finalTotal = subtotal - discount + tax + shippingCost;

        try {
            return await prisma.salesOrder.create({
                data: {
                    code,
                    agentId,
                    employeeId: creatorId,
                    orderDate,
                    expectedShipDate,
                    status: (status as any) || 'DRAFT',
                    discount,
                    shippingCost,
                    tax,
                    totalAmount: finalTotal,
                    paymentTerms,
                    deliveryTerms,
                    note,
                    priority: (priority as any) || 'MEDIUM',

                    details: {
                        create: details.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            salePrice: item.salePrice,
                            quantityShipped: 0
                        }))
                    }
                },
                include: {
                    details: {
                        include: { product: true }
                    },
                    agent: true
                }
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                if (error.meta && error.meta.target.includes('code')) {
                    throw new Error(`Sales Order Code "${code}" already exists.`);
                }
            }
            throw error;
        }
    }

    async updateSO(id: string | number, data: SOUpdateData, userId: number) {
        const soId = typeof id === 'string' ? parseInt(id) : id;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: soId } });

        if (!so) throw new Error("Sales Order not found");

        if (so.status !== 'DRAFT' && so.status !== 'PENDING') {
            throw new Error(`Cannot edit order. Status is ${so.status}`);
        }

        if (so.employeeId !== userId) {
            throw new Error("You can only edit your own orders.");
        }

        return prisma.salesOrder.update({
            where: { salesOrderId: soId },
            data: {
                expectedShipDate: data.expectedShipDate,
                discount: data.discount,
                shippingCost: data.shippingCost,
                tax: data.tax,
                paymentTerms: data.paymentTerms,
                deliveryTerms: data.deliveryTerms,
                note: data.note,
                priority: data.priority as any
            }
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

    async getSOById(id: string | number) {
        const salesOrderId = typeof id === 'string' ? parseInt(id) : id;
        const so = await prisma.salesOrder.findUnique({
            where: { salesOrderId },
            include: {
                agent: true,
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                details: {
                    include: { product: true }
                }
            }
        });
        if (!so) throw new Error("Sales Order not found");
        return so;
    }

    async approveSO(soId: string | number, approverId: number) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== 'PENDING') throw new Error(`Cannot approve order. Status is ${so.status}`);

        if (so.employeeId === approverId) {
            throw new Error("Violation: You cannot approve a Sales Order that you created yourself.");
        }

        return prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: {
                status: 'APPROVED',
                approverId: approverId,
                approvedAt: new Date()
            }
        });
    }

    async submitSO(soId: string | number, userId: number) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== 'DRAFT') throw new Error(`Cannot submit. Current status is ${so.status}`);
        if (so.employeeId !== userId) throw new Error("Only the creator can submit this order.");

        return prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: { status: 'PENDING' }
        });
    }

    async rejectSO(soId: string | number, rejecterId: number, reason: string) {
        const id = typeof soId === 'string' ? parseInt(soId) : soId;
        const so = await prisma.salesOrder.findUnique({ where: { salesOrderId: id } });

        if (!so) throw new Error("Order not found");
        if (so.status !== 'PENDING') throw new Error(`Cannot reject. Current status is ${so.status}`);
        if (so.employeeId === rejecterId) throw new Error("You cannot reject your own order.");

        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const rejectionNote = `\n[REJECTED ${timestamp}]: ${reason}`;
        const updatedNote = (so.note || '') + rejectionNote;

        return prisma.salesOrder.update({
            where: { salesOrderId: id },
            data: {
                status: 'DRAFT',
                note: updatedNote
            }
        });
    }
}

export default new SalesOrderService();
