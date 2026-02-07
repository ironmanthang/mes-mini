import { Router } from 'express';
import { createCheck, getByProduct, getByWorkOrder } from './qualityController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createCheckSchema } from './qualityValidator.js';

const router = Router();

router.use(protect);

router.post('/',
    authorize('System Admin', 'Production Manager', 'QC Inspector'),
    validate(createCheckSchema),
    createCheck
);

router.get('/product/:productId',
    authorize('System Admin', 'Production Manager', 'QC Inspector'),
    getByProduct
);

router.get('/work-order/:woId',
    authorize('System Admin', 'Production Manager', 'QC Inspector'),
    getByWorkOrder
);

/**
 * @swagger
 * tags:
 *   name: Quality
 *   description: Quality Control (QC) operations
 */

/**
 * @swagger
 * /api/quality:
 *   post:
 *     summary: Record a new QC result
 *     tags: [Quality]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, passed]
 *             properties:
 *               workOrderId: { type: integer }
 *               productId: { type: integer }
 *               passed: { type: boolean, description: "True = PASSED, False = FAILED" }
 *               checkDate: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: QC Record Created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/quality/product/{productId}:
 *   get:
 *     summary: Get QC history for a product
 *     tags: [Quality]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: QC history
 */

export default router;
