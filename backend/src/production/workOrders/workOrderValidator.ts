import { Joi } from '../../common/validators/common.js';

export const createWOSchema = Joi.object({
    productionRequestId: Joi.number().integer().required(),
    productId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    productionLineId: Joi.number().integer().optional() // NEW: Optional production line
});

export const completeWOSchema = Joi.object({
    quantityProduced: Joi.number().integer().min(1).required(),
    batchCode: Joi.string().optional(),
    expiryDate: Joi.date().iso().min('now').optional()
});
