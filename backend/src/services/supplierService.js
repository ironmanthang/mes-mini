// src/services/supplierService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SupplierService {

  async getAllSuppliers() {
    return prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSupplierById(id) {
    const supplier = await prisma.supplier.findUnique({
      where: { supplierId: parseInt(id) }
    });
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
  }

  async createSupplier(data) {
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

    return prisma.supplier.create({ data });
  }

  async updateSupplier(id, data) {
    const supplierId = parseInt(id);
    const supplier = await prisma.supplier.findUnique({ where: { supplierId } });
    if (!supplier) throw new Error('Supplier not found');

    // Conflict Check (Dynamic)
    const orConditions = [];
    if (data.code) orConditions.push({ code: data.code });
    if (data.email) orConditions.push({ email: data.email });
    if (data.phoneNumber) orConditions.push({ phoneNumber: data.phoneNumber });

    if (orConditions.length > 0) {
      const conflict = await prisma.supplier.findFirst({
        where: {
          NOT: { supplierId }, // Exclude self
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
      data
    });
  }

  async deleteSupplier(id) {
    const supplierId = parseInt(id);
    const hasOrders = await prisma.purchaseOrder.findFirst({ where: { supplierId } });
    if (hasOrders) throw new Error('Cannot delete supplier because they have existing Purchase Orders.');

    return prisma.supplier.delete({ where: { supplierId } });
  }
  async getSupplierComponents(supplierId) {
    const id = parseInt(supplierId);

    const relations = await prisma.supplierComponent.findMany({
      where: { supplierId: id },
      include: {
        component: {
          include: {
            // 1. Fetch the stock records for this component
            componentStocks: true
          }
        }
      }
    });
    return relations.map(r => {
      // 2. LOGIC: Sum up quantities from all warehouses
      // If componentStocks is empty, total is 0.
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

        // 3. Return the calculated Total
        currentStock: totalStock,

        // SUGGESTION LOGIC: Use standardCost
        suggestedPrice: r.component.standardCost
      };
    });
  }


  async assignComponentToSupplier(supplierId, componentId) {
    // Upsert ensures we don't crash if it already exists
    return prisma.supplierComponent.upsert({
      where: {
        supplierId_componentId: {
          supplierId: parseInt(supplierId),
          componentId: parseInt(componentId)
        }
      },
      update: {}, // Do nothing if exists
      create: {
        supplierId: parseInt(supplierId),
        componentId: parseInt(componentId)
      }
    });
  }

  async removeComponentFromSupplier(supplierId, componentId) {
    const result = await prisma.supplierComponent.deleteMany({
      where: {
        supplierId: parseInt(supplierId),
        componentId: parseInt(componentId)
      }
    });

    // CHECK: Did we actually delete anything?
    if (result.count === 0) {
      throw new Error('This component is not assigned to this supplier.');
    }

    return result;
  }
}

module.exports = new SupplierService();