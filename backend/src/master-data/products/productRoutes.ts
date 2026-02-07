import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductBarcode
} from './productController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createProductSchema, updateProductSchema } from './productValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize('System Admin', 'Production Manager', 'Sales Staff', 'Warehouse Keeper', 'Purchasing Staff', 'Line Leader', 'Production Worker', 'QC Inspector'), getAllProducts);
router.get('/:id', authorize('System Admin', 'Production Manager', 'Sales Staff', 'Warehouse Keeper', 'Purchasing Staff', 'Line Leader', 'Production Worker', 'QC Inspector'), getProductById);
router.post('/', authorize('System Admin', 'Production Manager'), validate(createProductSchema), createProduct);
router.put('/:id', authorize('System Admin', 'Production Manager'), validate(updateProductSchema), updateProduct);
router.delete('/:id', authorize('System Admin'), deleteProduct);

router.get('/:id/barcode',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper', 'QC Inspector'),
    getProductBarcode
);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Finished Goods Catalog
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products (paginated)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of products
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, productName, unit]
 *             properties:
 *               code: { type: string, example: "PRD-001" }
 *               productName: { type: string, example: "Smart Thermostat" }
 *               unit: { type: string, example: "pcs" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *               code: { type: string }
 *               productName: { type: string }
 *               unit: { type: string }
 *               categoryId: { type: integer }
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
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Cannot delete (has orders)
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/products/{id}/barcode:
 *   get:
 *     summary: Get barcode data for a product
 *     description: Returns barcode string for printing/display
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Barcode data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId: { type: integer }
 *                 code: { type: string }
 *                 productName: { type: string }
 *                 barcode: { type: string, example: "PRD-THERMOSTAT001" }
 *                 unit: { type: string }
 *       404:
 *         description: Product not found
 */

export default router;
