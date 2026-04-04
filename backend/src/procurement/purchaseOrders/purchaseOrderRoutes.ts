import { Router } from 'express';
import {
    createPO,
    updatePO,
    getAllPOs,
    getPOById,
    submitPO,
    approvePO,
    sendToSupplierPO,
    cancelPO,
    deletePO,
    receiveGoods,
    getLotsByPO,
    requestAttachmentUpload,
    confirmAttachmentUpload,
    listAttachments,
    deleteAttachment,
} from './purchaseOrderController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import {
    createPOSchema,
    updatePOSchema,
    submitPOSchema,
    sendToSupplierSchema,
    cancelPOSchema,
    receiveGoodsSchema,
    requestUploadSchema,
    confirmUploadSchema,
} from './purchaseOrderValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

// ── List & Detail ─────────────────────────────────────────────────────────────
router.get('/',
    authorize(PERM.PO_READ),
    getAllPOs
);

router.get('/:id',
    authorize(PERM.PO_READ),
    getPOById
);

// ── Create ────────────────────────────────────────────────────────────────────
router.post('/',
    authorize(PERM.PO_CREATE),
    validate(createPOSchema),
    createPO
);

// ── Generic Edit ──────────────────────────────────────────────────────────────
router.put('/:id',
    authorize(PERM.PO_CREATE),
    validate(updatePOSchema),
    updatePO
);

// ── State Transition Commands (POST per Decision #12) ─────────────────────────

// DRAFT → PENDING (generates official PO code)
router.post('/:id/submit',
    authorize(PERM.PO_SUBMIT),
    validate(submitPOSchema),
    submitPO
);

// PENDING → APPROVED (was PUT, now POST per Decision #12)
router.post('/:id/approve',
    authorize(PERM.PO_APPROVE),
    approvePO
);

// APPROVED → ORDERED
router.post('/:id/send-to-supplier',
    authorize(PERM.PO_SEND),
    validate(sendToSupplierSchema),
    sendToSupplierPO
);

// Receive goods (ORDERED / RECEIVING → RECEIVING / COMPLETED)
router.post('/:id/receive',
    authorize(PERM.PO_RECEIVE),
    validate(receiveGoodsSchema),
    receiveGoods
);

// Get Generated Lots for a PO (For printing/viewing barcodes)
router.get('/:id/lots',
    authorize(PERM.PO_READ),
    getLotsByPO
);

// PENDING|APPROVED → CANCELLED (soft-delete, preserves audit trail)
router.post('/:id/cancel',
    authorize(PERM.PO_CANCEL),
    validate(cancelPOSchema),
    cancelPO
);

// Hard-delete (DRAFT only — no official PO code to preserve)
router.delete('/:id',
    authorize(PERM.PO_CREATE),
    deletePO
);

// ── Attachments ───────────────────────────────────────────────────────────────

// Step 1: Request a presigned PUT URL to upload directly to R2
router.post('/:id/attachments/request-upload',
    authorize(PERM.ATTACH_UPLOAD),
    validate(requestUploadSchema),
    requestAttachmentUpload
);

// Step 2: Confirm file is uploaded — create the DB record
router.post('/:id/attachments/confirm',
    authorize(PERM.ATTACH_UPLOAD),
    validate(confirmUploadSchema),
    confirmAttachmentUpload
);

// List all attachments for a PO (includes presigned download URLs)
router.get('/:id/attachments',
    authorize(PERM.PO_READ),
    listAttachments
);

// Hard-delete a single attachment (R2 + DB row)
router.delete('/:id/attachments/:attachmentId',
    authorize(PERM.ATTACH_DELETE_ANY),
    deleteAttachment
);


