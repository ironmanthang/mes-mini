const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RoleService {
  async getAllRoles() {
    return prisma.role.findMany();
  }

  async createRole(data) {
    const { roleName } = data;
    const existingRole = await prisma.role.findUnique({ where: { roleName } });
    if (existingRole) {
      throw new Error('Role name already exists');
    }
    return prisma.role.create({ data: { roleName } });
  }

  async updateRole(id, data) {
    
    const { roleName } = data;
    const roleId = parseInt(id);

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

  async deleteRole(id) {
    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new Error('Role not found');

    const roleInUse = await prisma.employeeRole.findFirst({ where: { roleId } });
    if (roleInUse) {
      throw new Error('Cannot delete role because it is assigned to users.');
    }
    return prisma.role.delete({ where: { roleId } });
  }
}

module.exports = new RoleService();