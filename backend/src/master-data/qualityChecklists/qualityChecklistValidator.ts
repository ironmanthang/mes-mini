import { Joi } from '../../common/validators/common.js';

const inspectionPointSchema = Joi.object({
    pointName: Joi.string().required().trim(),
    description: Joi.string().trim().optional().allow(null, ''),
    sortOrder: Joi.number().integer().optional().default(0)
});

export const createChecklistSchema = Joi.object({
    checklistName: Joi.string().required().trim(),
    description: Joi.string().trim().optional().allow(null, ''),
    points: Joi.array().items(inspectionPointSchema).optional()
});

export const updateChecklistSchema = Joi.object({
    checklistName: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(null, '')
});

export const createPointSchema = inspectionPointSchema;

export const updatePointSchema = Joi.object({
    pointName: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(null, ''),
    sortOrder: Joi.number().integer().optional()
});