// ─────────────────────────────────────────────────────────────────────────────
// Swagger JSDoc Blocks
// ─────────────────────────────────────────────────────────────────────────────

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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, ORDERED, RECEIVING, COMPLETED, CANCELLED]
 *         description: "Filter by status. Comma-separated for multiple (e.g. DRAFT,PENDING). Omit for all."
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW]
 *         description: "Filter by priority."
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by PO code or supplier name
 *     responses:
 *       200:
 *         description: Paginated list of POs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       purchaseOrderId: { type: integer }
 *                       code: { type: string, example: "PO-2026-001" }
 *                       orderDate: { type: string, format: date-time }
 *                       expectedDeliveryDate: { type: string, format: date }
 *                       status: { type: string, enum: ["DRAFT","PENDING","APPROVED","ORDERED","RECEIVING","COMPLETED","CANCELLED"], example: "PENDING" }
 *                       totalAmount: { type: number }
 *                       priority: { type: string, enum: ["HIGH","MEDIUM","LOW"] }
 *                       supplier: { type: object, properties: { supplierName: { type: string }, code: { type: string } } }
 *                       employee: { type: object, properties: { fullName: { type: string } } }
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
 *         description: Full PO details with all line items
 *       403:
 *         description: Forbidden (accessing another user's DRAFT)
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create a new Purchase Order
 *     description: |
 *       Creates a PO in DRAFT or PENDING status.
 *       - **DRAFT (default):** System auto-generates a temp code `D-PO-YYMMDD-{id}`. Call `/submit` to assign official code.
 *       - **PENDING (direct submit):** System auto-generates official sequential code `PO-YYYY-NNN` immediately, skipping DRAFT.
 *
 *       The `code` field is NOT accepted — it is always system-generated.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierId, warehouseId, details]
 *             properties:
 *               supplierId: { type: integer, example: 4 }
 *               warehouseId: { type: integer, example: 1 }
 *               status: { type: string, enum: ["DRAFT","PENDING"], default: "DRAFT", description: "Omit for DRAFT. Use PENDING to skip DRAFT and get official PO code immediately." }
 *               orderDate: { type: string, format: date-time, example: "2027-03-29T22:45:00Z" }
 *               priority: { type: string, enum: ["HIGH","MEDIUM","LOW"], example: "HIGH" }
 *               expectedDeliveryDate: { type: string, example: "2028-04-12" }
 *               paymentTerms: { type: string, enum: ["Net 30","Due upon receipt","50% Advance, 50% on delivery"], example: "50% Advance, 50% on delivery" }
 *               deliveryTerms: { type: string, enum: ["FOB - Free On Board","CIF - Cost, Insurance and Freight","EXW - Ex Works","DDP - Delivered Duty Paid"], example: "DDP - Delivered Duty Paid" }
 *               note: { type: string, example: "Urgent order: CPU for PR-20260310-0001 (VIP Client) + restocking Control Chips for the main production line." }
 *               taxRate: { type: number, default: 0, example: 10, description: "Tax percentage (e.g. 10)" }
 *               shippingCost: { type: number, default: 0, example: 350000 }
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [componentId, quantity, unitPrice]
 *                   properties:
 *                     componentId: { type: integer, example: 5 }
 *                     quantity: { type: integer, example: 20 }
 *                     unitPrice: { type: number, example: 10000000.00 }
 *                     productionRequestId: { type: integer, nullable: true, example: null, description: "Optional. Links this line item to a specific PR. Leave as null for General Stock. Component must exist in that PR's BOM." }
 *     responses:
 *       201:
 *         description: PO created. Code is system-generated.
 *       400:
 *         description: Validation error (e.g. component not sold by supplier, BOM mismatch)
 *       403:
 *         description: Forbidden (must be Purchasing Staff or System Admin)
 */

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update Purchase Order
 *     description: |
 *       Update metadata fields. **Cannot change status here**.
 *       Fields like `note` and `expectedDeliveryDate` are editable until ORDERED.
 *       Financial fields and `details` are locked (frozen) once submitted (PENDING).
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
 *               priority: { type: string, enum: ["HIGH","MEDIUM","LOW"], description: "DRAFT/PENDING only" }
 *               warehouseId: { type: integer, description: "DRAFT only" }
 *               taxRate: { type: number, description: "DRAFT only" }
 *               shippingCost: { type: number, description: "DRAFT only" }
 *               note: { type: string }
 *               paymentTerms: { type: string, enum: ["Net 30","Due upon receipt","50% Advance, 50% on delivery"], description: "DRAFT only" }
 *               deliveryTerms: { type: string, enum: ["FOB - Free On Board","CIF - Cost, Insurance and Freight","EXW - Ex Works","DDP - Delivered Duty Paid"], description: "DRAFT only" }
 *               details:
 *                 type: array
 *                 description: "DRAFT only. Full replacement."
 *                 items:
 *                   type: object
 *                   required: [componentId, quantity, unitPrice]
 *                   properties:
 *                     componentId: { type: integer }
 *                     quantity: { type: integer }
 *                     unitPrice: { type: number }
 *                     productionRequestId: { type: integer, nullable: true, description: "Link to PR BOM" }
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Frozen field violation or logic error
 *       403:
 *         description: Forbidden (not the creator)
 *       404:
 *         description: PO not found
 */


