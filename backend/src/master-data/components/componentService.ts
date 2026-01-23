import prisma from '../../common/lib/prisma.js';
import type { Component } from '../../generated/prisma/index.js';

interface ComponentQuery {
    search?: string;
}

interface ComponentCreateData {
    code: string;
    componentName: string;
    description?: string;
    unit: string;
    minStockLevel?: number;
    standardCost?: number;
}

interface ComponentSupplier {
    supplierId: number;
    supplierName: string;
    code: string;
    email: string | null;
    phoneNumber: string | null;
}

class ComponentService {

    async getAllComponents(query: ComponentQuery & { page?: number; limit?: number }): Promise<any> {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { componentName: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.component.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.component.count({ where })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    async getComponentById(id: string | number): Promise<Component> {
        const componentId = typeof id === 'string' ? parseInt(id) : id;
        const component = await prisma.component.findUnique({
            where: { componentId }
        });
        if (!component) throw new Error('Component not found');
        return component;
    }

    async createComponent(data: ComponentCreateData): Promise<Component> {
        // Check Duplicate Code
        const existing = await prisma.component.findUnique({ where: { code: data.code } });
        if (existing) throw new Error(`Component code "${data.code}" already exists.`);

        return prisma.component.create({ data: data as any });
    }

    async updateComponent(id: string | number, data: Partial<ComponentCreateData>): Promise<Component> {
        const componentId = typeof id === 'string' ? parseInt(id) : id;
        const component = await prisma.component.findUnique({ where: { componentId } });
        if (!component) throw new Error('Component not found');

        if (data.code && data.code !== component.code) {
            const exists = await prisma.component.findUnique({ where: { code: data.code } });
            if (exists) throw new Error(`Component code "${data.code}" already exists.`);
        }

        return prisma.component.update({
            where: { componentId },
            data: data as any
        });
    }

    async deleteComponent(id: string | number): Promise<Component> {
        const componentId = typeof id === 'string' ? parseInt(id) : id;

        // 1. Check if used in BOM (Product Composition)
        const inBOM = await prisma.productComposition.findFirst({ where: { componentId } });
        if (inBOM) throw new Error('Cannot delete: This component is part of a Product BOM.');

        // 2. Check if used in Purchase Orders
        const inPO = await prisma.purchaseOrderDetail.findFirst({ where: { componentId } });
        if (inPO) throw new Error('Cannot delete: This component exists in Purchase Orders.');

        // 3. Check if stock exists
        const hasStock = await prisma.componentStock.findFirst({
            where: { componentId, quantity: { gt: 0 } }
        });
        if (hasStock) throw new Error('Cannot delete: Physical stock still exists in warehouse.');

        return prisma.component.delete({ where: { componentId } });
    }


    async getComponentSuppliers(componentId: string | number): Promise<ComponentSupplier[]> {
        const id = typeof componentId === 'string' ? parseInt(componentId) : componentId;

        // 1. Verify component exists
        const component = await prisma.component.findUnique({ where: { componentId: id } });
        if (!component) throw new Error('Component not found');

        // 2. Find suppliers
        const relations = await prisma.supplierComponent.findMany({
            where: { componentId: id },
            include: { supplier: true }
        });

        // 3. Format response
        return relations.map(r => ({
            supplierId: r.supplier.supplierId,
            supplierName: r.supplier.supplierName,
            code: r.supplier.code,
            email: r.supplier.email,
            phoneNumber: r.supplier.phoneNumber
        }));
    }
}

export default new ComponentService();
