import prisma from '../../common/lib/prisma.js';
import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js';

// ─── Query ──────────────────────────────────────────────────────────────────

interface StockQuery {
    page?: number;
    limit?: number;
    search?: string;
}

// ─── COMPONENT Response Types ────────────────────────────────────────────────

interface ComponentLotDetail {
    componentLotId: number;
    lotCode: string;
    initialQuantity: number;
    currentQuantity: number;
    receivedAt: string;
    poCode: string | null;
}

interface ComponentStockItem {
    componentId: number;
    componentCode: string;
    componentName: string;
    unit: string;
    totalCurrentQuantity: number;
    minStockLevel: number;
    status: 'OK' | 'LOW_STOCK';
    lotCount: number;
    lots: ComponentLotDetail[];
}

interface ComponentWarehouseSummary {
    totalComponents: number;
    totalLots: number;
    totalQuantity: number;
}

// ─── SALES Response Types ────────────────────────────────────────────────────

interface BatchDetail {
    batchCode: string;
    productionDate: string;
    expiryDate: string | null;
    instanceCount: number;
    workOrderCode: string;
}

interface SalesStockItem {
    productId: number;
    productCode: string;
    productName: string;
    unit: string;
    inStockCount: number;
    minStockLevel: number;
    status: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    oldestReceivedAt: string | null;
    newestReceivedAt: string | null;
    batches: BatchDetail[];
}

interface SalesWarehouseSummary {
    totalProducts: number;
    totalInstances: number;
}

// ─── ERROR Response Types ─────────────────────────────────────────────────────

interface ErrorBatchDetail {
    batchCode: string;
    productionDate: string;
    instanceCount: number;
    workOrderCode: string;
    productionLineName: string | null;
}

interface ErrorStockItem {
    productId: number;
    productCode: string;
    productName: string;
    unit: string;
    defectiveCount: number;
    batches: ErrorBatchDetail[];
}

interface ErrorWarehouseSummary {
    totalProducts: number;
    totalDefectiveInstances: number;
}

// ─── Base Warehouse Info ──────────────────────────────────────────────────────

