import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../common/lib/prisma.js';
import type { Employee } from '../../generated/prisma/index.js';

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
    email?: string;
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
        const employee = await prisma.employee.findUnique({
            where: { username },
            include: { roles: { include: { role: true } } }
        });

        if (!employee) throw new Error('Invalid credentials');
        if (!(await bcrypt.compare(password, employee.password))) throw new Error('Invalid credentials');
        if (employee.status !== 'ACTIVE') throw new Error('Account is inactive or terminated. Contact admin.');

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
        const { fullName, email, phoneNumber, address, dateOfBirth } = data;

        if (email || phoneNumber) {
            const existing = await prisma.employee.findFirst({
                where: {
                    NOT: { employeeId: id },
                    OR: [
                        { email: email || undefined },
                        { phoneNumber: phoneNumber || undefined }
                    ]
                }
            });

            if (existing) {
                if (existing.email === email) throw new Error('Email already in use');
                if (existing.phoneNumber === phoneNumber) throw new Error('Phone number already in use');
            }
        }

        const updatedEmployee = await prisma.employee.update({
            where: { employeeId: id },
            data: {
                fullName,
                email,
                phoneNumber,
                address,
                dateOfBirth,
            },
            include: {
                roles: {
                    include: { role: true }
                }
            }
        });

        return {
            employeeId: updatedEmployee.employeeId,
            fullName: updatedEmployee.fullName,
            email: updatedEmployee.email,
            phoneNumber: updatedEmployee.phoneNumber,
            address: updatedEmployee.address,
            dateOfBirth: updatedEmployee.dateOfBirth,
            status: updatedEmployee.status,
            roles: updatedEmployee.roles.map(r => ({
                roleId: r.role.roleId,
                roleName: r.role.roleName
            }))
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
