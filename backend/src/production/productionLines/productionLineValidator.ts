import { Joi } from '../../common/validators/common.js';

export const createProductionLineSchema = Joi.object({
    lineName: Joi.string().min(2).max(100).required(),
    location: Joi.string().max(200).optional()
});

export const updateProductionLineSchema = Joi.object({
    lineName: Joi.string().min(2).max(100).optional(),
    location: Joi.string().max(200).optional().allow(null, '')
});
