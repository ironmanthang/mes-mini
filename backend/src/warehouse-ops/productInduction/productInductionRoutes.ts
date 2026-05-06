import { Router } from 'express';
import { inductProducts } from './productInductionController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { inductProductsSchema } from './productInductionValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.post('/',
    authorize(PERM.WH_INDUCT),
    validate(inductProductsSchema),
    inductProducts
);

/**
 * @swagger
 * tags:
 *   name: Warehouse Ops
 *   description: Warehouse operations including product induction
 */

/**
 * @swagger
 * /api/warehouse-ops/product-induction:
 *   post:
 *     summary: Induct finished products into warehouse inventory
 *     description: |
 *       Accepts a batch of serial numbers scanned at the warehouse receiving gate.
 *       **All-or-nothing semantics:** if any serial number is invalid, the entire
 *       batch is rejected with a descriptive error.
 *
 *       **Pre-conditions for each instance:**
 *       - Must have status PASSED_QC or FAILED_QC (QC must be completed first)
 *       - Parent Work Order must have valid target warehouses configured
 *
 *       **What this endpoint does:**
 *       - Routes PASSED_QC → IN_STOCK_SALES (targetSalesWarehouseId)
 *       - Routes FAILED_QC → IN_STOCK_ERROR (targetErrorWarehouseId)
 *       - Sets receivedAt timestamp for all inducted items
 *       - Creates an InventoryTransaction (type: IMPORT_PRODUCTION) for each item
 *       - Triggers PR attribution for PASSED_QC items (increments WorkOrderFulfillment)
 *     tags: [Warehouse Ops]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serialNumbers]
 *             properties:
 *               serialNumbers:
 *                 type: array
 *                 description: List of serial numbers scanned at the receiving gate
 *                 items:
 *                   type: string
 *                 example: ["SN-QC-TEST-0001", "SN-QC-TEST-0002"]
 *     responses:
 *       200:
 *         description: All instances inducted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInducted:
 *                   type: integer
 *                 inducted:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serialNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [IN_STOCK_SALES, IN_STOCK_ERROR]
 *                       warehouseId:
 *                         type: integer
 *       400:
 *         description: |
 *           Batch rejected. Possible reasons:
 *           - One or more serial numbers not found
 *           - One or more instances not in PASSED_QC or FAILED_QC status
 *           - Target warehouse(s) no longer exist
 */

export default router;
