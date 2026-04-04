import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { Employee } from '../../generated/prisma/index.js';
import employeeService from '../employees/employeeService.js';
import { type PermCode } from '../../common/constants/permissions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Return type contracts (explicit for API documentation)
// ─────────────────────────────────────────────────────────────────────────────

interface LoginResult {
    token: string;
    user: {
        employeeId:     number;
        username:       string;
        fullName:       string;
        email:          string;
        status:         string;
        roles:          { roleId: number; roleCode: string; roleName: string }[]; // CHANGED: + roleCode
        permissions:    PermCode[];  // NEW — flattened for frontend UI use
    };
}

interface ProfileData {
    fullName?:    string;
    phoneNumber?: string;
    address?:     string;
    dateOfBirth?: Date;
}

interface ProfileResult {
    employeeId:   number;
    fullName:     string;
    email:        string;
    phoneNumber:  string;
    address:      string | null;
    dateOfBirth:  Date | null;
    status:       string;
    roles:        { roleId: number; roleCode: string; roleName: string }[];
    permissions:  PermCode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────────────────────────────────────

class AuthService {
    /**
     * login() — Authenticate and return a JWT + enriched user payload.
     *
     * JWT Payload now includes sessionVersion.
     * protect() will compare this against the DB value on every request.
     * Incrementing sessionVersion (via force-logout) instantly kills all active tokens.
     *
     * Login Response includes a flattened `permissions` array.
     * The frontend should use this (not roleName) to conditionally render UI.
     * This decouples the UI from role strings completely.
     */
    async login(username: string, password: string): Promise<LoginResult> {
        const identifier = username.toLowerCase();

        // Load employee with roles + permissions in one query (same shape as findByIdWithPermissions)
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: { select: { permCode: true } } }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!employee) throw new Error('Invalid credentials');
        if (!(await bcrypt.compare(password, employee.password))) throw new Error('Invalid credentials');
        if (employee.status !== 'ACTIVE') throw new Error('Account is inactive. Contact admin.');

        // Sign JWT with sessionVersion included
        const token = jwt.sign(
            {
                id:             employee.employeeId,
                username:       employee.username,
                sessionVersion: employee.sessionVersion  // NEW
            },
            process.env.JWT_SECRET!,
            { expiresIn: '8h' }
        );

        // Flatten permissions across all roles (deduplicate with Set)
        const permSet = new Set<PermCode>();
        for (const er of employee.roles) {
            for (const rp of er.role.permissions) {
                permSet.add(rp.permission.permCode as PermCode);
            }
        }
        const permissions = Array.from(permSet);

        return {
            token,
            user: {
                employeeId:  employee.employeeId,
                username:    employee.username,
                fullName:    employee.fullName,
                email:       employee.email,
                status:      employee.status,
                roles: employee.roles.map(r => ({
                    roleId:   r.role.roleId,
                    roleCode: r.role.roleCode,   // NEW
                    roleName: r.role.roleName
                })),
                permissions  // NEW — frontend uses this to show/hide buttons
            }
        };
    }

    async updateProfile(id: number, data: ProfileData): Promise<ProfileResult> {
        const { fullName, phoneNumber, address, dateOfBirth } = data;

        const updated = await employeeService.updateBasicProfile(id, {
            fullName,
            phoneNumber,
            address,
            dateOfBirth
        });

        if (!updated) {
            throw new Error('Employee not found or update failed');
        }

        const userWithPerms = await employeeService.findByIdWithPermissions(updated.employeeId);

        return {
            employeeId:  updated.employeeId,
            fullName:    updated.fullName,
            email:       updated.email,
            phoneNumber: updated.phoneNumber,
            address:     updated.address,
            dateOfBirth: updated.dateOfBirth,
            status:      updated.status,
            roles:       userWithPerms?.roles ?? updated.roles,
            permissions: userWithPerms?.permissions ?? []
        };
    }

    async changePassword(id: number, oldPassword: string, newPassword: string): Promise<Employee> {
        const employee = await prisma.employee.findUnique({ where: { employeeId: id } });
        if (!employee || !(await bcrypt.compare(oldPassword, employee.password))) {
            throw new Error('Incorrect current password');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return prisma.employee.update({
            where: { employeeId: id },
            data: { password: hashedPassword }
        });
    }
}

export default new AuthService();
