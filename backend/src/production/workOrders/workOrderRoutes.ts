import { Router } from 'express';
import {
    createWorkOrder,
    updateWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    releaseWorkOrder,
    startWorkOrder,
    completeWorkOrder,
    cancelWorkOrder
} from './workOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createWOSchema, updateWOSchema, completeWOSchema, cancelWOSchema } from './workOrderValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.WO_READ),
    getAllWorkOrders
);

router.post('/',
    authorize(PERM.WO_CREATE),
    validate(createWOSchema),
    createWorkOrder
);

router.get('/:id',
    authorize(PERM.WO_READ),
    getWorkOrderById
);

router.put('/:id',
    authorize(PERM.WO_UPDATE),
    validate(updateWOSchema),
    updateWorkOrder
);

router.put('/:id/release',
    authorize(PERM.WO_UPDATE),
    releaseWorkOrder
);

router.put('/:id/start',
    authorize(PERM.WO_UPDATE),
    startWorkOrder
);

router.put('/:id/complete',
    authorize(PERM.WO_COMPLETE),
    validate(completeWOSchema),
    completeWorkOrder
);

router.put('/:id/cancel',
    authorize(PERM.WO_UPDATE),
    validate(cancelWOSchema),
    cancelWorkOrder
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
 *         schema: 
 *           type: string
 *           enum: [DRAFT, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of WOs
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: Create a Work Order (Plan)
 *     description: Links to a Production Request. Can optionally assign a production line.
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
 *               quantity: { type: integer, minimum: 1 }
 *               productionLineId: { type: integer, description: "Optional production line assignment" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Invalid data or Production Request status
 */

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     summary: Get Work Order details
 *     description: Includes linked Material Request, Production Batches, and Fulfillments.
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Work Order details
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/work-orders/{id}:
 *   put:
 *     summary: Update Work Order configuration
 *     description: Used to set target warehouses and production lines while in DRAFT.
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
 *             properties:
 *               productionLineId: { type: integer }
 *               targetSalesWarehouseId: { type: integer }
 *               targetErrorWarehouseId: { type: integer }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Invalid state (not DRAFT) or invalid IDs
 *       404:
 *         description: Work Order not found
 */

/**
 * @swagger
 * /api/work-orders/{id}/release:
 *   put:
 *     summary: Release Work Order (DRAFT -> RELEASED)
 *     description: Requires target warehouses (Sales and Error) to be configured for QC routing.
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Released
 *       400:
 *         description: Missing warehouse configuration or invalid status
 */

/**
 * @swagger
 * /api/work-orders/{id}/start:
 *   put:
 *     summary: Start Production (RELEASED -> IN_PROGRESS)
 *     description: Automatically creates a Material Request and updates linked Production Request/Sales Order status.
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
 *       400:
 *         description: Invalid status or Material Request creation failed
 */

/**
 * @swagger
 * /api/work-orders/{id}/complete:
 *   put:
 *     summary: Complete Production (Move WO to COMPLETED)
 *     description: Requires linked Material Request ISSUED; produced instances are created as PENDING_QC and logged in inventory.
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
 *               quantityProduced: { type: integer, minimum: 1 }
 *               batchCode: { type: string, description: "Optional custom batch code" }
 *               expiryDate: { type: string, format: "date", description: "Optional expiry date" }
 *               warehouseId: { type: integer, description: "Optional warehouse override" }
 *     responses:
 *       200:
 *         description: Completed
 *       400:
 *         description: Invalid quantity, status, or material request not issued
 */

/**
 * @swagger
 * /api/work-orders/{id}/cancel:
 *   put:
 *     summary: Cancel a Work Order
 *     description: Reverts the associated Production Request status and cancels pending Material Requests.
 *     tags: [Work Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Cancelled
 *       400:
 *         description: Invalid status or missing reason for IN_PROGRESS cancellation
 */

export default router;
