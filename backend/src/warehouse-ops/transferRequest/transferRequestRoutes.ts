import { Router } from 'express';
import {
    createTransfer,
    completeTransfer,
    getAllTransfers,
    getTransferById
} from './transferRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createTransferSchema, completeTransferSchema } from './transferRequestValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.TR_READ),
    getAllTransfers
);

router.post('/',
    authorize(PERM.TR_MANAGE),
    validate(createTransferSchema),
    createTransfer
);

router.get('/:id',
    authorize(PERM.TR_READ),
    getTransferById
);

router.put('/:id/complete',
    authorize(PERM.TR_MANAGE),
    validate(completeTransferSchema),
    completeTransfer
);

/**
 * @swagger
 * tags:
 *   name: Transfer Requests
 *   description: Warehouse-to-Warehouse Relocations
 */

/**
 * @swagger
 * /api/warehouse-ops/transfer-requests:
 *   get:
 *     summary: List all Transfer Requests
 *     tags: [Transfer Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, COMPLETED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of transfer requests
 */

/**
 * @swagger
 * /api/warehouse-ops/transfer-requests:
 *   post:
 *     summary: Create a Transfer Request
 *     description: Plan a warehouse-to-warehouse relocation. Source and target must be the same warehouse type.
 *     tags: [Transfer Requests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceWarehouseId, targetWarehouseId, entityType, details]
 *             properties:
 *               sourceWarehouseId: { type: integer }
 *               targetWarehouseId: { type: integer }
 *               entityType: { type: string, enum: [COMPONENT, PRODUCT] }
 *               note: { type: string }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [entityId, quantity]
 *                   properties:
 *                     entityId: { type: integer, description: "componentId or productId" }
 *                     quantity: { type: integer }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/warehouse-ops/transfer-requests/{id}:
 *   get:
 *     summary: Get Transfer Request details
 *     tags: [Transfer Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transfer request with details
 *       400:
 *         description: Not found
 */

/**
 * @swagger
 * /api/warehouse-ops/transfer-requests/{id}/complete:
 *   put:
 *     summary: Complete Transfer (Barcode Scan Required)
 *     description: |
 *       Atomically moves physical items between warehouses.
 *       Requires scanning every lot (components) or serial number (products).
 *     tags: [Transfer Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scannedItems]
 *             properties:
 *               scannedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [detailId]
 *                   properties:
 *                     detailId: { type: integer }
 *                     lots:
 *                       type: array
 *                       description: For COMPONENT transfers only
 *                       items:
 *                         type: object
 *                         properties:
 *                           lotCode: { type: string }
 *                           quantity: { type: integer }
 *                     instances:
 *                       type: array
 *                       description: For PRODUCT transfers only
 *                       items:
 *                         type: object
 *                         properties:
 *                           serialNumber: { type: string }
 *     responses:
 *       200:
 *         description: Transfer completed, items moved
 *       400:
 *         description: Validation or scan mismatch error
 */

export default router;
