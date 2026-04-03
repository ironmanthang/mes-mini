import { Joi, phonePattern } from '../../common/validators/common.js';
import { EmployeeStatus } from '../../generated/prisma/index.js';

export const employeeCreateSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().pattern(phonePattern).required().messages({
        'string.pattern.base': 'Phone number must be 10-15 digits'
    }),
    province: Joi.string().required(),
    ward: Joi.string().required(),
    street: Joi.string().required(),
    dateOfBirth: Joi.date().iso().optional(),
    hireDate: Joi.date().iso().required(),
    status: Joi.string().valid(EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE).optional(),
    roleIds: Joi.array().items(Joi.number().integer()).min(1).required().messages({
        'array.min': 'A new employee must be assigned at least one role'
    })
});

export const employeeUpdateSchema = Joi.object({
    fullName: Joi.string().optional(),
    // email and username are explicitly NOT allowed here per strict read-only rule
    phoneNumber: Joi.string().pattern(phonePattern).optional(),
    province: Joi.string().optional(),
    ward: Joi.string().optional(),
    street: Joi.string().optional(),
    dateOfBirth: Joi.date().iso().optional().allow(null),
    hireDate: Joi.date().iso().optional(),
    terminationDate: Joi.date().iso().optional().allow(null),
    status: Joi.string().valid(...Object.values(EmployeeStatus)).optional(),
    roleIds: Joi.array().items(Joi.number().integer()).min(1).optional()
});

export const statusUpdateSchema = Joi.object({
    status: Joi.string().valid(...Object.values(EmployeeStatus)).required()
});
