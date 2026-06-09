import { Joi } from '../../common/validators/common.js';

export const createWOSchema = Joi.object({
    productionRequestId: Joi.number().integer().required(),
    productId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    productionLineId: Joi.number().integer().optional() // NEW: Optional production line
});

export const updateWOSchema = Joi.object({
    productionLineId: Joi.number().integer().optional(),
    targetSalesWarehouseId: Joi.number().integer().optional(),
    targetErrorWarehouseId: Joi.number().integer().optional(),
    note: Joi.string().allow('', null).optional()
});

export const completeWOSchema = Joi.object({
    quantityProduced: Joi.number().integer().min(1).required(),
    batchCode: Joi.string().optional(),
    expiryDate: Joi.date().iso().min('now').optional(),
    warehouseId: Joi.number().integer().min(1).optional(),
    laborCost: Joi.number().min(0).required(),
    overheadCost: Joi.number().min(0).required()
});

export const cancelWOSchema = Joi.object({
    reason: Joi.string().trim().max(500).allow('', null).optional()
});
