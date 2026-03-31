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
}

export default new WarehouseService();
