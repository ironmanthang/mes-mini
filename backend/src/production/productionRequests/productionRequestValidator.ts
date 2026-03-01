import { Joi } from '../../common/validators/common.js';

export const createProductionRequestSchema = Joi.object({
    productId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
    dueDate: Joi.date().iso().min('now').optional(),
    soDetailId: Joi.number().integer().optional(),
    note: Joi.string().max(500).optional()
});
