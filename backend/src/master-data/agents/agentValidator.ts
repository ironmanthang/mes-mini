import { Joi } from '../../common/validators/common.js';

export const createAgentSchema = Joi.object({
    code: Joi.string().required().uppercase().trim().messages({
        'string.empty': 'Agent Code is required'
    }),
    agentName: Joi.string().required().trim().messages({
        'string.empty': 'Agent Name is required'
    }),
    phoneNumber: Joi.string().optional().allow(null, ''),
    email: Joi.string().email().optional().allow(null, ''),
    address: Joi.string().required().messages({
        'string.empty': 'Address is required'
    })
});

export const updateAgentSchema = Joi.object({
    code: Joi.string().uppercase().trim().optional(),
    agentName: Joi.string().trim().optional(),
    phoneNumber: Joi.string().optional().allow(null, ''),
    email: Joi.string().email().optional().allow(null, ''),
    address: Joi.string().optional()
});
