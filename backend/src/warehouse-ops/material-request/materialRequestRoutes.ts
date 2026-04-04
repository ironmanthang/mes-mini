import { Router } from 'express';
import {
    getAllRequests,
    getRequestById,
    approveRequest,
    getDispatchSlip
} from './materialRequestController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.get('/',
    authorize(PERM.MR_READ),
    getAllRequests
);

router.get('/:id',
    authorize(PERM.MR_READ),
    getRequestById
);

router.put('/:id/approve',
    authorize(PERM.MR_APPROVE),
    approveRequest
);

router.get('/:id/slip',
    authorize(PERM.MR_READ),
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
 * /api/warehouse-ops/material-requests:
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
 * /api/warehouse-ops/material-requests/{id}/approve:
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
 * /api/warehouse-ops/material-requests/{id}/slip:
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
