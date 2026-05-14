import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../../src/common/lib/prisma.js';
import { PERM } from '../../../src/common/constants/permissions.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority, WarehouseType, InventoryTransactionType, ProductInstanceStatus, MaterialRequestStatus, InspectionType } from '../../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = '123456';

export async function injectComponentStock(componentId: number, warehouseId: number, quantity: number, lotCodePrefix: string) {
    if (quantity <= 0) return;

    const admin = await prisma.employee.findFirst({ where: { username: 'admin' } });
    const supplier = await prisma.supplier.findFirst();

    // 1. Ensure "Opening Stock" PO exists to satisfy schema constraint (ComponentLot -> PODetail)
    const openingPo = await prisma.purchaseOrder.upsert({
        where: { code: 'PO-OPENING-STOCK' },
        update: {},
        create: {
            code: 'PO-OPENING-STOCK',
            supplierId: supplier?.supplierId || 1,
            employeeId: admin?.employeeId || 1,
            status: PurchaseOrderStatus.COMPLETED,
            warehouseId: warehouseId,
            totalAmount: 0,
            orderDate: new Date('2026-01-01'),
        }
    });

    // 2. Ensure PO Detail exists
    const poDetail = await prisma.purchaseOrderDetail.upsert({
        where: {
            purchaseOrderId_componentId: {
                purchaseOrderId: openingPo.purchaseOrderId,
                componentId: componentId
            }
        },
        update: {
            quantityReceived: { increment: quantity }
        },
        create: {
            purchaseOrderId: openingPo.purchaseOrderId,
            componentId: componentId,
            quantityOrdered: quantity,
            quantityReceived: quantity,
            unitPrice: 0
        }
    });

    // 3. Update Aggregate Stock (Hard Reset for Seed Idempotency)
    await prisma.componentStock.upsert({
        where: { warehouseId_componentId: { warehouseId, componentId } },
        update: { quantity },
        create: { warehouseId, componentId, quantity }
    });

    // 4. Create Traceable Lot
    const lotCode = `${lotCodePrefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Check if a lot with this prefix already exists to avoid duplicates on re-seed
    const existingLot = await prisma.componentLot.findFirst({
        where: { lotCode: { startsWith: lotCodePrefix }, componentId, warehouseId }
    });

    if (!existingLot) {
        await prisma.componentLot.create({
            data: {
                lotCode,
                componentId,
                poDetailId: poDetail.poDetailId,
                warehouseId,
                initialQuantity: quantity,
                currentQuantity: quantity
            }
        });

        // 5. Audit Transaction
        await prisma.inventoryTransaction.create({
            data: {
                quantity,
                note: `Seeded opening stock: ${lotCodePrefix}`,
                employeeId: admin?.employeeId || 1,
                warehouseId,
                componentId,
                transactionType: InventoryTransactionType.IMPORT_PO,
                purchaseOrderId: openingPo.purchaseOrderId
            }
        });
    } else {
        // Just sync the quantity if lot exists
        await prisma.componentLot.update({
            where: { componentLotId: existingLot.componentLotId },
            data: { currentQuantity: quantity }
        });
    }
}

