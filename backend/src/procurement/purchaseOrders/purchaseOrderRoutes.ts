import { Router } from 'express';
import {
    createPO,
    updatePO,
    getAllPOs,
    getPOById,
    approvePO,
} from './purchaseOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createPOSchema, updatePOSchema } from './purchaseOrderValidator.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('System Admin', 'Production Manager', 'Purchasing Staff'),
    getAllPOs
);

router.get('/:id',
    authorize('System Admin', 'Production Manager', 'Purchasing Staff'),
    getPOById
);

router.post('/',
    validate(createPOSchema),
    authorize('System Admin', 'Purchasing Staff'),
    createPO
);

router.put('/:id',
    authorize('System Admin', 'Purchasing Staff'),
    validate(updatePOSchema),
    updatePO
);

router.put('/:id/approve',
    authorize('System Admin', 'Production Manager'),
    approvePO
);

/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Managing orders to Suppliers (Module A)
 */


/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: List all Purchase Orders
 *     tags: [Purchase Orders]
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
 *         description: List of POs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   purchaseOrderId: { type: integer }
 *                   code: { type: string }
 *                   status: { type: string, example: "PENDING" }
 *                   totalAmount: { type: number }
 *                   supplier: { type: object, properties: { supplierName: { type: string } } }
 *                   employee: { type: object, properties: { fullName: { type: string } } }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get PO Details
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: PO Details with line items
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create a new Purchase Order (Draft)
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, supplierId, details]
 *             properties:
 *               code: { type: string, example: "PO-2025-001" }
 *               supplierId: { type: integer, example: 1 }
 *               expectedDeliveryDate: { type: string, example: "2026-12-07" }
 *               discount: { type: number, default: 0 }
 *               tax: { type: number, default: 0 }
 *               shippingCost: { type: number, default: 0 }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     componentId: { type: integer, example: 1 }
 *                     quantity: { type: integer, example: 5 }
 *                     unitPrice: { type: number }
 *     responses:
 *       201:
 *         description: PO Created successfully
 *       400:
 *         description: Validation Error (e.g. Component not sold by Supplier)
 *       403:
 *         description: Forbidden (Must be Purchasing Staff)
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/approve:
 *   put:
 *     summary: Approve a PO
 *     description: Only accessible by Production Manager. Creator cannot approve their own order.
 *     tags: [Purchase Orders]
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
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update a Purchase Order (Edit Draft)
 *     description: Update details or change status (e.g., DRAFT -> PENDING). Can only edit if status is DRAFT or PENDING.
 *     tags: [Purchase Orders]
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
 *               expectedDeliveryDate: { type: string, format: date }
 *               discount: { type: number }
 *               tax: { type: number }
 *               shippingCost: { type: number }
 *               note: { type: string }
 *               paymentTerms: { type: string, enum: ["Net 30", "Due upon receipt", "50% Advance, 50% on delivery"] }
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
 *         description: PO not found
 */


export default router;
