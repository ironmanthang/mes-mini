import { Router } from 'express';
import {
    getInventoryStatus,
    getLowStockAlerts
} from './inventoryController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/status',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getInventoryStatus
);

router.get('/alerts',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getLowStockAlerts
);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock Management and Reporting
 */

/**
 * @swagger
 * /api/warehouse/inventory/status:
 *   get:
 *     summary: Get Consolidated Inventory Report
 *     description: >
 *       Returns a consolidated inventory report where:
 *       - `totalPhysicalQuantity`: The total count of components physically present across all warehouses.
 *       - `totalAllocatedQuantity`: Components reserved for specific activities (e.g., Work Orders). These items are in the warehouse but are committed and cannot be used for new tasks.
 *       - `availableQuantity`: The actual stock available for use, calculated as `totalPhysicalQuantity - totalAllocatedQuantity`.
 *       Status is `LOW_STOCK` when `availableQuantity < minStockLevel`.
 *       Components with `minStockLevel = 0` do not trigger alerts.
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filter by component name (case-insensitive, partial match)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated consolidated inventory report
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
 *                       componentId: { type: integer, example: 9 }
 *                       code: { type: string, example: "COM-BATTERY-500" }
 *                       componentName: { type: string, example: "Battery 500mAh" }
 *                       unit: { type: string, example: "pcs" }
 *                       totalPhysicalQuantity: { type: integer, example: 100, description: "Total units physically on shelves across all warehouses" }
 *                       totalAllocatedQuantity: { type: integer, example: 20, description: "Total units reserved for planned Work Orders" }
 *                       availableQuantity: { type: integer, example: 80, description: "Free-to-use stock = totalPhysicalQuantity - totalAllocatedQuantity" }
 *                       minStockLevel: { type: integer, example: 50, description: "Safety stock threshold. 0 means no threshold is set." }
 *                       status: { type: string, enum: [OK, LOW_STOCK], example: "OK" }
 *                       warehouseStocks:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             warehouseId: { type: integer, example: 1 }
 *                             warehouseName: { type: string, example: "Main Warehouse (Materials)" }
 *                             quantity: { type: integer, example: 100 }
 *                             allocatedQuantity: { type: integer, example: 20 }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 */

/**
 * @swagger
 * /api/warehouse/inventory/alerts:
 *   get:
 *     summary: Get Low Stock Alerts
 *     description: >
 *       Returns components where `availableQuantity` (physical - allocated) is strictly below `minStockLevel`.
 *       Components with `minStockLevel = 0` are excluded (no threshold configured).
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of components requiring urgent restocking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   componentId: { type: integer, example: 3 }
 *                   code: { type: string, example: "COM-CHIP-X1" }
 *                   componentName: { type: string, example: "Control Chip X1" }
 *                   unit: { type: string, example: "pcs" }
 *                   minStockLevel: { type: integer, example: 500 }
 *                   totalPhysicalQuantity: { type: integer, example: 0 }
 *                   totalAllocatedQuantity: { type: integer, example: 0 }
 *                   availableQuantity: { type: integer, example: 0 }
 */

export default router;

