import prisma from '../../common/lib/prisma.js';

class InventoryService {

    // 1. Get Consolidated Inventory Status
    // Shows physical stock, allocated (reserved) stock, what is actually available, and per-warehouse breakdown.
    async getInventoryStatus(query: { page?: number; limit?: number; search?: string } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.componentName = { contains: query.search, mode: 'insensitive' };
        }

        // We query Components (The master data) and include their stock.
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

        const report = components.map(comp => {
            const totalPhysicalQuantity = comp.componentStocks.reduce((sum, s) => sum + s.quantity, 0);
            const totalAllocatedQuantity = comp.componentStocks.reduce((sum, s) => sum + s.allocatedQuantity, 0);
            const availableQuantity = totalPhysicalQuantity - totalAllocatedQuantity;

            // LOW_STOCK uses strict `<`: minStockLevel=0 means no safety threshold, so items with 0 min won't
            // falsely alert when they are also at 0. An item is only LOW_STOCK if available drops BELOW the min.
            const status = availableQuantity < comp.minStockLevel ? 'LOW_STOCK' : 'OK';

            return {
                componentId: comp.componentId,
                code: comp.code,
                componentName: comp.componentName,
                unit: comp.unit,
                totalPhysicalQuantity,
                totalAllocatedQuantity,
                availableQuantity,
                minStockLevel: comp.minStockLevel,
                status,
                warehouseStocks: comp.componentStocks.map(s => ({
                    warehouseId: s.warehouse.warehouseId,
                    warehouseName: s.warehouse.warehouseName,
                    quantity: s.quantity,
                    allocatedQuantity: s.allocatedQuantity
                }))
            };
        });

        return createPaginatedResponse(report, total, page, limit);
    }

    // 2. Low Stock Alerts
    // Returns components where (physical - allocated) < minStockLevel, matching the strict `<` rule above.
    // minStockLevel = 0 is intentionally excluded (HAVING ... AND c.min_stock_level > 0).
    async getLowStockAlerts() {
        const lowStockItems = await prisma.$queryRaw`
            SELECT 
                c.component_id        AS "componentId",
                c.code,
                c.component_name      AS "componentName",
                c.unit,
                c.min_stock_level     AS "minStockLevel",
                COALESCE(SUM(cs.quantity), 0)           AS "totalPhysicalQuantity",
                COALESCE(SUM(cs.allocated_quantity), 0) AS "totalAllocatedQuantity",
                COALESCE(SUM(cs.quantity), 0) - COALESCE(SUM(cs.allocated_quantity), 0) AS "availableQuantity"
            FROM "components" c
            LEFT JOIN "component_stocks" cs ON c.component_id = cs.component_id
            GROUP BY c.component_id
            HAVING
                c.min_stock_level > 0
                AND (COALESCE(SUM(cs.quantity), 0) - COALESCE(SUM(cs.allocated_quantity), 0)) < c.min_stock_level
        `;

        return lowStockItems;
    }
}

export default new InventoryService();
