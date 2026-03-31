import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductBarcode
} from './productController.js';
import { getBom, addBomComponent, updateBomComponent, removeBomComponent } from './bomController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createProductSchema, updateProductSchema, addBomComponentSchema, updateBomComponentSchema, checkFeasibilitySchema } from './productValidator.js';
import { getProductProductionContext, checkProductionFeasibility } from '../../production/mrp/productionFeasibilityController.js';

const router = Router();

router.use(protect);

router.get('/', authorize('System Admin', 'Production Manager', 'Sales Staff', 'Warehouse Keeper', 'Purchasing Staff', 'Line Leader', 'Production Worker', 'QC Inspector'), getAllProducts);
router.get('/:id', authorize('System Admin', 'Production Manager', 'Sales Staff', 'Warehouse Keeper', 'Purchasing Staff', 'Line Leader', 'Production Worker', 'QC Inspector'), getProductById);
router.post('/', authorize('System Admin', 'Production Manager'), validate(createProductSchema), createProduct);
router.put('/:id', authorize('System Admin', 'Production Manager'), validate(updateProductSchema), updateProduct);
router.delete('/:id', authorize('System Admin'), deleteProduct);

// --- Production Feasibility Routes ---
/**
 * @swagger
 * /api/products/{id}/production-context:
 *   get:
 *     summary: Get proactive production context (Stock vs Demand)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suggested production quantity based on stock and demand
 */
router.get('/:id/production-context',
    authorize('System Admin', 'Production Manager'),
    getProductProductionContext
);

/**
 * @swagger
 * /api/products/{id}/production-feasibility:
 *   post:
 *     summary: Run live BOM feasibility check
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Feasibility report (canProduce + requirements)
 */
router.post('/:id/production-feasibility',
    authorize('System Admin', 'Production Manager'),
    validate(checkFeasibilitySchema),
    checkProductionFeasibility
);

router.get('/:id/barcode',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper', 'QC Inspector'),
    getProductBarcode
);

// --- BOM Routes ---
const bomAuth = authorize('System Admin', 'Production Manager');

router.get('/:id/bom', authorize('System Admin', 'Production Manager', 'Warehouse Keeper', 'Purchasing Staff', 'Line Leader'), getBom);
router.post('/:id/bom', bomAuth, validate(addBomComponentSchema), addBomComponent);
router.put('/:id/bom/:componentId', bomAuth, validate(updateBomComponentSchema), updateBomComponent);
router.delete('/:id/bom/:componentId', bomAuth, removeBomComponent);

// --- Production Feasibility Routes ---
/**
 * @swagger
 * /api/products/{id}/production-context:
 *   get:
 *     summary: Get proactive production context (Stock vs Demand)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suggested production quantity based on stock and demand
 */
router.get('/:id/production-context',
    authorize('System Admin', 'Production Manager'),
    getProductProductionContext
);

/**
 * @swagger
 * /api/products/{id}/production-feasibility:
 *   post:
 *     summary: Run live BOM feasibility check
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Feasibility report (canProduce + requirements)
 */
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


/**
 * @swagger
 * /api/products/{id}/bom:
 *   get:
 *     summary: Get Bill of Materials for a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of BOM components
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId: { type: integer }
 *                   componentId: { type: integer }
 *                   quantityNeeded: { type: integer, example: 5 }
 *                   component:
 *                     type: object
 *                     properties:
 *                       componentId: { type: integer }
 *                       componentName: { type: string }
 *                       code: { type: string }
 *                       unit: { type: string }
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/{id}/bom:
 *   post:
 *     summary: Add a component to a product's BOM
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [componentId, quantityNeeded]
 *             properties:
 *               componentId: { type: integer, example: 1 }
 *               quantityNeeded: { type: integer, minimum: 1, example: 5 }
 *     responses:
 *       201:
 *         description: BOM entry created
 *       400:
 *         description: Validation error or duplicate component
 *       404:
 *         description: Product or Component not found
 */

/**
 * @swagger
 * /api/products/{id}/bom/{componentId}:
 *   put:
 *     summary: Update quantity of a component in the BOM
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema: { type: integer }
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantityNeeded]
 *             properties:
 *               quantityNeeded: { type: integer, minimum: 1, example: 10 }
 *     responses:
 *       200:
 *         description: BOM entry updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product or BOM entry not found
 */

/**
 * @swagger
 * /api/products/{id}/bom/{componentId}:
 *   delete:
 *     summary: Remove a component from the BOM
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema: { type: integer }
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component removed from BOM
 *       404:
 *         description: Product or BOM entry not found
 */

export default router;
