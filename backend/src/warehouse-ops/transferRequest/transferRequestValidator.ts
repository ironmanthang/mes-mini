import { Joi } from '../../common/validators/common.js';

export const createTransferSchema = Joi.object({
    sourceWarehouseId: Joi.number().integer().positive().required(),
    targetWarehouseId: Joi.number().integer().positive().required(),
    entityType: Joi.string().valid('COMPONENT', 'PRODUCT').required(),
    note: Joi.string().allow('', null).optional(),
    details: Joi.array().items(
        Joi.object({
            entityId: Joi.number().integer().positive().required(),
            quantity: Joi.number().integer().positive().required()
        })
    ).min(1).required()
});

export const completeTransferSchema = Joi.object({
    scannedItems: Joi.array().items(
        Joi.object({
            detailId: Joi.number().integer().positive().required(),
            lots: Joi.array().items(
                Joi.object({
                    lotCode: Joi.string().required(),
                    quantity: Joi.number().integer().positive().required()
                })
            ).optional(),
            instances: Joi.array().items(
                Joi.object({
                    serialNumber: Joi.string().required()
                })
            ).optional()
        })
    ).min(1).required()
});
