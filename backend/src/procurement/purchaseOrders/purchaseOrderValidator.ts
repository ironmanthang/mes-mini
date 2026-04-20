import { Joi } from '../../common/validators/common.js';
import { PurchaseOrderStatus } from '../../generated/prisma/index.js';

export const createPOSchema = Joi.object({
    // code intentionally removed — system-generated (Two-State Numbering)
    supplierId: Joi.number().integer().required(),
    warehouseId: Joi.number().integer().required(),
    orderDate: Joi.date().iso().default(() => new Date()),
    // Only DRAFT or PENDING allowed at creation time (Decision #8 / B11)
    status: Joi.string().valid(
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PENDING
    ).default(PurchaseOrderStatus.DRAFT),
    expectedDeliveryDate: Joi.date().iso().min('now').optional().allow(null),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').optional(),

    // Financials
    shippingCost: Joi.number().min(0).default(0),
    taxRate: Joi.number().min(0).max(100).default(0),
    paymentTerms: Joi.string().valid(
        'Net 30',
        'Due upon receipt',
        '50% Advance, 50% on delivery'
    ).optional().allow(null, ''),
    deliveryTerms: Joi.string().valid(
        'FOB - Free On Board',
        'CIF - Cost, Insurance and Freight',
        'EXW - Ex Works',
        'DDP - Delivered Duty Paid'
    ).optional().allow(null, ''),
    note: Joi.string().optional().allow(null, ''),

    // The Items List
    details: Joi.array().items(
        Joi.object({
            componentId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
            // productionRequestId: optional PR link for BOM traceability (B5 fix)
            productionRequestId: Joi.number().integer().positive().optional().allow(null)
        })
    ).min(1).required().messages({
        'array.min': 'Purchase Order must have at least one item'
    })
});

export const updatePOSchema = Joi.object({
    expectedDeliveryDate: Joi.date().iso().min('now').optional().allow(null),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').optional(),
    warehouseId: Joi.number().integer().optional(),
    shippingCost: Joi.number().min(0).optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    paymentTerms: Joi.string().valid(
        'Net 30',
        'Due upon receipt',
        '50% Advance, 50% on delivery'
    ).optional().allow(null, ''),
    deliveryTerms: Joi.string().valid(
        'FOB - Free On Board',
        'CIF - Cost, Insurance and Freight',
        'EXW - Ex Works',
        'DDP - Delivered Duty Paid'
    ).optional().allow(null, ''),
    note: Joi.string().optional().allow(null, ''),
    details: Joi.array().items(
        Joi.object({
            componentId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
            productionRequestId: Joi.number().integer().positive().optional().allow(null)
        })
    ).min(1).optional().messages({
        'array.min': 'Purchase Order must have at least one item'
    })
    // status intentionally removed — use dedicated command endpoints (Decision #16 / B6 fix)
});

// No body needed for submit — the endpoint is a pure command (POST /:id/submit)
export const submitPOSchema = Joi.object({});

export const sendToSupplierSchema = Joi.object({
    note: Joi.string().optional().allow(null, '')
});

// Cancel (PENDING/APPROVED states only — soft delete preserving audit trail)
export const cancelPOSchema = Joi.object({
    note: Joi.string().optional().allow(null, '')
});

// Receive goods — each item = one physical box = one ComponentLot
export const receiveGoodsSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            componentId: Joi.number().integer().required(),
            initialQuantity: Joi.number().integer().min(1).required(),
            warehouseId: Joi.number().integer().required()
        })
    ).min(1).required().messages({
        'array.min': 'At least one item is required for receiving'
    })
});

// ── Attachment schemas ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
] as const;

const ATTACHMENT_CATEGORIES = ['CONTRACT', 'INVOICE', 'PACKING_SLIP', 'INSPECTION', 'OTHER'] as const;

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Step 1: Request a presigned upload URL.
 * Backend validates metadata and returns a time-limited PUT URL.
 * No file bytes ever touch the backend.
 */
export const requestUploadSchema = Joi.object({
    fileName: Joi.string().max(255).required(),
    mimeType: Joi.string().valid(...ALLOWED_MIME_TYPES).required().messages({
        'any.only': `File type is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`
    }),
    fileSize: Joi.number().integer().min(1).max(MAX_FILE_SIZE_BYTES).required().messages({
        'number.max': 'File size exceeds the 20 MB limit.'
    }),
    category: Joi.string().valid(...ATTACHMENT_CATEGORIES).default('OTHER'),
});

/**
 * Step 2: Confirm upload is complete.
 * Called by frontend after successfully PUTting the file to R2.
 * Creates the DB record.
 */
export const confirmUploadSchema = Joi.object({
    fileKey:  Joi.string().max(1024).required(),
    fileName: Joi.string().max(255).required(),
    mimeType: Joi.string().valid(...ALLOWED_MIME_TYPES).required(),
    fileSize: Joi.number().integer().min(1).max(MAX_FILE_SIZE_BYTES).required(),
    category: Joi.string().valid(...ATTACHMENT_CATEGORIES).default('OTHER'),
});
