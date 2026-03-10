import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../src/common/lib/prisma.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority } from '../../src/generated/prisma/index.js';

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
    INSTANCES: true,
    SCENARIOS: true,
    // --- DEMO ENRICHMENT ---
    AGENTS: true,
    PURCHASE_ORDERS: true,
    SALES_ORDERS: true,
    PRODUCTION_REQUESTS: true,
};

const DEFAULT_PASSWORD = '123456';

async function main(): Promise<void> {
    console.log('Starting Seeding Process...');

    // FORCE RUN RELATIONS because they seem missing
    await seedSupplierComponents();

    if (SEED_CONFIG.ROLES) await seedRoles();
    if (SEED_CONFIG.EMPLOYEES) await seedEmployees();

    // Master Data
    if (SEED_CONFIG.SUPPLIERS) await seedSuppliers();
    if (SEED_CONFIG.COMPONENTS) await seedComponents();
    if (SEED_CONFIG.WAREHOUSES) await seedWarehouses();
    if (SEED_CONFIG.PRODUCTS) await seedProducts();
    if (SEED_CONFIG.LINES) await seedProductionLines();
    if (SEED_CONFIG.RELATIONS) await seedSupplierComponents();
    if (SEED_CONFIG.INSTANCES) await seedProductInstances();
    await seedAgents();
    if (SEED_CONFIG.SCENARIOS) await seedProductionScenarios();

    // --- DEMO ENRICHMENT (depends on all master data above) ---
    if (SEED_CONFIG.AGENTS) await seedDemoAgents();
    if (SEED_CONFIG.SUPPLIERS) await seedDemoSuppliers();
    if (SEED_CONFIG.COMPONENTS) await seedDemoComponents();
    if (SEED_CONFIG.PRODUCTS) await seedDemoProducts();
    if (SEED_CONFIG.RELATIONS) await seedDemoSupplierComponents();
    if (SEED_CONFIG.COMPONENTS) await seedDemoComponentStock();
    if (SEED_CONFIG.INSTANCES) await seedDemoProductInstances();
    if (SEED_CONFIG.PURCHASE_ORDERS) await seedDemoPurchaseOrders();
    if (SEED_CONFIG.SALES_ORDERS) await seedDemoSalesOrders();
    if (SEED_CONFIG.PRODUCTION_REQUESTS) await seedDemoProductionRequests();

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

// ============================================================================
// 11. DEMO ENRICHMENT: AGENTS
// ============================================================================
async function seedDemoAgents(): Promise<void> {
    console.log('...Seeding Demo Agents');
    const agents = [
        { code: 'AGT-002', name: 'Beta Electronics', email: 'beta@electronics.vn', phone: '0912345679', address: 'Ho Chi Minh City, VN' },
        { code: 'AGT-003', name: 'Gamma Distribution', email: 'gamma@dist.vn', phone: '0912345680', address: 'Da Nang, VN' },
        { code: 'AGT-004', name: 'Delta Tech Solutions', email: 'delta@tech.vn', phone: '0912345681', address: 'Hai Phong, VN' },
        { code: 'AGT-005', name: 'Epsilon Trading Co.', email: 'epsilon@trading.vn', phone: '0912345682', address: 'Can Tho, VN' },
        { code: 'AGT-006', name: 'Zeta Systems JSC', email: 'zeta@systems.vn', phone: '0912345683', address: 'Binh Duong, VN' },
    ];
    for (const a of agents) {
        await prisma.agent.upsert({
            where: { code: a.code },
            update: {},
            create: { code: a.code, agentName: a.name, email: a.email, phoneNumber: a.phone, address: a.address }
        });
    }
    console.log(`   ✓ ${agents.length} demo agents created`);
}

// ============================================================================
// 12. DEMO ENRICHMENT: SUPPLIERS
// ============================================================================
async function seedDemoSuppliers(): Promise<void> {
    console.log('...Seeding Demo Suppliers');
    const suppliers = [
        { code: 'SUP-INTEL', name: 'Intel Vietnam', email: 'b2b@intel.vn', phone: '0904444444', address: 'SHTP, Ho Chi Minh City' },
        { code: 'SUP-FOXCONN', name: 'Foxconn Assembly', email: 'orders@foxconn.vn', phone: '0905555555', address: 'Bac Ninh Industrial Zone' },
        { code: 'SUP-KINGSTON', name: 'Kingston Memory', email: 'sales@kingston.vn', phone: '0906666666', address: 'Binh Duong, VN' },
        { code: 'SUP-CORSAIR', name: 'Corsair Components', email: 'parts@corsair.vn', phone: '0907777777', address: 'Long An, VN' },
    ];
    for (const s of suppliers) {
        await prisma.supplier.upsert({
            where: { code: s.code },
            update: {},
            create: { code: s.code, supplierName: s.name, email: s.email, phoneNumber: s.phone, address: s.address }
        });
    }
    console.log(`   ✓ ${suppliers.length} demo suppliers created`);
}

// ============================================================================
// 13. DEMO ENRICHMENT: COMPONENTS
// ============================================================================
async function seedDemoComponents(): Promise<void> {
    console.log('...Seeding Demo Components');
    const components = [
        { code: 'COM-DISPLAY-15', name: 'Display Panel 15.6"', unit: 'pcs', cost: 3500000, stock: 50 },
        { code: 'COM-SSD-512', name: 'SSD 512GB NVMe', unit: 'pcs', cost: 1800000, stock: 80 },
        { code: 'COM-WIFI-AX', name: 'WiFi AX Module', unit: 'pcs', cost: 250000, stock: 200 },
        { code: 'COM-CASE-ALLOY', name: 'Aluminum Case Body', unit: 'pcs', cost: 800000, stock: 100 },
        { code: 'COM-KB-MECH', name: 'Mechanical Keyboard Unit', unit: 'pcs', cost: 650000, stock: 60 },
        { code: 'COM-FAN-120', name: 'Cooling Fan 120mm', unit: 'pcs', cost: 150000, stock: 150 },
    ];
    for (const c of components) {
        await prisma.component.upsert({
            where: { code: c.code },
            update: {},
            create: { code: c.code, componentName: c.name, unit: c.unit, standardCost: c.cost, minStockLevel: c.stock }
        });
    }
    console.log(`   ✓ ${components.length} demo components created`);
}

// ============================================================================
// 14. DEMO ENRICHMENT: PRODUCTS + BOM
// ============================================================================
async function seedDemoProducts(): Promise<void> {
    console.log('...Seeding Demo Products + BOM');

    // --- Tablet A1 ---
    const tablet = await prisma.product.upsert({
        where: { code: 'PROD-TABLET-A1' },
        update: {},
        create: { code: 'PROD-TABLET-A1', productName: 'Tablet A1', unit: 'pcs' }
    });
    const screenOled = await prisma.component.findUnique({ where: { code: 'COM-SCREEN-OLED' } });
    const battery500 = await prisma.component.findUnique({ where: { code: 'COM-BATTERY-500' } });
    const wifiAx = await prisma.component.findUnique({ where: { code: 'COM-WIFI-AX' } });
    if (screenOled) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: screenOled.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: screenOled.componentId, quantityNeeded: 1 } });
    if (battery500) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: battery500.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: battery500.componentId, quantityNeeded: 1 } });
    if (wifiAx) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: tablet.productId, componentId: wifiAx.componentId } }, update: { quantityNeeded: 1 }, create: { productId: tablet.productId, componentId: wifiAx.componentId, quantityNeeded: 1 } });

    // --- Desktop Z5 ---
    const desktop = await prisma.product.upsert({
        where: { code: 'PROD-DESKTOP-Z5' },
        update: {},
        create: { code: 'PROD-DESKTOP-Z5', productName: 'Desktop Z5 Workstation', unit: 'pcs' }
    });
    const cpuUltra = await prisma.component.findUnique({ where: { code: 'COM-CPU-ULTRA' } });
    const ram32 = await prisma.component.findUnique({ where: { code: 'COM-RAM-32GB' } });
    const ssd512 = await prisma.component.findUnique({ where: { code: 'COM-SSD-512' } });
    const psu850 = await prisma.component.findUnique({ where: { code: 'COM-PSU-850W' } });
    if (cpuUltra) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: cpuUltra.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: cpuUltra.componentId, quantityNeeded: 1 } });
    if (ram32) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: ram32.componentId } }, update: { quantityNeeded: 2 }, create: { productId: desktop.productId, componentId: ram32.componentId, quantityNeeded: 2 } });
    if (ssd512) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: ssd512.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: ssd512.componentId, quantityNeeded: 1 } });
    if (psu850) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: desktop.productId, componentId: psu850.componentId } }, update: { quantityNeeded: 1 }, create: { productId: desktop.productId, componentId: psu850.componentId, quantityNeeded: 1 } });

    // --- Monitor M1 ---
    const monitor = await prisma.product.upsert({
        where: { code: 'PROD-MONITOR-M1' },
        update: {},
        create: { code: 'PROD-MONITOR-M1', productName: 'Monitor M1 Pro', unit: 'pcs' }
    });
    const display15 = await prisma.component.findUnique({ where: { code: 'COM-DISPLAY-15' } });
    const caseAlloy = await prisma.component.findUnique({ where: { code: 'COM-CASE-ALLOY' } });
    if (display15) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: monitor.productId, componentId: display15.componentId } }, update: { quantityNeeded: 1 }, create: { productId: monitor.productId, componentId: display15.componentId, quantityNeeded: 1 } });
    if (caseAlloy) await prisma.billOfMaterial.upsert({ where: { productId_componentId: { productId: monitor.productId, componentId: caseAlloy.componentId } }, update: { quantityNeeded: 1 }, create: { productId: monitor.productId, componentId: caseAlloy.componentId, quantityNeeded: 1 } });

    console.log('   ✓ 3 demo products + BOM created');
}

