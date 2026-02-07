import prisma from '../../common/lib/prisma.js';
import { ProductionRequestStatus, Priority } from '../../generated/prisma/index.js';

interface CreateProductionRequestData {
    productId: number;
    quantity: number;
    priority?: Priority;
    dueDate?: Date;
    salesOrderId?: number;
}

class ProductionRequestService {
    async createRequest(data: CreateProductionRequestData, userId: number) {
        const { productId, quantity, priority, dueDate, salesOrderId } = data;

        // 1. Validate Product
        const product = await prisma.product.findUnique({
            where: { productId }
        });
        if (!product) throw new Error("Product not found");

        // 2. Generate Code
        const count = await prisma.productionRequest.count();
        const code = `PR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        return prisma.productionRequest.create({
            data: {
                code,
                productId,
                quantity,
                priority: priority || 'MEDIUM',
                requestDate: new Date(), // Now
                // dueDate can be added if we extend the schema
                status: 'PENDING',
                employeeId: userId,
                salesOrderId // New Field
            },
            include: {
                product: true,
                employee: {
                    select: { fullName: true }
                }
            }
        });
    }

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
                    salesOrder: { select: { code: true } },
                    employee: { select: { fullName: true } }
                }
            }),
            prisma.productionRequest.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getRequestById(id: number) {
        const req = await prisma.productionRequest.findUnique({
            where: { productionRequestId: id },
            include: {
                product: true,
                salesOrder: { select: { code: true } },
                employee: { select: { fullName: true } },
                workOrderFulfillments: {
                    include: { workOrder: true }
                }
            }
        });

        if (!req) throw new Error("Production Request not found");
        return req;
    }

    async approveRequest(id: string | number) {
        const requestId = typeof id === 'string' ? parseInt(id) : id;

        const req = await prisma.productionRequest.findUnique({ where: { productionRequestId: requestId } });
        if (!req) throw new Error("Request not found");

        if (req.status !== 'PENDING') {
            throw new Error(`Cannot approve. Current status is ${req.status}`);
        }

        return prisma.productionRequest.update({
            where: { productionRequestId: requestId },
            data: { status: 'APPROVED' }
        });
    }

    async rejectRequest(id: string | number) {
        const requestId = typeof id === 'string' ? parseInt(id) : id;

        const req = await prisma.productionRequest.findUnique({ where: { productionRequestId: requestId } });
        if (!req) throw new Error("Request not found");

        if (req.status !== 'PENDING') {
            throw new Error(`Cannot reject. Current status is ${req.status}`);
        }

        // Technically could add a reason here if schema supported it
        return prisma.productionRequest.update({
            where: { productionRequestId: requestId },
            data: { status: 'REJECTED' }
        });
    }
}

export default new ProductionRequestService();
