import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { AuthUser } from '../../common/types/express.js';

interface EmployeeCreateData {
    fullName: string;
    username: string;
    password: string;
    roleIds: number[];
    email: string;
    phoneNumber: string;
    address?: string;
    dateOfBirth?: Date;
    hireDate: Date;
    status?: string;
}

interface EmployeeUpdateData {
    fullName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    address?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
    terminationDate?: Date;
    status?: string;
    roleIds?: number[];
}

interface FormattedEmployee {
    employeeId: number;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    address: string | null;
    dateOfBirth: Date | null;
    hireDate: Date;
    terminationDate: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    roles: { roleId: number; roleName: string }[];
}

class EmployeeService {
    _formatEmployee(employee: any): FormattedEmployee | null {
        if (!employee) return null;
        return {
            ...employee,
            password: undefined,
            roles: employee.roles.map((r: any) => ({
                roleId: r.role.roleId,
                roleName: r.role.roleName
            }))
        };
    }

    async createUser(data: EmployeeCreateData): Promise<FormattedEmployee | null> {
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
                address, dateOfBirth, hireDate, status: (status as any) || 'ACTIVE',
                roles: {
                    create: roleIds.map(id => ({ role: { connect: { roleId: id } } })),
                },
            },
            include: {
                roles: { include: { role: true } }
            }
        });

        return this._formatEmployee(newEmployee);
    }

    async updateEmployeeByAdmin(targetId: string | number, data: EmployeeUpdateData, adminUser: AuthUser): Promise<FormattedEmployee | null> {
        const id = typeof targetId === 'string' ? parseInt(targetId) : targetId;

        // Safety check for self-termination
        if (id === adminUser.employeeId && data.status && data.status !== 'ACTIVE') {
            throw new Error('Security Safety: You cannot terminate your own account.');
        }

        // Dynamic Conflict Check
        const orConditions: any[] = [];
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
        const updateData: any = { ...data };
        delete updateData.roleIds;
        delete updateData.password;

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

    async updateStatus(id: string | number, status: string) {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        return prisma.employee.update({
            where: { employeeId },
            data: { status: status as any }
        });
    }

    async deleteEmployeeHard(id: string | number) {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        return prisma.employee.delete({
            where: { employeeId }
        });
    }

    async getAllEmployees(query: { page?: number; limit?: number; search?: string } = {}): Promise<any> {
        const { getPaginationParams, createPaginatedResponse } = await import('../../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const where: any = {};
        if (query.search) {
            where.OR = [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { username: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    roles: { include: { role: true } }
                },
                orderBy: { employeeId: 'asc' }
            }),
            prisma.employee.count({ where })
        ]);

        const data = employees.map(emp => {
            const { password, ...rest } = emp as any;
            return {
                ...rest,
                roles: emp.roles.map(r => ({ roleId: r.role.roleId, roleName: r.role.roleName }))
            };
        });

        return createPaginatedResponse(data, total, page, limit);
    }

    async findById(id: string | number): Promise<FormattedEmployee | null> {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        const employee = await prisma.employee.findUnique({
            where: { employeeId },
            include: {
                roles: { include: { role: true } }
            },
        });
        return this._formatEmployee(employee);
    }
}

export default new EmployeeService();