// ============================================================================
// 15. DEMO ENRICHMENT: SUPPLIER-COMPONENT LINKS
// ============================================================================
async function seedDemoSupplierComponents(): Promise<void> {
    console.log('...Seeding Demo Supplier-Component Links');

    const links: { supplierCode: string; componentCode: string }[] = [
        { supplierCode: 'SUP-INTEL', componentCode: 'COM-CPU-ULTRA' },
        { supplierCode: 'SUP-INTEL', componentCode: 'COM-CHIP-X1' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-SCREW-M5' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-SCREEN-OLED' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-DISPLAY-15' },
        { supplierCode: 'SUP-FOXCONN', componentCode: 'COM-CASE-ALLOY' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-RAM-32GB' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-BATTERY-500' },
        { supplierCode: 'SUP-KINGSTON', componentCode: 'COM-SSD-512' },
        { supplierCode: 'SUP-CORSAIR', componentCode: 'COM-PSU-850W' },
        { supplierCode: 'SUP-CORSAIR', componentCode: 'COM-FAN-120' },
    ];

    for (const link of links) {
        const supplier = await prisma.supplier.findUnique({ where: { code: link.supplierCode } });
        const component = await prisma.component.findUnique({ where: { code: link.componentCode } });
        if (supplier && component) {
            await prisma.supplierComponent.upsert({
                where: { supplierId_componentId: { supplierId: supplier.supplierId, componentId: component.componentId } },
                update: {},
                create: { supplierId: supplier.supplierId, componentId: component.componentId }
            });
        }
    }
    console.log(`   ✓ ${links.length} supplier-component links created`);
}

// ============================================================================
// 16. DEMO ENRICHMENT: COMPONENT STOCK
// ============================================================================
async function seedDemoComponentStock(): Promise<void> {
    console.log('...Seeding Demo Component Stock');
    const warehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    if (!warehouse) return;

    const stockEntries: { componentCode: string; qty: number }[] = [
        { componentCode: 'COM-DISPLAY-15', qty: 50 },
        { componentCode: 'COM-SSD-512', qty: 80 },
        { componentCode: 'COM-WIFI-AX', qty: 200 },
        { componentCode: 'COM-CASE-ALLOY', qty: 100 },
        { componentCode: 'COM-KB-MECH', qty: 60 },
        { componentCode: 'COM-FAN-120', qty: 150 },
        // Also ensure existing gaming PC components have consistent stock
        { componentCode: 'COM-CHIP-X1', qty: 300 },
        { componentCode: 'COM-SCREW-M5', qty: 5000 },
    ];

    for (const entry of stockEntries) {
        const comp = await prisma.component.findUnique({ where: { code: entry.componentCode } });
        if (comp) {
            await prisma.componentStock.upsert({
                where: { warehouseId_componentId: { warehouseId: warehouse.warehouseId, componentId: comp.componentId } },
                update: { quantity: entry.qty },
                create: { warehouseId: warehouse.warehouseId, componentId: comp.componentId, quantity: entry.qty }
            });
        }
    }
    console.log('   ✓ Demo component stock seeded');
}

// ============================================================================
// 17. DEMO ENRICHMENT: PRODUCT INSTANCES (for SO shipping & stock display)
// ============================================================================
async function seedDemoProductInstances(): Promise<void> {
    console.log('...Seeding Demo Product Instances');

    const admin = await prisma.employee.findFirst();
    if (!admin) return;

    // Helper: create instances for a product via a dummy work order + batch
    async function createInstances(productCode: string, count: number, prefix: string) {
        const product = await prisma.product.findUnique({ where: { code: productCode } });
        if (!product) return;

        const woCode = `WO-DEMO-${prefix}`;
        const wo = await prisma.workOrder.upsert({
            where: { code: woCode },
            update: {},
            create: { code: woCode, quantity: count, employeeId: admin!.employeeId, productId: product.productId, status: 'COMPLETED' }
        });

        const batchCode = `BATCH-DEMO-${prefix}`;
        let batch = await prisma.productionBatch.findFirst({ where: { batchCode } });
        if (!batch) {
            batch = await prisma.productionBatch.create({
                data: { batchCode, productionDate: new Date(), workOrderId: wo.workOrderId }
            });
        }

        const instances = [];
        for (let i = 1; i <= count; i++) {
            instances.push({
                productId: product.productId,
                serialNumber: `SN-DEMO-${prefix}-${i.toString().padStart(4, '0')}`,
                status: 'IN_STOCK' as const,
                unitProductionCost: 1200000,
                productionBatchId: batch.productionBatchId,
            });
        }
        await prisma.productInstance.createMany({ data: instances, skipDuplicates: true });
    }

    await createInstances('PROD-GAMING-PC', 10, 'GPC');
    await createInstances('PROD-SMARTWATCH', 30, 'SW');
    await createInstances('PROD-TABLET-A1', 25, 'TAB');
    await createInstances('PROD-DESKTOP-Z5', 15, 'DSK');
    await createInstances('PROD-MONITOR-M1', 20, 'MON');

    console.log('   ✓ Demo product instances created');
}

// ============================================================================
// 18. DEMO ENRICHMENT: PURCHASE ORDERS (12 POs with varied statuses)
// ============================================================================
async function seedDemoPurchaseOrders(): Promise<void> {
    console.log('...Seeding Demo Purchase Orders');

    const purchaser = await prisma.employee.findFirst({ where: { username: 'purchaser' } });
    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!purchaser || !manager) { console.warn('   ⚠️ Missing purchaser or manager employee'); return; }

    // Helper to find IDs by code
    const sup = async (code: string) => (await prisma.supplier.findUnique({ where: { code } }))!;
    const comp = async (code: string) => (await prisma.component.findUnique({ where: { code } }))!;

    interface POSeed {
        code: string; supplierCode: string; status: PurchaseOrderStatus; priority: Priority;
        approved: boolean; items: { componentCode: string; qty: number; price: number; received: number }[];
    }

    const poSeeds: POSeed[] = [
        { code: 'PO-2026-901', supplierCode: 'SUP-HP', status: PurchaseOrderStatus.COMPLETED, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-STEEL-5MM', qty: 100, price: 45000, received: 100 }, { componentCode: 'COM-STEEL-10MM', qty: 50, price: 85000, received: 50 }] },
        { code: 'PO-2026-902', supplierCode: 'SUP-SS', status: PurchaseOrderStatus.COMPLETED, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-CHIP-X1', qty: 200, price: 120000, received: 200 }] },
        { code: 'PO-2026-903', supplierCode: 'SUP-INTEL', status: PurchaseOrderStatus.SENT_TO_SUPPLIER, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-CPU-ULTRA', qty: 50, price: 10000000, received: 0 }] },
        { code: 'PO-2026-904', supplierCode: 'SUP-KINGSTON', status: PurchaseOrderStatus.PARTIALLY_RECEIVED, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-RAM-32GB', qty: 100, price: 2000000, received: 40 }] },
        { code: 'PO-2026-905', supplierCode: 'SUP-CORSAIR', status: PurchaseOrderStatus.PENDING_APPROVAL, priority: Priority.LOW, approved: false,
            items: [{ componentCode: 'COM-PSU-850W', qty: 30, price: 3000000, received: 0 }] },
        { code: 'PO-2026-906', supplierCode: 'SUP-FOXCONN', status: PurchaseOrderStatus.DRAFT, priority: Priority.MEDIUM, approved: false,
            items: [{ componentCode: 'COM-SCREW-M5', qty: 5000, price: 500, received: 0 }] },
        { code: 'PO-2026-907', supplierCode: 'SUP-INTEL', status: PurchaseOrderStatus.CANCELLED, priority: Priority.LOW, approved: false,
            items: [{ componentCode: 'COM-CPU-ULTRA', qty: 10, price: 10000000, received: 0 }] },
        { code: 'PO-2026-908', supplierCode: 'SUP-KINGSTON', status: PurchaseOrderStatus.SENT_TO_SUPPLIER, priority: Priority.HIGH, approved: true,
            items: [{ componentCode: 'COM-RAM-32GB', qty: 200, price: 2000000, received: 0 }, { componentCode: 'COM-BATTERY-500', qty: 100, price: 50000, received: 0 }] },
        { code: 'PO-2026-909', supplierCode: 'SUP-HP', status: PurchaseOrderStatus.DRAFT, priority: Priority.MEDIUM, approved: false,
            items: [{ componentCode: 'COM-STEEL-5MM', qty: 200, price: 45000, received: 0 }] },
        { code: 'PO-2026-910', supplierCode: 'SUP-FOXCONN', status: PurchaseOrderStatus.PENDING_APPROVAL, priority: Priority.HIGH, approved: false,
            items: [{ componentCode: 'COM-SCREEN-OLED', qty: 300, price: 200000, received: 0 }] },
        { code: 'PO-2026-911', supplierCode: 'SUP-CORSAIR', status: PurchaseOrderStatus.COMPLETED, priority: Priority.MEDIUM, approved: true,
            items: [{ componentCode: 'COM-PSU-850W', qty: 50, price: 3000000, received: 50 }] },
        { code: 'PO-2026-912', supplierCode: 'SUP-SS', status: PurchaseOrderStatus.SENT_TO_SUPPLIER, priority: Priority.LOW, approved: true,
            items: [{ componentCode: 'COM-CHIP-X1', qty: 500, price: 120000, received: 0 }] },
    ];

    for (const po of poSeeds) {
        const supplier = await sup(po.supplierCode);
        if (!supplier) continue;

        // Calculate total
        let subtotal = 0;
        const detailsData = [];
        for (const item of po.items) {
            const component = await comp(item.componentCode);
            if (!component) continue;
            subtotal += item.qty * item.price;
            detailsData.push({
                componentId: component.componentId,
                quantityOrdered: item.qty,
                unitPrice: item.price,
                quantityReceived: item.received,
            });
        }

        await prisma.purchaseOrder.upsert({
            where: { code: po.code },
            update: {},
            create: {
                code: po.code,
                supplierId: supplier.supplierId,
                employeeId: purchaser.employeeId,
                status: po.status,
                priority: po.priority,
                orderDate: new Date(2026, 2, Math.floor(Math.random() * 10) + 1), // March 1-10
                expectedDeliveryDate: new Date(2026, 2, 20),
                totalAmount: subtotal,
                discount: 0, shippingCost: 0, tax: 0,
                approverId: po.approved ? manager.employeeId : null,
                approvedAt: po.approved ? new Date() : null,
                details: { create: detailsData },
            }
        });
    }
    console.log(`   ✓ ${poSeeds.length} demo purchase orders created`);
}

// ============================================================================
// 19. DEMO ENRICHMENT: SALES ORDERS (9 new SOs with varied statuses)
// ============================================================================
async function seedDemoSalesOrders(): Promise<void> {
    console.log('...Seeding Demo Sales Orders');

    const sales = await prisma.employee.findFirst({ where: { username: 'sales' } });
    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!sales || !manager) { console.warn('   ⚠️ Missing sales or manager employee'); return; }

    const agt = async (code: string) => (await prisma.agent.findUnique({ where: { code } }))!;
    const prod = async (code: string) => (await prisma.product.findUnique({ where: { code } }))!;

    interface SOSeed {
        code: string; agentCode: string; status: SalesOrderStatus; priority: Priority;
        approved: boolean; note?: string;
        items: { productCode: string; qty: number; price: number; shipped: number }[];
    }

    const soSeeds: SOSeed[] = [
        { code: 'SO-2026-901', agentCode: 'AGT-002', status: SalesOrderStatus.DRAFT, priority: Priority.MEDIUM, approved: false,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 5, price: 15000000, shipped: 0 }] },
        { code: 'SO-2026-902', agentCode: 'AGT-003', status: SalesOrderStatus.PENDING_APPROVAL, priority: Priority.HIGH, approved: false,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 10, price: 14500000, shipped: 0 }] },
        { code: 'SO-2026-903', agentCode: 'AGT-004', status: SalesOrderStatus.APPROVED, priority: Priority.HIGH, approved: true,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 3, price: 15000000, shipped: 0 }] },
        { code: 'SO-2026-904', agentCode: 'AGT-005', status: SalesOrderStatus.IN_PROGRESS, priority: Priority.MEDIUM, approved: true,
            items: [{ productCode: 'PROD-LAPTOP-X1', qty: 8, price: 14000000, shipped: 3 }] },
        { code: 'SO-2026-905', agentCode: 'AGT-002', status: SalesOrderStatus.COMPLETED, priority: Priority.LOW, approved: true,
            items: [{ productCode: 'PROD-GAMING-PC', qty: 2, price: 25000000, shipped: 2 }] },
        { code: 'SO-2026-906', agentCode: 'AGT-006', status: SalesOrderStatus.CANCELLED, priority: Priority.MEDIUM, approved: false,
            note: '[CANCELLED 2026-03-05 by User 6]: Customer withdrew the order.',
            items: [{ productCode: 'PROD-SMARTWATCH', qty: 15, price: 5000000, shipped: 0 }] },
        { code: 'SO-2026-907', agentCode: 'AGT-003', status: SalesOrderStatus.DRAFT, priority: Priority.LOW, approved: false,
            items: [{ productCode: 'PROD-TABLET-A1', qty: 20, price: 8000000, shipped: 0 }] },
        { code: 'SO-2026-908', agentCode: 'AGT-004', status: SalesOrderStatus.APPROVED, priority: Priority.HIGH, approved: true,
            items: [{ productCode: 'PROD-DESKTOP-Z5', qty: 5, price: 35000000, shipped: 0 }] },
        { code: 'SO-2026-909', agentCode: 'AGT-005', status: SalesOrderStatus.PENDING_APPROVAL, priority: Priority.MEDIUM, approved: false,
            items: [{ productCode: 'PROD-MONITOR-M1', qty: 10, price: 12000000, shipped: 0 }, { productCode: 'PROD-LAPTOP-X1', qty: 2, price: 15000000, shipped: 0 }] },
    ];

    for (const so of soSeeds) {
        const agent = await agt(so.agentCode);
        if (!agent) continue;

        // Calculate total
        let subtotal = 0;
        const detailsData = [];
        for (const item of so.items) {
            const product = await prod(item.productCode);
            if (!product) continue;
            subtotal += item.qty * item.price;
            detailsData.push({
                productId: product.productId,
                quantity: item.qty,
                salePrice: item.price,
                quantityShipped: item.shipped,
            });
        }

        await prisma.salesOrder.upsert({
            where: { code: so.code },
            update: {},
            create: {
                code: so.code,
                agentId: agent.agentId,
                employeeId: sales.employeeId,
                status: so.status,
                priority: so.priority,
                orderDate: new Date(2026, 2, Math.floor(Math.random() * 10) + 1),
                expectedShipDate: new Date(2026, 2, 25),
                totalAmount: subtotal,
                discount: 0, agentShippingPrice: 0, tax: 0,
                approverId: so.approved ? manager.employeeId : null,
                approvedAt: so.approved ? new Date() : null,
                note: so.note || null,
                details: { create: detailsData },
            }
        });
    }
    console.log(`   ✓ ${soSeeds.length} demo sales orders created`);
}

