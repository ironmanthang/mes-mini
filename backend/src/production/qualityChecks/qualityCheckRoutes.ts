import { Router } from 'express';
import { createCheck, getByProduct, getByWorkOrder } from './qualityCheckController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createCheckSchema } from './qualityCheckValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

router.post('/',
    authorize(PERM.QC_CREATE),
    validate(createCheckSchema),
    createCheck
);

router.get('/product/:productId',
    authorize(PERM.QC_READ),
    getByProduct
);

router.get('/work-order/:woId',
    authorize(PERM.QC_READ),
    getByWorkOrder
);

/**
 * @swagger
 * tags:
 *   name: Quality
 *   description: Quality Control (QC) inspection operations
 */

/**
 * @swagger
 * /api/quality:
 *   post:
 *     summary: Record a QC inspection result for a product instance
 *     description: |
 *       Submits inspection results for ALL points in the product's assigned checklist.
 *       The overall result (PASSED/FAILED) is derived **server-side** using the
 *       **One Fail = Total Fail** rule.
 *       After recording, the instance status changes to PASSED_QC or FAILED_QC.
 *       Warehouse induction is a separate step via POST /api/warehouse-ops/product-induction.
 *     tags: [Quality]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serialNumber, inspectionResults]
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 description: Unique serial number of the product instance to inspect
 *               checkDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional inspection date (defaults to now)
 *               notes:
 *                 type: string
 *                 description: Optional overall notes for the QC check
 *               inspectionResults:
 *                 type: array
 *                 minItems: 1
 *                 description: |
 *                   Results for EVERY inspection point in the product checklist.
 *                   Submitting a partial list will return a 400 error listing the missing point IDs.
 *                   Fetch the checklist via GET /api/master-data/quality-checklists/{checklistId} to get all required inspectionPointIds.
 *                 items:
 *                   type: object
 *                   required: [inspectionPointId, passed]
 *                   properties:
 *                     inspectionPointId:
 *                       type: integer
 *                       description: ID of the inspection point (from the product checklist)
 *                     passed:
 *                       type: boolean
 *                       description: Whether this inspection point passed
 *                     measuredValue:
 *                       type: number
 *                       description: Measured value — required for MEASUREMENT type points
 *                     notes:
 *                       type: string
 *                       description: Optional notes for this specific inspection point
 *           example:
 *             serialNumber: "SN-QC-TEST-0001"
 *             checkDate: "2026-05-06T08:00:00.000Z"
 *             notes: "Final assembly quality check"
 *             inspectionResults:
 *               - inspectionPointId: 1
 *                 passed: true
 *                 notes: "Device powered on successfully"
 *               - inspectionPointId: 2
 *                 passed: true
 *                 notes: "Screen is flawless"
 *               - inspectionPointId: 3
 *                 passed: true
 *                 measuredValue: 4.0
 *                 notes: "Battery voltage is within range"
 *     responses:
 *       201:
 *         description: QC inspection recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qualityCheckId: { type: integer }
 *                 result:
 *                   type: string
 *                   enum: [PASSED, FAILED]
 *                   description: Server-computed overall result
 *                 instanceStatus:
 *                   type: string
 *                   enum: [PASSED_QC, FAILED_QC]
 *                   description: Updated status of the product instance
 *                 checkDate: { type: string, format: date-time }
 *                 notes: { type: string }
 *                 inspectionResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       inspectionResultId: { type: integer }
 *                       inspectionPointId: { type: integer }
 *                       passed: { type: boolean }
 *                       measuredValue: { type: number, nullable: true }
 *                       notes: { type: string, nullable: true }
 *       400:
 *         description: Validation error — missing points, duplicate QC, or missing checklist
 *       401:
 *         description: Unauthorized — valid bearer token required
 *       403:
 *         description: Forbidden — QC_CREATE permission required
 */

/**
 * @swagger
 * /api/quality/product/{productId}:
 *   get:
 *     summary: Get QC history for a product
 *     tags: [Quality]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID to retrieve QC history for
 *     responses:
 *       200:
 *         description: List of QC checks with granular inspection results for this product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   qualityCheckId: { type: integer }
 *                   checkDate: { type: string, format: date-time }
 *                   result: { type: string, enum: [PASSED, FAILED] }
 *                   notes: { type: string, nullable: true }
 *                   employee:
 *                     type: object
 *                     properties:
 *                       fullName: { type: string }
 *                   productInstance:
 *                     type: object
 *                     properties:
 *                       serialNumber: { type: string }
 *                       status: { type: string }
 *                   inspectionResults:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         passed: { type: boolean }
 *                         measuredValue: { type: number, nullable: true }
 *                         notes: { type: string, nullable: true }
 *                         inspectionPoint:
 *                           type: object
 *                           properties:
 *                             pointName: { type: string }
 *                             pointType: { type: string }
 */

/**
 * @swagger
 * /api/quality/work-order/{woId}:
 *   get:
 *     summary: Get all QC checks for a work order
 *     description: Returns QC results for every product instance produced under this work order. Useful for batch QC review dashboards.
 *     tags: [Quality]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: woId
 *         required: true
 *         schema: { type: integer }
 *         description: Work Order ID
 *     responses:
 *       200:
 *         description: All QC checks for all instances produced under this work order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   qualityCheckId: { type: integer }
 *                   checkDate: { type: string, format: date-time }
 *                   result: { type: string, enum: [PASSED, FAILED] }
 *                   notes: { type: string, nullable: true }
 *                   employee:
 *                     type: object
 *                     properties:
 *                       fullName: { type: string }
 *                   productInstance:
 *                     type: object
 *                     properties:
 *                       serialNumber: { type: string }
 *                       status: { type: string }
 *                   inspectionResults:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         passed: { type: boolean }
 *                         measuredValue: { type: number, nullable: true }
 *                         notes: { type: string, nullable: true }
 *                         inspectionPoint:
 *                           type: object
 *                           properties:
 *                             pointName: { type: string }
 *                             pointType: { type: string }
 */

export default router;
