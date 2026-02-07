import { Router } from 'express';
import {
    getAllComponents,
    getComponentById,
    createComponent,
    updateComponent,
    deleteComponent,
    getComponentSuppliers,
    getComponentBarcode
} from './componentController.js';

import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createComponentSchema, updateComponentSchema } from './componentValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize('System Admin', 'Production Manager', 'Purchasing Staff'), getAllComponents);
router.get('/:id', authorize('System Admin', 'Production Manager'), getComponentById);

router.post('/',
    authorize('System Admin', 'Production Manager'),
    validate(createComponentSchema),
    createComponent
);


router.put('/:id',
    authorize('System Admin', 'Production Manager'),
    validate(updateComponentSchema),
    updateComponent
);

router.delete('/:id',
    authorize('System Admin'),
    deleteComponent
);

router.get('/:id/suppliers',
    authorize('System Admin', 'Production Manager', 'Purchasing Staff'),
    getComponentSuppliers
);

router.get('/:id/barcode',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper'),
    getComponentBarcode
);

/**
 * @swagger
 * tags:
 *   name: Components
 *   description: Master data for Raw Materials
 */

/**
 * @swagger
 * /api/components:
 *   get:
 *     summary: List all components (supports ?search= query)
 *     tags: [Components]
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
 *         description: Search by name or code
 *     responses:
 *       200:
 *         description: List of components
 */

/**
 * @swagger
 * /api/components:
 *   post:
 *     summary: Create a new component
 *     tags: [Components]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, componentName, unit]
 *             properties:
 *               code: { type: string, example: "COM-001" }
 *               componentName: { type: string, example: "Steel Sheet 5mm" }
 *               description: { type: string, example: "High quality steel sheet" }
 *               unit: { type: string, example: "pcs" }
 *               minStockLevel: { type: integer, example: 100 }
 *               standardCost: { type: number, example: 50.00 }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation Error
 */

/**
 * @swagger
 * /api/components/{id}:
 *   get:
 *     summary: Get component details
 *     tags: [Components]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Component details
 *       404:
 *         description: Not Found
 */

/**
 * @swagger
 * /api/components/{id}:
 *   put:
 *     summary: Update component
 *     tags: [Components]
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
 *               componentName: { type: string }
 *               description: { type: string }
 *               unit: { type: string }
 *               minStockLevel: { type: integer }
 *               standardCost: { type: number }
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Validation Error
 *       404:
 *         description: Not Found
 */

/**
 * @swagger
 * /api/components/{id}:
 *   delete:
 *     summary: Delete component
 *     tags: [Components]
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
 *         description: Cannot delete (Used in BOM or PO)
 *       404:
 *         description: Not Found
 */


/**
 * @swagger
 * /api/components/{id}/suppliers:
 *   get:
 *     summary: Get all suppliers who sell this component
 *     description: Useful for sourcing. Finds who can provide a specific item.
 *     tags: [Components]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   supplierId: { type: integer }
 *                   supplierName: { type: string }
 *                   code: { type: string }
 *       404:
 *         description: Component not found
 */

/**
 * @swagger
 * /api/components/{id}/barcode:
 *   get:
 *     summary: Get barcode data for a component
 *     description: Returns barcode string for printing/display
 *     tags: [Components]
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
 *                 componentId: { type: integer }
 *                 code: { type: string }
 *                 componentName: { type: string }
 *                 barcode: { type: string, example: "COM-RESISTOR001" }
 *                 unit: { type: string }
 *       404:
 *         description: Component not found
 */

export default router;
