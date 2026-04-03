import { Router } from 'express';
import {
    createUser,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus
    // deleteEmployee
} from './employeeController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { employeeCreateSchema, employeeUpdateSchema, statusUpdateSchema } from './employeeValidator.js';

const router = Router();

router.use(protect, authorize('System Admin'));

router.post('/', validate(employeeCreateSchema), createUser);
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', validate(employeeUpdateSchema), updateEmployee);
// DELETE route is commented out as hard-deleting employees ruins data traceability. Use status update to INACTIVE instead.
// router.delete('/:id', deleteEmployee);
router.patch('/:id/status', validate(statusUpdateSchema), updateEmployeeStatus);


/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         employeeId: { type: integer, example: 2 }
 *         fullName: { type: string, example: "Nguyen Van A" }
 *         username: { type: string, example: "user1" }
 *         email: { type: string, example: "user1@example.com" }
 *         phoneNumber: { type: string, example: "0901234567" }
 *         address: { type: string, example: "123 Ha Noi Street" }
 *         dateOfBirth: { type: string, format: date-time, example: "2000-05-20T00:00:00.000Z" }
 *         hireDate: { type: string, format: date-time, example: "2025-01-01T00:00:00.000Z" }
 *         terminationDate: { type: string, format: date-time, nullable: true }
 *         status: { type: string, enum: [ACTIVE, INACTIVE], example: "ACTIVE" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         roles: 
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               roleId: { type: integer, example: 1 }
 *               roleName: { type: string, example: "System Admin" }
 *         _devCredentials:
 *           type: object
 *           description: "SPECIAL FIELD: Returned only in development mode when GMAIL_USER is unconfigured. Never sent in production."
 *           properties:
 *             email: { type: string, example: "user1@example.com" }
 *             password: { type: string, example: "temp-password-123" }
 */

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee (System Admin only)
 *     description: Create a new user account. Requires at least one Role ID.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phoneNumber, province, ward, street, hireDate, roleIds]
 *             properties:
 *               fullName: 
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email: 
 *                 type: string
 *                 example: "user1@example.com"
 *               phoneNumber: 
 *                 type: string
 *                 example: "0901234567"
 *               province: 
 *                 type: string
 *                 example: "Ho Chi Minh"
 *               ward: 
 *                 type: string
 *                 example: "District 1"
 *               street: 
 *                 type: string
 *                 example: "123 Le Loi"
 *               dateOfBirth: 
 *                 type: string
 *                 format: date
 *                 example: "2000-05-20"
 *               hireDate: 
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               roleIds: 
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1]
 *               status: 
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *     responses:
 *       201:
 *         description: Employee created successfully. If GMAIL_USER or GMAIL_APP_PASSWORD  is unconfigured (Dev Mode), response includes '_devCredentials' with the plain text password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation Error (Joi) or Duplicate Data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *             examples:
 *               JoiError:
 *                 value: { message: "\"email\" must be a valid email" }
 *               DuplicateError:
 *                 value: { message: "Username already exists" }
 *       401:
 *         description: Not Authorized (Token failed)
 *       403:
 *         description: Forbidden (Requires System Admin role)
 */

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: List all employees (System Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of all employees in the system
 *       403:
 *         description: Forbidden (Not a System Admin)
 */

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get single employee details (System Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Employee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update full employee details (System Admin only)
 *     description: Admin can update any field including Roles, Status, and Dates.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
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
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               province: { type: string }
 *               ward: { type: string }
 *               street: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               hireDate: { type: string, format: date }
 *               terminationDate: { type: string, format: date, nullable: true }
 *               roleIds: { type: array, items: { type: integer } }
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/employees/{id}/status:
 *   patch:
 *     summary: Quick update status (System Admin only)
 *     description: Use this for Soft Delete (Deactivating) or Reactivating users.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 */


// DELETE api doc removed

export default router;
