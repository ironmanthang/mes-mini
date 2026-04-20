import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../src/common/lib/prisma.js';
import { PERM, type PermCode } from '../../src/common/constants/permissions.js';
import { EmployeeStatus, WarehouseType } from '../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = process.env.PROD_SEED_DEFAULT_PASSWORD || '123456';

const ROLES = [
    { code: 'SYS_ADMIN', name: 'System Admin' },
    { code: 'PROD_MGR', name: 'Production Manager' },
    { code: 'WH_STAFF', name: 'Warehouse Staff' },
    { code: 'LINE_LEADER', name: 'Line Leader' },
    { code: 'PROD_WORKER', name: 'Production Worker' },
    { code: 'SALES_STAFF', name: 'Sales Staff' },
    { code: 'PURCH_STAFF', name: 'Purchasing Staff' },
    { code: 'QC_INSPECTOR', name: 'QC Inspector' },
] as const;

const EMPLOYEES = [
    { name: 'Super Admin', username: 'admin', email: 'admin@mes.com', roleCode: 'SYS_ADMIN', phone: '0900000000' },
    { name: 'Mr. Production Manager', username: 'manager', email: 'manager@mes.com', roleCode: 'PROD_MGR', phone: '0900000001' },
    { name: 'Ms. Warehouse Staff', username: 'warehouse', email: 'warehouse@mes.com', roleCode: 'WH_STAFF', phone: '0900000002' },
    { name: 'Ms. Line Leader', username: 'lineleader', email: 'lineleader@mes.com', roleCode: 'LINE_LEADER', phone: '0900000003' },
    { name: 'Mr. Production Worker', username: 'worker', email: 'worker@mes.com', roleCode: 'PROD_WORKER', phone: '0900000004' },
    { name: 'Ms. Sales Staff', username: 'sales', email: 'sales@mes.com', roleCode: 'SALES_STAFF', phone: '0900000005' },
    { name: 'Mr. Purchasing Staff', username: 'purchaser', email: 'purchase@mes.com', roleCode: 'PURCH_STAFF', phone: '0900000006' },
    { name: 'Ms. QC Inspector', username: 'qc', email: 'qc@mes.com', roleCode: 'QC_INSPECTOR', phone: '0900000007' },
] as const;

const SUPPLIERS = [
    { code: 'SUP-HP', name: 'Hoa Phat Steel', email: 'sales@hoaphat.com', phone: '0901111111', address: 'Industrial Zone A' },
    { code: 'SUP-SS', name: 'Samsung Electronics', email: 'b2b@samsung.com', phone: '0902222222', address: 'Industrial Zone B' },
    { code: 'SUP-LG', name: 'Logistics Global', email: 'contact@lg.com', phone: '0903333333', address: 'Industrial Zone C' },
] as const;

const AGENTS = [
    { code: 'AGT-001', name: 'Authorized Dealer Alpha', email: 'alpha@dealer.com', phone: '0912345678', address: 'Hanoi, VN' },
] as const;

const COMPONENTS = [
    { code: 'COM-STEEL-5MM', name: 'Steel Sheet 5mm', unit: 'kg', cost: 45000, minStock: 100 },
    { code: 'COM-STEEL-10MM', name: 'Steel Sheet 10mm', unit: 'kg', cost: 85000, minStock: 50 },
    { code: 'COM-CHIP-X1', name: 'Control Chip X1', unit: 'pcs', cost: 120000, minStock: 500 },
    { code: 'COM-SCREW-M5', name: 'Screw M5', unit: 'pcs', cost: 500, minStock: 10000 },
    { code: 'COM-SCREEN-OLED', name: 'OLED Screen 2inch', unit: 'pcs', cost: 200000, minStock: 100 },
    { code: 'COM-BATTERY-500', name: 'Battery 500mAh', unit: 'pcs', cost: 50000, minStock: 100 },
    { code: 'COM-WIFI-AX', name: 'WiFi AX Module', unit: 'pcs', cost: 250000, minStock: 200 },
] as const;

const WAREHOUSES = [
    { code: 'WH-MAIN', name: 'Main Warehouse (Materials)', location: 'Zone A', type: WarehouseType.COMPONENT },
    { code: 'WH-PROD', name: 'Production Floor', location: 'Zone B', type: WarehouseType.COMPONENT },
    { code: 'WH-FG', name: 'Sales Warehouse', location: 'Zone C', type: WarehouseType.SALES },
    { code: 'WH-DEFECT', name: 'Error Warehouse', location: 'Zone D', type: WarehouseType.ERROR },
] as const;

