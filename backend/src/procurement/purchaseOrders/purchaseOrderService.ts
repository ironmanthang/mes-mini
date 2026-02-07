import prisma from '../../common/lib/prisma.js';
import { PurchaseOrder, NotificationType, PurchaseOrderStatus } from '../../generated/prisma/index.js';

interface PODetailItem {
    componentId: number;
    quantity: number;
    unitPrice: number;
}

interface POCreateData {
    code: string;
    status?: string;
    supplierId: number;
    orderDate?: Date;
    expectedDeliveryDate?: Date;
    discount: number;
    shippingCost: number;
    tax: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    details: PODetailItem[];
}

interface POUpdateData {
    expectedDeliveryDate?: Date;
    discount?: number;
    shippingCost?: number;
    tax?: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    status?: string;
}

class PurchaseOrderService {

    async createPO(data: POCreateData, creatorId: number) {
        const {
            code, status, supplierId, orderDate, expectedDeliveryDate,
            discount, shippingCost, tax, paymentTerms, deliveryTerms,
            details
        } = data;

        const componentIds = details.map(item => item.componentId);
        const uniqueIds = new Set(componentIds);
        if (uniqueIds.size !== componentIds.length) {
            throw new Error("Duplicate components found in list. Please combine them into a single line item.");
        }

        // 1. Check if Supplier exists
        const supplier = await prisma.supplier.findUnique({ where: { supplierId } });
        if (!supplier) throw new Error("Supplier not found");

        // 2. Validate Items & Calculate Subtotal
        let subtotal = 0;

        for (const item of details) {
            const relation = await prisma.supplierComponent.findUnique({
                where: {
                    supplierId_componentId: {
                        supplierId: supplierId,
                        componentId: item.componentId
                    }
                }
            });

            if (!relation) {
                throw new Error(`Component ID ${item.componentId} is not provided by this Supplier.`);
            }

            subtotal += (item.quantity * item.unitPrice);
        }

        // 3. Calculate Final Total
        const finalTotal = subtotal - discount + tax + shippingCost;

        try {
            return await prisma.purchaseOrder.create({
                data: {
                    code,
                    supplierId,
                    employeeId: creatorId,
                    orderDate,
                    expectedDeliveryDate,
                    status: (status as any) || PurchaseOrderStatus.DRAFT,
                    discount,
                    shippingCost,
                    tax,
                    totalAmount: finalTotal,

                    paymentTerms,
                    deliveryTerms,

                    details: {
                        create: details.map(item => ({
                            componentId: item.componentId,
                            quantityOrdered: item.quantity,
                            unitPrice: item.unitPrice,
                            quantityReceived: 0
                        }))
                    }
                },
                include: {
                    details: {
                        include: { component: true }
                    }
                }
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                if (error.meta && error.meta.target.includes('code')) {
                    throw new Error(`Purchase Order Code "${code}" already exists.`);
                }
            }
            throw error;
        }
    }



    async updatePO(id: string | number, data: POUpdateData, userId: number) {
        const poId = typeof id === 'string' ? parseInt(id) : id;
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: poId } });

        if (!po) throw new Error("PO not found");

        if (po.status !== PurchaseOrderStatus.DRAFT && po.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
            throw new Error(`Cannot edit order. Status is ${po.status}`);
        }

        if (po.employeeId !== userId) {
            throw new Error("You can only edit your own orders.");
        }

        return prisma.purchaseOrder.update({
            where: { purchaseOrderId: poId },
            data: {
                expectedDeliveryDate: data.expectedDeliveryDate,
                discount: data.discount,
                shippingCost: data.shippingCost,
                tax: data.tax,
                paymentTerms: data.paymentTerms,
                deliveryTerms: data.deliveryTerms,
                status: data.status as any // Allow status update (DRAFT -> PENDING_APPROVAL)
            }
        });
    }


    async getAllPOs(query: { page?: number; limit?: number; search?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { code: { contains: query.search, mode: 'insensitive' } },
                { supplier: { supplierName: { contains: query.search, mode: 'insensitive' } } }
            ];
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
                        select: {
                            supplierName: true,
                            code: true
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
            prisma.purchaseOrder.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getPOById(id: string | number) {
        const purchaseOrderId = typeof id === 'string' ? parseInt(id) : id;
        const po = await prisma.purchaseOrder.findUnique({
            where: { purchaseOrderId },
            include: {
                supplier: true,
                employee: { select: { fullName: true } },
                approver: { select: { fullName: true } },
                details: {
                    include: { component: true }
                }
            }
        });
        if (!po) throw new Error("Purchase Order not found");
        return po;
    }

    async approvePO(poId: string | number, approverId: number) {
        const id = parseInt(String(poId));
        const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: id } });

        if (!po) throw new Error("Order not found");
        if (po.status !== PurchaseOrderStatus.PENDING_APPROVAL) throw new Error(`Cannot approve order. Status is ${po.status}`);

        if (po.employeeId === approverId) {
            throw new Error("Violation: You cannot approve a Purchase Order that you created yourself.");
        }

        const updatedPO = await prisma.purchaseOrder.update({
            where: { purchaseOrderId: Number(id) },
            data: {
                status: PurchaseOrderStatus.SENT_TO_SUPPLIER,
                approverId: Number(approverId),
                approvedAt: new Date()
            }
        });

        // Notify the creator that their PO was approved
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

    async receiveGoods(poId: string | number, items: { componentId: number; quantity: number; warehouseId: number }[], userId: number) {
        const id = typeof poId === 'string' ? parseInt(poId) : poId;

        // 1. Fetch PO with details using a transaction to ensure data integrity during the check
        return await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: id },
                include: { details: true }
            });

            if (!po) throw new Error("Purchase Order not found");

            // Allow receiving if SENT_TO_SUPPLIER or PARTIALLY_RECEIVED
            const allowedStatuses = [PurchaseOrderStatus.SENT_TO_SUPPLIER, PurchaseOrderStatus.PARTIALLY_RECEIVED];
            // Cast to any because allowedStatuses is PurchaseOrderStatus[] but po.status is PurchaseOrderStatus (enum)
            if (!(allowedStatuses as any[]).includes(po.status)) {
                throw new Error(`Cannot receive goods. Order status is ${po.status}. Must be SENT_TO_SUPPLIER or PARTIALLY_RECEIVED.`);
            }

            // 2. Process each item
            for (const item of items) {
                const detail = po.details.find(d => d.componentId === item.componentId);

                if (!detail) {
                    throw new Error(`Component ID ${item.componentId} is not in this Purchase Order.`);
                }

                const remaining = detail.quantityOrdered - detail.quantityReceived;
                if (item.quantity > remaining) {
                    throw new Error(`Cannot receive ${item.quantity} for Component ${item.componentId}. Only ${remaining} remaining.`);
                }

                // A. Update PO Detail
                await tx.purchaseOrderDetail.update({
                    where: {
                        purchaseOrderId_componentId: {
                            purchaseOrderId: id,
                            componentId: item.componentId
                        }
                    },
                    data: {
                        quantityReceived: { increment: item.quantity }
                    }
                });

                // B. Update/Upsert ComponentStock
                // We use upsert because the stock might not exist in this warehouse yet
                await tx.componentStock.upsert({
                    where: {
                        warehouseId_componentId: {
                            warehouseId: item.warehouseId,
                            componentId: item.componentId
                        }
                    },
                    update: {
                        quantity: { increment: item.quantity }
                    },
                    create: {
                        warehouseId: item.warehouseId,
                        componentId: item.componentId,
                        quantity: item.quantity
                    }
                });

                // C. Create Inventory Transaction Log
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
            }

            // 3. Check if PO is fully completed
            // We fetch the Updated details to check the new totals
            const updatedDetails = await tx.purchaseOrderDetail.findMany({
                where: { purchaseOrderId: id }
            });

            const allReceived = updatedDetails.every(d => d.quantityReceived >= d.quantityOrdered);
            const newStatus = allReceived ? PurchaseOrderStatus.COMPLETED : PurchaseOrderStatus.PARTIALLY_RECEIVED;

            // 4. Update PO Status
            const updatedPO = await tx.purchaseOrder.update({
                where: { purchaseOrderId: Number(id) },
                data: {
                    status: newStatus
                },
                include: {
                    details: { include: { component: true } }
                }
            });

            return updatedPO;
        });
    }
}

export default new PurchaseOrderService();
