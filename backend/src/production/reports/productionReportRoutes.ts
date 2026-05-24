import { Router } from 'express';

import { getLinePerformance } from './productionReportController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect, authorize(PERM.DASH_READ));

router.get('/line-performance', getLinePerformance);

/**
 * @swagger
 * tags:
 *   name: Production Reports
 *   description: Production output and quality performance reporting
 */

/**
 * @swagger
 * /api/production/reports/line-performance:
 *   get:
 *     summary: Get production line performance report
 *     description: Reports finished product output by production line and product, including passed, failed, and pending QC quantities.
 *     tags: [Production Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: Inclusive start date in YYYY-MM-DD format.
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: Inclusive end date in YYYY-MM-DD format.
 *       - in: query
 *         name: productionLineId
 *         schema: { type: integer }
 *       - in: query
 *         name: productId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Production line performance totals and breakdowns
 *       400:
 *         description: Invalid query parameter
 */

export default router;
