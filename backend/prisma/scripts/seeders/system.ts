import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../../../src/common/lib/prisma.js';
import { PERM } from '../../../src/common/constants/permissions.js';
import { EmployeeStatus, PurchaseOrderStatus, SalesOrderStatus, ProductionRequestStatus, Priority, WarehouseType, InventoryTransactionType, ProductInstanceStatus, MaterialRequestStatus, InspectionType } from '../../../src/generated/prisma/index.js';

const DEFAULT_PASSWORD = '123456';

export async function seedRoles(): Promise<void> {
    console.log('...Seeding Roles');

    // Consolidated to 4 roles for MVP
    // roleCode is the immutable system identifier — NEVER rename after deployment
    const roles = [
        { code: 'SYS_ADMIN',    name: 'System Admin' },
        { code: 'PROD_MGR',     name: 'Production Manager' },
        { code: 'WH_STAFF',     name: 'Warehouse Staff' },
        { code: 'LINE_LEADER',  name: 'Line Leader' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { roleCode: role.code },
            update: { roleName: role.name },
            create: { roleCode: role.code, roleName: role.name },
        });
    }
    console.log(`   Created/updated ${roles.length} roles`);
}

export async function seedPermissions(): Promise<void> {
    console.log('...Seeding Permissions');

    // Derive module from permCode prefix (e.g., 'PO_READ' → module 'PO')
    // This ensures 100% parity between PERM const and DB — no manual string lists.
    const permEntries = Object.entries(PERM).map(([, permCode]) => {
        const module = permCode.split('_')[0];  // First segment before underscore
        return { permCode, module };
    });

    // Description map — human-readable for the Permission Management UI
    const descriptions: Record<string, string> = {
        EMP_READ:          'View employee list & details',
        EMP_CREATE:        'Create new employees',
        EMP_UPDATE:        'Edit employee details',
        EMP_STATUS:        'Activate/deactivate employees & force-logout',
        ROLE_MANAGE:       'Full CRUD on roles & permission assignments',
        PO_READ:           'View Purchase Orders',
        PO_CREATE:         'Create & edit draft POs',
        PO_SUBMIT:         'Submit POs for approval',
        PO_APPROVE:        'Approve pending POs',
        PO_SEND:           'Send approved POs to supplier',
        PO_RECEIVE:        'Receive goods against POs',
        PO_CANCEL:         'Cancel POs',
        SO_READ:           'View Sales Orders',
        SO_CREATE:         'Create & edit draft SOs',
        SO_SUBMIT:         'Submit SOs for approval',
        SO_APPROVE:        'Approve pending SOs',
        SO_SHIP:           'Ship/fulfill SOs',
        SO_CANCEL:         'Cancel SOs',
        PR_READ:           'View Production Requests',
        PR_CREATE:         'Create Production Requests',
        PR_UPDATE:         'Edit production requests',
        PR_CANCEL:         'Cancel production requests',
        PR_LINK_PO:        'Link PR to a Purchase Order',
        WO_READ:           'View Work Orders',
        WO_CREATE:         'Create Work Orders',
        WO_UPDATE:         'Edit & transition Work Orders',
        WO_COMPLETE:       'Mark Work Orders as completed',
        LINE_READ:         'View production lines',
        LINE_CREATE:       'Create production lines',
        LINE_UPDATE:       'Edit production lines',
        LINE_DELETE:       'Delete production lines',
        QC_READ:           'View quality checks',
        QC_CREATE:         'Perform quality checks',
        WH_STOCK_READ:     'View inventory/stock levels',
        WH_STOCK_ADJUST:   'Adjust inventory balances',
        WH_MANAGE:         'Full CRUD on warehouse entities',
        MR_READ:           'View material export requests',
        MR_CREATE:         'Create material requests',
        MR_APPROVE:        'Approve/process material requests',
        ST_READ:           'View stocktakes',
        ST_CREATE:         'Create stocktakes',
        ST_COMPLETE:       'Complete/approve stocktakes',
        TR_READ:           'View transfer requests',
        TR_MANAGE:         'Create & complete transfer requests',
        ATTACH_UPLOAD:     'Upload attachments',
        ATTACH_DELETE_ANY: 'Delete any user\'s attachments (admin override)',
        NOTIF_READ:        'Read own notifications',
        DASH_READ:         'View dashboard metrics',
        PRODUCT_READ:      'View product list & details',
        PRODUCT_CREATE:    'Create products',
        PRODUCT_UPDATE:    'Edit products & BOM',
        COMP_READ:         'View component list & details',
        COMP_CREATE:       'Create components',
        COMP_UPDATE:       'Edit components',
        SUPPLIER_READ:     'View supplier list & details',
        SUPPLIER_CREATE:   'Create suppliers',
        SUPPLIER_UPDATE:   'Edit suppliers',
        AGENT_READ:        'View agent list & details',
        AGENT_CREATE:      'Create agents',
        AGENT_UPDATE:      'Edit agents',
    };

    for (const entry of permEntries) {
        await prisma.permission.upsert({
            where: { permCode: entry.permCode },
            update: {},  // permCode and module are immutable once deployed
            create: {
                permCode:    entry.permCode,
                module:      entry.module,
                description: descriptions[entry.permCode] || entry.permCode,
            },
        });
    }
    console.log(`   Created/updated ${permEntries.length} permissions`);
}

