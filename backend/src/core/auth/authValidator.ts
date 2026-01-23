import { Joi, phonePattern } from '../../common/validators/common.js';

export const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

export const profileUpdateSchema = Joi.object({
    fullName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().pattern(phonePattern).optional().messages({
        'string.pattern.base': 'Phone number must be 10-15 digits'
    }),
    address: Joi.string().optional(),
    dateOfBirth: Joi.date().iso().optional()
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
});
