import prisma from '../../common/lib/prisma.js';
import type { Warehouse } from '../../generated/prisma/index.js';

interface WarehouseQuery {
    type?: string;
    search?: string;
}

class WarehouseService {
    async getAllWarehouses(query: WarehouseQuery): Promise<Warehouse[]> {
        const where: any = {};
        
        if (query.type) {
            where.warehouseType = query.type;
        }

        if (query.search) {
             where.OR = [
                { warehouseName: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        return prisma.warehouse.findMany({
            where,
            orderBy: { warehouseId: 'asc' }
        });
    }

    async createWarehouse(data: { warehouseName: string; location?: string; warehouseType: string }): Promise<Warehouse> {
        const count = await prisma.warehouse.count();
        const code = `WH-${data.warehouseType.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}${count}`;
        
        return prisma.warehouse.create({
            data: {
                warehouseName: data.warehouseName,
                location: data.location,
                warehouseType: data.warehouseType as any,
                code
            }
        });
    }

    async updateWarehouse(warehouseId: number, data: { warehouseName: string; location?: string }): Promise<Warehouse> {
        const warehouse = await prisma.warehouse.findUnique({ where: { warehouseId } });
        if (!warehouse) throw new Error('Warehouse not found');

        return prisma.warehouse.update({
            where: { warehouseId },
            data: {
                warehouseName: data.warehouseName,
                location: data.location
            }
        });
    }

    async deleteWarehouse(warehouseId: number): Promise<void> {
        const warehouse = await prisma.warehouse.findUnique({ 
            where: { warehouseId },
            include: {
                _count: {
                    select: {
                        componentStocks: true,
                        productInstances: true,
                        componentLots: true
                    }
                }
            }
        });

        if (!warehouse) throw new Error('Warehouse not found');

        if (warehouse._count.componentStocks > 0 || warehouse._count.productInstances > 0 || warehouse._count.componentLots > 0) {
            throw new Error('Cannot delete warehouse: it contains existing components or products.');
        }

        await prisma.warehouse.delete({
            where: { warehouseId }
        });
    }
}

export default new WarehouseService();
