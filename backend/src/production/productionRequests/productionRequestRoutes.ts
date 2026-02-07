import { Router } from 'express';
import {
    createRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest
} from './productionRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createProductionRequestSchema } from './productionRequestValidator.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('Production Manager', 'System Admin'),
    getAllRequests
);

router.post('/',
    authorize('Sales Staff', 'Production Manager', 'System Admin'), // Sales can request
    validate(createProductionRequestSchema),
    createRequest
);

router.get('/:id',
    authorize('Production Manager', 'System Admin', 'Sales Staff'),
    getRequestById
);

router.put('/:id/approve',
    authorize('Production Manager'),
    approveRequest
);

router.put('/:id/reject',
    authorize('Production Manager'),
    rejectRequest
);

/**
 * @swagger
 * tags:
 *   name: Production Requests
 *   description: Managing requests to produce items
 */

/**
 * @swagger
 * /api/production-requests:
 *   get:
 *     summary: List all Production Requests
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [REQUESTED, APPROVED, COMPLETED, CANCELLED] }
 *     responses:
 *       200:
 *         description: List of requests
 */

/**
 * @swagger
 * /api/production-requests:
 *   post:
 *     summary: Create a Production Request
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: integer }
 *               quantity: { type: integer }
 *               priority: { type: string, enum: [HIGH, MEDIUM, LOW] }
 *     responses:
 *       201:
 *         description: Created successfully
 */

/**
 * @swagger
 * /api/production-requests/{id}/approve:
 *   put:
 *     summary: Approve a Request
 *     tags: [Production Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approved
 */

export default router;
