import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove extra fields that aren't in the schema
        });

        if (error) {
            // Format error messages nicely
            const errorMessage = error.details.map((detail) => detail.message).join('. ');
            res.status(400).json({ message: errorMessage });
            return;
        }

        // Replace req.body with the cleaned/converted data
        req.body = value;
        next();
    };
};

export default validate;
