import { Router } from 'express';
import {
    createSO,
    updateSO,
    getAllSOs,
    getSOById,
    approveSO,
    submitSO,
    rejectSO,
    startProcessing,
    shipOrder,
    deleteSO,
    cancelSO,
    checkFeasibility,
} from './salesOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createSOSchema, updateSOSchema, shipOSchema, cancelSOSchema } from './salesOrderValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.SO_READ),
    getAllSOs
);

router.get('/:id/feasibility',
    authorize(PERM.SO_READ),
    checkFeasibility
);

router.get('/:id',
    authorize(PERM.SO_READ),
    getSOById
);

router.post('/',
    authorize(PERM.SO_CREATE),
    validate(createSOSchema),
    createSO
);

router.put('/:id',
    authorize(PERM.SO_CREATE),
    validate(updateSOSchema),
    updateSO
);

router.delete('/:id',
    authorize(PERM.SO_CREATE),
    deleteSO
);
router.put('/:id/approve',
    authorize(PERM.SO_APPROVE),
    approveSO
);

router.put('/:id/submit',
    authorize(PERM.SO_SUBMIT),
    submitSO
);

router.put('/:id/reject',
    authorize(PERM.SO_APPROVE),
    rejectSO
);

router.put('/:id/cancel',
    authorize(PERM.SO_CANCEL),
    validate(cancelSOSchema),
    cancelSO
);

router.put('/:id/process',
    authorize(PERM.SO_SHIP),
    startProcessing
);

router.post('/:id/ship',
    authorize(PERM.SO_SHIP),
    validate(shipOSchema),
    shipOrder
);

/**
 * @swagger
 * tags:
 *   name: "Sales Orders"
 *   description: "Managing orders from Agents/Customers"
 */

/**
 * @swagger
 * /api/sales-orders:
 *   get:
 *     summary: "List all Sales Orders"
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of SOs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   salesOrderId: { type: integer }
 *                   code: { type: string }
 *                   status: { type: string, enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RETURNED"], example: "PENDING_APPROVAL" }
 *                   totalAmount: { type: number }
 *                   agent: { type: object, properties: { agentName: { type: string } } }
 *                   employee: { type: object, properties: { fullName: { type: string } } }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   get:
 *     summary: "Get SO Details"
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: SO Details with line items
 *       404:
 *         description: SO not found
 */