const PRODUCT_DEFINITIONS = [
    {
        code: 'PROD-LAPTOP-X1',
        name: 'Laptop X1 Pro',
        unit: 'pcs',
        minStock: 20,
        bom: [
            { componentCode: 'COM-CHIP-X1', quantityNeeded: 1 },
            { componentCode: 'COM-SCREW-M5', quantityNeeded: 10 },
        ],
    },
    {
        code: 'PROD-SMARTWATCH',
        name: 'Smartwatch V1',
        unit: 'pcs',
        minStock: 30,
        bom: [
            { componentCode: 'COM-SCREEN-OLED', quantityNeeded: 1 },
            { componentCode: 'COM-BATTERY-500', quantityNeeded: 1 },
            { componentCode: 'COM-WIFI-AX', quantityNeeded: 1 },
        ],
    },
] as const;

const SUPPLIER_COMPONENT_LINKS = [
    { supplierCode: 'SUP-HP', componentCode: 'COM-STEEL-5MM' },
    { supplierCode: 'SUP-HP', componentCode: 'COM-STEEL-10MM' },
    { supplierCode: 'SUP-SS', componentCode: 'COM-CHIP-X1' },
    { supplierCode: 'SUP-SS', componentCode: 'COM-SCREEN-OLED' },
    { supplierCode: 'SUP-LG', componentCode: 'COM-SCREW-M5' },
    { supplierCode: 'SUP-LG', componentCode: 'COM-BATTERY-500' },
    { supplierCode: 'SUP-LG', componentCode: 'COM-WIFI-AX' },
] as const;

const permissionDescriptions: Partial<Record<PermCode, string>> = {
    EMP_READ: 'View employee list and details',
    EMP_CREATE: 'Create new employees',
    EMP_UPDATE: 'Edit employee details',
    EMP_STATUS: 'Activate/deactivate employees and force logout',
    ROLE_MANAGE: 'Manage roles and permission assignments',
    PO_READ: 'View purchase orders',
    PO_CREATE: 'Create and edit draft purchase orders',
    PO_SUBMIT: 'Submit purchase orders for approval',
    PO_APPROVE: 'Approve pending purchase orders',
    PO_SEND: 'Send approved purchase orders to suppliers',
    PO_RECEIVE: 'Receive goods against purchase orders',
    PO_CANCEL: 'Cancel purchase orders',
    SO_READ: 'View sales orders',
    SO_CREATE: 'Create and edit draft sales orders',
    SO_SUBMIT: 'Submit sales orders for approval',
    SO_APPROVE: 'Approve pending sales orders',
    SO_SHIP: 'Ship sales orders',
    SO_CANCEL: 'Cancel sales orders',
    PR_READ: 'View production requests',
    PR_CREATE: 'Create production requests',
    PR_UPDATE: 'Edit production requests',
    PR_CANCEL: 'Cancel production requests',
    PR_LINK_PO: 'Link production requests to purchase orders',
    PR_APPROVE: 'Approve production requests',
    WO_READ: 'View work orders',
    WO_CREATE: 'Create work orders',
    WO_UPDATE: 'Edit work orders',
    WO_COMPLETE: 'Complete work orders',
    LINE_READ: 'View production lines',
    LINE_CREATE: 'Create production lines',
    LINE_UPDATE: 'Edit production lines',
    LINE_DELETE: 'Delete production lines',
    QC_READ: 'View quality checks',
    QC_CREATE: 'Perform quality checks',
    WH_STOCK_READ: 'View inventory levels',
    WH_STOCK_ADJUST: 'Adjust inventory balances',
    WH_MANAGE: 'Manage warehouses',
    MR_READ: 'View material requests',
    MR_CREATE: 'Create material requests',
    MR_APPROVE: 'Approve material requests',
    ST_READ: 'View stocktakes',
    ST_CREATE: 'Create stocktakes',
    ST_COMPLETE: 'Complete stocktakes',
    ATTACH_UPLOAD: 'Upload attachments',
    ATTACH_DELETE_ANY: 'Delete any attachment',
    NOTIF_READ: 'Read notifications',
    DASH_READ: 'View dashboard metrics',
    PRODUCT_READ: 'View products',
    PRODUCT_CREATE: 'Create products',
    PRODUCT_UPDATE: 'Update products and BOM',
    COMP_READ: 'View components',
    COMP_CREATE: 'Create components',
    COMP_UPDATE: 'Update components',
    SUPPLIER_READ: 'View suppliers',
    SUPPLIER_CREATE: 'Create suppliers',
    SUPPLIER_UPDATE: 'Update suppliers',
    AGENT_READ: 'View agents',
    AGENT_CREATE: 'Create agents',
    AGENT_UPDATE: 'Update agents',
};

