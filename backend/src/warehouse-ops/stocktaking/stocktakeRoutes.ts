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
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.post('/',
    authorize(PERM.ST_CREATE),
    validate(createSessionSchema),
    createSession
);

router.get('/:id',
    authorize(PERM.ST_READ),
    getSessionById
);

router.post('/:id/items',
    authorize(PERM.ST_CREATE),
    validate(updateCountSchema),
    updateCount
);

router.post('/:id/finalize',
    authorize(PERM.ST_COMPLETE),
    finalizeSession
);

router.get('/:id/variance',
    authorize(PERM.ST_COMPLETE),
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
 * /api/warehouse-ops/stocktaking:
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
