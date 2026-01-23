// Define the user object structure that authMiddleware attaches to req.user
export interface AuthUser {
    employeeId: number;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    address: string | null;
    dateOfBirth: Date | null;
    hireDate: Date;
    terminationDate?: Date | null;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
    roles: { roleId: number; roleName: string }[];
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
