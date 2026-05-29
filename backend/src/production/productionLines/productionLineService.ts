import prisma from '../../common/lib/prisma.js';
import { ProductionLine, WorkOrderStatus } from '../../generated/prisma/index.js';
import { AppError } from '../../common/utils/AppError.js';

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
        if (!line) throw new AppError('Production Line not found', 404);
        return line;
    }

    async createProductionLine(data: ProductionLineCreateData): Promise<ProductionLine> {
        // Check duplicate name
        const existing = await prisma.productionLine.findFirst({
            where: { lineName: { equals: data.lineName, mode: 'insensitive' } }
        });
        if (existing) throw new AppError(`Production Line "${data.lineName}" already exists.`, 400);

        return prisma.productionLine.create({ data });
    }

    async updateProductionLine(id: number, data: Partial<ProductionLineCreateData>): Promise<ProductionLine> {
        const line = await prisma.productionLine.findUnique({ where: { productionLineId: id } });
        if (!line) throw new AppError('Production Line not found', 404);

        if (data.lineName && data.lineName !== line.lineName) {
            const exists = await prisma.productionLine.findFirst({
                where: { lineName: { equals: data.lineName, mode: 'insensitive' } }
            });
            if (exists) throw new AppError(`Production Line "${data.lineName}" already exists.`, 400);
        }

        return prisma.productionLine.update({
            where: { productionLineId: id },
            data
        });
    }

    async deleteProductionLine(id: number): Promise<ProductionLine> {
        const line = await prisma.productionLine.findUnique({
            where: { productionLineId: id },
            include: {
                _count: {
                    select: {
                        workOrders: true,
                        productionBatches: true
                    }
                }
            }
        });

        if (!line) throw new AppError('Production Line not found', 404);

        if (line._count.workOrders > 0 || line._count.productionBatches > 0) {
            throw new AppError('Cannot delete: Production Line is linked to existing Work Orders or Production Batches.', 400);
        }

        return prisma.productionLine.delete({ where: { productionLineId: id } });
    }
}

export default new ProductionLineService();
