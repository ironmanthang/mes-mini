import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../../src/common/lib/prisma.js';
import { PERM } from '../../../src/common/constants/permissions.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority, WarehouseType, InventoryTransactionType, ProductInstanceStatus, MaterialRequestStatus, InspectionType } from '../../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = '123456';

export async function seedSuppliers(): Promise<void> {
    console.log('...Seeding Suppliers');
    const suppliers = [
        { code: 'SUP-HP', name: 'Hoa Phat Steel', email: 'sales@hoaphat.com', phone: '0901111111' },
        { code: 'SUP-SS', name: 'Samsung Electronics', email: 'b2b@samsung.com', phone: '0902222222' },
        { code: 'SUP-LG', name: 'Logistics Global', email: 'contact@lg.com', phone: '0903333333' }
    ];

    for (const s of suppliers) {
        await prisma.supplier.upsert({
            where: { code: s.code },
            update: {},
            create: {
                code: s.code,
                supplierName: s.name,
                email: s.email,
                phoneNumber: s.phone,
                address: 'Industrial Zone'
            }
        });
    }
}

export async function seedAgents(): Promise<void> {
    console.log('...Seeding Agents');
    const agents = [{ code: 'AGT-001', name: 'Authorized Dealer Alpha', email: 'alpha@dealer.com', phone: '0912345678', address: 'Hanoi, VN' }];
    for (const a of agents) {
        await prisma.agent.upsert({
            where: { code: a.code },
            update: {},
            create: { code: a.code, agentName: a.name, email: a.email, phoneNumber: a.phone, address: a.address }
        });
    }
}

export async function seedComponents(): Promise<void> {
    console.log('...Seeding Components');
    const components = [
        { code: 'COM-STEEL-5MM', name: 'Steel Sheet 5mm', unit: 'kg', cost: 45000, stock: 100 },
        { code: 'COM-STEEL-10MM', name: 'Steel Sheet 10mm', unit: 'kg', cost: 85000, stock: 50 },
        { code: 'COM-CHIP-X1', name: 'Control Chip X1', unit: 'pcs', cost: 120000, stock: 500 },
        { code: 'COM-SCREW-M5', name: 'Screw M5', unit: 'pcs', cost: 500, stock: 10000 },
    ];

    for (const c of components) {
        await prisma.component.upsert({
            where: { code: c.code },
            update: {},
            create: {
                code: c.code,
                componentName: c.name,
                unit: c.unit,
                standardCost: c.cost,
                minStockLevel: c.stock
            }
        });
    }
}

export async function seedQualityChecklists(): Promise<void> {
    console.log('...Seeding Quality Checklists');

    // 1. Electronics Standard Checklist
    const elecChecklist = await prisma.qualityChecklist.upsert({
        where: { checklistId: 1 },
        update: {},
        create: {
            checklistName: 'Standard Electronics QC',
            description: 'Standard checklist for electronics products',
        }
    });

    await prisma.inspectionPoint.deleteMany({ where: { checklistId: elecChecklist.checklistId } });
    await prisma.inspectionPoint.createMany({
        data: [
            {
                checklistId: elecChecklist.checklistId,
                pointName: 'Power On Test',
                description: 'Verify device powers on correctly',
                pointType: InspectionType.BINARY,
                sortOrder: 1
            },
            {
                checklistId: elecChecklist.checklistId,
                pointName: 'Screen Quality',
                description: 'Check for dead pixels or scratches',
                pointType: InspectionType.BINARY,
                sortOrder: 2
            },
            {
                checklistId: elecChecklist.checklistId,
                pointName: 'Battery Voltage',
                description: 'Measure battery voltage',
                pointType: InspectionType.MEASUREMENT,
                minValue: 3.7,
                maxValue: 4.2,
                unit: 'V',
                sortOrder: 3
            }
        ]
    });
}

export async function seedProducts(): Promise<void> {
    console.log('...Seeding Products & BOM');

    const elecChecklist = await prisma.qualityChecklist.findFirst({ where: { checklistName: 'Standard Electronics QC' } });

    // 1. Create Product
    const product = await prisma.product.upsert({
        where: { code: 'PROD-LAPTOP-X1' },
        update: {},
        create: {
            code: 'PROD-LAPTOP-X1',
            productName: 'Laptop X1 Pro',
            unit: 'pcs',
            minStockLevel: 20,
            checklistId: elecChecklist?.checklistId
        }
    });

    // 2. Link BOM (1 Laptop uses 1 Chip, 10 Screws)
    const chip = await prisma.component.findUnique({ where: { code: 'COM-CHIP-X1' } });
    const screw = await prisma.component.findUnique({ where: { code: 'COM-SCREW-M5' } });

    if (chip) {
        await prisma.billOfMaterial.upsert({
            where: {
                productId_componentId: {
                    productId: product.productId,
                    componentId: chip.componentId
                }
            },
            update: {},
            create: { productId: product.productId, componentId: chip.componentId, quantityNeeded: 1 }
        });
    }

    if (screw) {
        await prisma.billOfMaterial.upsert({
            where: {
                productId_componentId: {
                    productId: product.productId,
                    componentId: screw.componentId
                }
            },
            update: {},
            create: { productId: product.productId, componentId: screw.componentId, quantityNeeded: 10 }
        });
    }
}

export async function seedSupplierComponents(): Promise<void> {
    console.log('...Linking Suppliers to Components');

    const hoaphat = await prisma.supplier.findUnique({ where: { code: 'SUP-HP' } });
    const samsung = await prisma.supplier.findUnique({ where: { code: 'SUP-SS' } });

    const steel5 = await prisma.component.findUnique({ where: { code: 'COM-STEEL-5MM' } });
    const steel10 = await prisma.component.findUnique({ where: { code: 'COM-STEEL-10MM' } });
    const chip = await prisma.component.findUnique({ where: { code: 'COM-CHIP-X1' } });

    const links = [
        { s: hoaphat, c: steel5 },
        { s: hoaphat, c: steel10 },
        { s: samsung, c: chip }
    ];

    for (const link of links) {
        if (link.s && link.c) {
            await prisma.supplierComponent.upsert({
                where: {
                    supplierId_componentId: {
                        supplierId: link.s.supplierId,
                        componentId: link.c.componentId
                    }
                },
                update: {},
                create: {
                    supplierId: link.s.supplierId,
                    componentId: link.c.componentId
                }
            });
        }
    }
}

