import { Router } from 'express';
import { lookupWarranty, activateWarranty } from './warrantyController.js';

const router = Router();

router.get('/lookup/:serialNumber', lookupWarranty);
router.post('/activate', activateWarranty);

/**
 * @swagger
 * tags:
 *   name: Public Warranty
 *   description: Unauthenticated warranty endpoints
 */

/**
 * @swagger
 * /api/public/warranties/lookup/{serialNumber}:
 *   get:
 *     summary: Lookup warranty details for a product instance
 *     tags: [Public Warranty]
 *     parameters:
 *       - in: path
 *         name: serialNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warranty details
 *       404:
 *         description: Product instance not found
 */

/**
 * @swagger
 * /api/public/warranties/activate:
 *   post:
 *     summary: Activate warranty for a shipped product
 *     tags: [Public Warranty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serialNumber, customerName, email]
 *             properties:
 *               serialNumber: { type: string }
 *               customerName: { type: string }
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *     responses:
 *       201:
 *         description: Warranty activated successfully
 *       400:
 *         description: Validation error or warranty already activated
 */

export default router;
