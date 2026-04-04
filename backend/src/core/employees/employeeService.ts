import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { AuthUser } from '../../common/types/express.js';
import { EmployeeStatus } from '../../generated/prisma/index.js';
import { type PermCode } from '../../common/constants/permissions.js';
import { AppError } from '../../common/utils/AppError.js';

interface EmployeeCreateData {
    fullName:     string;
    roleIds:      number[];
    email:        string;
    phoneNumber:  string;
    province:     string;
    ward:         string;
    street:       string;
    dateOfBirth?: Date;
    hireDate:     Date;
    status?:      EmployeeStatus;
}

interface EmployeeUpdateData {
    fullName?:         string;
    phoneNumber?:      string;
    province?:         string;
    ward?:             string;
    street?:           string;
    dateOfBirth?:      Date;
    hireDate?:         Date;
    terminationDate?:  Date;
    status?:           EmployeeStatus;
    roleIds?:          number[];
}

/**
 * FormattedEmployee — shape returned by all public employee service methods.
 * roles now carries roleCode alongside roleName for use in service-level RBAC checks.
 * permissions is populated by findByIdWithPermissions() only.
 */
interface FormattedEmployee {
    employeeId:      number;
    fullName:        string;
    username:        string;
    email:           string;
    phoneNumber:     string;
    address:         string | null;
    dateOfBirth:     Date | null;
    hireDate:        Date;
    terminationDate: Date | null;
    status:          string;
    createdAt:       Date;
    updatedAt:       Date;
    sessionVersion:  number;
    roles:           { roleId: number; roleCode: string; roleName: string }[];
    permissions?:    PermCode[];  // Only populated by findByIdWithPermissions()
    _devCredentials?: { email: string; password: string };
}

import { generateSecurePassword } from '../../common/utils/passwordGenerator.js';
import { sendCredentialsEmail } from '../../common/utils/email.js';

