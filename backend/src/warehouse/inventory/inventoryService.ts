import prisma from '../../common/lib/prisma.js';

class InventoryService {

    // 1. Get Aggregated Inventory Status (Problem 1)
    // Shows what we have vs what we need.
    async getInventoryStatus(query: { page?: number; limit?: number; search?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.componentName = { contains: query.search, mode: 'insensitive' };
        }

        // We query Components (The master data) and include their stock
        // This ensures we see items with 0 stock too.
        const [components, total] = await Promise.all([
            prisma.component.findMany({
                where,
                skip,
                take: limit,
                orderBy: { componentName: 'asc' },
                include: {
                    componentStocks: {
                        include: { warehouse: true }
                    }
                }
            }),
            prisma.component.count({ where })
        ]);

        // Transform to flat report
        const report = components.map(comp => {
            const totalOnHand = comp.componentStocks.reduce((sum, stock) => sum + stock.quantity, 0);
            const status = totalOnHand <= comp.minStockLevel ? 'LOW_STOCK' : 'OK';

            return {
                componentId: comp.componentId,
                code: comp.code,
                name: comp.componentName,
                unit: comp.unit,
                onHand: totalOnHand,
                minStock: comp.minStockLevel,
                status,
                locations: comp.componentStocks.map(s => ({
                    warehouse: s.warehouse.warehouseName,
                    qty: s.quantity
                }))
            };
        });

        return createPaginatedResponse(report, total, page, limit);
    }

    // 2. Low Stock Alerts (Problem 1)
    async getLowStockAlerts() {
        // Find components where stock <= minLevel
        // Since Prisma doesn't support easy "field comparison" in where clause without raw query or computed columns easily,
        // we will fetch all and filter or use raw query. For small scale, fetching is fine.
        // Optimization: Use Raw Query for performance if large data.

        const lowStockItems = await prisma.$queryRaw`
            SELECT 
                c.component_id as "componentId",
                c.code,
                c.component_name as "componentName",
                c.min_stock_level as "minStockLevel",
                COALESCE(SUM(cs.quantity), 0) as "currentStock"
            FROM "components" c
            LEFT JOIN "component_stocks" cs ON c.component_id = cs.component_id
            GROUP BY c.component_id
            HAVING COALESCE(SUM(cs.quantity), 0) <= c.min_stock_level
        `;

        return lowStockItems;
    }
}

export default new InventoryService();