/**
 * @swagger
 * /api/sales-orders:
 *   post:
 *     summary: Create a new Sales Order (Draft)
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agentId, details]
 *             properties:
 *               agentId:
 *                 type: integer
 *                 example: 1
 *                 description: "Code is auto-generated (D-YYMMDD-ID for drafts, SO-YYYY-XXX on submit)"
 *               orderDate:
 *                 type: string
 *                 format: "date-time"
 *                 example: "2026-02-02T10:00:00Z"
 *                 description: "Optional. Defaults to now."
 *               expectedShipDate:
 *                 type: string
 *                 format: "date-time"
 *                 example: "2026-02-15T00:00:00Z"
 *                 description: "Optional. Must be in the future."
 *               discount:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 5
 *               tax:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 10
 *               agentShippingPrice:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 50
 *               paymentTerms:
 *                 type: string
 *                 enum: ["Net 30", "Due upon receipt", "50% Advance, 50% on delivery", "COD - Cash on Delivery"]
 *                 example: "Net 30"
 *               deliveryTerms:
 *                 type: string
 *                 enum: ["FOB - Free On Board", "CIF - Cost, Insurance and Freight", "EXW - Ex Works", "DDP - Delivered Duty Paid"]
 *                 example: "EXW - Ex Works"
 *               note:
 *                 type: string
 *                 example: "Please ship with extra care."
 *               status:
 *                 type: string
 *                 enum: ["DRAFT", "PENDING_APPROVAL"]
 *                 default: "DRAFT"
 *                 example: "DRAFT"
 *               priority:
 *                 type: string
 *                 enum: ["HIGH", "MEDIUM", "LOW"]
 *                 default: "MEDIUM"
 *                 example: "MEDIUM"
 *               details:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, salePrice]
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 10
 *                     salePrice:
 *                       type: number
 *                       minimum: 0
 *                       example: 150.50
 *     responses:
 *       201:
 *         description: "SO Created successfully"
 *       400:
 *         description: "Validation Error (e.g. Product not found)"
 *       403:
 *         description: "Forbidden (Must be Sales Staff)"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/approve:
 *   put:
 *     summary: "Approve a Sales Order"
 *     description: "Only accessible by Production Manager. Creator cannot approve their own order."
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Approved successfully"
 *       400:
 *         description: "Logic Error (Self-approval or wrong status)"
 *       403:
 *         description: "Forbidden (Must be Production Manager)"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/submit:
 *   put:
 *     summary: "Submit a Sales Order for Approval"
 *     description: "Changes status from DRAFT to PENDING. Only the creator can submit."
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Submitted successfully"
 *       400:
 *         description: "Error (Wrong status or not the creator)"
 *       403:
 *         description: "Forbidden (Must be Sales Staff)"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/reject:
 *   put:
 *     summary: "Reject a Sales Order"
 *     description: "Changes status from PENDING to DRAFT. Appends rejection reason to note field. Only managers can reject (not the creator)."
 *     tags: [Sales Orders]
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: "Discount too high. Maximum allowed is 5%." }
 *     responses:
 *       200:
 *         description: "Rejected successfully"
 *       400:
 *         description: "Error (Wrong status, self-rejection, or missing reason)"
 *       403:
 *         description: "Forbidden (Must be Production Manager)"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/cancel:
 *   put:
 *     summary: "Cancel a Sales Order"
 *     description: "Cancels an Approved/Pending/In-Progress order. Releases reserved stock. Requires reason."
 *     tags: [Sales Orders]
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
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: "Customer cancelled via phone." }
 *     responses:
 *       200:
 *         description: "Cancelled successfully"
 *       400:
 *         description: "Error (Wrong status or shipped)"
 */

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   put:
 *     summary: "Update a Sales Order (Edit Draft)"
 *     description: "Update details or change status (e.g., DRAFT -> PENDING). Can only edit if status is DRAFT or PENDING_APPROVAL."
 *     tags: [Sales Orders]
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
 *               expectedShipDate: 
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-15T00:00:00Z"
 *                 description: "Optional. Must be in the future."
 *               discount: 
 *                 type: number
 *                 example: 10
 *                 minimum: 0
 *               tax: 
 *                 type: number
 *                 example: 5
 *                 minimum: 0
 *               agentShippingPrice: 
 *                 type: number
 *                 example: 15.5
 *                 minimum: 0
 *               note: 
 *                 type: string
 *                 example: "Updated shipping details."
 *               priority: 
 *                 type: string
 *                 enum: ["HIGH", "MEDIUM", "LOW"]
 *                 example: "HIGH"
 *               paymentTerms: 
 *                 type: string
 *                 enum: ["Net 30", "Due upon receipt", "50% Advance, 50% on delivery", "COD - Cash on Delivery"]
 *                 example: "Net 30"
 *               deliveryTerms: 
 *                 type: string
 *                 enum: ["FOB - Free On Board", "CIF - Cost, Insurance and Freight", "EXW - Ex Works", "DDP - Delivered Duty Paid"]
 *                 example: "FOB - Free On Board"
 *               details:
 *                 type: array
 *                 description: "Full replacement of line items (optional). If provided, all existing lines are deleted and replaced."
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, salePrice]
 *                   properties:
 *                     productId: 
 *                       type: integer
 *                       example: 2
 *                     quantity: 
 *                       type: integer
 *                       minimum: 1
 *                       example: 5
 *                     salePrice: 
 *                       type: number
 *                       minimum: 0
 *                       example: 120.00
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       400:
 *         description: "Validation Error or Status Violation (Cannot edit Approved orders)"
 *       403:
 *         description: "Forbidden"
 *       404:
 *         description: "SO not found"
 */

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   delete:
 *     summary: "Delete a Sales Order (Hybrid: Hard or Soft)"
 *     description: |
 *       Hybrid Logic:
 *       - **Draft Codes (D-xxx):** Hard Deleted (Record removed).
 *       - **Official Codes (SO-xxx):** Soft Deleted (Status set to CANCELLED) to preserve audit trail.
 *       - Only allowed if status is DRAFT.
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted (or Cancelled) successfully
 *       400:
 *         description: Error (Not a DRAFT or Privilege violation)
 */

/**
 * @swagger
 * /api/sales-orders/{id}/process:
 *   put:
 *     summary: "Start Processing (Move to Warehouse)"
 *     description: "Changes status from APPROVED to PROCESSING. Indicates order is being picked/packed."
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Processing started"
 *       400:
 *         description: "Error (Wrong status)"
 *       403:
 *         description: "Forbidden"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/ship:
 *   post:
 *     summary: "Ship Order (Goods Issue)"
 *     description: "Deduct inventory by scanning Serial Numbers. Updates status to SHIPPED if full."
 *     tags: [Sales Orders]
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
 *             required: [shipments]
 *             properties:
 *               shipments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer, example: 1 }
 *                     serialNumbers: 
 *                       type: array
 *                       items: { type: string, example: "SN-2026-LAPTOP-0001" }
 *               courierShippingCost: { type: number, description: "Actual freight expense incurred" }
 *     responses:
 *       200:
 *         description: "Shipment processed"
 *       400:
 *         description: "Error (Serial not found, already sold, etc)"
 *       403:
 *         description: "Forbidden"
 */

/**
 * @swagger
 * /api/sales-orders/{id}/feasibility:
 *   get:
 *     summary: "Check Feasibility (Traffic Light)"
 *     description: "Returns GREEN (ship from stock), YELLOW (can produce), or RED (material shortage) for each line item."
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Feasibility result with per-line-item traffic light status"
 *       400:
 *         description: "Error (Wrong SO status or not found)"
 */

export default router;
