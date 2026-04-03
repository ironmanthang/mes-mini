import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { Employee } from '../../generated/prisma/index.js';
import employeeService from '../employees/employeeService.js';

// Define return types
interface LoginResult {
    token: string;
    user: {
        employeeId: number;
        username: string;
        fullName: string;
        email: string;
        status: string;
        roles: { roleId: number; roleName: string }[];
    };
}

interface ProfileData {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
}

interface ProfileResult {
    employeeId: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string | null;
    dateOfBirth: Date | null;
    status: string;
    roles: { roleId: number; roleName: string }[];
}

class AuthService {
    async login(username: string, password: string): Promise<LoginResult> {
        const identifier = username.toLowerCase();
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            },
            include: { roles: { include: { role: true } } }
        });

        if (!employee) throw new Error('Invalid credentials');
        if (!(await bcrypt.compare(password, employee.password))) throw new Error('Invalid credentials');
        if (employee.status !== 'ACTIVE') throw new Error('Account is inactive. Contact admin.');

        const token = jwt.sign(
            { id: employee.employeeId, username: employee.username },
            process.env.JWT_SECRET!,
            { expiresIn: '8h' }
        );

        return {
            token,
            user: {
                employeeId: employee.employeeId,
                username: employee.username,
                fullName: employee.fullName,
                email: employee.email,
                status: employee.status,
                roles: employee.roles.map(r => ({
                    roleId: r.role.roleId,
                    roleName: r.role.roleName
                }))
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

        return {
            employeeId: updated.employeeId,
            fullName: updated.fullName,
            email: updated.email,
            phoneNumber: updated.phoneNumber,
            address: updated.address,
            dateOfBirth: updated.dateOfBirth,
            status: updated.status,
            roles: updated.roles
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
