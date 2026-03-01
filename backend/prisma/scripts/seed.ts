import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../src/common/lib/prisma.js';
import { EmployeeStatus } from '../../src/generated/prisma/index.js';

// ============================================================================
// 🎛️ CENTRAL CONTROL PANEL
// Toggle these to TRUE/FALSE to control what gets seeded
// ============================================================================
const SEED_CONFIG = {
    MINIMAL: false,  // false = Seed all users for full testing
    ROLES: true,
    EMPLOYEES: true,
    SUPPLIERS: true,
    COMPONENTS: true,
    WAREHOUSES: true,
    PRODUCTS: true,
    LINES: true,
    RELATIONS: true,
    INSTANCES: true, // NEW: Seed Inventory
    SCENARIOS: true, // NEW: Seed Complex Production Scenarios
};

const DEFAULT_PASSWORD = '123456';

async function main(): Promise<void> {
    console.log('Starting Seeding Process...');

    // FORCE RUN RELATIONS because they seem missing
    // console.log('Available Prisma Models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    await seedSupplierComponents();

    if (SEED_CONFIG.ROLES) await seedRoles();
    if (SEED_CONFIG.EMPLOYEES) await seedEmployees();

    // Master Data - Seed these even in MINIMAL mode if flags are true, or logic requires it.
    // Modified to allow Master Data with Minimal Users.
    if (SEED_CONFIG.SUPPLIERS) await seedSuppliers();
    if (SEED_CONFIG.COMPONENTS) await seedComponents();
    if (SEED_CONFIG.WAREHOUSES) await seedWarehouses();
    if (SEED_CONFIG.PRODUCTS) await seedProducts();
    if (SEED_CONFIG.LINES) await seedProductionLines();
    if (SEED_CONFIG.RELATIONS) await seedSupplierComponents();
    if (SEED_CONFIG.INSTANCES) await seedProductInstances(); // NEW
    await seedAgents();
    if (SEED_CONFIG.SCENARIOS) await seedProductionScenarios(); // NEW: The "Traffic Light" Logic Test Data

    console.log('Seeding Completed.');
}

// ============================================================================
// 9. SEED PRODUCT INSTANCES (INVENTORY)
// ============================================================================
async function seedProductInstances(): Promise<void> {
    console.log('...Seeding Product Instances (Mock Inventory)');

    // Find our Laptop
    const laptop = await prisma.product.findFirst({ where: { code: 'PROD-LAPTOP-X1' } });
    if (!laptop) return;

    // We must link instances to a Production Batch (Traceability)
    const admin = await prisma.employee.findFirst();

    // Create Dummy Work Order (Required parent for Batch)
    const workOrder = await prisma.workOrder.upsert({
        where: { code: 'WO-OPENING-STOCK' },
        update: {},
        create: {
            code: 'WO-OPENING-STOCK',
            quantity: 50,
            employeeId: admin?.employeeId || 1,
            productId: laptop.productId,
            status: 'COMPLETED'
        }
    });

    // Create Dummy Production Batch
    const prodBatch = await prisma.productionBatch.create({
        data: {
            batchCode: 'BATCH-OPENING-' + Date.now(),
            productionDate: new Date(),
            workOrderId: workOrder.workOrderId
        }
    });

    // Create 50 Units in Stock
    console.log('   Creating 50 Laptops in Stock...');
    const instancesData = [];
    for (let i = 1; i <= 50; i++) {
        instancesData.push({
            productId: laptop.productId,
            serialNumber: `SN-${new Date().getFullYear()}-LAPTOP-${i.toString().padStart(4, '0')}`,
            status: 'IN_STOCK' as const, // Force Literal Type
            unitProductionCost: 1500000, // Mock cost
            productionBatchId: prodBatch.productionBatchId // REQUIRED LINK
        });
    }

    await prisma.productInstance.createMany({
        data: instancesData,
        skipDuplicates: true
    });
}


