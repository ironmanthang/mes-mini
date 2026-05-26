import { Joi } from '../../common/validators/common.js';

export const createCategorySchema = Joi.object({
    categoryName: Joi.string().required().trim().messages({
        'string.empty': 'Category Name is required'
    }),
    description: Joi.string().trim().optional().allow(null, '')
});

export const updateCategorySchema = Joi.object({
    categoryName: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(null, '')
});
