import { Router } from 'express';
import { getAllWarehouses } from './warehouseController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/', 
    authorize(PERM.WH_STOCK_READ), 
    getAllWarehouses
);

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Master data for Warehouses
 */

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: List all warehouses
 *     description: Returns a list of all warehouses in the system. Use query param ?type= to filter.
 *     tags: [Warehouses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [COMPONENT, SALES, ERROR]
 *         description: Filter warehouses by their type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code
 *     responses:
 *       200:
 *         description: List of warehouses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   warehouseId: { type: integer }
 *                   warehouseName: { type: string }
 *                   location: { type: string, nullable: true }
 *                   warehouseType: { type: string }
 *                   code: { type: string }
 *                   createdAt: { type: string, format: date-time }
 *                   updatedAt: { type: string, format: date-time }
 *       400:
 *         description: Invalid warehouse type
 */

export default router;
