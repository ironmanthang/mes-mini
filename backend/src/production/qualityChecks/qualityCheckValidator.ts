import { Joi } from '../../common/validators/common.js';

export const createCheckSchema = Joi.object({
    serialNumber: Joi.string().required(),
    checkDate: Joi.date().iso().default(Date.now),
    notes: Joi.string().allow('', null).optional(),
    inspectionResults: Joi.array().items(
        Joi.object({
            inspectionPointId: Joi.number().integer().required(),
            passed: Joi.boolean().required(),
            notes: Joi.string().allow('', null).optional()
        })
    ).min(1).required()
});
