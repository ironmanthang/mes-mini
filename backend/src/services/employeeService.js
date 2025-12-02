const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

class EmployeeService {
    _formatEmployee(employee) {
    if (!employee) return null;
    return {
      ...employee,
      password: undefined, // Ensure password is removed if it leaked
      roles: employee.roles.map(r => ({ 
        roleId: r.role.roleId, 
        roleName: r.role.roleName 
      }))
    };
  }
  async createUser(data) {    
    const { fullName, username, password, roleIds, email, phoneNumber, address, dateOfBirth, hireDate, status } = data;

    const count = await prisma.role.count({
      where: {
        roleId: { in: roleIds }
      }
    });
    if (count !== roleIds.length) {
      throw new Error('One or more Role IDs are invalid.');
    }
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [{ username }, { email }, { phoneNumber }],
      },
    });

    if (existingEmployee) {
      if (existingEmployee.username === username) throw new Error('Username already exists');
      if (existingEmployee.email === email) throw new Error('Email already in use');
      if (existingEmployee.phoneNumber === phoneNumber) throw new Error('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await prisma.employee.create({
      data: {
        fullName, username, password: hashedPassword, email, phoneNumber,
        address, dateOfBirth, hireDate, status: status || 'ACTIVE',
        roles: {
          create: roleIds.map(id => ({ role: { connect: { roleId: id } } })),
        },
      },
      include: {
        roles: { include: { role: true } }
      }
    });

    // 4. Return Clean Format
    return this._formatEmployee(newEmployee);
  }

  async updateEmployeeByAdmin(targetId, data, adminUser) {
    const id = parseInt(targetId);
    
    // Safety check for self-termination
    if (id === adminUser.employeeId && data.status && data.status !== 'ACTIVE') {
        throw new Error('Security Safety: You cannot terminate your own account.');
    }

    // Dynamic Conflict Check
    const orConditions = [];
    if (data.username) orConditions.push({ username: data.username });
    if (data.email) orConditions.push({ email: data.email });
    if (data.phoneNumber) orConditions.push({ phoneNumber: data.phoneNumber });

    if (orConditions.length > 0) {
      const conflicting = await prisma.employee.findFirst({
        where: {
          NOT: { employeeId: id },
          OR: orConditions
        },
      });

      if (conflicting) {
        if (conflicting.username === data.username) throw new Error('Username already taken');
        if (conflicting.email === data.email) throw new Error('Email already in use');
        if (conflicting.phoneNumber === data.phoneNumber) throw new Error('Phone number already in use');
      }
    }

    // Prepare Update Object
    const updateData = { ...data };
    delete updateData.roleIds; // Handle separately
    delete updateData.password; // Handle separately

    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Role Logic
    if (data.roleIds) {
      if (id === adminUser.employeeId) {
        const adminRole = await prisma.role.findUnique({ where: { roleName: 'System Admin' } });
        if (adminRole && !data.roleIds.includes(adminRole.roleId)) {
           throw new Error('Security Violation: You cannot remove the System Admin role from yourself.');
        }
      }

      updateData.roles = {
        deleteMany: {},
        create: data.roleIds.map(roleId => ({
          role: { connect: { roleId: roleId } }
        }))
      };
    }


    const updatedEmployee = await prisma.employee.update({
      where: { employeeId: id },
      data: updateData,
      include: {
        roles: { include: { role: true } },
      },
    });

    return this._formatEmployee(updatedEmployee);
  }

  async updateStatus(id, status) {
     return prisma.employee.update({
         where: { employeeId: parseInt(id) },
         data: { status }
     });
  }

  async deleteEmployeeHard(id) {
      return prisma.employee.delete({
          where: { employeeId: parseInt(id) }
      });
  }

  async getAllEmployees() {
    const employees = await prisma.employee.findMany({
      include: {
        roles: { include: { role: true } }
      },
      orderBy: { employeeId: 'asc' }
    });

    // Map ALL employees to clean format
    return employees.map(emp => {
        // Manually remove password from list view to be safe
        const { password, ...rest } = emp; 
        return {
            ...rest,
            roles: emp.roles.map(r => ({ roleId: r.role.roleId, roleName: r.role.roleName }))
        };
    });
  }

  async findById(id) {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: parseInt(id) },
      include: {
        roles: { include: { role: true } }
      },
    });
    return this._formatEmployee(employee);
  }
}

module.exports = new EmployeeService();