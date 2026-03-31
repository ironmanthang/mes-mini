import prisma from '../../common/lib/prisma.js';
import type { BillOfMaterial, Component } from '../../generated/prisma/index.js';

type BomEntry = BillOfMaterial & {
    component: Pick<Component, 'componentId' | 'componentName' | 'code' | 'unit' | 'description'>;
};

const componentSelect = {
    componentId: true,
    componentName: true,
    code: true,
    unit: true,
    description: true,
} as const;

class BomService {

    async getBom(productId: number): Promise<BomEntry[]> {
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        return prisma.billOfMaterial.findMany({
            where: { productId },
            include: { component: { select: componentSelect } },
            orderBy: { componentId: 'asc' }
        }) as Promise<BomEntry[]>;
    }

    async addComponent(productId: number, componentId: number, quantityNeeded: number): Promise<BomEntry> {
        // Validate product exists
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        // Validate component exists
        const component = await prisma.component.findUnique({ where: { componentId } });
        if (!component) throw new Error('Component not found');

        // Check for duplicate (composite PK violation would give a cryptic error)
        const existing = await prisma.billOfMaterial.findUnique({
            where: { productId_componentId: { productId, componentId } }
        });
        if (existing) {
            throw new Error(`Component "${component.code}" is already in the BOM for this product. Use PUT to update quantity.`);
        }

        return prisma.billOfMaterial.create({
            data: { productId, componentId, quantityNeeded },
            include: { component: { select: componentSelect } }
        }) as Promise<BomEntry>;
    }

    async updateComponent(productId: number, componentId: number, quantityNeeded: number): Promise<BomEntry> {
        // Validate product exists
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        // Validate BOM entry exists
        const existing = await prisma.billOfMaterial.findUnique({
            where: { productId_componentId: { productId, componentId } }
        });
        if (!existing) throw new Error('BOM entry not found for this product/component combination');

        return prisma.billOfMaterial.update({
            where: { productId_componentId: { productId, componentId } },
            data: { quantityNeeded },
            include: { component: { select: componentSelect } }
        }) as Promise<BomEntry>;
    }

    async removeComponent(productId: number, componentId: number): Promise<void> {
        // Validate product exists
        const product = await prisma.product.findUnique({ where: { productId } });
        if (!product) throw new Error('Product not found');

        // Validate BOM entry exists
        const existing = await prisma.billOfMaterial.findUnique({
            where: { productId_componentId: { productId, componentId } }
        });
        if (!existing) throw new Error('BOM entry not found for this product/component combination');

        await prisma.billOfMaterial.delete({
            where: { productId_componentId: { productId, componentId } }
        });
    }
}

export default new BomService();