// ============================================================================
// 20. DEMO ENRICHMENT: PRODUCTION REQUESTS (8 PRs with varied statuses)
// ============================================================================
async function seedDemoProductionRequests(): Promise<void> {
    console.log('...Seeding Demo Production Requests');

    const manager = await prisma.employee.findFirst({ where: { username: 'manager' } });
    if (!manager) { console.warn('   ⚠️ Missing manager employee'); return; }

    const prod = async (code: string) => (await prisma.product.findUnique({ where: { code } }))!;

    // Find SO Detail links for MTO requests
    const soTraffic = await prisma.salesOrder.findUnique({ where: { code: 'SO-SCENARIO-TRAFFIC-LIGHT' }, include: { details: true } });
    const soYellow = await prisma.salesOrder.findUnique({ where: { code: 'SO-SCENARIO-YELLOW-PROD' }, include: { details: true } });
    const so908 = await prisma.salesOrder.findUnique({ where: { code: 'SO-2026-908' }, include: { details: true } });

    interface PRSeed {
        code: string; productCode: string; qty: number; status: ProductionRequestStatus;
        priority: Priority; soDetailId: number | null; note?: string;
    }

    const prSeeds: PRSeed[] = [
        { code: 'PR-20260310-0001', productCode: 'PROD-GAMING-PC', qty: 20, status: ProductionRequestStatus.WAITING_MATERIAL, priority: Priority.HIGH,
            soDetailId: soTraffic?.details[0]?.soDetailId || null, note: 'MTO from Traffic Light scenario — CPU shortage' },
        { code: 'PR-20260310-0002', productCode: 'PROD-SMARTWATCH', qty: 20, status: ProductionRequestStatus.APPROVED, priority: Priority.MEDIUM,
            soDetailId: soYellow?.details[0]?.soDetailId || null, note: 'MTO from Yellow scenario — raw materials available' },
        { code: 'PR-20260310-0003', productCode: 'PROD-LAPTOP-X1', qty: 30, status: ProductionRequestStatus.APPROVED, priority: Priority.LOW,
            soDetailId: null, note: 'Manual Request (MTS) — buffer stock for Q2' },
        { code: 'PR-20260310-0004', productCode: 'PROD-TABLET-A1', qty: 15, status: ProductionRequestStatus.WAITING_MATERIAL, priority: Priority.MEDIUM,
            soDetailId: null, note: 'Manual Request (MTS) — WiFi modules needed' },
        { code: 'PR-20260310-0005', productCode: 'PROD-DESKTOP-Z5', qty: 5, status: ProductionRequestStatus.APPROVED, priority: Priority.HIGH,
            soDetailId: so908?.details[0]?.soDetailId || null, note: 'MTO from SO-2026-908' },
        { code: 'PR-20260310-0006', productCode: 'PROD-GAMING-PC', qty: 10, status: ProductionRequestStatus.CANCELLED, priority: Priority.LOW,
            soDetailId: null, note: 'Manual Request (MTS); Cancelled: Forecast revised down' },
        { code: 'PR-20260310-0007', productCode: 'PROD-MONITOR-M1', qty: 25, status: ProductionRequestStatus.PARTIALLY_FULFILLED, priority: Priority.MEDIUM,
            soDetailId: null, note: 'Manual Request (MTS) — partial WO created' },
        { code: 'PR-20260310-0008', productCode: 'PROD-LAPTOP-X1', qty: 50, status: ProductionRequestStatus.FULFILLED, priority: Priority.HIGH,
            soDetailId: null, note: 'Manual Request (MTS) — fully converted to WO' },
    ];

    for (const pr of prSeeds) {
        const product = await prod(pr.productCode);
        if (!product) continue;

        await prisma.productionRequest.upsert({
            where: { code: pr.code },
            update: {},
            create: {
                code: pr.code,
                productId: product.productId,
                quantity: pr.qty,
                status: pr.status,
                priority: pr.priority,
                employeeId: manager.employeeId,
                requestDate: new Date(2026, 2, 10),
                soDetailId: pr.soDetailId,
                note: pr.note,
            }
        });
    }

    // --- Create minimal Work Orders + Fulfillments for PARTIALLY_FULFILLED & FULFILLED PRs ---
    console.log('   ...Creating Work Orders for fulfilled PRs');

    const prPartial = await prisma.productionRequest.findUnique({ where: { code: 'PR-20260310-0007' } });
    const prFull = await prisma.productionRequest.findUnique({ where: { code: 'PR-20260310-0008' } });
    const monitor = await prod('PROD-MONITOR-M1');
    const laptop = await prod('PROD-LAPTOP-X1');
    const line = await prisma.productionLine.findFirst();

    if (prPartial && monitor && line) {
        const wo = await prisma.workOrder.upsert({
            where: { code: 'WO-DEMO-PR007' },
            update: {},
            create: {
                code: 'WO-DEMO-PR007', quantity: 10, employeeId: manager.employeeId,
                productId: monitor.productId, productionLineId: line.productionLineId,
                status: 'IN_PROGRESS',
            }
        });
        await prisma.workOrderFulfillment.upsert({
            where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: prPartial.productionRequestId } },
            update: {},
            create: { workOrderId: wo.workOrderId, productionRequestId: prPartial.productionRequestId, quantity: 10 }
        });
    }

    if (prFull && laptop && line) {
        const wo = await prisma.workOrder.upsert({
            where: { code: 'WO-DEMO-PR008' },
            update: {},
            create: {
                code: 'WO-DEMO-PR008', quantity: 50, employeeId: manager.employeeId,
                productId: laptop.productId, productionLineId: line.productionLineId,
                status: 'COMPLETED',
            }
        });
        await prisma.workOrderFulfillment.upsert({
            where: { workOrderId_productionRequestId: { workOrderId: wo.workOrderId, productionRequestId: prFull.productionRequestId } },
            update: {},
            create: { workOrderId: wo.workOrderId, productionRequestId: prFull.productionRequestId, quantity: 50 }
        });
    }

    console.log(`   ✓ ${prSeeds.length} demo production requests created`);
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
