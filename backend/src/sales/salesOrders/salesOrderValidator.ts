import { Joi } from '../../common/validators/common.js';

export const createSOSchema = Joi.object({
    code: Joi.string().required().uppercase().trim().messages({
        'string.empty': 'SO Number (Code) is required'
    }),
    agentId: Joi.number().integer().required(),
    orderDate: Joi.date().iso().default(() => new Date()),
    expectedShipDate: Joi.date().iso().min('now').optional().allow(null),
    status: Joi.string().valid('DRAFT', 'PENDING').default('DRAFT'),

    // Financials
    discount: Joi.number().min(0).default(0),
    shippingCost: Joi.number().min(0).default(0),
    tax: Joi.number().min(0).default(0),

    // Terms
    paymentTerms: Joi.string().valid(
        'Net 30',
        'Due upon receipt',
        '50% Advance, 50% on delivery',
        'COD - Cash on Delivery'
    ).optional().allow(null, ''),
    deliveryTerms: Joi.string().valid(
        'FOB - Free On Board',
        'CIF - Cost, Insurance and Freight',
        'EXW - Ex Works',
        'DDP - Delivered Duty Paid'
    ).optional().allow(null, ''),
    note: Joi.string().optional().allow(null, ''),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),

    // The Items List
    details: Joi.array().items(
        Joi.object({
            productId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            salePrice: Joi.number().min(0).required()
        })
    ).min(1).required().messages({
        'array.min': 'Sales Order must have at least one item'
    })
});

export const updateSOSchema = Joi.object({
    expectedShipDate: Joi.date().iso().min('now').optional().allow(null),
    discount: Joi.number().min(0).optional(),
    shippingCost: Joi.number().min(0).optional(),
    tax: Joi.number().min(0).optional(),
    paymentTerms: Joi.string().valid(
        'Net 30',
        'Due upon receipt',
        '50% Advance, 50% on delivery',
        'COD - Cash on Delivery'
    ).optional().allow(null, ''),
    deliveryTerms: Joi.string().valid(
        'FOB - Free On Board',
        'CIF - Cost, Insurance and Freight',
        'EXW - Ex Works',
        'DDP - Delivered Duty Paid'
    ).optional().allow(null, ''),
    note: Joi.string().optional().allow(null, ''),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').optional(),

    // Can change status from DRAFT -> PENDING
    status: Joi.string().valid('DRAFT', 'PENDING', 'CANCELLED').optional(),
});
