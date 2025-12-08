const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ComponentService {
  
  async getAllComponents(query) {
    const where = {};
    if (query.search) {
      where.OR = [
        { componentName: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } }
      ];
    }
    return prisma.component.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getComponentById(id) {
    const component = await prisma.component.findUnique({
      where: { componentId: parseInt(id) }
    });
    if (!component) throw new Error('Component not found');
    return component;
  }

  async createComponent(data) {
    // Check Duplicate Code
    const existing = await prisma.component.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Component code "${data.code}" already exists.`);

    return prisma.component.create({ data });
  }

  async updateComponent(id, data) {
    const componentId = parseInt(id);
    const component = await prisma.component.findUnique({ where: { componentId } });
    if (!component) throw new Error('Component not found');

    if (data.code && data.code !== component.code) {
      const exists = await prisma.component.findUnique({ where: { code: data.code } });
      if (exists) throw new Error(`Component code "${data.code}" already exists.`);
    }

    return prisma.component.update({
      where: { componentId },
      data
    });
  }

  async deleteComponent(id) {
    const componentId = parseInt(id);

    // 1. Check if used in BOM (Product Composition)
    const inBOM = await prisma.productComposition.findFirst({ where: { componentId } });
    if (inBOM) throw new Error('Cannot delete: This component is part of a Product BOM.');

    // 2. Check if used in Purchase Orders
    const inPO = await prisma.purchaseOrderDetail.findFirst({ where: { componentId } });
    if (inPO) throw new Error('Cannot delete: This component exists in Purchase Orders.');

    // 3. Check if stock exists (optional, but recommended)
    const hasStock = await prisma.componentStock.findFirst({ 
      where: { componentId, quantity: { gt: 0 } } 
    });
    if (hasStock) throw new Error('Cannot delete: Physical stock still exists in warehouse.');

    return prisma.component.delete({ where: { componentId } });
  }

  
  async getComponentSuppliers(componentId) {
    const id = parseInt(componentId);
    
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

module.exports = new ComponentService();