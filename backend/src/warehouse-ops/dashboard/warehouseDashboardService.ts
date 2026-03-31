import prisma from '../../common/lib/prisma.js';
import InventoryService from '../inventory/inventoryService.js';

// ─── Response Types ────────────────────────────────────────────────

interface LowStockProduct {
    productId: number;
    productName: string;
    inStockCount: number;
    minStockLevel: number;
}

interface Alert {
    severity: 'LOW_STOCK' | 'SHORTAGE' | 'RECEIVED';
    message: string;
    time: string;
}

interface WarehouseDashboardResponse {
    finishedGoods: {
        lowStockProducts: LowStockProduct[];
        lowStockCount: number;
        totalGap: number;
    };
    components: {
        lowStockCount: number;
        totalTracked: number;
        totalGap: number;
    };
    alerts: Alert[];
}

// ─── Service ───────────────────────────────────────────────────────

class WarehouseDashboardService {

    async getMetrics(warehouseId?: number): Promise<WarehouseDashboardResponse> {
        const [finishedGoods, components, alerts] = await Promise.all([
            this._getFinishedGoodsMetrics(warehouseId),
            this._getComponentMetrics(warehouseId),
            this._buildAlerts(warehouseId)
        ]);

        return { finishedGoods, components, alerts };
    }

    // ─── PRIVATE ───────────────────────────────────────────────────

    /**
     * Get low-stock finished goods.
     * Uses the new direct warehouseId column for O(1) filtering.
     */
    private async _getFinishedGoodsMetrics(warehouseId?: number): Promise<WarehouseDashboardResponse['finishedGoods']> {
        // 1. Tracked products (minStockLevel > 0)
        const trackedProducts = await prisma.product.findMany({
            where: { minStockLevel: { gt: 0 } },
            select: { productId: true, productName: true, minStockLevel: true }
        });

        // 2. Aggregated stock per product
        const productIds = trackedProducts.map(p => p.productId);
        const stockMap = await InventoryService.getBulkProductStock(productIds, warehouseId);

        // 3. Filter for those below threshold
        const lowStockProducts: LowStockProduct[] = trackedProducts
            .map(p => ({
                productId: p.productId,
                productName: p.productName,
                inStockCount: stockMap.get(p.productId) || 0,
                minStockLevel: p.minStockLevel
            }))
            .filter(p => p.inStockCount < p.minStockLevel);

        const totalGap = lowStockProducts.reduce((sum, p) => sum + (p.minStockLevel - p.inStockCount), 0);

        return {
            lowStockProducts,
            lowStockCount: lowStockProducts.length,
            totalGap
        };
    }

    /**
     * Get component health metrics.
     * Standardized to "Low Stock Count" for UX consistency.
     */
    private async _getComponentMetrics(warehouseId?: number): Promise<WarehouseDashboardResponse['components']> {
        // 1. Get all components with minStockLevel > 0
        const trackedComponents = await prisma.component.findMany({
            where: { minStockLevel: { gt: 0 } },
            select: { componentId: true, minStockLevel: true }
        });

        const totalTracked = trackedComponents.length;
        if (totalTracked === 0) return { lowStockCount: 0, totalTracked: 0, totalGap: 0 };

        // 2. Aggregate quantity per component
        const componentIds = trackedComponents.map(c => c.componentId);
        const stockMap = await InventoryService.getBulkComponentStock(componentIds, warehouseId);

        // 3. Count those below min and calculate gap
        let lowStockCount = 0;
        let totalGap = 0;
        for (const comp of trackedComponents) {
            const currentStock = stockMap.get(comp.componentId) || 0;
            if (currentStock < comp.minStockLevel) {
                lowStockCount++;
                totalGap += (comp.minStockLevel - currentStock);
            }
        }

        return { lowStockCount, totalTracked, totalGap };
    }

    /**
     * Build alerts feed.
     */
    private async _buildAlerts(warehouseId?: number): Promise<Alert[]> {
        const alerts: Alert[] = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [lowStockProducts, lowStockComponents, recentPOs] = await Promise.all([
            this._getLowStockProductAlerts(warehouseId),
            this._getLowStockComponentAlerts(warehouseId),
            prisma.purchaseOrder.findMany({
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: sevenDaysAgo },
                    // Filtering POs by warehouse isn't direct in schema, usually POs belong to a target warehouse
                    // For now, we show recent POs globally or we could filter by inventory transactions.
                    // Sticking to global recent receipts for dashboard feed unless specifically requested.
                },
                select: {
                    code: true,
                    updatedAt: true,
                    supplier: { select: { supplierName: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 5
            })
        ]);

        alerts.push(...lowStockProducts);
        alerts.push(...lowStockComponents);

        for (const po of recentPOs) {
            alerts.push({
                severity: 'RECEIVED',
                message: `${po.code} fully received from ${po.supplier.supplierName}`,
                time: po.updatedAt.toISOString()
            });
        }

        alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return alerts;
    }

    private async _getLowStockProductAlerts(warehouseId?: number): Promise<Alert[]> {
        const metrics = await this._getFinishedGoodsMetrics(warehouseId);
        return metrics.lowStockProducts.map(p => ({
            severity: 'LOW_STOCK' as const,
            message: `${p.productName} stock — ${p.inStockCount} (min: ${p.minStockLevel})`,
            time: new Date().toISOString()
        }));
    }

    private async _getLowStockComponentAlerts(warehouseId?: number): Promise<Alert[]> {
        // We reuse the logic from _getComponentMetrics but return formatted alerts
        const trackedComponents = await prisma.component.findMany({
            where: { minStockLevel: { gt: 0 } },
            select: { componentId: true, componentName: true, minStockLevel: true }
        });

        const componentIds = trackedComponents.map(c => c.componentId);
        const stockMap = await InventoryService.getBulkComponentStock(componentIds, warehouseId);

        return trackedComponents
            .filter(c => (stockMap.get(c.componentId) || 0) < c.minStockLevel)
            .map(c => ({
                severity: 'SHORTAGE' as const,
                message: `${c.componentName} stock insufficient — ${stockMap.get(c.componentId) || 0} (min: ${c.minStockLevel})`,
                time: new Date().toISOString()
            }));
    }
}

export default new WarehouseDashboardService();
