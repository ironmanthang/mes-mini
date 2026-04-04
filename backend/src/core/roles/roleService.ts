import prisma from '../../common/lib/prisma.js';
import type { Role } from '../../generated/prisma/index.js';
import { PERM, type PermCode } from '../../common/constants/permissions.js';

interface RoleCreateData {
    roleCode: string;  // NEW — immutable system identifier (e.g., 'WH_STAFF')
    roleName: string;  // Human-readable display name (e.g., 'Warehouse Staff')
}

// Partial update allows changing roleName without touching roleCode
interface RoleUpdateData {
    roleCode?: string;
    roleName?: string;
}

class RoleService {
    async getAllRoles(): Promise<Role[]> {
        return prisma.role.findMany({ orderBy: { roleCode: 'asc' } });
    }

    /**
     * createRole() — Create a new role with a unique code + display name.
     *
     * CHANGED: Now accepts roleCode as a required field.
     * roleCode is the immutable identifier. It should follow UPPER_SNAKE_CASE convention
     * and never be renamed after creation (routes and services reference it in code).
     */
    async createRole(data: RoleCreateData): Promise<Role> {
        let { roleCode, roleName } = data;

        if (!roleName || roleName.trim() === '') {
            throw new Error('Role name is required');
        }

        // Auto-generate immutable role code if not provided by the client
        if (!roleCode || roleCode.trim() === '') {
            roleCode = roleName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
        }

        // Check code uniqueness (immutable identifier)
        const existingCode = await prisma.role.findUnique({ where: { roleCode } });
        if (existingCode) throw new Error(`Role code '${roleCode}' already exists`);

        // Check name uniqueness (display name)
        const existingName = await prisma.role.findUnique({ where: { roleName } });
        if (existingName) throw new Error(`Role name '${roleName}' already exists`);

        return prisma.role.create({ data: { roleCode, roleName } });
    }

    /**
     * updateRole() — Update a role's display name.
     *
     * NOTE: We allow roleCode to be updated here as a safeguard for typo corrections
     * only in development. In production, roleCode should be treated as immutable.
     * The SYS_ADMIN guard in deleteRole() applies here too — cannot rename SYS_ADMIN.
     */
    async updateRole(id: string | number, data: RoleUpdateData): Promise<Role> {
        const roleId = typeof id === 'string' ? parseInt(id) : id;

        const roleToUpdate = await prisma.role.findUnique({ where: { roleId } });
        if (!roleToUpdate) throw new Error('Role not found');

        // Prevent renaming the SYS_ADMIN roleCode — it's referenced in source code
        if (data.roleCode && data.roleCode !== roleToUpdate.roleCode && roleToUpdate.roleCode === 'SYS_ADMIN') {
            throw new Error('System Safety: The SYS_ADMIN roleCode is immutable and cannot be changed.');
        }

        // Duplicate checks
        if (data.roleCode) {
            const duplicateCode = await prisma.role.findFirst({
                where: { roleCode: data.roleCode, NOT: { roleId } }
            });
            if (duplicateCode) throw new Error('Role code already exists');
        }

        if (data.roleName) {
            const duplicateName = await prisma.role.findFirst({
                where: { roleName: data.roleName, NOT: { roleId } }
            });
            if (duplicateName) throw new Error('Role name already exists');
        }

        return prisma.role.update({
            where: { roleId },
            data: {
                ...(data.roleCode && { roleCode: data.roleCode }),
                ...(data.roleName && { roleName: data.roleName }),
            },
        });
    }

    /**
     * deleteRole() — Hard-delete a role (only if unassigned and not SYS_ADMIN).
     *
     * CHANGED: Added SYS_ADMIN permanent protection guard.
     * WHY: SYS_ADMIN is the root-access role. Deleting it would lock out all admins
     * and make the system unrecoverable without direct DB access.
     * Note: RolePermission rows are cascade-deleted when the role is deleted (schema: onDelete: Cascade).
     */
    async deleteRole(id: string | number): Promise<Role> {
        const roleId = typeof id === 'string' ? parseInt(id) : id;
        const role = await prisma.role.findUnique({ where: { roleId } });
        if (!role) throw new Error('Role not found');

        // Permanent protection: SYS_ADMIN can never be deleted
        if (role.roleCode === 'SYS_ADMIN') {
            throw new Error('System Safety: The root Administrator role can never be deleted.');
        }

        const roleInUse = await prisma.employeeRole.findFirst({ where: { roleId } });
        if (roleInUse) {
            throw new Error('Cannot delete role because it is assigned to users.');
        }

        return prisma.role.delete({ where: { roleId } });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Permission Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * getAllPermissions() — Returns the full permission catalog from DB.
     * Used by the Permission Management UI to populate the assignment form.
     *
     * UPDATED: Now supports optional `search` (on permCode/description) and `module` filter.
     */
    async getAllPermissions(search?: string, module?: string) {
        return prisma.permission.findMany({
            where: {
                AND: [
                    module ? { module } : {},
                    search ? {
                        OR: [
                            { permCode: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } }
                        ]
                    } : {}
                ]
            },
            orderBy: [{ module: 'asc' }, { permCode: 'asc' }]
        });
    }

    /**
     * getRolePermissions() — Returns current permissions for a specific role.
     */
    async getRolePermissions(roleId: string | number) {
        const id = typeof roleId === 'string' ? parseInt(roleId) : roleId;
        const role = await prisma.role.findUnique({
            where: { roleId: id },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });
        if (!role) throw new Error('Role not found');
        return role.permissions.map(rp => rp.permission);
    }

    /**
     * setRolePermissions() — Full replace of a role's permission assignments.
     *
     * WHY full replace (not additive)?
     *   Additive permission management ("add this, remove that") is error-prone
     *   in UIs. A full replace with a checkbox-style UI is safer and more intuitive.
     *   The Grinder or frontend sends the complete desired permission set;
     *   we atomic-swap in a single transaction.
     *
     * Cascade: deleteMany removes all existing RolePermission rows, then we
     * create the new set. Wrapped in a transaction for atomicity.
     */
    async setRolePermissions(roleId: string | number, permCodes: PermCode[]) {
        const id = typeof roleId === 'string' ? parseInt(roleId) : roleId;

        const role = await prisma.role.findUnique({ where: { roleId: id } });
        if (!role) throw new Error('Role not found');

        // Validate all provided permCodes exist in DB
        const permissions = await prisma.permission.findMany({
            where: { permCode: { in: permCodes } }
        });
        if (permissions.length !== permCodes.length) {
            const foundCodes = new Set(permissions.map(p => p.permCode));
            const invalid = permCodes.filter(c => !foundCodes.has(c));
            throw new Error(`Invalid permission codes: ${invalid.join(', ')}`);
        }

        // Atomic full replace inside a transaction
        return prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId: id } });
            await tx.rolePermission.createMany({
                data: permissions.map(p => ({
                    roleId: id,
                    permissionId: p.permissionId
                }))
            });
            return tx.role.findUnique({
                where: { roleId: id },
                include: { permissions: { include: { permission: true } } }
            });
        });
    }
}

export default new RoleService();
