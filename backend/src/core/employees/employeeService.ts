import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { AuthUser } from '../../common/types/express.js';
import { EmployeeStatus } from '../../generated/prisma/index.js';

interface EmployeeCreateData {
    fullName: string;
    roleIds: number[];
    email: string;
    phoneNumber: string;
    province: string;
    ward: string;
    street: string;
    dateOfBirth?: Date;
    hireDate: Date;
    status?: EmployeeStatus;
}

interface EmployeeUpdateData {
    fullName?: string;
    phoneNumber?: string;
    province?: string;
    ward?: string;
    street?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
    terminationDate?: Date;
    status?: EmployeeStatus;
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
    _devCredentials?: { email: string; password: string };
}

import { generateSecurePassword } from '../../common/utils/passwordGenerator.js';
import { sendCredentialsEmail } from '../../common/utils/email.js';

class EmployeeService {
    async _checkUniqueConstraints(id: number | null, email?: string, phoneNumber?: string, username?: string): Promise<void> {
        const orConditions: any[] = [];
        if (email) orConditions.push({ email });
        if (phoneNumber) orConditions.push({ phoneNumber });
        if (username) orConditions.push({ username });

        if (orConditions.length > 0) {
            const conflicting = await prisma.employee.findFirst({
                where: {
                    ...(id ? { NOT: { employeeId: id } } : {}),
                    OR: orConditions
                },
            });

            if (conflicting) {
                if (email && conflicting.email === email) throw new Error('Email already in use');
                if (phoneNumber && conflicting.phoneNumber === phoneNumber) throw new Error('Phone number already in use');
                if (username && conflicting.username === username) throw new Error('Username already taken');
            }
        }
    }
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
        const { fullName, roleIds, email, phoneNumber, province, ward, street, dateOfBirth, hireDate, status } = data;

        const count = await prisma.role.count({ where: { roleId: { in: roleIds } } });
        if (count !== roleIds.length) {
            throw new Error('One or more Role IDs are invalid.');
        }

        const username = email;
        await this._checkUniqueConstraints(null, email, phoneNumber, username);

        const tempPassword = generateSecurePassword(12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        let address = [street, ward, province].filter(Boolean).join(', ');
        if (!address) address = '';

        const newEmployee = await prisma.employee.create({
            data: {
                fullName, username, password: hashedPassword, email, phoneNumber,
                address, dateOfBirth, hireDate, status: status || EmployeeStatus.ACTIVE,
                roles: {
                    create: roleIds.map(id => ({ role: { connect: { roleId: id } } })),
                },
            },
            include: { roles: { include: { role: true } } }
        });

        // Send email (handling both SMTP and Dev/Mock mode)
        const emailResult = await sendCredentialsEmail(email, tempPassword, fullName);
        
        const formatted = this._formatEmployee(newEmployee);
        
        // If system is in Dev Mode (no GMAIL config) and not production, attach credentials to response
        if (formatted && emailResult.method === 'mock' && process.env.NODE_ENV !== 'production') {
            formatted._devCredentials = { email, password: tempPassword };
        }

        return formatted;
    }

    async updateEmployeeByAdmin(targetId: string | number, data: EmployeeUpdateData, adminUser: AuthUser): Promise<FormattedEmployee | null> {
        const id = typeof targetId === 'string' ? parseInt(targetId) : targetId;

        if (id === adminUser.employeeId && data.status && data.status !== 'ACTIVE') {
            throw new Error('Security Safety: You cannot terminate your own account.');
        }

        await this._checkUniqueConstraints(id, undefined, data.phoneNumber); // Email and Username are locked

        const updateData: any = { ...data };
        delete updateData.email;
        delete updateData.username;
        delete updateData.roleIds;
        delete updateData.province;
        delete updateData.ward;
        delete updateData.street;

        if (data.province || data.ward || data.street) {
            const currentEmployee = await prisma.employee.findUnique({ where: { employeeId: id } });
            if (currentEmployee) {
                // For simplicity, if they update address, we expect them to update the whole thing.
                // Or if any part is passed, just build it. Typically frontend sends all 3 if editing.
                const addressFields = [
                    data.street || '',
                    data.ward || '',
                    data.province || ''
                ].filter(Boolean);
                
                if (addressFields.length > 0) {
                    updateData.address = addressFields.join(', ');
                }
            }
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

    async updateBasicProfile(id: number, data: { fullName?: string, phoneNumber?: string, address?: string, dateOfBirth?: Date }): Promise<FormattedEmployee | null> {
        await this._checkUniqueConstraints(id, undefined, data.phoneNumber);
        
        const updatedEmployee = await prisma.employee.update({
            where: { employeeId: id },
            data,
            include: {
                roles: { include: { role: true } },
            },
        });

        return this._formatEmployee(updatedEmployee);
    }

    async updateStatus(id: string | number, status: EmployeeStatus) {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        return prisma.employee.update({
            where: { employeeId },
            data: { status }
        });
    }

/*
    async deleteEmployeeHard(id: string | number) {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        return prisma.employee.delete({
            where: { employeeId }
        });
    }
*/

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
