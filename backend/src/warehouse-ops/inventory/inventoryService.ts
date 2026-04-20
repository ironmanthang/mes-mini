import prisma from '../../common/lib/prisma.js';
import { Prisma } from '../../generated/prisma/index.js';

interface InventoryQuery {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: number;
}

class InventoryService {

    // 1. Get Consolidated Inventory Status (Components Only)
    async getInventoryStatus(query: InventoryQuery = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.componentName = { contains: query.search, mode: 'insensitive' };
        }

        const [components, total] = await Promise.all([
            prisma.component.findMany({
                where,
                skip,
                take: limit,
                orderBy: { componentName: 'asc' },
                include: {
                    componentStocks: {
                        where: query.warehouseId ? { warehouseId: query.warehouseId } : undefined,
                        include: { warehouse: true }
                    }
                }
            }),
            prisma.component.count({ where })
        ]);

        const report = components.map(comp => {
            // Principal Engineer Note: Stock is local (filtered by WH), but minStockLevel is Global.
            const availableQuantity = comp.componentStocks.reduce((sum, s) => sum + s.quantity, 0);
            const status = availableQuantity < comp.minStockLevel ? 'LOW_STOCK' : 'OK';

            return {
                componentId: comp.componentId,
                code: comp.code,
                componentName: comp.componentName,
                unit: comp.unit,
                availableQuantity,
                minStockLevel: comp.minStockLevel,
                status,
                warehouseStocks: comp.componentStocks.map(s => ({
                    warehouseId: s.warehouse.warehouseId,
                    warehouseName: s.warehouse.warehouseName,
                    quantity: s.quantity
                }))
            };
        });

        return createPaginatedResponse(report, total, page, limit);
    }

    // 2. Unified Low Stock Details (The Drill-down API)
    async getLowStockDetails(warehouseId?: number) {
        // A. Handle Products
        const productWhere: any = { status: 'IN_STOCK' };
        if (warehouseId) productWhere.warehouseId = warehouseId;

        const productStockCounts = await prisma.productInstance.groupBy({
            by: ['productId'],
            where: productWhere,
            _count: { productId: true }
        });

        const productStockMap = new Map<number, number>();
        productStockCounts.forEach(s => productStockMap.set(s.productId, s._count.productId));

        const trackedProducts = await prisma.product.findMany({
            where: { minStockLevel: { gt: 0 } },
            select: { productId: true, productName: true, minStockLevel: true, code: true }
        });

        const lowStockProducts = trackedProducts
            .filter(p => (productStockMap.get(p.productId) || 0) < p.minStockLevel)
            .map(p => ({
                id: p.productId,
                type: 'PRODUCT',
                code: p.code,
                name: p.productName,
                currentStock: productStockMap.get(p.productId) || 0,
                minStock: p.minStockLevel,
                gap: p.minStockLevel - (productStockMap.get(p.productId) || 0)
            }));

        // B. Handle Components
        const componentWhere: any = { minStockLevel: { gt: 0 } };
        const componentsWithStock = await prisma.component.findMany({
            where: componentWhere,
            include: {
                componentStocks: {
                    where: warehouseId ? { warehouseId } : undefined
                }
            }
        });

        const lowStockComponents = componentsWithStock
            .map(c => {
                const available = c.componentStocks.reduce((sum, s) => sum + s.quantity, 0);
                return {
                    id: c.componentId,
                    type: 'COMPONENT',
                    code: c.code,
                    name: c.componentName,
                    currentStock: available,
                    minStock: c.minStockLevel,
                    gap: c.minStockLevel - available
                };
            })
            .filter(c => c.currentStock < c.minStock);

        return [...lowStockProducts, ...lowStockComponents].sort((a, b) => b.gap - a.gap);
    }

    // 3. Specific Item Stock Status
    async getStockStatus(id: number, type: 'PRODUCT' | 'COMPONENT', warehouseId?: number) {
        if (type === 'PRODUCT') {
            const product = await prisma.product.findUnique({
                where: { productId: id },
                select: { productName: true, code: true, minStockLevel: true }
            });
            if (!product) throw new Error('Product not found');

            const where: any = { productId: id, status: 'IN_STOCK' };
            if (warehouseId) where.warehouseId = warehouseId;

            const countsByWarehouse = await prisma.productInstance.groupBy({
                by: ['warehouseId'],
                where,
                _count: { productInstanceId: true }
            });

            // Fetch warehouse names
            const warehouses = await prisma.warehouse.findMany({
                where: { warehouseId: { in: countsByWarehouse.map(c => c.warehouseId as number) } }
            });

            const totalInStock = countsByWarehouse.reduce((sum, c) => sum + c._count.productInstanceId, 0);

            return {
                id,
                type,
                name: product.productName,
                code: product.code,
                minStockLevel: product.minStockLevel,
                totalInStock,
                breakdown: countsByWarehouse.map(c => ({
                    warehouseId: c.warehouseId,
                    warehouseName: warehouses.find(w => w.warehouseId === c.warehouseId)?.warehouseName || 'Unknown',
                    quantity: c._count.productInstanceId
                }))
            };
        } else {
            const component = await prisma.component.findUnique({
                where: { componentId: id },
                include: {
                    componentStocks: {
                        where: warehouseId ? { warehouseId } : undefined,
                        include: { warehouse: true }
                    }
                }
            });
            if (!component) throw new Error('Component not found');

            const availableQuantity = component.componentStocks.reduce((sum, s) => sum + s.quantity, 0);

            return {
                id,
                type,
                name: component.componentName,
                code: component.code,
                minStockLevel: component.minStockLevel,
                availableQuantity,
                breakdown: component.componentStocks.map(s => ({
                    warehouseId: s.warehouse.warehouseId,
                    warehouseName: s.warehouse.warehouseName,
                    quantity: s.quantity
                }))
            };
        }
    }

    // 4. Shared API for other slices: Bulk Component Stock
    async getBulkComponentStock(
        componentIds: number[],
        warehouseId?: number,
        tx?: Prisma.TransactionClient
    ): Promise<Map<number, number>> {
        const db = tx || prisma;
        const stockAgg = await db.componentStock.groupBy({
            by: ['componentId'],
            where: {
                componentId: { in: componentIds },
                ...(warehouseId ? { warehouseId } : {})
            },
            _sum: { quantity: true }
        });

        const stockMap = new Map<number, number>();
        stockAgg.forEach(s => stockMap.set(s.componentId, s._sum.quantity || 0));
        return stockMap;
    }

    // 5. Shared API for other slices: Bulk Product Stock
    async getBulkProductStock(productIds: number[], warehouseId?: number): Promise<Map<number, number>> {
        const stockCounts = await prisma.productInstance.groupBy({
            by: ['productId'],
            where: {
                productId: { in: productIds },
                status: 'IN_STOCK',
                ...(warehouseId ? { warehouseId } : {})
            },
            _count: { productId: true }
        });

        const stockMap = new Map<number, number>();
        stockCounts.forEach(s => stockMap.set(s.productId, s._count.productId));
        return stockMap;
    }
}

export default new InventoryService();
