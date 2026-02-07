import { Router } from 'express';
import { getSummary, getInventoryOverview, getProductionStatus } from './dashboardController.js';
import { protect, authorize } from '../common/middleware/authMiddleware.js';

const router = Router();

router.use(protect);

// All authenticated users can view dashboard
// All authenticated users can view dashboard
router.get('/summary', getSummary);
router.get('/inventory', getInventoryOverview);
router.get('/production', getProductionStatus);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard KPIs and overview data
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get high-level KPI summary
 *     description: Returns aggregated counts for inventory, production, sales, and procurement
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventory:
 *                   type: object
 *                   properties:
 *                     totalComponents: { type: integer }
 *                     totalProducts: { type: integer }
 *                     lowStockAlerts: { type: integer }
 *                     totalInventoryValue: { type: number }
 *                 production:
 *                   type: object
 *                   properties:
 *                     activeWorkOrders: { type: integer }
 *                     completedThisMonth: { type: integer }
 *                     pendingProductionRequests: { type: integer }
 *                 sales:
 *                   type: object
 *                   properties:
 *                     pendingSalesOrders: { type: integer }
 *                     processingOrders: { type: integer }
 *                     completedThisMonth: { type: integer }
 *                 procurement:
 *                   type: object
 *                   properties:
 *                     pendingPurchaseOrders: { type: integer }
 *                     partiallyReceived: { type: integer }
 */

/**
 * @swagger
 * /api/dashboard/inventory:
 *   get:
 *     summary: Get inventory overview
 *     description: Stock distribution by warehouse and low stock alerts
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Inventory overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 componentsByWarehouse:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouseId: { type: integer }
 *                       warehouseName: { type: string }
 *                       totalQuantity: { type: integer }
 *                       totalValue: { type: number }
 *                 topLowStockItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       componentId: { type: integer }
 *                       code: { type: string }
 *                       componentName: { type: string }
 *                       currentStock: { type: integer }
 *                       minStockLevel: { type: integer }
 *                       deficit: { type: integer }
 */

/**
 * @swagger
 * /api/dashboard/production:
 *   get:
 *     summary: Get production status
 *     description: Work orders by status, recent batches, and production queue
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Production status data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workOrdersByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       count: { type: integer }
 *                 recentCompletedBatches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       batchCode: { type: string }
 *                       productName: { type: string }
 *                       quantity: { type: integer }
 *                       completedAt: { type: string, format: date-time }
 *                 productionRequestsQueue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code: { type: string }
 *                       productName: { type: string }
 *                       quantity: { type: integer }
 *                       priority: { type: string }
 *                       requestDate: { type: string, format: date-time }
 */

export default router;