async function seedRoles(): Promise<void> {
    for (const role of ROLES) {
        await prisma.role.upsert({
            where: { roleCode: role.code },
            update: { roleName: role.name },
            create: { roleCode: role.code, roleName: role.name },
        });
    }
    console.log(`Roles seeded: ${ROLES.length}`);
}

async function seedPermissions(): Promise<void> {
    const perms = Object.values(PERM) as PermCode[];

    for (const permCode of perms) {
        const module = permCode.split('_')[0];
        await prisma.permission.upsert({
            where: { permCode },
            update: {},
            create: {
                permCode,
                module,
                description: permissionDescriptions[permCode] || permCode,
            },
        });
    }

    console.log(`Permissions seeded: ${perms.length}`);
}

async function seedRolePermissions(): Promise<void> {
    const allPerms = await prisma.permission.findMany({
        select: { permissionId: true, permCode: true },
    });

    const permMap = new Map(allPerms.map((p) => [p.permCode as PermCode, p.permissionId]));
    const ALL_PERMS = Object.values(PERM) as PermCode[];

    const rolePermissions: Record<string, PermCode[]> = {
        SYS_ADMIN: ALL_PERMS,
        PROD_MGR: [
            PERM.PO_READ, PERM.PO_APPROVE, PERM.PO_CANCEL,
            PERM.SO_READ, PERM.SO_APPROVE, PERM.SO_CANCEL,
            PERM.PR_READ, PERM.PR_CREATE, PERM.PR_UPDATE, PERM.PR_APPROVE, PERM.PR_CANCEL, PERM.PR_LINK_PO,
            PERM.WO_READ, PERM.WO_CREATE, PERM.WO_UPDATE, PERM.WO_COMPLETE,
            PERM.LINE_READ, PERM.LINE_CREATE, PERM.LINE_UPDATE, PERM.LINE_DELETE,
            PERM.QC_READ, PERM.WH_STOCK_READ,
            PERM.MR_READ, PERM.MR_APPROVE,
            PERM.ST_READ, PERM.DASH_READ,
            PERM.PRODUCT_READ, PERM.PRODUCT_CREATE, PERM.PRODUCT_UPDATE,
            PERM.COMP_READ, PERM.COMP_CREATE, PERM.COMP_UPDATE,
            PERM.SUPPLIER_READ,
        ],
        WH_STAFF: [
            PERM.WH_STOCK_READ, PERM.WH_STOCK_ADJUST, PERM.WH_MANAGE,
            PERM.MR_READ, PERM.MR_CREATE, PERM.MR_APPROVE,
            PERM.ST_READ, PERM.ST_CREATE, PERM.ST_COMPLETE,
            PERM.PO_RECEIVE, PERM.SO_SHIP,
            PERM.ATTACH_UPLOAD,
            PERM.PRODUCT_READ,
            PERM.COMP_READ, PERM.COMP_CREATE, PERM.COMP_UPDATE,
            PERM.SUPPLIER_READ, PERM.SUPPLIER_CREATE, PERM.SUPPLIER_UPDATE,
        ],
        LINE_LEADER: [
            PERM.WO_READ, PERM.WO_UPDATE,
            PERM.LINE_READ, PERM.QC_READ,
            PERM.MR_READ, PERM.MR_CREATE,
            PERM.PRODUCT_READ, PERM.COMP_READ,
        ],
        PROD_WORKER: [
            PERM.WO_READ, PERM.QC_READ,
            PERM.MR_READ,
            PERM.PRODUCT_READ, PERM.COMP_READ,
        ],
        SALES_STAFF: [
            PERM.SO_READ, PERM.SO_CREATE, PERM.SO_SUBMIT, PERM.SO_APPROVE, PERM.SO_SHIP, PERM.SO_CANCEL,
            PERM.PR_READ, PERM.PR_CREATE,
            PERM.DASH_READ,
            PERM.PRODUCT_READ,
            PERM.AGENT_READ, PERM.AGENT_CREATE, PERM.AGENT_UPDATE,
        ],
        PURCH_STAFF: [
            PERM.PO_READ, PERM.PO_CREATE, PERM.PO_SUBMIT, PERM.PO_APPROVE, PERM.PO_SEND, PERM.PO_RECEIVE, PERM.PO_CANCEL,
            PERM.PR_READ, PERM.PR_LINK_PO,
            PERM.ATTACH_UPLOAD,
            PERM.PRODUCT_READ, PERM.COMP_READ,
            PERM.SUPPLIER_READ, PERM.SUPPLIER_CREATE,
        ],
        QC_INSPECTOR: [
            PERM.QC_READ, PERM.QC_CREATE,
            PERM.WO_READ,
            PERM.PRODUCT_READ, PERM.COMP_READ,
        ],
    };

    for (const perms of Object.values(rolePermissions)) {
        if (!perms.includes(PERM.NOTIF_READ)) {
            perms.push(PERM.NOTIF_READ);
        }
    }

    for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
        const role = await prisma.role.findUnique({ where: { roleCode } });
        if (!role) {
            console.warn(`Role not found, skipping assignments: ${roleCode}`);
            continue;
        }

        await prisma.rolePermission.deleteMany({ where: { roleId: role.roleId } });

        const permissionIds = permCodes
            .map((permCode) => permMap.get(permCode))
            .filter((id): id is number => id !== undefined);

        if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map((permissionId) => ({
                    roleId: role.roleId,
                    permissionId,
                })),
            });
        }
    }

    console.log('Role permissions seeded');
}

