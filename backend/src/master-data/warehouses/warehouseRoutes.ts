import { Router } from 'express';
import { getAllWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from './warehouseController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/', 
    authorize(PERM.WH_STOCK_READ), 
    getAllWarehouses
);

router.post('/', 
    authorize(PERM.WH_MANAGE),
    createWarehouse
);

router.put('/:id', 
    authorize(PERM.WH_MANAGE),
    updateWarehouse
);

router.delete('/:id', 
    authorize(PERM.WH_MANAGE),
    deleteWarehouse
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

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseName, warehouseType]
 *             properties:
 *               warehouseName: { type: string, example: "Main Raw Materials" }
 *               location: { type: string, example: "Building A, Floor 1" }
 *               warehouseType: { type: string, enum: [COMPONENT, SALES, ERROR], example: "COMPONENT" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error or invalid type
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               warehouseName: { type: string, example: "Main Raw Materials v2" }
 *               location: { type: string, example: "Building A, Floor 1, Zone B" }
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Validation Error
 *       404:
 *         description: Warehouse not found
 */

/**
 * @swagger
 * /api/warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse
 *     tags: [Warehouses]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       400:
 *         description: Cannot delete warehouse (has active inventory or pending orders)
 *       404:
 *         description: Warehouse not found
 */

export default router;
