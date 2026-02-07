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
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stock Report
 */

/**
 * @swagger
 * /api/warehouse/inventory/alerts:
 *   get:
 *     summary: Get Low Stock Alerts
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Items below min stock level
 */

export default router;
