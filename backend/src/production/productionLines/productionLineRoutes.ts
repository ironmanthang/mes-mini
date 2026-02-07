import { Router } from 'express';
import {
    getAllProductionLines,
    getProductionLineById,
    createProductionLine,
    updateProductionLine,
    deleteProductionLine
} from './productionLineController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createProductionLineSchema, updateProductionLineSchema } from './productionLineValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize('System Admin', 'Production Manager', 'Line Leader'), getAllProductionLines);
router.get('/:id', authorize('System Admin', 'Production Manager', 'Line Leader'), getProductionLineById);
router.post('/', authorize('System Admin', 'Production Manager'), validate(createProductionLineSchema), createProductionLine);
router.put('/:id', authorize('System Admin', 'Production Manager'), validate(updateProductionLineSchema), updateProductionLine);
router.delete('/:id', authorize('System Admin'), deleteProductionLine);

/**
 * @swagger
 * tags:
 *   name: Production Lines
 *   description: Manufacturing line management
 */

/**
 * @swagger
 * /api/production/lines:
 *   get:
 *     summary: Get all production lines
 *     tags: [Production Lines]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of production lines with work order counts
 */

/**
 * @swagger
 * /api/production/lines/{id}:
 *   get:
 *     summary: Get production line details
 *     tags: [Production Lines]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Production line with active work orders
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/production/lines:
 *   post:
 *     summary: Create production line
 *     tags: [Production Lines]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lineName]
 *             properties:
 *               lineName: { type: string, example: "SMT Line 1" }
 *               location: { type: string, example: "Building A, Floor 2" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error or duplicate name
 */

/**
 * @swagger
 * /api/production/lines/{id}:
 *   put:
 *     summary: Update production line
 *     tags: [Production Lines]
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
 *               lineName: { type: string }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/production/lines/{id}:
 *   delete:
 *     summary: Delete production line
 *     tags: [Production Lines]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Cannot delete (has active work orders)
 *       404:
 *         description: Not found
 */

export default router;