// ============================================================================
// 1. SEED ROLES (Based on ISA-95 & Electronics Manufacturing Best Practices)
// ============================================================================
async function seedRoles(): Promise<void> {
    console.log('...Seeding Roles');

    // Roles mapped to MES functions:
    // - System Admin: Full access, user management, configurations
    // - Production Manager: Approves SO/PO/WO, monitors KPIs, scheduling
    // - Warehouse Keeper: Inventory management, material issue/receipt
    // - Line Leader: Shop floor supervisor, manages production line workers
    // - Production Worker: Executes work orders, records production data
    // - Sales Staff: Creates/submits sales orders, manages agents
    // - Purchasing Staff: Creates/submits purchase orders, manages suppliers
    // - QC Inspector: Quality checks, pass/fail decisions (ADDED based on web research)

    const roles = [
        'System Admin',
        'Production Manager',
        'Warehouse Keeper',
        'Line Leader',
        'Production Worker',
        'Sales Staff',
        'Purchasing Staff',
        'QC Inspector',
        'Warehouse Staff'
    ];

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { roleName },
            update: {},
            create: { roleName },
        });
    }
    console.log(`   Created ${roles.length} roles`);
}

// ============================================================================
// 2. SEED EMPLOYEES (One per role for testing)
// ============================================================================
async function seedEmployees(): Promise<void> {
    console.log('...Seeding Employees');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Full list of users - one employee per role for comprehensive testing
    // Each employee represents a persona that would use specific features
    const allUsers = [
        // Admin - Has full access
        { name: 'Super Admin', username: 'admin', email: 'admin@mes.com', role: 'System Admin' },

        // Manager - Approves orders, monitors production
        { name: 'Mr. Production Manager', username: 'manager', email: 'manager@mes.com', role: 'Production Manager' },

        // Warehouse - Handles inventory, material issue/receipt
        { name: 'Mr. Warehouse Keeper', username: 'warehouse', email: 'warehouse@mes.com', role: 'Warehouse Keeper' },

        // Line Leader - Supervises production workers on shop floor
        { name: 'Ms. Line Leader', username: 'lineleader', email: 'lineleader@mes.com', role: 'Line Leader' },

        // Worker - Executes work orders, records production data
        { name: 'Mr. Production Worker', username: 'worker', email: 'worker@mes.com', role: 'Production Worker' },

        // Sales - Creates sales orders for agents
        { name: 'Ms. Sales Staff', username: 'sales', email: 'sales@mes.com', role: 'Sales Staff' },

        // Purchasing - Creates purchase orders for suppliers
        { name: 'Mr. Purchasing Staff', username: 'purchaser', email: 'purchase@mes.com', role: 'Purchasing Staff' },

        // QC - Performs quality checks, pass/fail decisions
        { name: 'Ms. QC Inspector', username: 'qc', email: 'qc@mes.com', role: 'QC Inspector' }
    ];

    // MINIMAL mode: only seed super admin; otherwise seed all (one per role)
    const users = SEED_CONFIG.MINIMAL
        ? [allUsers[0]]  // Only Super Admin
        : allUsers;      // All 8 employees (one per role)

    console.log(`   Mode: ${SEED_CONFIG.MINIMAL ? 'MINIMAL (1 admin only)' : 'FULL (' + users.length + ' employees, one per role)'}`);

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        try {
            const role = await prisma.role.findUnique({ where: { roleName: u.role } });
            if (!role) {
                console.warn(`   ⚠️ Role "${u.role}" not found. Skipping user ${u.username}.`);
                continue;
            }

            await prisma.employee.upsert({
                where: { username: u.username },
                update: { status: EmployeeStatus.ACTIVE },
                create: {
                    fullName: u.name,
                    username: u.username,
                    password: hashedPassword,
                    email: u.email,
                    phoneNumber: `09000000${i.toString().padStart(2, '0')}`,
                    address: 'Spark Electronics Factory',
                    dateOfBirth: new Date('1990-01-01'),
                    hireDate: new Date(),
                    status: EmployeeStatus.ACTIVE,
                    roles: {
                        create: { roleId: role.roleId }
                    }
                }
            });
            console.log(`   ✓ ${u.username} (${u.role})`);
        } catch (error) {
            console.error(`   ❌ Failed to seed user ${u.username}:`, error);
        }
    }
}

