import { Joi } from '../../common/validators/common.js';

export const createProductSchema = Joi.object({
    code: Joi.string().required().uppercase().trim().messages({
        'string.empty': 'Product Code is required'
    }),
    productName: Joi.string().required().trim().messages({
        'string.empty': 'Product Name is required'
    }),
    unit: Joi.string().required().messages({
        'string.empty': 'Unit is required'
    }),
    categoryId: Joi.number().integer().optional().allow(null)
});

export const updateProductSchema = Joi.object({
    code: Joi.string().uppercase().trim().optional(),
    productName: Joi.string().trim().optional(),
    unit: Joi.string().optional(),
    categoryId: Joi.number().integer().optional().allow(null)
});

export const addBomComponentSchema = Joi.object({
    componentId: Joi.number().integer().required().messages({
        'number.base': 'Component ID must be a number',
        'any.required': 'Component ID is required'
    }),
    quantityNeeded: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity needed is required'
    })
});

export const updateBomComponentSchema = Joi.object({
    quantityNeeded: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity needed is required'
    })
});

export const checkFeasibilitySchema = Joi.object({
    quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
    })
});

