const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

class EmployeeService {
  async createUser(data) {
    const { fullName, username, password, roleIds } = data;
    const existingEmployee = await prisma.employee.findUnique({ where: { username } });
    if (existingEmployee) {
      throw new Error('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.employee.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        roles: {
          create: roleIds.map(id => ({
            role: { connect: { roleId: id } },
          })),
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async getAllEmployees() {
    return prisma.employee.findMany({
      select: { employeeId: true, fullName: true, username: true, roles: { select: { role: { select: { roleName: true } } } } },
    });
  }

  async findById(id) {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
      select: {
        employeeId: true,
        fullName: true,
        username: true,
        roles: { select: { role: { select: { roleName: true } } } },
      },
    });
    if (employee) {
      employee.roles = employee.roles.map(r => r.role.roleName);
    }
    return employee;
  }
}

module.exports = new EmployeeService();