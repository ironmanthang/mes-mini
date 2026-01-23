import { Router } from 'express';
import {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole
} from './roleController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { roleSchema } from './roleValidator.js';

const router = Router();

router.use(protect, authorize('System Admin'));
router.get('/', getAllRoles);
router.post('/', validate(roleSchema), createRole);
router.put('/:id', validate(roleSchema), updateRole);
router.delete('/:id', deleteRole);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   roleId: { type: integer }
 *                   roleName: { type: string }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Not a System Admin)
 *       500:
 *         description: Server Error
 */


/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName]
 *             properties:
 *               roleName: { type: string, example: "Production Manager" }
 *     responses:
 *       201:
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roleId: { type: integer }
 *                 roleName: { type: string }
 *       400:
 *         description: Validation Error or Duplicate Name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *             examples:
 *               Duplicate:
 *                 value: { message: "Role name already exists" }
 *               Empty:
 *                 value: { message: "\"roleName\" is not allowed to be empty" }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update a role name
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
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
 *             required: [roleName]
 *             properties:
 *               roleName: { type: string, example: "Updated Role Name" }
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Validation Error, Duplicate Name, or Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Role deleted successfully" }
 *       400:
 *         description: Role In Use or Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Cannot delete role because it is assigned to users." }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

export default router;
