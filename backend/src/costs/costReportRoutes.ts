import { Router } from 'express';

import { getMaterialCosts, getProductCosts } from './costReportController.js';
import { protect, authorize } from '../common/middleware/authMiddleware.js';
import { PERM } from '../common/constants/permissions.js';

const router = Router();

router.use(protect, authorize(PERM.DASH_READ));

router.get('/materials', getMaterialCosts);
router.get('/products', getProductCosts);

/**
 * @swagger
 * tags:
 *   name: Cost Reports
 *   description: Cost reporting for purchased materials and manufactured products
 */

/**
 * @swagger
 * /api/costs/materials:
 *   get:
 *     summary: Get raw material cost report
 *     description: Reports material spend from IMPORT_PO inventory transactions using the original Purchase Order line unit price.
 *     tags: [Cost Reports]
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
 *         name: componentId
 *         schema: { type: integer }
 *       - in: query
 *         name: supplierId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Material cost totals and breakdowns
 *       400:
 *         description: Invalid query parameter
 */

/**
 * @swagger
 * /api/costs/products:
 *   get:
 *     summary: Get finished product cost report
 *     description: Reports frozen production cost snapshots saved on completed Work Orders and Product Instances after QC cost absorption.
 *     tags: [Cost Reports]
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
 *         name: productId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product cost totals and breakdowns
 *       400:
 *         description: Invalid query parameter
 */

export default router;
