import prisma from '../../common/lib/prisma.js';
import type { Role } from '../../generated/prisma/index.js';

interface RoleCreateData {
    roleName: string;
}

class RoleService {
    async getAllRoles(): Promise<Role[]> {
        return prisma.role.findMany();
    }

    async createRole(data: RoleCreateData): Promise<Role> {
        const { roleName } = data;
        const existingRole = await prisma.role.findUnique({ where: { roleName } });
        if (existingRole) {
            throw new Error('Role name already exists');
        }
        return prisma.role.create({ data: { roleName } });
    }

    async updateRole(id: string | number, data: RoleCreateData): Promise<Role> {
        const { roleName } = data;
        const roleId = typeof id === 'string' ? parseInt(id) : id;

        const roleToUpdate = await prisma.role.findUnique({ where: { roleId } });
        if (!roleToUpdate) throw new Error('Role not found');

        const duplicateCheck = await prisma.role.findFirst({
            where: {
                roleName: roleName,
                NOT: { roleId: roleId }
            }
        });

        if (duplicateCheck) {
            throw new Error('Role name already exists');
        }
        return prisma.role.update({
            where: { roleId },
            data: { roleName },
        });
    }

    async deleteRole(id: string | number): Promise<Role> {
        const roleId = typeof id === 'string' ? parseInt(id) : id;
        const role = await prisma.role.findUnique({ where: { roleId } });
        if (!role) throw new Error('Role not found');

        const roleInUse = await prisma.employeeRole.findFirst({ where: { roleId } });
        if (roleInUse) {
            throw new Error('Cannot delete role because it is assigned to users.');
        }
        return prisma.role.delete({ where: { roleId } });
    }
}

export default new RoleService();