class EmployeeService {

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * _formatEmployee() — Strips password, maps roles to the public DTO shape.
     *
     * CHANGED: roles now includes roleCode for stable service-level RBAC checks.
     * Old code used roleName for things like cancelPO() authorization.
     * Using roleCode (immutable) is safer because roleName can be edited in the UI.
     */
    _formatEmployee(employee: any): FormattedEmployee | null {
        if (!employee) return null;
        return {
            ...employee,
            password: undefined,
            roles: employee.roles.map((r: any) => ({
                roleId:   r.role.roleId,
                roleCode: r.role.roleCode,  // NEW
                roleName: r.role.roleName
            }))
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Auth Methods (called by protect() middleware)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * findByIdWithPermissions() — Deep select used exclusively by protect() middleware.
     *
     * WHY a separate method from findById()?
     *   protect() runs on EVERY authenticated request. It needs the full
     *   Employee → Roles → RolePermissions → Permissions chain.
     *   findById() (used for profile pages, detail views) does NOT need this depth.
     *   Keeping them separate prevents over-fetching on every normal CRUD call.
     *
     * Performance: Single DB round-trip with a 4-level nested .select.
     *   Using .select (not .include) means we only pull the exact fields we need,
     *   keeping the payload minimal even for SYS_ADMIN with ~60+ permissions.
     */
    async findByIdWithPermissions(id: number): Promise<AuthUser | null> {
        const employee = await prisma.employee.findUnique({
            where: { employeeId: id },
            select: {
                employeeId:     true,
                fullName:       true,
                username:       true,
                email:          true,
                phoneNumber:    true,
                address:        true,
                dateOfBirth:    true,
                hireDate:       true,
                terminationDate:true,
                status:         true,
                createdAt:      true,
                updatedAt:      true,
                sessionVersion: true,
                roles: {
                    select: {
                        role: {
                            select: {
                                roleId:   true,
                                roleCode: true,
                                roleName: true,
                                permissions: {
                                    select: {
                                        permission: {
                                            select: { permCode: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!employee) return null;

        // Flatten permissions across all roles (deduplicate with Set)
        const permSet = new Set<PermCode>();
        for (const er of employee.roles) {
            for (const rp of er.role.permissions) {
                permSet.add(rp.permission.permCode as PermCode);
            }
        }

        return {
            ...employee,
            roles: employee.roles.map(er => ({
                roleId:   er.role.roleId,
                roleCode: er.role.roleCode,
                roleName: er.role.roleName,
            })),
            permissions: Array.from(permSet),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD Methods
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * createUser() — Create a new employee.
     *
     * CHANGED: Replaced _checkUniqueConstraints() TOCTOU pattern with P2002 try/catch.
     * WHY: The old findFirst() check is a race condition. Two concurrent requests can
     * both pass the check, then one fails at the DB INSERT level with an unhandled error.
     * The DB unique constraint is the ONLY reliable uniqueness guard. P2002 catches it atomically.
     */
    async createUser(data: EmployeeCreateData): Promise<FormattedEmployee | null> {
        const { fullName, roleIds, email, phoneNumber, province, ward, street, dateOfBirth, hireDate, status } = data;

        const count = await prisma.role.count({ where: { roleId: { in: roleIds } } });
        if (count !== roleIds.length) {
            throw new Error('One or more Role IDs are invalid.');
        }

        const username = email;
        const tempPassword = generateSecurePassword(12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        let address = [street, ward, province].filter(Boolean).join(', ');
        if (!address) address = '';

        try {
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
        } catch (error: any) {
            // P2002 — Unique constraint violation (race-condition safe)
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target?.includes('email'))        throw new Error('Email already in use');
                if (target?.includes('phone_number')) throw new Error('Phone number already in use');
                if (target?.includes('username'))     throw new Error('Username already taken');
                throw new Error('A unique constraint was violated.');
            }
            throw error;
        }
    }

    async updateEmployeeByAdmin(targetId: string | number, data: EmployeeUpdateData, adminUser: AuthUser): Promise<FormattedEmployee | null> {
        const id = typeof targetId === 'string' ? parseInt(targetId) : targetId;

        if (id === adminUser.employeeId && data.status && data.status !== 'ACTIVE') {
            throw new Error('Security Safety: You cannot terminate your own account.');
        }

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
                // CHANGED: Use roleCode (immutable) instead of roleName (editable display string)
                const adminRole = await prisma.role.findUnique({ where: { roleCode: 'SYS_ADMIN' } });
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

        try {
            const updatedEmployee = await prisma.employee.update({
                where: { employeeId: id },
                data: updateData,
                include: {
                    roles: { include: { role: true } },
                },
            });

            return this._formatEmployee(updatedEmployee);
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('Employee not found', 404);
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target?.includes('phone_number')) throw new Error('Phone number already in use');
                throw new Error('A unique constraint was violated.');
            }
            throw error;
        }
    }

    async updateBasicProfile(id: number, data: { fullName?: string, phoneNumber?: string, address?: string, dateOfBirth?: Date }): Promise<FormattedEmployee | null> {
        try {
            const updatedEmployee = await prisma.employee.update({
                where: { employeeId: id },
                data,
                include: {
                    roles: { include: { role: true } },
                },
            });
            return this._formatEmployee(updatedEmployee);
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('Employee not found', 404);
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[] | undefined;
                if (target?.includes('phone_number')) throw new Error('Phone number already in use');
                throw new Error('A unique constraint was violated.');
            }
            throw error;
        }
    }

    async updateStatus(id: string | number, status: EmployeeStatus) {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        try {
            return await prisma.employee.update({
                where: { employeeId },
                data: { status }
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('Employee not found', 404);
            throw error;
        }
    }

    /**
     * forceLogout() — Increments sessionVersion, killing all active JWTs for this employee.
     *
     * How it works:
     *   1. DB sessionVersion is incremented (e.g., 1 → 2)
     *   2. The employee's existing JWTs still carry sessionVersion: 1
     *   3. protect() compares DB version (2) vs JWT version (1) → mismatch → 401
     *   4. The employee must log in fresh to get a new token with sessionVersion: 2
     *
     * Use cases: suspected account compromise, admin session cleanup, role change enforcement.
     */
    async forceLogout(id: string | number): Promise<void> {
        const employeeId = typeof id === 'string' ? parseInt(id) : id;
        try {
            await prisma.employee.update({
                where: { employeeId },
                data: { sessionVersion: { increment: 1 } }
            });
        } catch (error: any) {
            if (error.code === 'P2025') throw new AppError('Employee not found', 404);
            throw error;
        }
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
                roles: emp.roles.map(r => ({
                    roleId:   r.role.roleId,
                    roleCode: r.role.roleCode,  // NEW
                    roleName: r.role.roleName
                }))
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
