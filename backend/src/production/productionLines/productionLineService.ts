import prisma from '../../common/lib/prisma.js';
import { ProductionLine, WorkOrderStatus } from '../../generated/prisma/index.js';

interface ProductionLineCreateData {
    lineName: string;
    location?: string;
}

class ProductionLineService {

    async getAllProductionLines() {
        return prisma.productionLine.findMany({
            orderBy: { lineName: 'asc' },
            include: {
                _count: {
                    select: {
                        workOrders: true,
                        productionBatches: true
                    }
                }
            }
        });
    }

    async getProductionLineById(id: number): Promise<ProductionLine> {
        const line = await prisma.productionLine.findUnique({
            where: { productionLineId: id },
            include: {
                workOrders: {
                    where: { status: WorkOrderStatus.IN_PROGRESS },
                    take: 10,
                    include: { product: { select: { productName: true } } }
                },
                _count: {
                    select: {
                        workOrders: true,
                        productionBatches: true
                    }
                }
            }
        });
        if (!line) throw new Error('Production Line not found');
        return line;
    }

    async createProductionLine(data: ProductionLineCreateData): Promise<ProductionLine> {
        // Check duplicate name
        const existing = await prisma.productionLine.findFirst({
            where: { lineName: { equals: data.lineName, mode: 'insensitive' } }
        });
        if (existing) throw new Error(`Production Line "${data.lineName}" already exists.`);

        return prisma.productionLine.create({ data });
    }

    async updateProductionLine(id: number, data: Partial<ProductionLineCreateData>): Promise<ProductionLine> {
        const line = await prisma.productionLine.findUnique({ where: { productionLineId: id } });
        if (!line) throw new Error('Production Line not found');

        if (data.lineName && data.lineName !== line.lineName) {
            const exists = await prisma.productionLine.findFirst({
                where: { lineName: { equals: data.lineName, mode: 'insensitive' } }
            });
            if (exists) throw new Error(`Production Line "${data.lineName}" already exists.`);
        }

        return prisma.productionLine.update({
            where: { productionLineId: id },
            data
        });
    }

    async deleteProductionLine(id: number): Promise<ProductionLine> {
        // Check if has active work orders
        const hasActiveWO = await prisma.workOrder.findFirst({
            where: { productionLineId: id, status: { in: [WorkOrderStatus.PLANNED, WorkOrderStatus.IN_PROGRESS] } }
        });
        if (hasActiveWO) throw new Error('Cannot delete: Line has active Work Orders.');

        return prisma.productionLine.delete({ where: { productionLineId: id } });
    }
}

export default new ProductionLineService();
