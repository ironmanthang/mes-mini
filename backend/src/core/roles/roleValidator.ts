import { Joi } from '../../common/validators/common.js';

export const roleCreateSchema = Joi.object({
    roleCode: Joi.string().trim().uppercase().min(1).optional().messages({
        'string.empty': 'Role code cannot be empty'
    }),
    roleName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Role name cannot be empty',
        'any.required': 'Role name is required'
    })
});

export const roleUpdateSchema = Joi.object({
    roleCode: Joi.string().trim().uppercase().min(1).optional(),
    roleName: Joi.string().trim().min(1).optional()
}).min(1);
