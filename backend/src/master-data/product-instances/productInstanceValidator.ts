import { Joi } from '../../common/validators/common.js';
import { ProductInstanceStatus } from '../../generated/prisma/index.js';

export const productInstanceQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(ProductInstanceStatus))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(ProductInstanceStatus).join(', ')}`
        }),
    productId: Joi.number().integer().positive().optional(),
    warehouseId: Joi.number().integer().positive().optional(),
    productionRequestId: Joi.number().integer().positive().optional(),
    workOrderId: Joi.number().integer().positive().optional(),
    serialNumber: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
});