// ============================================================================
// 3. SEED SUPPLIERS
// ============================================================================
async function seedSuppliers(): Promise<void> {
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

async function seedAgents(): Promise<void> {
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

// ============================================================================
// 4. SEED COMPONENTS
// ============================================================================
async function seedComponents(): Promise<void> {
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

// ============================================================================
// 5. SEED WAREHOUSES
// ============================================================================
async function seedWarehouses(): Promise<void> {
    console.log('...Seeding Warehouses');
    const warehouses = [
        { code: 'WH-MAIN', name: 'Main Warehouse (Materials)', location: 'Zone A', type: 'COMPONENT' },
        { code: 'WH-PROD', name: 'Production Floor', location: 'Zone B', type: 'COMPONENT' },
        { code: 'WH-FG', name: 'Finished Goods', location: 'Zone C', type: 'PRODUCT' },
        { code: 'WH-DEFECT', name: 'Defect Warehouse', location: 'Zone D', type: 'DEFECT' }
    ];

    for (const w of warehouses) {
        await prisma.warehouse.upsert({
            where: { code: w.code },
            update: {},
            create: {
                code: w.code,
                warehouseName: w.name,
                location: w.location,
            }
        });
    }
}

// ============================================================================
// 6. SEED PRODUCTS & BILL OF MATERIALS (BOM)
// ============================================================================
async function seedProducts(): Promise<void> {
    console.log('...Seeding Products & BOM');

    // 1. Create Product
    const product = await prisma.product.upsert({
        where: { code: 'PROD-LAPTOP-X1' },
        update: {},
        create: {
            code: 'PROD-LAPTOP-X1',
            productName: 'Laptop X1 Pro',
            unit: 'pcs'
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

// ============================================================================
// 7. SEED PRODUCTION LINES
// ============================================================================
async function seedProductionLines(): Promise<void> {
    console.log('...Seeding Production Lines');
    const lines = [
        { name: 'Line 1 (Assembly)', location: 'Zone B' },
        { name: 'Line 2 (Testing)', location: 'Zone C' }
    ];

    for (const l of lines) {
        const existing = await prisma.productionLine.findFirst({ where: { lineName: l.name } });
        if (!existing) {
            await prisma.productionLine.create({
                data: {
                    lineName: l.name,
                    location: l.location
                }
            });
        }
    }
}

// ============================================================================
// 8. SEED RELATIONS (Supplier <-> Component)
// ============================================================================
async function seedSupplierComponents(): Promise<void> {
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

// ============================================================================
// 10. SEED PRODUCTION SCENARIOS (Traffic Light Logic)
// ============================================================================
async function seedProductionScenarios(): Promise<void> {
    console.log('...Seeding Production Scenarios (Traffic Light Logic)');

    // 1. Create Product: Gaming PC
    const product = await prisma.product.upsert({
        where: { code: 'PROD-GAMING-PC' },
        update: {},
        create: {
            code: 'PROD-GAMING-PC',
            productName: 'Gaming PC Ultra',
            unit: 'pcs'
        }
    });

    // 2. Create Components with Specific Stock Levels
    // Scenario: Need 20 PCs.
    // BOM: 1 CPU, 2 RAM, 1 PSU.
    // Total Need: 20 CPU, 40 RAM, 20 PSU.

    const components = [
        // RED: 0 Stock (Shortage)
        { code: 'COM-CPU-ULTRA', name: 'CPU i9 Ultra', unit: 'pcs', cost: 10000000, stock: 0 },
        // YELLOW: 30 Stock (Partial - Need 40)
        { code: 'COM-RAM-32GB', name: 'RAM 32GB DDR5', unit: 'pcs', cost: 2000000, stock: 30 },
        // GREEN: 100 Stock (Sufficient - Need 20)
        { code: 'COM-PSU-850W', name: 'PSU 850W Gold', unit: 'pcs', cost: 3000000, stock: 100 }
    ];

    for (const c of components) {
        await prisma.component.upsert({
            where: { code: c.code },
            update: { minStockLevel: c.stock }, // Reset stock level ensures consistent testing
            create: {
                code: c.code,
                componentName: c.name,
                unit: c.unit,
                standardCost: c.cost,
                minStockLevel: c.stock
            }
        });

        // Ensure Warehouse Stock matches "minStockLevel" for this scenario
        // In a real app, minStockLevel is a threshold, but here we use it as "Current Stock" 
        // because the seed logic below sets it.
        // Let's actually set the Warehouse Stock properly.
        const warehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
        const comp = await prisma.component.findUnique({ where: { code: c.code } });

        if (warehouse && comp) {
            await prisma.componentStock.upsert({
                where: {
                    warehouseId_componentId: {
                        warehouseId: warehouse.warehouseId,
                        componentId: comp.componentId
                    }
                },
                update: { quantity: c.stock },
                create: {
                    warehouseId: warehouse.warehouseId,
                    componentId: comp.componentId,
                    quantity: c.stock
                }
            });
        }
    }

    // 3. Link BOM
    const cpu = await prisma.component.findUnique({ where: { code: 'COM-CPU-ULTRA' } });
    const ram = await prisma.component.findUnique({ where: { code: 'COM-RAM-32GB' } });
    const psu = await prisma.component.findUnique({ where: { code: 'COM-PSU-850W' } });

    // Helper to link BOM
    const linkBom = async (c: any, qty: number) => {
        if (!c) return;
        await prisma.billOfMaterial.upsert({
            where: { productId_componentId: { productId: product.productId, componentId: c.componentId } },
            update: { quantityNeeded: qty },
            create: { productId: product.productId, componentId: c.componentId, quantityNeeded: qty }
        });
    };

    await linkBom(cpu, 1);
    await linkBom(ram, 2); // Need 2 per PC
    await linkBom(psu, 1);

    // 4. Create Sales Order
    const admin = await prisma.employee.findFirst();
    const agent = await prisma.agent.findFirst();

    if (admin && agent) {
        // Create Sales Order for 20 Units
        // This triggers the logic:
        // - CPU: Need 20, Have 0 -> RED
        // - RAM: Need 40, Have 30 -> YELLOW
        // - PSU: Need 20, Have 100 -> GREEN

        const soCode = 'SO-SCENARIO-TRAFFIC-LIGHT';
        const so = await prisma.salesOrder.upsert({
            where: { code: soCode },
            update: {}, // Don't wipe if exists, just ensure it's there
            create: {
                code: soCode,
                status: 'APPROVED', // Ready for Production Request
                orderDate: new Date(),
                employeeId: admin.employeeId,
                agentId: agent.agentId,
                totalAmount: 500000000
            }
        });

        // Add Detail for Gaming PC
        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: so.salesOrderId, productId: product.productId } },
            update: {},
            create: {
                salesOrderId: so.salesOrderId,
                productId: product.productId,
                quantity: 20,
                salePrice: 25000000
            }
        });

        console.log(`   ✓ SCENARIO 3 (RED/YELLOW) Created: Check SO "${soCode}" (Gaming PCs -> Shortage)`);
    }

    // ---------------------------------------------------------
    // SCENARIO 1: GREEN (Ship from Stock - Laptops)
    // ---------------------------------------------------------
    const laptopProduct = await prisma.product.findUnique({ where: { code: 'PROD-LAPTOP-X1' } });
    if (laptopProduct && admin && agent) {
        const greenSoCode = 'SO-SCENARIO-GREEN-STOCK';
        const greenSo = await prisma.salesOrder.upsert({
            where: { code: greenSoCode },
            update: {},
            create: {
                code: greenSoCode,
                status: 'APPROVED',
                orderDate: new Date(),
                employeeId: admin.employeeId,
                agentId: agent.agentId,
                totalAmount: 150000000
            }
        });

        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: greenSo.salesOrderId, productId: laptopProduct.productId } },
            update: {},
            create: {
                salesOrderId: greenSo.salesOrderId,
                productId: laptopProduct.productId,
                quantity: 10, // We seeded 50 instances earlier, so requesting 10 is pure GREEN.
                salePrice: 15000000
            }
        });
        console.log(`   ✓ SCENARIO 1 (GREEN) Created: Check SO "${greenSoCode}" (Laptops -> Ready to ship)`);
    }

    // ---------------------------------------------------------
    // SCENARIO 2: YELLOW (No Finished Goods, but have Raw Materials)
    // ---------------------------------------------------------
    const smartwatch = await prisma.product.upsert({
        where: { code: 'PROD-SMARTWATCH' },
        update: {},
        create: { code: 'PROD-SMARTWATCH', productName: 'Smartwatch V1', unit: 'pcs' }
    });

    const screen = await prisma.component.upsert({
        where: { code: 'COM-SCREEN-OLED' },
        update: {},
        create: { code: 'COM-SCREEN-OLED', componentName: 'OLED Screen 2inch', unit: 'pcs', standardCost: 200000, minStockLevel: 100 }
    });
    const battery = await prisma.component.upsert({
        where: { code: 'COM-BATTERY-500' },
        update: {},
        create: { code: 'COM-BATTERY-500', componentName: 'Battery 500mAh', unit: 'pcs', standardCost: 50000, minStockLevel: 100 }
    });

    // Put components in warehouse
    const mainWh = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    if (mainWh) {
        await prisma.componentStock.upsert({
            where: { warehouseId_componentId: { warehouseId: mainWh.warehouseId, componentId: screen.componentId } },
            update: { quantity: 100 }, create: { warehouseId: mainWh.warehouseId, componentId: screen.componentId, quantity: 100 }
        });
        await prisma.componentStock.upsert({
            where: { warehouseId_componentId: { warehouseId: mainWh.warehouseId, componentId: battery.componentId } },
            update: { quantity: 100 }, create: { warehouseId: mainWh.warehouseId, componentId: battery.componentId, quantity: 100 }
        });
    }

    // Link BOM for Smartwatch
    await prisma.billOfMaterial.upsert({
        where: { productId_componentId: { productId: smartwatch.productId, componentId: screen.componentId } },
        update: { quantityNeeded: 1 }, create: { productId: smartwatch.productId, componentId: screen.componentId, quantityNeeded: 1 }
    });
    await prisma.billOfMaterial.upsert({
        where: { productId_componentId: { productId: smartwatch.productId, componentId: battery.componentId } },
        update: { quantityNeeded: 1 }, create: { productId: smartwatch.productId, componentId: battery.componentId, quantityNeeded: 1 }
    });

    // Create SO for Smartwatch
    if (admin && agent) {
        const yellowSoCode = 'SO-SCENARIO-YELLOW-PROD';
        const yellowSo = await prisma.salesOrder.upsert({
            where: { code: yellowSoCode },
            update: {},
            create: { code: yellowSoCode, status: 'APPROVED', orderDate: new Date(), employeeId: admin.employeeId, agentId: agent.agentId, totalAmount: 100000000 }
        });

        await prisma.salesOrderDetail.upsert({
            where: { salesOrderId_productId: { salesOrderId: yellowSo.salesOrderId, productId: smartwatch.productId } },
            update: {},
            create: { salesOrderId: yellowSo.salesOrderId, productId: smartwatch.productId, quantity: 20, salePrice: 5000000 } // Need 20. Have 0 FG, but have 100 raw materials -> YELLOW
        });
        console.log(`   ✓ SCENARIO 2 (YELLOW) Created: Check SO "${yellowSoCode}" (Smartwatches -> Can Produce instantly)`);
    }
}

// Execution
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
