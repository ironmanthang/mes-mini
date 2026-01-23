import { Router } from 'express';
import {
    createSO,
    updateSO,
    getAllSOs,
    getSOById,
    approveSO,
    submitSO,
    rejectSO,
} from './salesOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createSOSchema, updateSOSchema } from './salesOrderValidator.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('System Admin', 'Production Manager', 'Sales Staff'),
    getAllSOs
);

router.get('/:id',
    authorize('System Admin', 'Production Manager', 'Sales Staff'),
    getSOById
);

router.post('/',
    validate(createSOSchema),
    authorize('Sales Staff'),
    createSO
);

router.put('/:id',
    authorize('Sales Staff'),
    validate(updateSOSchema),
    updateSO
);
router.put('/:id/approve',
    authorize('Production Manager'),
    approveSO
);

router.put('/:id/submit',
    authorize('Sales Staff'),
    submitSO
);

router.put('/:id/reject',
    authorize('Production Manager'),
    rejectSO
);

/**
 * @swagger
 * tags:
 *   name: Sales Orders
 *   description: Managing orders from Agents/Customers
 */

/**
 * @swagger
 * /api/sales-orders:
 *   get:
 *     summary: List all Sales Orders
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
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
 *                   status: { type: string, example: "PENDING" }
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
 *     summary: Get SO Details
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
 *             required: [code, agentId, details]
 *             properties:
 *               code: { type: string, example: "SO-2026-001" }
 *               agentId: { type: integer, example: 1 }
 *               expectedShipDate: { type: string, example: "2026-02-15" }
 *               discount: { type: number, default: 0 }
 *               tax: { type: number, default: 0 }
 *               shippingCost: { type: number, default: 0 }
 *               paymentTerms: { type: string, enum: ["Net 30", "Due upon receipt", "50% Advance, 50% on delivery", "COD - Cash on Delivery"] }
 *               deliveryTerms: { type: string, enum: ["FOB - Free On Board", "CIF - Cost, Insurance and Freight", "EXW - Ex Works", "DDP - Delivered Duty Paid"] }
 *               note: { type: string }
 *               priority: { type: string, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, salePrice]
 *                   properties:
 *                     productId: { type: integer, example: 1 }
 *                     quantity: { type: integer, example: 100 }
 *                     salePrice: { type: number, example: 150.00 }
 *     responses:
 *       201:
 *         description: SO Created successfully
 *       400:
 *         description: Validation Error (e.g. Product not found)
 *       403:
 *         description: Forbidden (Must be Sales Staff)
 */

/**
 * @swagger
 * /api/sales-orders/{id}/approve:
 *   put:
 *     summary: Approve a Sales Order
 *     description: Only accessible by Production Manager. Creator cannot approve their own order.
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approved successfully
 *       400:
 *         description: Logic Error (Self-approval or wrong status)
 *       403:
 *         description: Forbidden (Must be Production Manager)
 */

/**
 * @swagger
 * /api/sales-orders/{id}/submit:
 *   put:
 *     summary: Submit a Sales Order for Approval
 *     description: Changes status from DRAFT to PENDING. Only the creator can submit.
 *     tags: [Sales Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Submitted successfully
 *       400:
 *         description: Error (Wrong status or not the creator)
 *       403:
 *         description: Forbidden (Must be Sales Staff)
 */

/**
 * @swagger
 * /api/sales-orders/{id}/reject:
 *   put:
 *     summary: Reject a Sales Order
 *     description: Changes status from PENDING to DRAFT. Appends rejection reason to note field. Only managers can reject (not the creator).
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
 *         description: Rejected successfully
 *       400:
 *         description: Error (Wrong status, self-rejection, or missing reason)
 *       403:
 *         description: Forbidden (Must be Production Manager)
 */

/**
 * @swagger
 * /api/sales-orders/{id}:
 *   put:
 *     summary: Update a Sales Order (Edit Draft)
 *     description: Update details or change status (e.g., DRAFT -> PENDING). Can only edit if status is DRAFT or PENDING.
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
 *               expectedShipDate: { type: string, format: date }
 *               discount: { type: number }
 *               tax: { type: number }
 *               shippingCost: { type: number }
 *               note: { type: string }
 *               priority: { type: string, enum: ["HIGH", "MEDIUM", "LOW"] }
 *               paymentTerms: { type: string, enum: ["Net 30", "Due upon receipt", "50% Advance, 50% on delivery", "COD - Cash on Delivery"] }
 *               deliveryTerms: { type: string, enum: ["FOB - Free On Board", "CIF - Cost, Insurance and Freight", "EXW - Ex Works", "DDP - Delivered Duty Paid"] }
 *               status: { type: string, enum: ["DRAFT", "PENDING", "CANCELLED"], description: "Use this to Submit a draft" }
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Validation Error or Status Violation (Cannot edit Approved orders)
 *       403:
 *         description: Forbidden
 *       404:
 *         description: SO not found
 */

export default router;
