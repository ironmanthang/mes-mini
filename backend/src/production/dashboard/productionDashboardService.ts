import prisma from '../../common/lib/prisma.js';

interface PendingProductionRequest {
    code: string;
    productName: string;
    quantity: number;
    priority: string;
    status: string;
}

interface CostPerUnit {
    amount: number;
    productName: string;
}

interface ProductionDashboardResponse {
    pendingRequests: {
        count: number;
        requests: PendingProductionRequest[];
    };
    activeWorkOrders: number | null;
    qcPassRate: number | null;
    costPerUnit: CostPerUnit | null;
}

class ProductionDashboardService {

    async getMetrics(): Promise<ProductionDashboardResponse> {
        const pendingPRs = await prisma.productionRequest.findMany({
            where: {
                status: { in: ['APPROVED', 'WAITING_MATERIAL'] }
            },
            select: {
                code: true,
                quantity: true,
                priority: true,
                status: true,
                product: { select: { productName: true } }
            },
            orderBy: [
                { priority: 'asc' },
                { createdAt: 'asc' }
            ],
            take: 20
        });

        return {
            pendingRequests: {
                count: pendingPRs.length,
                requests: pendingPRs.map(pr => ({
                    code: pr.code,
                    productName: pr.product.productName,
                    quantity: pr.quantity,
                    priority: pr.priority,
                    status: pr.status
                }))
            },
            activeWorkOrders: null,
            qcPassRate: null,
            costPerUnit: null
        };
    }
}

export default new ProductionDashboardService();