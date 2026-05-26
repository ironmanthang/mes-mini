import prisma from '../common/lib/prisma.js';
import {
    InventoryTransactionType,
    ProductInstanceStatus,
    PurchaseOrderStatus,
    WorkOrderStatus
} from '../generated/prisma/index.js';
import { ReportDateRange, roundMoney, toDateKey, toNumber } from '../common/utils/reporting.js';

export interface MaterialCostReportQuery extends ReportDateRange {
    componentId?: number;
    supplierId?: number;
}

export interface ProductCostReportQuery extends ReportDateRange {
    productId?: number;
}

interface CostAccumulator {
    totalCost: number;
    quantity: number;
}

interface ProductCostAccumulator {
    totalProductionCost: number;
    totalMaterialCost: number;
    totalConversionCost: number;
    totalInstancesCreated: number;
    passedCount: number;
    failedCount: number;
    pendingQcCount: number;
}

const PASSED_STATUSES: ProductInstanceStatus[] = [
    ProductInstanceStatus.PASSED_QC,
    ProductInstanceStatus.IN_STOCK_SALES,
    ProductInstanceStatus.SHIPPED
];

const FAILED_STATUSES: ProductInstanceStatus[] = [
    ProductInstanceStatus.FAILED_QC,
    ProductInstanceStatus.IN_STOCK_ERROR
];

const dateRangeWhere = (query: ReportDateRange) => ({
    ...(query.startDate || query.endDate
        ? {
            gte: query.startDate,
            lt: query.endDate
        }
        : {})
});

const createProductAccumulator = (): ProductCostAccumulator => ({
    totalProductionCost: 0,
    totalMaterialCost: 0,
    totalConversionCost: 0,
    totalInstancesCreated: 0,
    passedCount: 0,
    failedCount: 0,
    pendingQcCount: 0
});

const finalizeProductAccumulator = (acc: ProductCostAccumulator) => ({
    totalProductionCost: roundMoney(acc.totalProductionCost),
    totalMaterialCost: roundMoney(acc.totalMaterialCost),
    totalConversionCost: roundMoney(acc.totalConversionCost),
    totalInstancesCreated: acc.totalInstancesCreated,
    passedCount: acc.passedCount,
    failedCount: acc.failedCount,
    pendingQcCount: acc.pendingQcCount
});

class CostReportService {
    async getMaterialCosts(query: MaterialCostReportQuery) {
        const transactions = await prisma.inventoryTransaction.findMany({
            where: {
                transactionType: InventoryTransactionType.IMPORT_PO,
                ...(query.componentId ? { componentId: query.componentId } : {}),
                purchaseOrder: {
                    status: { not: PurchaseOrderStatus.CANCELLED },
                    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
                    ...(query.startDate || query.endDate ? { orderDate: dateRangeWhere(query) } : {})
                }
            },
            include: {
                component: { select: { componentId: true, code: true, componentName: true } },
                purchaseOrder: {
                    select: {
                        purchaseOrderId: true,
                        code: true,
                        supplierId: true,
                        supplier: { select: { supplierId: true, supplierName: true, code: true } },
                        orderDate: true,
                        details: { select: { componentId: true, unitPrice: true } }
                    }
                }
            },
            orderBy: {
                purchaseOrder: {
                    orderDate: 'asc'
                }
            }
        });

        let totalMaterialCost = 0;
        let totalQuantityReceived = 0;
        const daily = new Map<string, CostAccumulator>();
        const components = new Map<number, CostAccumulator & { componentCode: string; componentName: string }>();
        const suppliers = new Map<number, CostAccumulator & { supplierCode: string; supplierName: string }>();

        for (const tx of transactions) {
            if (!tx.componentId || !tx.component || !tx.purchaseOrder) continue;

            const detail = tx.purchaseOrder.details.find(item => item.componentId === tx.componentId);
            if (!detail) continue;

            const quantity = tx.quantity;
            const cost = quantity * toNumber(detail.unitPrice);
            totalMaterialCost += cost;
            totalQuantityReceived += quantity;

            const date = toDateKey(tx.purchaseOrder.orderDate);
            const dailyRow = daily.get(date) ?? { totalCost: 0, quantity: 0 };
            dailyRow.totalCost += cost;
            dailyRow.quantity += quantity;
            daily.set(date, dailyRow);

            const componentRow = components.get(tx.componentId) ?? {
                componentCode: tx.component.code,
                componentName: tx.component.componentName,
                totalCost: 0,
                quantity: 0
            };
            componentRow.totalCost += cost;
            componentRow.quantity += quantity;
            components.set(tx.componentId, componentRow);

            const supplier = tx.purchaseOrder.supplier;
            const supplierRow = suppliers.get(supplier.supplierId) ?? {
                supplierCode: supplier.code,
                supplierName: supplier.supplierName,
                totalCost: 0,
                quantity: 0
            };
            supplierRow.totalCost += cost;
            supplierRow.quantity += quantity;
            suppliers.set(supplier.supplierId, supplierRow);
        }

        return {
            filters: {
                startDate: query.startDate ? toDateKey(query.startDate) : null,
                endDate: query.endDate ? toDateKey(new Date(query.endDate.getTime() - 1)) : null,
                componentId: query.componentId ?? null,
                supplierId: query.supplierId ?? null
            },
            totalMaterialCost: roundMoney(totalMaterialCost),
            totalQuantityReceived,
            dailyBreakdown: Array.from(daily.entries()).map(([date, row]) => ({
                date,
                totalCost: roundMoney(row.totalCost),
                quantityReceived: row.quantity
            })),
            componentBreakdown: Array.from(components.entries()).map(([componentId, row]) => ({
                componentId,
                componentCode: row.componentCode,
                componentName: row.componentName,
                totalCost: roundMoney(row.totalCost),
                quantityReceived: row.quantity
            })),
            supplierBreakdown: Array.from(suppliers.entries()).map(([supplierId, row]) => ({
                supplierId,
                supplierCode: row.supplierCode,
                supplierName: row.supplierName,
                totalCost: roundMoney(row.totalCost),
                quantityReceived: row.quantity
            }))
        };
    }

