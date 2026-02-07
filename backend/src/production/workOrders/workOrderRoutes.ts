import { Router } from 'express';
import {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    startWorkOrder,
    completeWorkOrder
} from './workOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createWOSchema, completeWOSchema } from './workOrderValidator.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('Production Manager', 'System Admin'),
    getAllWorkOrders
);

router.post('/',
    authorize('Production Manager'),
    validate(createWOSchema),
    createWorkOrder
);

router.get('/:id',
    authorize('Production Manager', 'System Admin'),
    getWorkOrderById
);

router.put('/:id/start',
    authorize('Production Manager'),
    startWorkOrder
);

router.put('/:id/complete',
    authorize('Production Manager'),
    validate(completeWOSchema),
    completeWorkOrder
);

/**
 * @swagger
 * tags:
 *   name: Work Orders
 *   description: Managing production execution (The Factory Floor)
 */

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: List all Work Orders
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of WOs
 */

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: Create a Work Order (Plan)
 *     description: Links to a Production Request
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productionRequestId, productId, quantity]
 *             properties:
 *               productionRequestId: { type: integer }
 *               productId: { type: integer }
 *               quantity: { type: integer }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/work-orders/{id}/start:
 *   put:
 *     summary: Start Production (Move to In Progress)
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Started
 */

/**
 * @swagger
 * /api/work-orders/{id}/complete:
 *   put:
 *     summary: Complete Production (Store Info)
 *     description: Completes the WO (Does NO Inventory updates yet - mocked)
 *     tags: [Work Orders]
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
 *             required: [quantityProduced]
 *             properties:
 *               quantityProduced: { type: integer }
 *               batchCode: { type: string, description: "Optional custom batch code" }
 *               expiryDate: { type: string, format: "date", description: "Optional expiry date" }
 *     responses:
 *       200:
 *         description: Completed
 */

export default router;
