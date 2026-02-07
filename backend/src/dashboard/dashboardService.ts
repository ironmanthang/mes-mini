import prisma from '../common/lib/prisma.js';

interface DashboardSummary {
    inventory: {
        totalComponents: number;
        totalProducts: number;
        lowStockAlerts: number;
        totalInventoryValue: number;
    };
    production: {
        activeWorkOrders: number;
        completedThisMonth: number;
        pendingProductionRequests: number;
    };
    sales: {
        pendingSalesOrders: number;
        processingOrders: number;
        completedThisMonth: number;
    };
    procurement: {
        pendingPurchaseOrders: number;
        partiallyReceived: number;
    };
}

interface InventoryOverview {
    componentsByWarehouse: Array<{
        warehouseId: number;
        warehouseName: string;
        totalQuantity: number;
        totalValue: number;
    }>;
    topLowStockItems: Array<{
        componentId: number;
        code: string;
        componentName: string;
        currentStock: number;
        minStockLevel: number;
        deficit: number;
    }>;
}

interface ProductionStatus {
    workOrdersByStatus: Array<{
        status: string;
        count: number;
    }>;
    recentCompletedBatches: Array<{
        batchCode: string;
        productName: string;
        quantity: number;
        completedAt: Date;
    }>;
    productionRequestsQueue: Array<{
        code: string;
        productName: string;
        quantity: number;
        priority: string;
        requestDate: Date;
    }>;
}


class DashboardService {

    async getSummary(): Promise<DashboardSummary> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            totalComponents,
            totalProducts,
            lowStockCount,
            activeWOs,
            completedWOsThisMonth,
            pendingPRs,
            pendingSOs,
            processingSOs,
            completedSOsThisMonth,
            pendingPOs,
            partialPOs
        ] = await Promise.all([
            prisma.component.count(),
            prisma.product.count(),
            // Low stock: current stock < minStockLevel
            prisma.$queryRaw<[{ count: bigint }]>`
                SELECT COUNT(DISTINCT cs.component_id) as count
                FROM component_stock cs
                JOIN components c ON cs.component_id = c.component_id
                WHERE cs.quantity < COALESCE(c.min_stock_level, 0)
            `.then(r => Number(r[0]?.count || 0)),
            prisma.workOrder.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.workOrder.count({
                where: { status: 'COMPLETED', updatedAt: { gte: startOfMonth } }
            }),
            prisma.productionRequest.count({ where: { status: 'PENDING' } }),
            prisma.salesOrder.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.salesOrder.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.salesOrder.count({
                where: { status: 'COMPLETED', updatedAt: { gte: startOfMonth } }
            }),
            prisma.purchaseOrder.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.purchaseOrder.count({ where: { status: 'PARTIALLY_RECEIVED' } })
        ]);

        // Calculate total inventory value (components only for now)
        const inventoryValue = await prisma.$queryRaw<[{ totalValue: number }]>`
            SELECT SUM(cs.quantity * c.standard_cost) as "totalValue"
            FROM component_stocks cs
            JOIN components c ON cs.component_id = c.component_id
        `.then(r => Number(r[0]?.totalValue || 0));

        return {
            inventory: {
                totalComponents,
                totalProducts,
                lowStockAlerts: lowStockCount,
                totalInventoryValue: inventoryValue
            },
            production: {
                activeWorkOrders: activeWOs,
                completedThisMonth: completedWOsThisMonth,
                pendingProductionRequests: pendingPRs
            },
            sales: {
                pendingSalesOrders: pendingSOs,
                processingOrders: processingSOs,
                completedThisMonth: completedSOsThisMonth
            },
            procurement: {
                pendingPurchaseOrders: pendingPOs,
                partiallyReceived: partialPOs
            }
        };
    }

    async getInventoryOverview(): Promise<InventoryOverview> {
        // Stock by warehouse - Manual aggregation because Prisma groupBy doesn't support relation aggregation easily
        const allStock = await prisma.componentStock.findMany({
            include: {
                component: true,
                warehouse: true
            }
        });

        const warehouseMap = new Map<number, { name: string; qty: number; val: number }>();

        for (const stock of allStock) {
            const current = warehouseMap.get(stock.warehouseId) || {
                name: stock.warehouse.warehouseName,
                qty: 0,
                val: 0
            };

            const value = stock.quantity * Number(stock.component.standardCost || 0);

            warehouseMap.set(stock.warehouseId, {
                name: stock.warehouse.warehouseName,
                qty: current.qty + stock.quantity,
                val: current.val + value
            });
        }

        const componentsByWarehouse = Array.from(warehouseMap.entries()).map(([id, data]) => ({
            warehouseId: id,
            warehouseName: data.name,
            totalQuantity: data.qty,
            totalValue: data.val
        }));

        // Top low stock items (top 10)
        const lowStockItems = await prisma.$queryRaw<Array<{
            component_id: number;
            code: string;
            component_name: string;
            current_stock: bigint;
            min_stock_level: number;
        }>>`
            SELECT 
                c.component_id,
                c.code,
                c.component_name,
                COALESCE(SUM(cs.quantity), 0) as current_stock,
                COALESCE(c.min_stock_level, 0) as min_stock_level
            FROM components c
            LEFT JOIN component_stocks cs ON c.component_id = cs.component_id
            WHERE c.min_stock_level > 0
            GROUP BY c.component_id, c.code, c.component_name, c.min_stock_level
            HAVING COALESCE(SUM(cs.quantity), 0) < c.min_stock_level
            ORDER BY (c.min_stock_level - COALESCE(SUM(cs.quantity), 0)) DESC
            LIMIT 10
        `;

        const topLowStockItems = lowStockItems.map(item => ({
            componentId: item.component_id,
            code: item.code,
            componentName: item.component_name,
            currentStock: Number(item.current_stock),
            minStockLevel: item.min_stock_level,
            deficit: item.min_stock_level - Number(item.current_stock)
        }));

        return {
            componentsByWarehouse,
            topLowStockItems
        };
    }

    async getProductionStatus(): Promise<ProductionStatus> {
        // Work orders by status
        const woByStatus = await prisma.workOrder.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        const workOrdersByStatus = woByStatus.map(w => ({
            status: w.status,
            count: w._count.status
        }));

        // Recent completed batches (last 10)
        const recentBatches = await prisma.productionBatch.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                workOrder: {
                    include: { product: { select: { productName: true } } }
                },
                _count: { select: { productInstances: true } }
            }
        });

        const recentCompletedBatches = recentBatches.map(b => ({
            batchCode: b.batchCode,
            productName: b.workOrder.product.productName,
            quantity: b._count.productInstances,
            completedAt: b.productionDate
        }));

        // Production requests queue (pending approval)
        const prQueue = await prisma.productionRequest.findMany({
            where: { status: { in: ['PENDING', 'APPROVED'] } },
            take: 10,
            orderBy: [{ priority: 'asc' }, { requestDate: 'asc' }],
            include: { product: { select: { productName: true } } }
        });

        const productionRequestsQueue = prQueue.map(pr => ({
            code: pr.code,
            productName: pr.product.productName,
            quantity: pr.quantity,
            priority: pr.priority,
            requestDate: pr.requestDate
        }));

        return {
            workOrdersByStatus,
            recentCompletedBatches,
            productionRequestsQueue
        };
    }


}

export default new DashboardService();
