import { Joi } from '../../common/validators/common.js';

export const createComponentSchema = Joi.object({
    code: Joi.string().uppercase().trim().required().messages({
        'string.empty': 'Component Code is required (e.g., SCREW-001)'
    }),
    componentName: Joi.string().trim().required(),
    description: Joi.string().optional().allow(null, ''),
    unit: Joi.string().required().valid('pcs', 'kg', 'm', 'l', 'set').messages({
        'any.only': 'Unit must be one of: pcs, kg, m, l, set'
    }),
    minStockLevel: Joi.number().integer().min(0).default(0),
    standardCost: Joi.number().min(0).default(0)
});


export const updateComponentSchema = Joi.object({
    code: Joi.string().uppercase().trim().optional(),
    componentName: Joi.string().trim().optional(),
    description: Joi.string().optional().allow(null, ''),
    unit: Joi.string().valid('pcs', 'kg', 'm', 'l', 'set').optional(),
    minStockLevel: Joi.number().integer().min(0).optional(),
    standardCost: Joi.number().min(0).optional()
});
