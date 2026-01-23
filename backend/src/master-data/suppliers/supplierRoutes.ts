import { Router } from 'express';
import {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierComponents,
    assignComponent,
    removeComponent
} from './supplierController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema } from './supplierValidator.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper', 'Purchasing Staff'),
    getAllSuppliers
);
router.get('/:id',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper'),
    getSupplierById
);
router.post('/',
    authorize('System Admin', 'Production Manager'),
    validate(createSupplierSchema),
    createSupplier
);
router.put('/:id',
    authorize('System Admin', 'Production Manager'),
    validate(updateSupplierSchema),
    updateSupplier
);
router.delete('/:id',
    authorize('System Admin'),
    deleteSupplier
);


router.get('/:id/components',
    authorize('System Admin', 'Production Manager', 'Warehouse Keeper'),
    getSupplierComponents
);
router.post('/:id/components',
    authorize('System Admin', 'Production Manager'),
    assignComponent
);
router.delete('/:id/components/:componentId',
    authorize('System Admin', 'Production Manager'),
    removeComponent
);


/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Management of raw material vendors (Module A)
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
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
 *                   code: { type: string }
 *                   supplierName: { type: string }
 *       401: 
 *         description: Not Authorized
 *       403: 
 *         description: Forbidden (Role not allowed)
 */

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, supplierName]
 *             properties:
 *               code: { type: string, example: "SUP-001" }
 *               supplierName: { type: string, example: "Samsung Vina" }
 *               email: { type: string, example: "contact@samsung.com" }
 *               phoneNumber: { type: string, example: "0901234567" }
 *               address: { type: string, example: "Hanoi Hi-Tech Park" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation Error or Duplicate
 *       403: 
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier details
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 */

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
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
 *               supplierName: { type: string }
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Validation Error or Duplicate Data
 *       404:
 *         description: Supplier not found
 */

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
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
 *         description: Cannot delete (Has Purchase Orders)
 *       403: 
 *         description: Forbidden
 *       404:
 *         description: Supplier not found
 */


/**
 * @swagger
 * /api/suppliers/{id}/components:
 *   get:
 *     summary: Get all components provided by this supplier
 *     description: Used for the filtered dropdown in Purchase Order creation.
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of components with suggested prices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   componentId: { type: integer }
 *                   name: { type: string }
 *                   suggestedPrice: { type: number }
 */

/**
 * @swagger
 * /api/suppliers/{id}/components:
 *   post:
 *     summary: Assign a component to this supplier
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [componentId]
 *             properties:
 *               componentId: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Assigned successfully
 *       400:
 *         description: Invalid ID
 */

/**
 * @swagger
 * /api/suppliers/{id}/components/{componentId}:
 *   delete:
 *     summary: Remove a component from this supplier's catalog
 *     tags: [Suppliers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Removed successfully
 */

export default router;
