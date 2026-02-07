import { Router } from 'express';
import {
    getAllAgents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent
} from './agentController.js';
import { protect, authorize } from '../../common/middleware/authMiddleware.js';
import validate from '../../common/middleware/validate.js';
import { createAgentSchema, updateAgentSchema } from './agentValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize('System Admin', 'Production Manager', 'Sales Staff'), getAllAgents);
router.get('/:id', authorize('System Admin', 'Production Manager', 'Sales Staff'), getAgentById);
router.post('/',
    authorize('Procurement Manager', 'Sales Manager', 'System Admin'),
    validate(createAgentSchema),
    createAgent
);
router.put('/:id', authorize('System Admin', 'Sales Staff'), validate(updateAgentSchema), updateAgent);
router.delete('/:id', authorize('System Admin'), deleteAgent);

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Customer/Distributor Management
 */

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: List all agents (paginated)
 *     tags: [Agents]
 *     security: [{ bearerAuth: [] }]
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
 *         description: Paginated list of agents
 */

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Agent details
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, agentName, address]
 *             properties:
 *               code: { type: string, example: "AGT-001" }
 *               agentName: { type: string, example: "Electronics Plus Inc" }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: Update agent
 *     tags: [Agents]
 *     security: [{ bearerAuth: [] }]
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
 *               code: { type: string }
 *               agentName: { type: string }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: Delete agent
 *     tags: [Agents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Cannot delete (has orders)
 *       404:
 *         description: Not found
 */

export default router;
