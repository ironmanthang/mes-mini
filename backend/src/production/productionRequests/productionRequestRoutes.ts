import { Router } from 'express';
import {
    createRequest,
    getAllRequests,
    getRequestById,
    recheckFeasibility,
    draftPurchaseOrder,
    cancelRequest,
    getRequirements,
    convertRequestsToWorkOrder
} from './productionRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createProductionRequestSchema } from './productionRequestValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.PR_READ),
    getAllRequests
);

router.post('/',
    authorize(PERM.PR_CREATE),
    validate(createProductionRequestSchema),
    createRequest
);

router.post('/convert-to-work-order',
    authorize(PERM.WO_CREATE),
    convertRequestsToWorkOrder
);

router.get('/:id/requirements',
    authorize(PERM.PR_READ),
    getRequirements
);

router.put('/:id/recheck',
    authorize(PERM.PR_UPDATE),
    recheckFeasibility
);

router.get('/:id/draft-purchase-order',
    authorize(PERM.PR_LINK_PO),
    draftPurchaseOrder
);

router.put('/:id/cancel',
    authorize(PERM.PR_CANCEL),
    cancelRequest
);

router.get('/:id',
    authorize(PERM.PR_READ),
    getRequestById
);

/**
 * @swagger
 * tags:
 *   name: Production Requests
 *   description: Managing requests to produce items
 */

/**
 * @swagger
 * /api/production-requests:
 *   get:
 *     summary: List all Production Requests
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [APPROVED, WAITING_MATERIAL, PARTIALLY_FULFILLED, FULFILLED, CANCELLED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of requests
 */

/**
 * @swagger
 * /api/production-requests:
 *   post:
 *     summary: Create a Production Request (runs BOM check automatically)
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: 
 *                 type: integer
 *                 example: 1
 *                 description: "The ID of the product to manufacture"
 *               quantity: 
 *                 type: integer
 *                 minimum: 1
 *                 example: 50
 *               priority: 
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *                 default: "MEDIUM"
 *                 example: "MEDIUM"
 *               dueDate: 
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59Z"
 *                 description: "Optional. Must be in the future."
 *               soDetailId: 
 *                 type: integer
 *                 example: 3
 *                 description: "Sales Order Detail ID (omit for Make-to-Stock)"
 *               note: 
 *                 type: string
 *                 maxLength: 500
 *                 example: "Urgent production for Q4 deadline."
 *     responses:
 *       201:
 *         description: Created with status APPROVED or WAITING_MATERIAL
 */

/**
 * @swagger
 * /api/production-requests/{id}/recheck:
 *   put:
 *     summary: Re-check feasibility of a WAITING_MATERIAL request
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Re-check result (may transition to APPROVED)
 */

/**
 * @swagger
 * /api/production-requests/{id}/draft-purchase-order:
 *   get:
 *     summary: Get shortage list for PO pre-fill (only WAITING_MATERIAL)
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of components with shortage quantities
 */

/**
 * @swagger
 * /api/production-requests/{id}/cancel:
 *   put:
 *     summary: Cancel a Request
 *     tags: [Production Requests]
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
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Cancelled
 */

/**
 * @swagger
 * /api/production-requests/{id}/requirements:
 *   get:
 *     summary: Calculate MRP for a specific request
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: MRP Calculation Result
 */

/**
 * @swagger
 * /api/production-requests/{id}:
 *   get:
 *     summary: Get Production Request by ID
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Production Request details with linked Work Orders and Purchase Orders
 *       404:
 *         description: Production Request not found
 */

/**
 * @swagger
 * /api/production-requests/convert-to-work-order:
 *   post:
 *     summary: Convert approved Production Requests into a Work Order
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestIds]
 *             properties:
 *               requestIds:
 *                 type: array
 *                 items: { type: integer }
 *                 description: "Array of Production Request IDs to bundle into a Work Order"
 *               quantities:
 *                 type: array
 *                 items: { type: integer }
 *                 description: "Corresponding quantities for each request (optional, defaults to full quantity)"
 *               productionLineId:
 *                 type: integer
 *                 description: "Target production line ID"
 *     responses:
 *       201:
 *         description: Work Order created successfully
 *       400:
 *         description: Validation error (wrong status, missing data, etc.)
 */

export default router;
