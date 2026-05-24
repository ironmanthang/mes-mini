import prisma from '../../common/lib/prisma.js';
import { ProductInstanceStatus } from '../../generated/prisma/index.js';
import { ReportDateRange, roundRate, toDateKey } from '../../common/utils/reporting.js';

export interface LinePerformanceReportQuery extends ReportDateRange {
    productionLineId?: number;
    productId?: number;
}

interface PerformanceCounters {
    totalProduced: number;
    qcCompleted: number;
    passedCount: number;
    failedCount: number;
    pendingQcCount: number;
}

interface ProductPerformanceAccumulator extends PerformanceCounters {
    productId: number;
    productCode: string;
    productName: string;
}

interface LinePerformanceAccumulator extends PerformanceCounters {
    productionLineId: number | null;
    lineName: string;
    location: string | null;
    products: Map<number, ProductPerformanceAccumulator>;
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

const createCounters = (): PerformanceCounters => ({
    totalProduced: 0,
    qcCompleted: 0,
    passedCount: 0,
    failedCount: 0,
    pendingQcCount: 0
});

const applyStatus = (acc: PerformanceCounters, status: ProductInstanceStatus): void => {
    acc.totalProduced += 1;

    if (PASSED_STATUSES.includes(status)) {
        acc.qcCompleted += 1;
        acc.passedCount += 1;
        return;
    }

    if (FAILED_STATUSES.includes(status)) {
        acc.qcCompleted += 1;
        acc.failedCount += 1;
        return;
    }

    if (status === ProductInstanceStatus.PENDING_QC) {
        acc.pendingQcCount += 1;
    }
};

const finalizeCounters = (acc: PerformanceCounters) => ({
    totalProduced: acc.totalProduced,
    qcCompleted: acc.qcCompleted,
    passedCount: acc.passedCount,
    failedCount: acc.failedCount,
    pendingQcCount: acc.pendingQcCount,
    passRate: acc.qcCompleted > 0 ? roundRate(acc.passedCount / acc.qcCompleted) : 0,
    defectRate: acc.qcCompleted > 0 ? roundRate(acc.failedCount / acc.qcCompleted) : 0
});

class ProductionReportService {
    async getLinePerformance(query: LinePerformanceReportQuery) {
        const batches = await prisma.productionBatch.findMany({
            where: {
                ...(query.startDate || query.endDate ? { productionDate: dateRangeWhere(query) } : {}),
                ...(query.productionLineId ? { productionLineId: query.productionLineId } : {}),
                ...(query.productId ? { workOrder: { productId: query.productId } } : {})
            },
            include: {
                productionLine: { select: { productionLineId: true, lineName: true, location: true } },
                workOrder: {
                    select: {
                        product: { select: { productId: true, code: true, productName: true } }
                    }
                },
                productInstances: { select: { status: true } }
            },
            orderBy: { productionDate: 'asc' }
        });

        const totals = createCounters();
        const lines = new Map<string, LinePerformanceAccumulator>();

        for (const batch of batches) {
            const lineKey = batch.productionLine?.productionLineId.toString() ?? 'unassigned';
            const line = lines.get(lineKey) ?? {
                ...createCounters(),
                productionLineId: batch.productionLine?.productionLineId ?? null,
                lineName: batch.productionLine?.lineName ?? 'Unassigned',
                location: batch.productionLine?.location ?? null,
                products: new Map<number, ProductPerformanceAccumulator>()
            };

            const product = batch.workOrder.product;
            const productRow = line.products.get(product.productId) ?? {
                ...createCounters(),
                productId: product.productId,
                productCode: product.code,
                productName: product.productName
            };

            for (const instance of batch.productInstances) {
                applyStatus(totals, instance.status);
                applyStatus(line, instance.status);
                applyStatus(productRow, instance.status);
            }

            line.products.set(product.productId, productRow);
            lines.set(lineKey, line);
        }

        return {
            filters: {
                startDate: query.startDate ? toDateKey(query.startDate) : null,
                endDate: query.endDate ? toDateKey(new Date(query.endDate.getTime() - 1)) : null,
                productionLineId: query.productionLineId ?? null,
                productId: query.productId ?? null
            },
            totals: finalizeCounters(totals),
            lines: Array.from(lines.values()).map(line => ({
                productionLineId: line.productionLineId,
                lineName: line.lineName,
                location: line.location,
                ...finalizeCounters(line),
                products: Array.from(line.products.values()).map(product => ({
                    productId: product.productId,
                    productCode: product.productCode,
                    productName: product.productName,
                    ...finalizeCounters(product)
                }))
            }))
        };
    }
}

export default new ProductionReportService();
