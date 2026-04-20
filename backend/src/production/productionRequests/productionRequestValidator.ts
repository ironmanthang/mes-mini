import { Joi } from '../../common/validators/common.js';
import { Priority } from '../../generated/prisma/index.js';

export const createProductionRequestSchema = Joi.object({
    productId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    priority: Joi.string().valid(...Object.values(Priority)).default(Priority.MEDIUM),
    dueDate: Joi.date().iso().min('now').optional(),
    soDetailId: Joi.number().integer().optional(),
    note: Joi.string().max(500).optional(),
    asDraft: Joi.boolean().optional().default(true)
});