export async function seedRolePermissions(): Promise<void> {
    console.log('...Seeding Role-Permission Assignments');

    // All permissions exist in DB — build a lookup map: permCode → permissionId
    const allPerms = await prisma.permission.findMany({ select: { permissionId: true, permCode: true } });
    const permMap = new Map(allPerms.map(p => [p.permCode, p.permissionId]));

    // Role → Permission mapping (from full-detail-plan.md Section 3.3)
    const ALL_PERMS = Object.values(PERM);  // SYS_ADMIN gets everything

    const rolePermissions: Record<string, string[]> = {
        SYS_ADMIN: ALL_PERMS,  // Explicit, not wildcard — shows every perm in the mgmt UI
        PROD_MGR: [
            PERM.PO_READ, PERM.PO_APPROVE, PERM.PO_CANCEL,
            PERM.SO_READ, PERM.SO_APPROVE, PERM.SO_CANCEL,
            PERM.PR_READ, PERM.PR_CREATE, PERM.PR_UPDATE, PERM.PR_APPROVE, PERM.PR_CANCEL, PERM.PR_LINK_PO,
            PERM.WO_READ, PERM.WO_CREATE, PERM.WO_UPDATE, PERM.WO_COMPLETE,
            PERM.LINE_READ, PERM.LINE_CREATE, PERM.LINE_UPDATE, PERM.LINE_DELETE,
            PERM.QC_READ, PERM.WH_STOCK_READ,
            PERM.MR_READ, PERM.MR_APPROVE,
            PERM.ST_READ, PERM.DASH_READ,
            PERM.TR_READ, PERM.WH_INDUCT,
            PERM.PRODUCT_READ, PERM.PRODUCT_CREATE, PERM.PRODUCT_UPDATE,
            PERM.COMP_READ, PERM.COMP_CREATE, PERM.COMP_UPDATE,
            PERM.SUPPLIER_READ,
            // Absorbed HR & Role Mgmt
            PERM.EMP_READ, PERM.EMP_CREATE, PERM.EMP_UPDATE, PERM.EMP_STATUS,
            PERM.ROLE_MANAGE,
            PERM.ATTACH_DELETE_ANY,
            PERM.ATTACH_UPLOAD,
        ],
        WH_STAFF: [
            PERM.WH_STOCK_READ, PERM.WH_STOCK_ADJUST, PERM.WH_MANAGE,
            PERM.MR_READ, PERM.MR_CREATE, PERM.MR_APPROVE,
            PERM.ST_READ, PERM.ST_CREATE, PERM.ST_COMPLETE,
            PERM.TR_READ, PERM.TR_MANAGE,
            PERM.PO_RECEIVE, PERM.SO_SHIP,
            PERM.WH_INDUCT,
            PERM.ATTACH_UPLOAD,
            PERM.PRODUCT_READ,
            PERM.COMP_READ, PERM.COMP_CREATE, PERM.COMP_UPDATE,
            PERM.SUPPLIER_READ, PERM.SUPPLIER_CREATE, PERM.SUPPLIER_UPDATE,
            // Absorbed Purchasing
            PERM.PO_READ, PERM.PO_CREATE, PERM.PO_SUBMIT, PERM.PO_SEND, PERM.PO_CANCEL,
            PERM.PR_READ, PERM.PR_LINK_PO,
            // Legacy/Parking
            PERM.SO_READ, PERM.SO_CREATE, PERM.SO_SUBMIT, PERM.SO_APPROVE, PERM.SO_CANCEL,
            PERM.AGENT_READ, PERM.AGENT_CREATE, PERM.AGENT_UPDATE,
        ],
        LINE_LEADER: [
            PERM.WO_READ, PERM.WO_UPDATE,
            PERM.LINE_READ, PERM.QC_READ,
            PERM.MR_READ, PERM.MR_CREATE,
            PERM.TR_READ,
            PERM.PRODUCT_READ, PERM.COMP_READ,
            // Absorbed QC
            PERM.QC_CREATE,
        ],
    };

    // Also assign NOTIF_READ to all roles (notifications are universal)
    for (const perms of Object.values(rolePermissions)) {
        if (!perms.includes(PERM.NOTIF_READ)) {
            perms.push(PERM.NOTIF_READ);
        }
    }

    for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
        const role = await prisma.role.findUnique({ where: { roleCode } });
        if (!role) {
            console.warn(`   ⚠️ Role '${roleCode}' not found, skipping permissions.`);
            continue;
        }

        // Full replace: wipe existing and re-seed (idempotent)
        await prisma.rolePermission.deleteMany({ where: { roleId: role.roleId } });

        const permissionIds = permCodes
            .map(code => permMap.get(code))
            .filter((id): id is number => id !== undefined);

        if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map(permissionId => ({ roleId: role.roleId, permissionId }))
            });
        }
        console.log(`   ✓ ${roleCode}: ${permissionIds.length} permissions assigned`);
    }
}

