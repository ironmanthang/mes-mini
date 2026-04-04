import { PermCode } from '../constants/permissions.js';

/**
 * AuthUser — shape of the user object attached to req.user by protect() middleware.
 *
 * Changes from v1:
 *  - roles: added `roleCode` (immutable system identifier) alongside existing `roleName`
 *  - sessionVersion: used by protect() to invalidate sessions instantly without Redis
 *  - permissions: flattened array of permCodes loaded eagerly from DB in a single query.
 *    authorize() reads this synchronously — zero extra DB round-trips per request.
 */
export interface AuthUser {
    employeeId:      number;
    fullName:        string;
    username:        string;
    email:           string;
    phoneNumber:     string;
    address:         string | null;
    dateOfBirth:     Date | null;
    hireDate:        Date;
    terminationDate?: Date | null;
    status:          string;
    createdAt?:      Date;
    updatedAt?:      Date;
    sessionVersion:  number;                                            // NEW — JWT version counter
    roles:           { roleId: number; roleCode: string; roleName: string }[]; // CHANGED — added roleCode
    permissions:     PermCode[];                                        // NEW — flattened, loaded by protect()
}

// Extend Express Request to include our user type
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export { };
