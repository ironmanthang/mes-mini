import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import EmployeeService from '../../core/employees/employeeService.js';
import { type PermCode } from '../constants/permissions.js';

/**
 * JwtPayload — what we encode into the JWT at login time.
 *
 * Adding sessionVersion here allows protect() to detect if a token has been
 * invalidated (e.g., via force-logout) without needing Redis or a blacklist.
 * If the DB's sessionVersion > JWT's sessionVersion → token is stale → 401.
 */
interface JwtPayload {
    id:             number;
    username:       string;
    sessionVersion: number;  // NEW — JWT invalidation counter
}

/**
 * protect() — Authentication middleware.
 *
 * Single DB round-trip strategy:
 *   Calls findByIdWithPermissions() which uses a deeply nested Prisma .select
 *   to load Employee + Roles + Permissions in ONE query (~1-3ms).
 *   All subsequent authorize() calls are pure in-memory checks — zero extra DB.
 *
 * Flow:
 *   1. Extract Bearer token
 *   2. jwt.verify() → { id, username, sessionVersion }
 *   3. Single DB query: Employee + roles + permissions
 *   4. Status check (ACTIVE)
 *   5. sessionVersion check (token invalidation)
 *   6. Attach user (with flattened permissions) to req.user → next()
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

            // Single optimized query — loads roles + permissions in one round-trip
            const user = await EmployeeService.findByIdWithPermissions(decoded.id);

            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            // Check if user is active
            if (user.status !== 'ACTIVE') {
                res.status(403).json({ message: 'Access denied. Account is not active.' });
                return;
            }

            // Session version check — instantly invalidates all tokens after force-logout
            // If admin calls PATCH /employees/:id/force-logout, DB sessionVersion increments.
            // Any token signed with the old version is rejected here.
            if (user.sessionVersion !== decoded.sessionVersion) {
                res.status(401).json({ message: 'Session expired. Please log in again.' });
                return;
            }

            req.user = user;
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

/**
 * authorize() — Authorization middleware (synchronous, zero DB queries).
 *
 * Accepts one or more PermCode values. Uses OR logic:
 *   authorize(PERM.PO_READ, PERM.PO_CREATE) — user needs AT LEAST ONE of these.
 *
 * This matches the behavior of the old role-based authorize():
 *   authorize('Admin', 'Manager') meant "Admin OR Manager".
 *
 * The user's permissions array is already loaded in memory by protect().
 * This check is O(n·m) where n = user permissions (~40 max) and m = required perms (typically 1-2).
 * Effectively O(1) — identical cost to the old roleName string check.
 *
 * No SYS_ADMIN wildcard bypass. Admin gets access only because the seed explicitly
 * assigns every permission to SYS_ADMIN. This maintains full transparency in the
 * Permission Management UI.
 */
export const authorize = (...requiredPerms: PermCode[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.permissions) {
            res.status(403).json({ message: 'Forbidden: No permissions loaded' });
            return;
        }

        // OR logic: user needs at least one of the required permissions
        const hasPerm = requiredPerms.some(p => req.user!.permissions.includes(p));

        if (!hasPerm) {
            res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
            return;
        }

        next();
    };
};