    async getProductCosts(query: ProductCostReportQuery) {
        const batches = await prisma.productionBatch.findMany({
            where: {
                ...(query.startDate || query.endDate ? { productionDate: dateRangeWhere(query) } : {}),
                workOrder: {
                    status: WorkOrderStatus.COMPLETED,
                    totalProductionCost: { not: null },
                    ...(query.productId ? { productId: query.productId } : {})
                }
            },
            include: {
                workOrder: {
                    select: {
                        workOrderId: true,
                        laborCost: true,
                        overheadCost: true,
                        totalMaterialCost: true,
                        totalProductionCost: true,
                        product: { select: { productId: true, code: true, productName: true } }
                    }
                },
                productInstances: { select: { status: true } }
            },
            orderBy: { productionDate: 'asc' }
        });

        const totals = createProductAccumulator();
        const daily = new Map<string, ProductCostAccumulator>();
        const products = new Map<number, ProductCostAccumulator & { productCode: string; productName: string }>();
        const countedWorkOrders = new Set<number>();

        for (const batch of batches) {
            const workOrder = batch.workOrder;
            const product = workOrder.product;
            const date = toDateKey(batch.productionDate);
            const dailyRow = daily.get(date) ?? createProductAccumulator();
            const productRow = products.get(product.productId) ?? {
                ...createProductAccumulator(),
                productCode: product.code,
                productName: product.productName
            };

            for (const instance of batch.productInstances) {
                totals.totalInstancesCreated += 1;
                dailyRow.totalInstancesCreated += 1;
                productRow.totalInstancesCreated += 1;

                if (PASSED_STATUSES.includes(instance.status)) {
                    totals.passedCount += 1;
                    dailyRow.passedCount += 1;
                    productRow.passedCount += 1;
                } else if (FAILED_STATUSES.includes(instance.status)) {
                    totals.failedCount += 1;
                    dailyRow.failedCount += 1;
                    productRow.failedCount += 1;
                } else if (instance.status === ProductInstanceStatus.PENDING_QC) {
                    totals.pendingQcCount += 1;
                    dailyRow.pendingQcCount += 1;
                    productRow.pendingQcCount += 1;
                }
            }

            if (!countedWorkOrders.has(workOrder.workOrderId)) {
                countedWorkOrders.add(workOrder.workOrderId);

                const materialCost = toNumber(workOrder.totalMaterialCost);
                const conversionCost = toNumber(workOrder.laborCost) + toNumber(workOrder.overheadCost);
                const productionCost = toNumber(workOrder.totalProductionCost);

                totals.totalMaterialCost += materialCost;
                totals.totalConversionCost += conversionCost;
                totals.totalProductionCost += productionCost;
                dailyRow.totalMaterialCost += materialCost;
                dailyRow.totalConversionCost += conversionCost;
                dailyRow.totalProductionCost += productionCost;
                productRow.totalMaterialCost += materialCost;
                productRow.totalConversionCost += conversionCost;
                productRow.totalProductionCost += productionCost;
            }

            daily.set(date, dailyRow);
            products.set(product.productId, productRow);
        }

        return {
            filters: {
                startDate: query.startDate ? toDateKey(query.startDate) : null,
                endDate: query.endDate ? toDateKey(new Date(query.endDate.getTime() - 1)) : null,
                productId: query.productId ?? null
            },
            ...finalizeProductAccumulator(totals),
            dailyBreakdown: Array.from(daily.entries()).map(([date, row]) => ({
                date,
                ...finalizeProductAccumulator(row)
            })),
            productBreakdown: Array.from(products.entries()).map(([productId, row]) => ({
                productId,
                productCode: row.productCode,
                productName: row.productName,
                ...finalizeProductAccumulator(row)
            }))
        };
    }
}

export default new CostReportService();
