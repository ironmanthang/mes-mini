const express = require('express');
const router = express.Router();
const { 
    login,
    getMe, 
    updateProfile, 
    changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { loginSchema, profileUpdateSchema, changePasswordSchema } = require('../validators/authValidator');

router.post('/login', validate(loginSchema), login);
router.use(protect);
router.get('/me', getMe);
router.put('/profile', validate(profileUpdateSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an employee
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username: { type: string, example: "admin" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Login: successful" }
 *                 token: { type: string, example: "eyJhbGciOiJIUzI1..." }
 *                 user: 
 *                   type: object
 *                   properties:
 *                     employeeId: { type: integer, example: 1 }
 *                     username: { type: string, example: "admin" }
 *                     fullName: { type: string, example: "Nguyen Van A" }
 *                     email: { type: string, example: "admin@example.com" }
 *                     status: { type: string, example: "ACTIVE" }
 *                     roles: 
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roleId: { type: integer, example: 1 }
 *                           roleName: { type: string, example: "System Admin" }
 *       400:
 *         description: Missing Input (Validation Error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "\"username\" is required" }
 *       401:
 *         description: Authentication Failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Invalid credentials" }
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Server error" }
 */


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in employee's data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId: { type: integer, example: 1 }
 *                 fullName: { type: string, example: "Nguyen Van A" }
 *                 username: { type: string, example: "admin" }
 *                 email: { type: string, example: "admin@example.com" }
 *                 phoneNumber: { type: string, example: "0901234567" }
 *                 address: { type: string, example: "123 Industrial Park" }
 *                 dateOfBirth: { type: string, format: "date", example: "1990-01-01T00:00:00.000Z" }
 *                 status: { type: string, example: "ACTIVE" }
 *                 roles: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roleId: { type: integer, example: 1 }
 *                       roleName: { type: string, example: "System Admin" }
 *       401:
 *         description: Not authorized (Token missing or invalid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Not authorized, token failed" }
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Server error" }
 */

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: 
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email: 
 *                 type: string
 *                 example: "email@example.com"
 *               phoneNumber: 
 *                 type: string
 *                 example: "0912345678"
 *               address: 
 *                 type: string
 *                 example: "123 Industrial Park, Hanoi"
 *               dateOfBirth: 
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: Profile updated successfully (Returns updated User object)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employeeId: { type: integer }
 *                 fullName: { type: string }
 *                 email: { type: string }
 *                 phoneNumber: { type: string }
 *                 roles: { type: array, items: { type: object } }
 *       400:
 *         description: Validation Error or Duplicate Data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *             examples:
 *               FormatError:
 *                 summary: Invalid Format (Joi)
 *                 value: { message: "\"email\" must be a valid email" }
 *               DuplicateError:
 *                 summary: Data Conflict
 *                 value: { message: "Email already in use" }
 *       401:
 *         description: Authentication Failed or Account Inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *             examples:
 *               InvalidCredentials:
 *                 summary: Wrong Password or User Not Found
 *                 value:
 *                   message: "Invalid credentials"
 *               InactiveUser:
 *                 summary: Correct Password but Account Banned
 *                 value:
 *                   message: "Account is inactive or terminated. Contact admin."
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Server error" }
 *                 error: { type: string }
 */


/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, description: "Min 6 chars" }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Password changed successfully" }
 *       400:
 *         description: Validation Error or Incorrect Old Password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Incorrect current password" }
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Not authorized, token failed" }
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Server error" }
 */

module.exports = router;