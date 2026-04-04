import { Router } from 'express';
import { getWarehouseDashboard } from './warehouseDashboardController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect, authorize(PERM.DASH_READ));

/**
 * @swagger
 * tags:
 *   name: Warehouse Dashboard
 *   description: Warehouse KPIs — Finished Goods, Component Health, Alerts
 */

/**
 * @swagger
 * /api/warehouse-ops/dashboard:
 *   get:
 *     summary: Get warehouse dashboard metrics
 *     description: Returns finished goods stock, component health, and active alerts. Supports optional warehouse filtering.
 *     tags: [Warehouse Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *         description: Optional warehouse ID to filter metrics
 *     responses:
 *       200:
 *         description: Warehouse dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 finishedGoods:
 *                   type: object
 *                   properties:
 *                     lowStockCount: { type: integer }
 *                     lowStockProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId: { type: integer }
 *                           productName: { type: string }
 *                           inStockCount: { type: integer }
 *                           minStockLevel: { type: integer }
 *                 components:
 *                   type: object
 *                   properties:
 *                     lowStockCount: { type: integer }
 *                     totalTracked: { type: integer }
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       severity: { type: string, enum: [LOW_STOCK, SHORTAGE, RECEIVED] }
 *                       message: { type: string }
 *                       time: { type: string, format: date-time }
 */
router.get('/', getWarehouseDashboard);

export default router;
