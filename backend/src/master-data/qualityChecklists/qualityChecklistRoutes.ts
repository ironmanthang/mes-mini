import { Router } from 'express';
import {
    getAllChecklists,
    getChecklistById,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    addInspectionPoint,
    updateInspectionPoint,
    deleteInspectionPoint
} from './qualityChecklistController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import {
    createChecklistSchema,
    updateChecklistSchema,
    createPointSchema,
    updatePointSchema
} from './qualityChecklistValidator.js';
import { PERM } from '../../common/constants/permissions.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Quality Master Data
 *   description: Manage QC Checklists and Inspection Points
 */

/**
 * @swagger
 * /api/master-data/quality-checklists:
 *   get:
 *     summary: Get all quality checklists
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of all checklists
 */
router.get('/', authorize(PERM.QC_READ), getAllChecklists);

/**
 * @swagger
 * /api/master-data/quality-checklists/{id}:
 *   get:
 *     summary: Get a checklist by ID
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checklist details with points
 */
router.get('/:id', authorize(PERM.QC_READ), getChecklistById);

/**
 * @swagger
 * /api/master-data/quality-checklists:
 *   post:
 *     summary: Create a new checklist
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checklistName]
 *             properties:
 *               checklistName:
 *                 type: string
 *               description:
 *                 type: string
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     pointName:
 *                       type: string
 *                     pointType:
 *                       type: string
 *                       enum: [BINARY, MEASUREMENT, SELECTION]
 *     responses:
 *       201:
 *         description: Created checklist
 */
router.post('/', authorize(PERM.PRODUCT_UPDATE), validate(createChecklistSchema), createChecklist);

/**
 * @swagger
 * /api/master-data/quality-checklists/{id}:
 *   put:
 *     summary: Update a checklist
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
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
 *               checklistName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated checklist
 *   delete:
 *     summary: Delete a checklist
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checklist deleted
 */
router.put('/:id', authorize(PERM.PRODUCT_UPDATE), validate(updateChecklistSchema), updateChecklist);
router.delete('/:id', authorize(PERM.PRODUCT_UPDATE), deleteChecklist);

/**
 * @swagger
 * /api/master-data/quality-checklists/{id}/points:
 *   post:
 *     summary: Add an inspection point
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
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
 *             required: [pointName, pointType]
 *             properties:
 *               pointName:
 *                 type: string
 *               pointType:
 *                 type: string
 *                 enum: [BINARY, MEASUREMENT, SELECTION]
 *     responses:
 *       201:
 *         description: Added point
 */
router.post('/:id/points', authorize(PERM.PRODUCT_UPDATE), validate(createPointSchema), addInspectionPoint);

/**
 * @swagger
 * /api/master-data/quality-checklists/points/{pointId}:
 *   put:
 *     summary: Update an inspection point
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pointId
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
 *               pointName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated point
 *   delete:
 *     summary: Delete an inspection point
 *     tags: [Quality Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Point deleted
 */
router.put('/points/:pointId', authorize(PERM.PRODUCT_UPDATE), validate(updatePointSchema), updateInspectionPoint);
router.delete('/points/:pointId', authorize(PERM.PRODUCT_UPDATE), deleteInspectionPoint);

export default router;
