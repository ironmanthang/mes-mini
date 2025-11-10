const express = require('express');
const router = express.Router();
const { createUser, getAllEmployees } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('System Admin'));

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "Jane Doe" }
 *               username: { type: string, example: "janedoe" }
 *               password: { type: string, example: "password123" }
 *               roleIds: { type: array, items: { type: integer }, example: [2, 3] }
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post('/', createUser);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get a list of all employees (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all employees
 */
router.get('/', getAllEmployees);

module.exports = router;