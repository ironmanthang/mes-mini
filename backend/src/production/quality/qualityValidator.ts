import { Joi } from '../../common/validators/common.js';

export const createCheckSchema = Joi.object({
    workOrderId: Joi.number().optional(),
    productId: Joi.number().required(),
    checkDate: Joi.date().iso().default(Date.now),
    passed: Joi.boolean().required(),
    notes: Joi.string().allow('', null).optional()
});
