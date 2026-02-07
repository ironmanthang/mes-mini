import { Joi } from '../../common/validators/common.js';

export const createSessionSchema = Joi.object({
    warehouseId: Joi.number().required(),
    description: Joi.string().optional()
});

export const updateCountSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            componentId: Joi.number().required(),
            actualQuantity: Joi.number().min(0).required(),
            notes: Joi.string().optional()
        })
    ).min(1).required()
});
