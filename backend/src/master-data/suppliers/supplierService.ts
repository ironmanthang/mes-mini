import prisma from '../../common/lib/prisma.js';
import type { Supplier } from '../../generated/prisma/index.js';

interface SupplierCreateData {
    code: string;
    supplierName: string;
    phoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
}

interface SupplierComponent {
    componentId: number;
    code: string;
    name: string;
    unit: string;
    description: string | null;
    currentStock: number;
    suggestedPrice: unknown; // Prisma Decimal type
}

class SupplierService {

    async getAllSuppliers(query: { page?: number; limit?: number; search?: string } = {}): Promise<any> {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { supplierName: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.supplier.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getSupplierById(id: string | number): Promise<Supplier> {
        const supplierId = typeof id === 'string' ? parseInt(id) : id;
        const supplier = await prisma.supplier.findUnique({
            where: { supplierId }
        });
        if (!supplier) throw new Error('Supplier not found');
        return supplier;
    }

    async createSupplier(data: SupplierCreateData): Promise<Supplier> {
        // 1. Check for Duplicate Code
        const existingCode = await prisma.supplier.findUnique({ where: { code: data.code } });
        if (existingCode) throw new Error(`Supplier code "${data.code}" already exists.`);

        // 2. Check for Duplicate Email/Phone
        if (data.email || data.phoneNumber) {
            const existingContact = await prisma.supplier.findFirst({
                where: {
                    OR: [
                        { email: data.email || undefined },
                        { phoneNumber: data.phoneNumber || undefined }
                    ]
                }
            });
            if (existingContact) {
                if (existingContact.email === data.email) throw new Error('Email already in use.');
                if (existingContact.phoneNumber === data.phoneNumber) throw new Error('Phone number already in use.');
            }
        }

        return prisma.supplier.create({ data: data as any });
    }

    async updateSupplier(id: string | number, data: Partial<SupplierCreateData>): Promise<Supplier> {
        const supplierId = typeof id === 'string' ? parseInt(id) : id;
        const supplier = await prisma.supplier.findUnique({ where: { supplierId } });
        if (!supplier) throw new Error('Supplier not found');

        // Conflict Check (Dynamic)
        const orConditions: any[] = [];
        if (data.code) orConditions.push({ code: data.code });
        if (data.email) orConditions.push({ email: data.email });
        if (data.phoneNumber) orConditions.push({ phoneNumber: data.phoneNumber });

        if (orConditions.length > 0) {
            const conflict = await prisma.supplier.findFirst({
                where: {
                    NOT: { supplierId },
                    OR: orConditions
                }
            });

            if (conflict) {
                if (conflict.code === data.code) throw new Error(`Supplier code "${data.code}" already exists.`);
                if (conflict.email === data.email) throw new Error('Email already in use.');
                if (conflict.phoneNumber === data.phoneNumber) throw new Error('Phone number already in use.');
            }
        }

        return prisma.supplier.update({
            where: { supplierId },
            data: data as any
        });
    }

    async deleteSupplier(id: string | number): Promise<Supplier> {
        const supplierId = typeof id === 'string' ? parseInt(id) : id;
        const hasOrders = await prisma.purchaseOrder.findFirst({ where: { supplierId } });
        if (hasOrders) throw new Error('Cannot delete supplier because they have existing Purchase Orders.');

        return prisma.supplier.delete({ where: { supplierId } });
    }

    async getSupplierComponents(supplierId: string | number): Promise<SupplierComponent[]> {
        const id = typeof supplierId === 'string' ? parseInt(supplierId) : supplierId;

        const relations = await prisma.supplierComponent.findMany({
            where: { supplierId: id },
            include: {
                component: {
                    include: {
                        componentStocks: true
                    }
                }
            }
        });

        return relations.map(r => {
            const totalStock = r.component.componentStocks.reduce(
                (sum, stock) => sum + stock.quantity,
                0
            );

            return {
                componentId: r.componentId,
                code: r.component.code,
                name: r.component.componentName,
                unit: r.component.unit,
                description: r.component.description,
                currentStock: totalStock,
                suggestedPrice: r.component.standardCost
            };
        });
    }


    async assignComponentToSupplier(supplierId: string | number, componentId: string | number) {
        const sId = typeof supplierId === 'string' ? parseInt(supplierId) : supplierId;
        const cId = typeof componentId === 'string' ? parseInt(componentId) : componentId;

        return prisma.supplierComponent.upsert({
            where: {
                supplierId_componentId: {
                    supplierId: sId,
                    componentId: cId
                }
            },
            update: {},
            create: {
                supplierId: sId,
                componentId: cId
            }
        });
    }

    async removeComponentFromSupplier(supplierId: string | number, componentId: string | number) {
        const sId = typeof supplierId === 'string' ? parseInt(supplierId) : supplierId;
        const cId = typeof componentId === 'string' ? parseInt(componentId) : componentId;

        const result = await prisma.supplierComponent.deleteMany({
            where: {
                supplierId: sId,
                componentId: cId
            }
        });

        if (result.count === 0) {
            throw new Error('This component is not assigned to this supplier.');
        }

        return result;
    }
}

export default new SupplierService();
