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
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.SUPPLIER_READ),
    getAllSuppliers
);
router.get('/:id',
    authorize(PERM.SUPPLIER_READ),
    getSupplierById
);
router.post('/',
    authorize(PERM.SUPPLIER_CREATE),
    validate(createSupplierSchema),
    createSupplier
);
router.put('/:id',
    authorize(PERM.SUPPLIER_UPDATE),
    validate(updateSupplierSchema),
    updateSupplier
);
router.delete('/:id',
    authorize(PERM.SUPPLIER_UPDATE),
    deleteSupplier
);


router.get('/:id/components',
    authorize(PERM.SUPPLIER_READ),
    getSupplierComponents
);
router.post('/:id/components',
    authorize(PERM.SUPPLIER_UPDATE),
    assignComponent
);
router.delete('/:id/components/:componentId',
    authorize(PERM.SUPPLIER_UPDATE),
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
 *     summary: List all suppliers (paginated)
 *     tags: [Suppliers]
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
 *         description: Paginated list of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     last_page: { type: integer }
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