interface WarehouseBase {
    warehouseId: number;
    warehouseName: string;
    warehouseType: 'COMPONENT' | 'SALES' | 'ERROR';
    location: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class WarehouseStockService {

    /**
     * Main orchestrator — reads warehouse type and delegates to the right method.
     */
    async getWarehouseStock(warehouseId: number, query: StockQuery) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { warehouseId },
            select: { warehouseId: true, warehouseName: true, warehouseType: true, location: true }
        });

        if (!warehouse) throw new Error('Warehouse not found');

        const base = warehouse as WarehouseBase;

        switch (base.warehouseType) {
            case 'COMPONENT': return this._getComponentStock(base, query);
            case 'SALES':     return this._getSalesStock(base, query);
            case 'ERROR':     return this._getErrorStock(base, query);
        }
    }

    // ─── COMPONENT ────────────────────────────────────────────────────────────

    private async _getComponentStock(warehouse: WarehouseBase, query: StockQuery) {
        const { page, limit, skip } = getPaginationParams(query);
        const search = query.search?.trim();

        // Fetch all lots in this warehouse that still have stock
        // Grouping is done in JS because Prisma doesn't support GROUP BY with nested includes
        const lots = await prisma.componentLot.findMany({
            where: {
                warehouseId: warehouse.warehouseId,
                currentQuantity: { gt: 0 },
                ...(search && {
                    OR: [
                        { component: { componentName: { contains: search, mode: 'insensitive' } } },
                        { component: { code:          { contains: search, mode: 'insensitive' } } },
                        { lotCode:                    { contains: search, mode: 'insensitive' } },
                    ]
                })
            },
            include: {
                component: {
                    select: {
                        componentId:   true,
                        componentName: true,
                        code:          true,
                        unit:          true,
                        minStockLevel: true,
                    }
                },
                poDetail: {
                    select: {
                        purchaseOrder: { select: { code: true } }
                    }
                }
            },
            orderBy: { receivedAt: 'asc' }
        });

        // Group lots by componentId
        const componentMap = new Map<number, { meta: typeof lots[0]['component']; lots: typeof lots }>();
        for (const lot of lots) {
            const existing = componentMap.get(lot.componentId);
            if (existing) {
                existing.lots.push(lot);
            } else {
                componentMap.set(lot.componentId, { meta: lot.component, lots: [lot] });
            }
        }

        // Build full item list before pagination
        const allItems: ComponentStockItem[] = Array.from(componentMap.values()).map(({ meta, lots: cLots }) => {
            const totalCurrentQuantity = cLots.reduce((sum, l) => sum + l.currentQuantity, 0);
            return {
                componentId:          meta.componentId,
                componentCode:        meta.code,
                componentName:        meta.componentName,
                unit:                 meta.unit,
                totalCurrentQuantity,
                minStockLevel:        meta.minStockLevel,
                status:               totalCurrentQuantity >= meta.minStockLevel ? 'OK' : 'LOW_STOCK',
                lotCount:             cLots.length,
                lots: cLots.map(l => ({
                    componentLotId:  l.componentLotId,
                    lotCode:         l.lotCode,
                    initialQuantity: l.initialQuantity,
                    currentQuantity: l.currentQuantity,
                    receivedAt:      l.receivedAt.toISOString(),
                    poCode:          l.poDetail?.purchaseOrder?.code ?? null,
                }))
            };
        });

        const total = allItems.length;
        const pagedItems = allItems.slice(skip, skip + limit);

        const summary: ComponentWarehouseSummary = {
            totalComponents: total,
            totalLots:       lots.length,
            totalQuantity:   lots.reduce((sum, l) => sum + l.currentQuantity, 0),
        };

        return {
            warehouseId:   warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            warehouseType: warehouse.warehouseType,
            location:      warehouse.location,
            summary,
            ...createPaginatedResponse(pagedItems, total, page, limit),
        };
    }

    // ─── SALES ────────────────────────────────────────────────────────────────

    private async _getSalesStock(warehouse: WarehouseBase, query: StockQuery) {
        const { page, limit, skip } = getPaginationParams(query);
        const search = query.search?.trim();

        const instances = await prisma.productInstance.findMany({
            where: {
                warehouseId: warehouse.warehouseId,
                status: 'IN_STOCK_SALES',
                ...(search && {
                    OR: [
                        { product: { productName: { contains: search, mode: 'insensitive' } } },
                        { product: { code:        { contains: search, mode: 'insensitive' } } },
                    ]
                })
            },
            include: {
                product: {
                    select: {
                        productId:     true,
                        productName:   true,
                        code:          true,
                        unit:          true,
                        minStockLevel: true,
                    }
                },
                productionBatch: {
                    select: {
                        batchCode:      true,
                        productionDate: true,
                        expiryDate:     true,
                        workOrder:      { select: { code: true } }
                    }
                }
            },
            orderBy: { receivedAt: 'asc' }
        });

        // Group instances by productId
        const productMap = new Map<number, { meta: typeof instances[0]['product']; instances: typeof instances }>();
        for (const inst of instances) {
            const existing = productMap.get(inst.productId);
            if (existing) {
                existing.instances.push(inst);
            } else {
                productMap.set(inst.productId, { meta: inst.product, instances: [inst] });
            }
        }

        const allItems: SalesStockItem[] = Array.from(productMap.values()).map(({ meta, instances: pInst }) => {
            const inStockCount = pInst.length;

            // Determine stock status
            let status: SalesStockItem['status'];
            if (inStockCount === 0)                      status = 'OUT_OF_STOCK';
            else if (inStockCount < meta.minStockLevel)  status = 'LOW_STOCK';
            else                                         status = 'OK';

            // Min/max receivedAt for FIFO relevance
            const receivedDates = pInst.map(i => i.receivedAt).filter(Boolean) as Date[];
            const oldestReceivedAt = receivedDates.length > 0
                ? new Date(Math.min(...receivedDates.map(d => d.getTime()))).toISOString()
                : null;
            const newestReceivedAt = receivedDates.length > 0
                ? new Date(Math.max(...receivedDates.map(d => d.getTime()))).toISOString()
                : null;

            // Sub-group by batch
            const batchMap = new Map<string, { detail: typeof pInst[0]['productionBatch']; count: number }>();
            for (const inst of pInst) {
                const bc = inst.productionBatch.batchCode;
                const entry = batchMap.get(bc);
                if (entry) {
                    entry.count++;
                } else {
                    batchMap.set(bc, { detail: inst.productionBatch, count: 1 });
                }
            }

            const batches: BatchDetail[] = Array.from(batchMap.values()).map(({ detail, count }) => ({
                batchCode:      detail.batchCode,
                productionDate: detail.productionDate.toISOString(),
                expiryDate:     detail.expiryDate?.toISOString() ?? null,
                instanceCount:  count,
                workOrderCode:  detail.workOrder.code,
            }));

            return {
                productId:        meta.productId,
                productCode:      meta.code,
                productName:      meta.productName,
                unit:             meta.unit,
                inStockCount,
                minStockLevel:    meta.minStockLevel,
                status,
                oldestReceivedAt,
                newestReceivedAt,
                batches,
            };
        });

        const total = allItems.length;
        const pagedItems = allItems.slice(skip, skip + limit);

        const summary: SalesWarehouseSummary = {
            totalProducts:  total,
            totalInstances: instances.length,
        };

        return {
            warehouseId:   warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            warehouseType: warehouse.warehouseType,
            location:      warehouse.location,
            summary,
            ...createPaginatedResponse(pagedItems, total, page, limit),
        };
    }

    // ─── ERROR ────────────────────────────────────────────────────────────────

    private async _getErrorStock(warehouse: WarehouseBase, query: StockQuery) {
        const { page, limit, skip } = getPaginationParams(query);
        const search = query.search?.trim();

        const instances = await prisma.productInstance.findMany({
            where: {
                warehouseId: warehouse.warehouseId,
                status: 'IN_STOCK_ERROR',
                ...(search && {
                    OR: [
                        { product: { productName: { contains: search, mode: 'insensitive' } } },
                        { product: { code:        { contains: search, mode: 'insensitive' } } },
                    ]
                })
            },
            include: {
                product: {
                    select: {
                        productId:   true,
                        productName: true,
                        code:        true,
                        unit:        true,
                    }
                },
                productionBatch: {
                    select: {
                        batchCode:      true,
                        productionDate: true,
                        workOrder:      { select: { code: true } },
                        productionLine: { select: { lineName: true } }
                    }
                }
            },
            orderBy: { receivedAt: 'asc' }
        });

        // Group by productId
        const productMap = new Map<number, { meta: typeof instances[0]['product']; instances: typeof instances }>();
        for (const inst of instances) {
            const existing = productMap.get(inst.productId);
            if (existing) {
                existing.instances.push(inst);
            } else {
                productMap.set(inst.productId, { meta: inst.product, instances: [inst] });
            }
        }

        const allItems: ErrorStockItem[] = Array.from(productMap.values()).map(({ meta, instances: pInst }) => {
            // Sub-group by batch
            const batchMap = new Map<string, { detail: typeof pInst[0]['productionBatch']; count: number }>();
            for (const inst of pInst) {
                const bc = inst.productionBatch.batchCode;
                const entry = batchMap.get(bc);
                if (entry) {
                    entry.count++;
                } else {
                    batchMap.set(bc, { detail: inst.productionBatch, count: 1 });
                }
            }

            const batches: ErrorBatchDetail[] = Array.from(batchMap.values()).map(({ detail, count }) => ({
                batchCode:          detail.batchCode,
                productionDate:     detail.productionDate.toISOString(),
                instanceCount:      count,
                workOrderCode:      detail.workOrder.code,
                productionLineName: detail.productionLine?.lineName ?? null,
            }));

            return {
                productId:      meta.productId,
                productCode:    meta.code,
                productName:    meta.productName,
                unit:           meta.unit,
                defectiveCount: pInst.length,
                batches,
            };
        });

        const total = allItems.length;
        const pagedItems = allItems.slice(skip, skip + limit);

        const summary: ErrorWarehouseSummary = {
            totalProducts:           total,
            totalDefectiveInstances: instances.length,
        };

        return {
            warehouseId:   warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            warehouseType: warehouse.warehouseType,
            location:      warehouse.location,
            summary,
            ...createPaginatedResponse(pagedItems, total, page, limit),
        };
    }
}

export default new WarehouseStockService();
