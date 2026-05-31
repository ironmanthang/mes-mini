import { Router } from 'express';
import {
    getAllProductInstances,
    getProductInstanceById
} from './productInstanceController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { productInstanceQuerySchema } from './productInstanceValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.get('/:id',
    getProductInstanceById
);

router.use(protect);

router.get('/',
    authorize(PERM.PRODUCT_READ),
    validate(productInstanceQuerySchema),
    getAllProductInstances
);

/**
 * @swagger
 * /api/product-instances:
 *   get:
 *     summary: List all product instances 
 *     tags: [Product Instances]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_QC, PASSED_QC, FAILED_QC, IN_STOCK_SALES, IN_STOCK_ERROR, SHIPPED]
 *         description: Filter by instance status
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Filter by current warehouse ID
 *       - in: query
 *         name: productionRequestId
 *         schema:
 *           type: integer
 *         description: Filter by production request ID (joins via WO/batches)
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *         description: Filter by work order ID (joins via batches)
 *       - in: query
 *         name: serialNumber
 *         schema:
 *           type: string
 *         description: Partial match on serial number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Free-text search across serialNumber, product name, and product code
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of product instances (optimized for UI tables)
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
 *                       productInstanceId: { type: integer }
 *                       serialNumber: { type: string }
 *                       status: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *                       product:
 *                         type: object
 *                         properties:
 *                           productId: { type: integer }
 *                           productName: { type: string }
 *                           code: { type: string }
 *                       warehouse:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           warehouseName: { type: string }
 *                           code: { type: string }
 *                       productionBatch:
 *                         type: object
 *                         properties:
 *                           batchCode: { type: string }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */

/**
 * @swagger
 * /api/product-instances/{id}:
 *   get:
 *     summary: Get a single product instance by ID or Serial Number (Public)
 *     tags: [Product Instances]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product instance ID
 *     responses:
 *       200:
 *         description: Full product instance with all nested relations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productInstanceId: { type: integer }
 *                 serialNumber: { type: string }
 *                 status: { type: string }
 *                 unitProductionCost: { type: number }
 *                 product:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer }
 *                     productName: { type: string }
 *                     code: { type: string }
 *                     unit: { type: string }
 *                     category: { type: object }
 *                 productionBatch:
 *                   type: object
 *                   properties:
 *                     batchCode: { type: string }
 *                     productionDate: { type: string }
 *                     expiryDate: { type: string }
 *                     workOrder: { type: object }
 *                     productionLine: { type: object }
 *                 salesOrder: { type: object, nullable: true }
 *                 warehouse: { type: object, nullable: true }
 *                 qualityChecks:
 *                   type: array
 *                   items:
 *                     type: object
 *                 warranty: { type: object, nullable: true }
 *       404:
 *         description: Product Instance not found
 */
export default router;
