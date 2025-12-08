const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PurchaseOrderService {

  async createPO(data, creatorId) {
    const { 
      code, status, supplierId, orderDate, expectedDeliveryDate,
      discount, shippingCost, tax, paymentTerms, deliveryTerms,
      details 
    } = data;

    const componentIds = details.map(item => item.componentId);
    const uniqueIds = new Set(componentIds);
    if (uniqueIds.size !== componentIds.length) {
      throw new Error("Duplicate components found in list. Please combine them into a single line item.");
    }

    // 1. Check if Supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { supplierId } });
    if (!supplier) throw new Error("Supplier not found");

    // 2. Validate Items & Calculate Subtotal
    let subtotal = 0;
    
    // We verify if these components actually belong to the supplier
    // This enforces the rule: "Only buy what they sell"
    for (const item of details) {
      const relation = await prisma.supplierComponent.findUnique({
        where: {
          supplierId_componentId: {
            supplierId: supplierId,
            componentId: item.componentId
          }
        }
      });
      
      if (!relation) {
        throw new Error(`Component ID ${item.componentId} is not provided by this Supplier.`);
      }

      subtotal += (item.quantity * item.unitPrice);
    }

    // 3. Calculate Final Total
    // Formula: Subtotal - Discount + Tax + Shipping
    // Note: Inputs are passed as numbers, convert to Decimal logic if needed or let Prisma handle it
    const finalTotal = subtotal - discount + tax + shippingCost;
    try {
      return await prisma.purchaseOrder.create({
        data: {
          code,
          supplierId,
          employeeId: creatorId, // The "Purchasing Staff" or "Manager"
          orderDate,
          expectedDeliveryDate,
          status: status || 'DRAFT',            
          discount,
          shippingCost,
          tax,
          totalAmount: finalTotal,
          
          paymentTerms,
          deliveryTerms,

          details: {
            create: details.map(item => ({
              componentId: item.componentId,
              quantityOrdered: item.quantity,
              unitPrice: item.unitPrice,
              quantityReceived: 0
            }))
          }
        },
        include: {
          details: {
            include: { component: true }
          }
        }
      });
    } catch (error) {
      // P2002 is Prisma's code for "Unique Constraint Violation"
      if (error.code === 'P2002') {
        if (error.meta && error.meta.target.includes('code')) {
           throw new Error(`Purchase Order Code "${code}" already exists.`);
        }
      }
      throw error; // If it's another error, throw it normally
    }
  }



  async updatePO(id, data, userId) {
    const poId = parseInt(id);
    const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: poId } });

    if (!po) throw new Error("PO not found");
    
    // RULE: Can only edit DRAFT or PENDING orders
    if (po.status !== 'DRAFT' && po.status !== 'PENDING') {
      throw new Error(`Cannot edit order. Status is ${po.status}`);
    }

    // RULE: Only the Creator can edit (Optional, but good practice)
    if (po.employeeId !== userId) {
      throw new Error("You can only edit your own orders.");
    }

    // If changing status to PENDING, it means "Submitting"
    return prisma.purchaseOrder.update({
      where: { purchaseOrderId: poId },
      data: {
        expectedDeliveryDate: data.expectedDeliveryDate,
        discount: data.discount,
        shippingCost: data.shippingCost,
        tax: data.tax,
        note: data.note,
        paymentTerms: data.paymentTerms,
        deliveryTerms: data.deliveryTerms,
        status: data.status // Allow flipping DRAFT -> PENDING
      }
    });
  }


  async getAllPOs() {
    // We use 'select' instead of 'include' to pick ONLY what we need
    return prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        purchaseOrderId: true,
        code: true,
        orderDate: true,
        expectedDeliveryDate: true,
        status: true,
        totalAmount: true,
        priority: true,
        
        // 1. Optimize Supplier: Only get the Name
        supplier: {
          select: {
            supplierName: true,
            code: true // Optional: Keep code if you display it
          }
        },

        // 2. Optimize Employee: Only get the Name
        employee: {
          select: {
            fullName: true
          }
        },

        // 3. (Optional) Get a count of items to show "Total Items: X"
        _count: {
          select: { details: true }
        }
      }
    });
  }

  async getPOById(id) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { purchaseOrderId: parseInt(id) },
      include: {
        supplier: true,
        employee: { select: { fullName: true } },
        approver: { select: { fullName: true } },
        details: {
          include: { component: true }
        }
      }
    });
    if (!po) throw new Error("Purchase Order not found");
    return po;
  }
  
  async approvePO(poId, approverId) {
    const po = await prisma.purchaseOrder.findUnique({ where: { purchaseOrderId: parseInt(poId) } });

    if (!po) throw new Error("Order not found");
    if (po.status !== 'PENDING') throw new Error(`Cannot approve order. Status is ${po.status}`);

    // FINAL FIREWALL: Even if you are Admin, you can't approve your own creation
    if (po.employeeId === approverId) {
      throw new Error("Violation: You cannot approve a Purchase Order that you created yourself.");
    }

    return prisma.purchaseOrder.update({
      where: { purchaseOrderId: parseInt(poId) },
      data: {
        status: 'APPROVED',
        approverId: approverId,
        approvedAt: new Date()
      }
    });
  }
}

module.exports = new PurchaseOrderService();