/**
 * @swagger
 * /api/purchase-orders/{id}/submit:
 *   post:
 *     summary: Submit a DRAFT PO for approval
 *     description: |
 *       Transitions the PO from **DRAFT → PENDING**.
 *       - Generates and permanently assigns the official sequential code (`PO-YYYY-NNN`), replacing the temp draft code.
 *       - Only the creator of the DRAFT can submit.
 *       - The PO must have at least one line item.
 *       - No request body needed.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Submitted. Official code assigned (e.g. PO-2026-001), status = PENDING.
 *       400:
 *         description: Logic error (not DRAFT, empty PO)
 *       403:
 *         description: Forbidden (not the creator, or wrong role)
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/approve:
 *   post:
 *     summary: Approve a PENDING Purchase Order
 *     description: |
 *       Transitions the PO from **PENDING → APPROVED**.
 *       - Only accessible by Production Manager or System Admin.
 *       - The creator of the PO cannot approve their own order (self-approval blocked).
 *       - Sends a notification to the creator.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approved. Status is now APPROVED (not yet sent to supplier).
 *       400:
 *         description: Logic error (wrong status, self-approval attempt)
 *       403:
 *         description: Forbidden (must be Production Manager or System Admin)
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/send-to-supplier:
 *   post:
 *     summary: Send an APPROVED PO to the supplier
 *     description: |
 *       Transitions the PO from **APPROVED → ORDERED**.
 *       - Only the original creator (Purchasing Staff) can call this endpoint.
 *       - Optionally add a note (e.g. "Sent via email on 2026-03-29").
 *       - Once ORDERED, the contract is legally binding. Cancel is no longer possible.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string, example: "Sent to supplier via email on 2026-03-29" }
 *     responses:
 *       200:
 *         description: Sent. Status is now ORDERED.
 *       400:
 *         description: Logic error (status not APPROVED)
 *       403:
 *         description: Forbidden (not the creator, or wrong role)
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     summary: Receive Goods (Goods Receipt)
 *     description: |
 *       Record items arriving at the warehouse. Each item in the array represents **one physical box**.
 *
 *       **Atomic operations per item (inside $transaction):**
 *       1. Update `PurchaseOrderDetail.quantityReceived` (increment)
 *       2. Upsert `ComponentStock` (increment warehouse balance)
 *       3. Create `InventoryTransaction` (type: IMPORT_PO)
 *       4. Create `ComponentLot` with auto-generated `lotCode` (e.g. `LOT-260329-001`)
 *
 *       **After commit:** A `PO_RECEIVED` notification is sent to the PO creator.
 *
 *       **Status transitions:** ORDERED → RECEIVING (partial) or COMPLETED (all received).
 *       Only allowed when PO status is `ORDERED` or `RECEIVING`.
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
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 description: Each element represents one physical box received = one ComponentLot
 *                 items:
 *                   type: object
 *                   required: [componentId, quantity, warehouseId]
 *                   properties:
 *                     componentId: { type: integer, example: 1 }
 *                     quantity: { type: integer, example: 50, description: "Units in this box" }
 *                     warehouseId: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Goods received. ComponentLot(s) created with lotCode. Status updated to RECEIVING or COMPLETED. PO_RECEIVED notification sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Goods Received Successfully" }
 *                 purchaseOrder: { type: object, description: "The updated PO object" }
 *                 generatedLots:
 *                   type: array
 *                   description: "The list of newly generated lot codes and quantities"
 *                   items:
 *                     type: object
 *                     properties:
 *                       lotCode: { type: string, example: "LOT-260329-001" }
 *                       componentId: { type: integer }
 *                       quantity: { type: integer }
 *       400:
 *         description: Logic error (wrong status, received more than ordered, empty items, component not in PO)
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict (concurrent update detected)
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/lots:
 *   get:
 *     summary: Get all ComponentLots for a specific PO
 *     description: Returns a list of all lot codes generated during receipt. Used by workers to reprint labels or audit stock.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of lots retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lotCode: { type: string }
 *                   componentId: { type: integer }
 *                   quantity: { type: integer }
 *                   component: { type: object, properties: { componentName: { type: string }, code: { type: string } } }
 *                   warehouse: { type: object, properties: { warehouseName: { type: string }, code: { type: string } } }
 *       404:
 *         description: Purchase Order not found.
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/cancel:
 *   post:
 *     summary: Cancel a Purchase Order
 *     description: |
 *       Transitions the PO to **CANCELLED** status (soft delete — preserves official PO code for audit).
 *
 *       **Allowed from:** `PENDING`, `APPROVED` only.
 *       - `DRAFT` POs cannot be cancelled — use `DELETE /:id` instead.
 *       - `ORDERED`, `RECEIVING`, `COMPLETED` POs cannot be cancelled — they represent a legally binding contract.
 *
 *       **RBAC:** Only the PO creator, a Production Manager, or a System Admin can cancel.
 *       Other Purchasing Staff cannot cancel a colleague's PO.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string, example: "Cancelled: supplier rejected terms" }
 *     responses:
 *       200:
 *         description: Cancelled. Status is now CANCELLED.
 *       400:
 *         description: Wrong status (DRAFT use DELETE; ORDERED+ is legally locked; already cancelled)
 *       403:
 *         description: Forbidden (not creator, manager, or admin)
 *       404:
 *         description: PO not found
 */

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   delete:
 *     summary: Hard-delete a DRAFT Purchase Order
 *     description: |
 *       Permanently removes a Purchase Order from the database.
 *
 *       **Only allowed for DRAFT status.** DRAFT POs have a temporary code (`D-PO-...`) with no audit significance.
 *       - POs in `PENDING` or beyond have an official `PO-YYYY-NNN` code that must be preserved. Use `POST /:id/cancel` instead.
 *       - Only the original creator can delete their own draft.
 *
 *       **Cascade:** Associated `PurchaseOrderDetail` records are deleted automatically (onDelete: Cascade).
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Draft deleted successfully.
 *       400:
 *         description: PO is not in DRAFT status — use cancel instead.
 *       403:
 *         description: Forbidden (not the creator)
 *       404:
 *         description: PO not found
 */


