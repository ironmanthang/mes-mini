import { Router } from 'express';
import {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole
} from './roleController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { roleCreateSchema, roleUpdateSchema } from './roleValidator.js';
import { PERM } from '../../common/constants/permissions.js';
import RoleService from './roleService.js';

const router = Router();

router.use(protect, authorize(PERM.ROLE_MANAGE));
router.get('/', getAllRoles);
router.post('/', validate(roleCreateSchema), createRole);
router.put('/:id', validate(roleUpdateSchema), updateRole);
router.delete('/:id', deleteRole);
router.get('/permissions', async (req, res) => {
    try {
        const { search, module } = req.query;
        const permissions = await RoleService.getAllPermissions(
            search as string, 
            module as string
        );
        res.status(200).json(permissions);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});
router.get('/:id/permissions', async (req, res) => {
    try {
        const permissions = await RoleService.getRolePermissions(req.params.id);
        res.status(200).json(permissions);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
});
router.put('/:id/permissions', async (req, res) => {
    try {
        const { permCodes } = req.body;
        if (!Array.isArray(permCodes)) {
            res.status(400).json({ message: '`permCodes` must be an array of permission code strings.' });
            return;
        }
        const result = await RoleService.setRolePermissions(req.params.id, permCodes);
        res.status(200).json({ message: 'Permissions updated successfully', role: result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
});




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
 *                   roleCode: { type: string, example: "PROD_MGR" }
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
 *               roleCode: { type: string, example: "PROD_MGR" }
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
 *                 roleCode: { type: string, example: "PROD_MGR" }
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
 *             properties:
 *               roleCode: { type: string, example: "UPDATED_CODE" }
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



/**
 * @swagger
 * /api/roles/permissions:
 *   get:
 *     summary: Get full permission catalog (with search & filter)
 *     description: Returns permissions from the database. Supports searching by `permCode` or `description` and filtering by `module`. Used by the Permission Management UI.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by permission code or description (partial, case-insensitive)
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *         description: Filter by specific module code (e.g., PO, SO, EMP)
 *     responses:
 *       200:
 *         description: List of permissions after filtering
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   permissionId: { type: integer }
 *                   permCode: { type: string, example: "PO_APPROVE" }
 *                   module: { type: string, example: "PO" }
 *                   description: { type: string, example: "Approve Purchase Orders" }
 */



/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: Get current permission assignments for a specific role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of permissions assigned to this role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   roleId: { type: integer }
 *                   permissionCode: { type: string, example: "PO_READ" }
 */

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: Full-replace permission assignments for a role
 *     description: Atomically replaces all permissions for the target role with the provided list.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
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
 *             required: [permCodes]
 *             properties:
 *               permCodes:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["PO_READ", "PO_APPROVE", "EMP_READ"]
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       400:
 *         description: Invalid permissions or role not found
 */

export default router;
