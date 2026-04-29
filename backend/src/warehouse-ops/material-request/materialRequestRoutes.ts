import { Router } from 'express';
import {
    getAllRequests,
    getRequestById,
    validateRequest,
    completeRequest,
    getDispatchSlip
} from './materialRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.MR_READ),
    getAllRequests
);

router.get('/:id',
    authorize(PERM.MR_READ),
    getRequestById
);

router.put('/:id/validate',
    authorize(PERM.MR_APPROVE),
    validateRequest
);

router.put('/:id/complete',
    authorize(PERM.MR_APPROVE),
    completeRequest
);


router.get('/:id/slip',
    authorize(PERM.MR_READ),
    getDispatchSlip
);

/**
 * @swagger
 * tags:
 *   name: Material Requests
 *   description: Warehouse Material Issue for Production
 */

/**
 * @swagger
 * /api/warehouse-ops/material-requests:
 *   get:
 *     summary: List all Material Requests (from Production)
 *     tags: [Material Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ISSUED, CANCELLED] }
 *     responses:
 *       200:
 *         description: List of requests
 */

/**
 * @swagger
 * /api/warehouse-ops/material-requests/{id}/validate:
 *   put:
 *     summary: Validate Material Availability
 *     description: Read-only stock sufficiency check for each request line.
 *     tags: [Material Requests]
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
 *             required: [warehouseId]
 *             properties:
 *               warehouseId: { type: integer }
 *     responses:
 *       200:
 *         description: Validation preview
 *       400:
 *         description: Invalid request or status
 */

/**
 * @swagger
 * /api/warehouse-ops/material-requests/{id}/complete:
 *   put:
 *     summary: Complete Material Issue (Deduct Stock)
 *     description: Atomically decrements stock and writes inventory transactions, then marks request ISSUED.
 *     tags: [Material Requests]
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
 *             required: [warehouseId, consumedLots]
 *             properties:
 *               warehouseId: { type: integer }
 *               consumedLots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [componentId, lotCode, quantity]
 *                   properties:
 *                     componentId: { type: integer }
 *                     lotCode: { type: string }
 *                     quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Stock deducted, request issued
 *       400:
 *         description: Insufficient Stock or invalid lots
 */


/**
 * @swagger
 * /api/warehouse-ops/material-requests/{id}/slip:
 *   get:
 *     summary: Get Dispatch Slip for Printing
 *     description: Returns formatted data for material dispatch slip
 *     tags: [Material Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dispatch slip data
 *       404:
 *         description: Request not found or not approved
 */

export default router;
