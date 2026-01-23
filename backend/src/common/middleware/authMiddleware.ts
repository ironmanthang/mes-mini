import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import EmployeeService from '../../core/employees/employeeService.js';

interface JwtPayload {
    id: number;
    username: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
            const user = await EmployeeService.findById(decoded.id);
            req.user = user ?? undefined; // Convert null to undefined
            if (!req.user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            // 2. Check if user is active
            if (req.user.status !== 'ACTIVE') {
                res.status(403).json({ message: 'Access denied. Account is not active.' });
                return;
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.roles) {
            res.status(403).json({ message: 'Forbidden: No roles assigned' });
            return;
        }

        // Check if ANY of the user's roles match ANY of the allowed roles
        const hasPermission = req.user.roles.some(userRole =>
            allowedRoles.includes(userRole.roleName)
        );

        if (!hasPermission) {
            res.status(403).json({ message: 'Forbidden: You do not have permission to access this route' });
            return;
        }
        next();
    };
};
