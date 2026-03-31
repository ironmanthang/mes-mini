/**
 * AppError — Operational error class for structured HTTP error handling.
 *
 * Usage:
 *   throw new AppError('You do not have permission to view this draft.', 403);
 *
 * Controllers check:
 *   if (error instanceof AppError) res.status(error.statusCode).json({ message: error.message });
 *   else res.status(500).json({ message: 'Internal Server Error' });
 *
 * Convention: retrofit other modules to use AppError when their files are next touched.
 */
export class AppError extends Error {
    public readonly statusCode: number;

    /** True for expected operational errors (validation, 403, 404, etc.) */
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = true;

        // Maintains proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