async function seedEmployees(): Promise<void> {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const employeeDef of EMPLOYEES) {
        const role = await prisma.role.findUnique({ where: { roleCode: employeeDef.roleCode } });
        if (!role) {
            console.warn(`Role not found for employee ${employeeDef.username}: ${employeeDef.roleCode}`);
            continue;
        }

        const employee = await prisma.employee.upsert({
            where: { username: employeeDef.username },
            update: {
                fullName: employeeDef.name,
                email: employeeDef.email,
                phoneNumber: employeeDef.phone,
                status: EmployeeStatus.ACTIVE,
                terminationDate: null,
            },
            create: {
                fullName: employeeDef.name,
                username: employeeDef.username,
                password: hashedPassword,
                email: employeeDef.email,
                phoneNumber: employeeDef.phone,
                address: 'MES Main Office',
                dateOfBirth: new Date('1990-01-01'),
                hireDate: new Date(),
                status: EmployeeStatus.ACTIVE,
            },
        });

        await prisma.employeeRole.deleteMany({ where: { employeeId: employee.employeeId } });
        await prisma.employeeRole.create({
            data: {
                employeeId: employee.employeeId,
                roleId: role.roleId,
            },
        });
    }

    console.log(`Employees seeded: ${EMPLOYEES.length}`);
}

async function seedSuppliers(): Promise<void> {
    for (const supplier of SUPPLIERS) {
        await prisma.supplier.upsert({
            where: { code: supplier.code },
            update: {
                supplierName: supplier.name,
                email: supplier.email,
                phoneNumber: supplier.phone,
                address: supplier.address,
            },
            create: {
                code: supplier.code,
                supplierName: supplier.name,
                email: supplier.email,
                phoneNumber: supplier.phone,
                address: supplier.address,
            },
        });
    }

    console.log(`Suppliers seeded: ${SUPPLIERS.length}`);
}

async function seedAgents(): Promise<void> {
    for (const agent of AGENTS) {
        await prisma.agent.upsert({
            where: { code: agent.code },
            update: {
                agentName: agent.name,
                email: agent.email,
                phoneNumber: agent.phone,
                address: agent.address,
            },
            create: {
                code: agent.code,
                agentName: agent.name,
                email: agent.email,
                phoneNumber: agent.phone,
                address: agent.address,
            },
        });
    }

    console.log(`Agents seeded: ${AGENTS.length}`);
}

async function seedComponents(): Promise<void> {
    for (const component of COMPONENTS) {
        await prisma.component.upsert({
            where: { code: component.code },
            update: {
                componentName: component.name,
                unit: component.unit,
                standardCost: component.cost,
                minStockLevel: component.minStock,
            },
            create: {
                code: component.code,
                componentName: component.name,
                unit: component.unit,
                standardCost: component.cost,
                minStockLevel: component.minStock,
            },
        });
    }

    console.log(`Components seeded: ${COMPONENTS.length}`);
}

async function seedWarehouses(): Promise<void> {
    for (const warehouse of WAREHOUSES) {
        await prisma.warehouse.upsert({
            where: { code: warehouse.code },
            update: {
                warehouseName: warehouse.name,
                location: warehouse.location,
                warehouseType: warehouse.type,
            },
            create: {
                code: warehouse.code,
                warehouseName: warehouse.name,
                location: warehouse.location,
                warehouseType: warehouse.type,
            },
        });
    }

    console.log(`Warehouses seeded: ${WAREHOUSES.length}`);
}

