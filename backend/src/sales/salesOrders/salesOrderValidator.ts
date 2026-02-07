import { Joi } from '../../common/validators/common.js';
import { SalesOrderStatus, Priority } from '../../generated/prisma/index.js';

export const createSOSchema = Joi.object({
    code: Joi.string().optional().uppercase().trim(), // Optional for auto-gen
    agentId: Joi.number().integer().required(),
    orderDate: Joi.date().iso().default(() => new Date()),
    expectedShipDate: Joi.date().iso().min('now').optional().allow(null),
    status: Joi.string().valid(
        SalesOrderStatus.DRAFT,
        SalesOrderStatus.PENDING_APPROVAL
    ).default(SalesOrderStatus.DRAFT),

    // Financials
    discount: Joi.number().min(0).default(0),
    agentShippingPrice: Joi.number().min(0).default(0),
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
    priority: Joi.string().valid(...Object.values(Priority)).default(Priority.MEDIUM),

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
    agentShippingPrice: Joi.number().min(0).optional(),
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
    priority: Joi.string().valid(...Object.values(Priority)).optional(),

    // Can change status from DRAFT -> PENDING_APPROVAL // REMOVED: Status must be changed via dedicated endpoints

    // Allow updating Line Items (Full Replacement)
    details: Joi.array().items(
        Joi.object({
            productId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            salePrice: Joi.number().min(0).required()
        })
    ).optional().min(1)
});

export const shipOSchema = Joi.object({
    shipments: Joi.array().items(
        Joi.object({
            productId: Joi.number().integer().required(),
            serialNumbers: Joi.array().items(Joi.string().required()).min(1).required()
        })
    ).min(1).required(),
    courierShippingCost: Joi.number().min(0).optional()
});

export const cancelSOSchema = Joi.object({
    reason: Joi.string().trim().min(5).required()
});
