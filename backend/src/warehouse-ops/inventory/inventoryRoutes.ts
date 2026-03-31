import { Router } from 'express';
import {
    getInventoryStatus,
    getLowStockDetails,
    getStockStatus
} from './inventoryController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/status',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getInventoryStatus
);

router.get('/low-stock-details',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getLowStockDetails
);

router.get('/stock-status',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getStockStatus
);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock Management and Reporting
 */

/**
 * @swagger
 * /api/warehouse-ops/inventory/status:
 *   get:
 *     summary: Get Consolidated Inventory Report (Components)
 *     description: Returns a paginated report of components and their stock across warehouses.
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated component stock report
 */

/**
 * @swagger
 * /api/warehouse-ops/inventory/low-stock-details:
 *   get:
 *     summary: Get Unified Low Stock Drill-down
 *     description: Returns a combined list of products and components that are below their minimum stock levels.
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema: { type: integer }
 *         description: Optional warehouse ID to filter shortages
 *     responses:
 *       200:
 *         description: Unified list of items needing attention
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   type: { type: string, enum: [PRODUCT, COMPONENT] }
 *                   code: { type: string }
 *                   name: { type: string }
 *                   currentStock: { type: integer }
 *                   minStock: { type: integer }
 *                   gap: { type: integer, description: "Difference between minStock and currentStock" }
 */

/**
 * @swagger
 * /api/warehouse-ops/inventory/stock-status:
 *   get:
 *     summary: Get Detailed Item Stock Status
 *     description: Returns a breakdown of stock across warehouses for a specific Product or Component.
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [PRODUCT, COMPONENT] }
 *       - in: query
 *         name: warehouseId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detailed stock breakdown
 */

export default router;
