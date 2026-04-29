import { Joi } from '../../common/validators/common.js';

export const createCheckSchema = Joi.object({
    serialNumber: Joi.string().required(),
    checkDate: Joi.date().iso().default(Date.now),
    result: Joi.string().valid('PASSED', 'FAILED').required(),
    notes: Joi.string().allow('', null).optional()
});
