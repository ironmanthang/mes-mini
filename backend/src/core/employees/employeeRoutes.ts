import { Router } from 'express';
import {
    createUser,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee
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
router.delete('/:id', deleteEmployee);
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
 *         status: { type: string, enum: [ACTIVE, INACTIVE, TERMINATED], example: "ACTIVE" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         roles: 
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               roleId: { type: integer, example: 1 }
 *               roleName: { type: string, example: "System Admin" }
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
 *             required: [fullName, username, password, email, phoneNumber, hireDate, roleIds]
 *             properties:
 *               fullName: 
 *                 type: string
 *                 example: "Nguyen Van A"
 *               username: 
 *                 type: string
 *                 example: "user1"
 *               password: 
 *                 type: string
 *                 example: "123456"
 *               email: 
 *                 type: string
 *                 example: "user1@example.com"
 *               phoneNumber: 
 *                 type: string
 *                 example: "0901234567"
 *               address: 
 *                 type: string
 *                 example: "123 Ha Noi Street"
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
 *         description: Employee created successfully
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
 *               username: { type: string }
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               hireDate: { type: string, format: date }
 *               terminationDate: { type: string, format: date, nullable: true }
 *               roleIds: { type: array, items: { type: integer } }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, TERMINATED] }
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
 *     description: Use this for Soft Delete (Terminating) or Reactivating users.
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
 *               status: { type: string, enum: [ACTIVE, INACTIVE, TERMINATED] }
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


/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Hard delete employee (System Admin only)
 *     description: Permanently remove from database. CAUTION - Use status update instead for normal termination.
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
 *         description: Employee permanently deleted
 *       500:
 *         description: Constraint Violation (Employee has existing records)
 */


export default router;