/**
 * @swagger
 * /api/purchase-orders/{id}/attachments/request-upload:
 *   post:
 *     summary: Step 1 - Request a presigned upload URL
 *     description: |
 *       Validates the file metadata and returns a time-limited presigned PUT URL.
 *       The frontend uploads the file directly to Cloudflare R2 using this URL.
 *
 *       After upload, call POST /:id/attachments/confirm to register the file in the database.
 *
 *       Upload Rules:
 *       - Max file size: 20 MB
 *       - Allowed types: PDF, JPEG, PNG, WEBP, MP4
 *       - Max 10 attachments per PO
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
 *             required: [fileName, mimeType, fileSize]
 *             properties:
 *               fileName: { type: string, example: "contract.pdf" }
 *               mimeType: { type: string, example: "application/pdf" }
 *               fileSize: { type: integer, example: 1048576 }
 *               category: { type: string, enum: ["CONTRACT","INVOICE","PACKING_SLIP","INSPECTION","OTHER"], default: "OTHER" }
 *     responses:
 *       200:
 *         description: URL generated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl: { type: string }
 *                 fileKey: { type: string }
 *       400:
 *         description: Validation error or PO status frozen.
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/attachments/confirm:
 *   post:
 *     summary: Step 2 - Confirm upload and register in DB
 *     description: Called after the file is PUT to R2. Creates the DB record.
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
 *             required: [fileKey, fileName, mimeType, fileSize]
 *             properties:
 *               fileKey: { type: string }
 *               fileName: { type: string }
 *               mimeType: { type: string }
 *               fileSize: { type: integer }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Registered.
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/attachments:
 *   get:
 *     summary: List all attachments for a PO
 *     description: Returns metadata with presigned download URLs (1 hour).
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List retrieved successfully.
 */

/**
 * @swagger
 * /api/purchase-orders/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment
 *     description: Hard-delete file from R2 and DB record.
 *     tags: [Purchase Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted successfully.
 */


export default router;
