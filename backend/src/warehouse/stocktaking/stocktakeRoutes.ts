import { Router } from 'express';
import {
    createSession,
    getSessionById,
    updateCount,
    finalizeSession,
    getVariance
} from './stocktakeController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createSessionSchema, updateCountSchema } from './stocktakeValidator.js';

const router = Router();

router.use(protect);

router.post('/',
    authorize('System Admin', 'Warehouse Keeper', 'Warehouse Manager'),
    validate(createSessionSchema),
    createSession
);

router.get('/:id',
    authorize('System Admin', 'Warehouse Keeper', 'Warehouse Manager'),
    getSessionById
);

router.post('/:id/items',
    authorize('System Admin', 'Warehouse Keeper', 'Warehouse Manager'),
    validate(updateCountSchema),
    updateCount
);

router.post('/:id/finalize',
    authorize('System Admin', 'Warehouse Manager'),
    finalizeSession
);

router.get('/:id/variance',
    authorize('System Admin', 'Warehouse Manager'),
    getVariance
);

/**
 * @swagger
 * tags:
 *   name: Stocktaking
 *   description: Inventory counting sessions
 */

/**
 * @swagger
 * /api/warehouse/stocktaking:
 *   post:
 *     summary: Start a new stocktake session
 *     tags: [Stocktaking]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId]
 *             properties:
 *               warehouseId: { type: integer }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Session created
 */

export default router;