export async function seedEmployees(minimal: boolean = false): Promise<void> {
    console.log('...Seeding Employees');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Full list — one employee per role for comprehensive testing (MVP roles only)
    // CHANGED: lookup by roleCode (immutable) instead of roleName (editable)
    const allUsers = [
        { name: 'Super Admin',            username: 'admin',     email: 'admin@mes.com',     roleCode: 'SYS_ADMIN' },
        { name: 'Mr. Production Manager', username: 'manager',   email: 'manager@mes.com',   roleCode: 'PROD_MGR' },
        { name: 'Ms. Warehouse Staff',    username: 'warehouse', email: 'warehouse@mes.com', roleCode: 'WH_STAFF' },
        { name: 'Ms. Line Leader',        username: 'lineleader',email: 'lineleader@mes.com',roleCode: 'LINE_LEADER' },
    ];

    const users = minimal
        ? [allUsers[0]]  // Only Super Admin
        : allUsers;      // All 4 employees (one per role)

    console.log(`   Mode: ${minimal ? 'MINIMAL (1 admin only)' : 'FULL (' + users.length + ' employees, one per role)'}`);

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        try {
            // CHANGED: lookup by roleCode (immutable)
            const role = await prisma.role.findUnique({ where: { roleCode: u.roleCode } });
            if (!role) {
                console.warn(`   ⚠️ Role '${u.roleCode}' not found. Skipping user ${u.username}.`);
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
            console.log(`   ✓ ${u.username} (${u.roleCode})`);
        } catch (error) {
            console.error(`   ❌ Failed to seed user ${u.username}:`, error);
        }
    }
}

export async function seedWarehouses(): Promise<void> {
    console.log('...Seeding Warehouses');
    const warehouses = [
        { code: 'WH-MAIN', name: 'Main Warehouse (Materials)', location: 'Zone A', type: WarehouseType.COMPONENT },
        { code: 'WH-PROD', name: 'Production Floor', location: 'Zone B', type: WarehouseType.COMPONENT },
        { code: 'WH-FG', name: 'Sales Warehouse', location: 'Zone C', type: WarehouseType.SALES },
        { code: 'WH-DEFECT', name: 'Error Warehouse', location: 'Zone D', type: WarehouseType.ERROR }
    ];

    for (const w of warehouses) {
        await prisma.warehouse.upsert({
            where: { code: w.code },
            update: {},
            create: {
                code: w.code,
                warehouseName: w.name,
                location: w.location,
                warehouseType: w.type,
            }
        });
    }
}

export async function seedProductionLines(): Promise<void> {
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

export async function seedCodeSequences(): Promise<void> {
    console.log('...Seeding Code Sequences');
    const sequences = [
        { scope: 'PO-2026', value: 912 }, // Since we used PO-2026-901 to 912
        { scope: 'LOT-260310', value: 100 } // Safety padding
    ];

    for (const seq of sequences) {
        await prisma.codeSequence.upsert({
            where: { scope: seq.scope },
            update: { currentValue: seq.value },
            create: { scope: seq.scope, currentValue: seq.value }
        });
    }
    console.log('   ✓ Code Sequences initialized');
}