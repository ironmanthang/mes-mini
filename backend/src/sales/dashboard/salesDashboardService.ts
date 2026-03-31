import prisma from '../../common/lib/prisma.js';

// ─── Response Types ────────────────────────────────────────────────

interface PendingSalesOrder {
    salesOrderId: number;
    code: string;
    agentName: string;
    productName: string;
    quantity: number;
    quantityShipped: number;
    status: string;
}

interface SalesDashboardResponse {
    pendingCount: number;
    orders: PendingSalesOrder[];
}

// ─── Service ───────────────────────────────────────────────────────

class SalesDashboardService {

    /**
     * Fetch Sales Orders that are waiting for stock to be fulfilled.
     * "Pending" = SO is APPROVED or IN_PROGRESS AND has line items where
     * quantityShipped < quantity.
     *
     * Returns flattened line items (one row per SO+Product combination),
     * matching the UI mockup table layout.
     *
     * Query: single query with joins — no N+1.
     */
    async getMetrics(): Promise<SalesDashboardResponse> {
        const pendingDetails = await prisma.salesOrderDetail.findMany({
            where: {
                salesOrder: {
                    status: { in: ['APPROVED', 'IN_PROGRESS'] }
                },
                // Raw Prisma doesn't support `where: { quantityShipped: { lt: col('quantity') } }`
                // So we fetch all details for pending SOs and filter in JS.
                // This is acceptable for dashboard-scale data (tens of SOs, not thousands).
            },
            select: {
                quantity: true,
                quantityShipped: true,
                salesOrder: {
                    select: {
                        salesOrderId: true,
                        code: true,
                        status: true,
                        agent: { select: { agentName: true } }
                    }
                },
                product: {
                    select: { productName: true }
                }
            },
            orderBy: {
                salesOrder: { orderDate: 'asc' }
            }
        });

        // Filter to only line items where shipment is incomplete
        const pendingOrders: PendingSalesOrder[] = pendingDetails
            .filter(d => d.quantityShipped < d.quantity)
            .map(d => ({
                salesOrderId: d.salesOrder.salesOrderId,
                code: d.salesOrder.code,
                agentName: d.salesOrder.agent.agentName,
                productName: d.product.productName,
                quantity: d.quantity,
                quantityShipped: d.quantityShipped,
                status: d.salesOrder.status
            }));

        return {
            pendingCount: pendingOrders.length,
            orders: pendingOrders
        };
    }
}

export default new SalesDashboardService();