async function seedSupplierComponents(): Promise<void> {
    for (const link of SUPPLIER_COMPONENT_LINKS) {
        const supplier = await prisma.supplier.findUnique({ where: { code: link.supplierCode } });
        const component = await prisma.component.findUnique({ where: { code: link.componentCode } });

        if (!supplier || !component) {
            continue;
        }

        await prisma.supplierComponent.upsert({
            where: {
                supplierId_componentId: {
                    supplierId: supplier.supplierId,
                    componentId: component.componentId,
                },
            },
            update: {},
            create: {
                supplierId: supplier.supplierId,
                componentId: component.componentId,
            },
        });
    }

    console.log(`Supplier-component links seeded: ${SUPPLIER_COMPONENT_LINKS.length}`);
}

async function seedProductsAndBom(): Promise<void> {
    for (const productDef of PRODUCT_DEFINITIONS) {
        const product = await prisma.product.upsert({
            where: { code: productDef.code },
            update: {
                productName: productDef.name,
                unit: productDef.unit,
                minStockLevel: productDef.minStock,
            },
            create: {
                code: productDef.code,
                productName: productDef.name,
                unit: productDef.unit,
                minStockLevel: productDef.minStock,
            },
        });

        for (const bomEntry of productDef.bom) {
            const component = await prisma.component.findUnique({ where: { code: bomEntry.componentCode } });
            if (!component) {
                continue;
            }

            await prisma.billOfMaterial.upsert({
                where: {
                    productId_componentId: {
                        productId: product.productId,
                        componentId: component.componentId,
                    },
                },
                update: {
                    quantityNeeded: bomEntry.quantityNeeded,
                },
                create: {
                    productId: product.productId,
                    componentId: component.componentId,
                    quantityNeeded: bomEntry.quantityNeeded,
                },
            });
        }
    }

    console.log(`Products and BOM seeded: ${PRODUCT_DEFINITIONS.length}`);
}

async function seedProductionLines(): Promise<void> {
    const lines = [
        { name: 'Line 1 (Assembly)', location: 'Zone B' },
        { name: 'Line 2 (Testing)', location: 'Zone C' },
    ] as const;

    for (const line of lines) {
        const existing = await prisma.productionLine.findFirst({ where: { lineName: line.name } });
        if (!existing) {
            await prisma.productionLine.create({
                data: {
                    lineName: line.name,
                    location: line.location,
                },
            });
        }
    }

    console.log(`Production lines seeded: ${lines.length}`);
}

async function seedComponentStocks(): Promise<void> {
    const mainWarehouse = await prisma.warehouse.findUnique({ where: { code: 'WH-MAIN' } });
    if (!mainWarehouse) {
        console.warn('WH-MAIN not found, skipping component stocks');
        return;
    }

    for (const componentDef of COMPONENTS) {
        const component = await prisma.component.findUnique({ where: { code: componentDef.code } });
        if (!component) {
            continue;
        }

        await prisma.componentStock.upsert({
            where: {
                warehouseId_componentId: {
                    warehouseId: mainWarehouse.warehouseId,
                    componentId: component.componentId,
                },
            },
            update: {
                quantity: componentDef.minStock,
            },
            create: {
                warehouseId: mainWarehouse.warehouseId,
                componentId: component.componentId,
                quantity: componentDef.minStock,
            },
        });
    }

    console.log('Component stock seeded for WH-MAIN');
}

async function seedCodeSequences(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const y = String(now.getFullYear()).slice(2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const scopes = [
        `PO-${year}`,
        `LOT-${y}${m}${d}`,
    ];

    for (const scope of scopes) {
        await prisma.codeSequence.upsert({
            where: { scope },
            update: {},
            create: {
                scope,
                currentValue: 0,
            },
        });
    }

    console.log(`Code sequences ensured: ${scopes.join(', ')}`);
}

async function main(): Promise<void> {
    console.log('Starting production-safe seed');

    if (DEFAULT_PASSWORD === '123456') {
        console.warn('Using default PROD_SEED_DEFAULT_PASSWORD=123456. Change this after first login.');
    }

    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedEmployees();
    await seedSuppliers();
    await seedAgents();
    await seedComponents();
    await seedWarehouses();
    await seedSupplierComponents();
    await seedProductsAndBom();
    await seedProductionLines();
    await seedComponentStocks();
    await seedCodeSequences();

    console.log('Production-safe seed completed');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
