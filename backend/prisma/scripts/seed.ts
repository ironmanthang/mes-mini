import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../src/common/lib/prisma.js';
import { EmployeeStatus } from '../../src/generated/prisma/index.js';

// ============================================================================
// 🎛️ CENTRAL CONTROL PANEL
// Toggle these to TRUE/FALSE to control what gets seeded
// ============================================================================
const SEED_CONFIG = {
    MINIMAL: false,  // true = Only Roles + Employees (for Swagger testing)
    ROLES: true,
    EMPLOYEES: true,
    SUPPLIERS: true,
    COMPONENTS: true,
    RELATIONS: true,
};

const DEFAULT_PASSWORD = '123456';

async function main(): Promise<void> {
    console.log('Starting Seeding Process...');

    if (SEED_CONFIG.ROLES) await seedRoles();
    if (SEED_CONFIG.EMPLOYEES) await seedEmployees();
    if (!SEED_CONFIG.MINIMAL) {
        if (SEED_CONFIG.SUPPLIERS) await seedSuppliers();
        if (SEED_CONFIG.COMPONENTS) await seedComponents();
        if (SEED_CONFIG.RELATIONS) await seedSupplierComponents();
    }

    console.log('Seeding Completed.');
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
        'QC Inspector'
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
// 5. SEED RELATIONS (Supplier <-> Component)
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

// Execution
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
