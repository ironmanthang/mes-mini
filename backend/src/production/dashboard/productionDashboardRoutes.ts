import { Router } from 'express';
import { getProductionDashboard } from './productionDashboardController.js';
import { protect } from '../../common/middleware/authMiddleware.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Production Dashboard
 *   description: Production KPIs — Pending PRs, Work Orders, QC, Cost
 */

/**
 * @swagger
 * /api/production/dashboard:
 *   get:
 *     summary: Get production dashboard metrics
 *     description: Returns pending production requests. Work Orders, QC Pass Rate, and Cost/Unit are stubbed (null) until those flows are implemented.
 *     tags: [Production Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Production dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingRequests:
 *                   type: object
 *                   properties:
 *                     count: { type: integer }
 *                     requests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code: { type: string }
 *                           productName: { type: string }
 *                           quantity: { type: integer }
 *                           priority: { type: string }
 *                           status: { type: string }
 *                 activeWorkOrders: { type: integer, nullable: true }
 *                 qcPassRate: { type: number, nullable: true }
 *                 costPerUnit:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     amount: { type: number }
 *                     productName: { type: string }
 */
router.get('/', getProductionDashboard);

export default router;
