import { Router } from 'express';
import { getSalesDashboard } from './salesDashboardController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect, authorize(PERM.DASH_READ));

/**
 * @swagger
 * tags:
 *   name: Sales Dashboard
 *   description: Sales KPIs — Pending Sales Orders waiting for stock
 */

/**
 * @swagger
 * /api/sales/dashboard:
 *   get:
 *     summary: Get sales dashboard metrics
 *     description: Returns pending sales orders that are waiting for stock fulfillment
 *     tags: [Sales Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sales dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingCount: { type: integer }
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       salesOrderId: { type: integer }
 *                       code: { type: string }
 *                       agentName: { type: string }
 *                       productName: { type: string }
 *                       quantity: { type: integer }
 *                       quantityShipped: { type: integer }
 *                       status: { type: string }
 */
router.get('/', getSalesDashboard);

export default router;
