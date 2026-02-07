import { Router } from 'express';
import {
    getAllRequests,
    getRequestById,
    approveRequest,
    getDispatchSlip
} from './materialRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getAllRequests
);

router.get('/:id',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getRequestById
);

router.put('/:id/approve',
    authorize('Warehouse Staff'),
    approveRequest
);

router.get('/:id/slip',
    authorize('Warehouse Staff', 'Production Manager', 'System Admin'),
    getDispatchSlip
);

/**
 * @swagger
 * tags:
 *   name: Material Requests
 *   description: Warehouse Material Issue for Production
 */

/**
 * @swagger
 * /api/warehouse/material-requests:
 *   get:
 *     summary: List all Material Requests (from Production)
 *     tags: [Material Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED] }
 *     responses:
 *       200:
 *         description: List of requests
 */

/**
 * @swagger
 * /api/warehouse/material-requests/{id}/approve:
 *   put:
 *     summary: Approve & Issue Materials
 *     description: Deducts Component Stock and Logs Transaction
 *     tags: [Material Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Stock Deducted, Request Approved
 *       400:
 *         description: Insufficient Stock
 */

/**
 * @swagger
 * /api/warehouse/material-requests/{id}/slip:
 *   get:
 *     summary: Get Dispatch Slip for Printing
 *     description: Returns formatted data for material dispatch slip
 *     tags: [Material Requests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dispatch slip data
 *       404:
 *         description: Request not found or not approved
 */

export default router;
