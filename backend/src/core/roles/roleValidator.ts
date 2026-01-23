import { Joi } from '../../common/validators/common.js';

export const roleSchema = Joi.object({
    roleName: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Role name cannot be empty',
        'any.required': 'Role name is required'
    })
});
