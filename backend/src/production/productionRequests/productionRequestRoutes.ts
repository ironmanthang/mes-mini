import { Router } from 'express';
import {
    createRequest,
    updateDraft,
    submitRequest,
    approveRequest,
    getAllRequests,
    getRequestById,
    recheckFeasibility,
    draftPurchaseOrder,
    cancelRequest,
    getRequirements,
    // convertRequestsToWorkOrder  // TODO: API not ready yet - waiting for work order rework
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

// router.post('/convert-to-work-order',
//     authorize(PERM.WO_CREATE),
//     convertRequestsToWorkOrder)
//   // TODO: API not ready yet - waiting for work order rework
// );

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

router.put('/:id',
    authorize(PERM.PR_UPDATE),
    updateDraft
);

router.put('/:id/submit',
    authorize(PERM.PR_UPDATE),
    submitRequest
);

router.put('/:id/approve',
    authorize(PERM.PR_APPROVE),
    approveRequest
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
 *         schema: { type: string, enum: [DRAFT, PENDING, WAITING_MATERIAL, APPROVED, IN_PROGRESS, FULFILLED, CANCELLED] }
 *         description: Filter by Production Request status
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
 *                 example: 3
 *                 description: "The ID of the product to manufacture"
 *               quantity: 
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
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
 *               asDraft:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: "Optional. If false, the request is submitted immediately; otherwise it is saved as a draft."
 *           examples:
 *             saveAsDraft:
 *               summary: Save as draft (default behavior)
 *               value:
 *                 productId: 1
 *                 quantity: 5
 *                 priority: "MEDIUM"
 *                 dueDate: "2026-12-31T23:59:59Z"
 *                 soDetailId: 4
 *                 note: "Urgent production for Q5 deadline."
 *                 asDraft: true
 *             submitImmediately:
 *               summary: Create and submit immediately
 *               value:
 *                 productId: 3
 *                 quantity: 5
 *                 priority: "HIGH"
 *                 dueDate: "2026-12-31T23:59:59Z"
 *                 soDetailId: 3
 *                 note: "Submit right away for planning."
 *                 asDraft: false
 *     responses:
 *       201:
 *         description: Created successfully (DRAFT if saved as draft, otherwise submitted to PENDING or WAITING_MATERIAL)
 */

/**
 * @swagger
 * /api/production-requests/{id}:
 *   put:
 *     summary: Update a draft Production Request
 *     tags: [Production Requests]
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
 *               productId:
 *                 type: integer
 *                 description: Optional new product ID (must have BOM)
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional new quantity
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional due date
 *               soDetailId:
 *                 type: integer
 *                 description: Optional linked Sales Order Detail ID
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note
 *           examples:
 *             updateDraftPayload:
 *               value:
 *                 quantity: 120
 *                 priority: "HIGH"
 *                 dueDate: "2026-12-28T09:00:00Z"
 *                 note: "Revised after sales confirmation."
 *     responses:
 *       200:
 *         description: Draft updated successfully
 *       400:
 *         description: Invalid input or request is not editable
 */

/**
 * @swagger
 * /api/production-requests/{id}/submit:
 *   put:
 *     summary: Submit a draft Production Request for feasibility check
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Submitted successfully (status becomes PENDING or WAITING_MATERIAL)
 *       400:
 *         description: Invalid state or validation error
 */

/**
 * @swagger
 * /api/production-requests/{id}/approve:
 *   put:
 *     summary: Approve a pending Production Request
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Request approved successfully
 *       403:
 *         description: Forbidden (missing role, self-approval, or invalid state)
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
 *         description: Re-check result (may transition to PENDING)
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

// /**
//  * @swagger
//  * /api/production-requests/convert-to-work-order:
//  *   post:
//  *     summary: Convert approved Production Requests into a Work Order
//  *     tags: [Production Requests]
//  *     security: [{ bearerAuth: [] }]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [requestIds]
//  *             properties:
//  *               requestIds:
//  *                 type: array
//  *                 items: { type: integer }
//  *                 description: "Array of Production Request IDs to bundle into a Work Order"
//  *               quantities:
//  *                 type: object
//  *                 additionalProperties:
//  *                   type: integer
//  *                   minimum: 1
//  *                 description: "Optional map of requestId -> quantity to produce (for split/partial fulfillment). If omitted, each request uses its remaining quantity."
//  *               productionLineId:
//  *                 type: integer
//  *                 description: "Target production line ID"
//  *           examples:
//  *             groupedDefault:
//  *               value:
//  *                 requestIds: [101, 102]
//  *                 productionLineId: 2
//  *             groupedWithSplit:
//  *               value:
//  *                 requestIds: [101, 102]
//  *                 quantities:
//  *                   "101": 40
//  *                   "102": 25
//  *                 productionLineId: 2
//  *     responses:
//  *       201:
//  *         description: Work Order created successfully
//  *       400:
//  *         description: Validation error (wrong status, missing data, etc.)
//  */

export default router;
