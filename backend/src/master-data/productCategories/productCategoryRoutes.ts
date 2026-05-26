import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from './productCategoryController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './productCategoryValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Product Categories
 *   description: Product Category Master Data
 */

/**
 * @swagger
 * /api/master-data/product-categories:
 *   get:
 *     summary: List all product categories
 *     tags: [Product Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of product categories
 */
router.get('/', authorize(PERM.PRODUCT_READ), getAllCategories);

/**
 * @swagger
 * /api/master-data/product-categories/{id}:
 *   get:
 *     summary: Get a product category by ID
 *     tags: [Product Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Not found
 */
router.get('/:id', authorize(PERM.PRODUCT_READ), getCategoryById);

/**
 * @swagger
 * /api/master-data/product-categories:
 *   post:
 *     summary: Create a new product category
 *     tags: [Product Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryName]
 *             properties:
 *               categoryName: { type: string, example: "Laptops & Computers" }
 *               description: { type: string, example: "Portable computing devices" }
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error or duplicate name
 */
router.post('/', authorize(PERM.PRODUCT_CREATE), validate(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/master-data/product-categories/{id}:
 *   put:
 *     summary: Update a product category
 *     tags: [Product Categories]
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
 *               categoryName: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated category
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
router.put('/:id', authorize(PERM.PRODUCT_UPDATE), validate(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/master-data/product-categories/{id}:
 *   delete:
 *     summary: Delete a product category
 *     tags: [Product Categories]
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
 *         description: Category is still in use by products
 *       404:
 *         description: Not found
 */
router.delete('/:id', authorize(PERM.PRODUCT_UPDATE), deleteCategory);

export default router;
