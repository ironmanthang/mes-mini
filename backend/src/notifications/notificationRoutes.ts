import { Router } from 'express';
import {
    getUnreadNotifications,
    getAllNotifications,
    markAsRead,
    markAllAsRead
} from './notificationController.js';
import { protect } from '../common/middleware/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/notifications/unread - For polling (returns unread + count)
router.get('/unread', getUnreadNotifications);

// GET /api/notifications - All notifications (paginated)
router.get('/', getAllNotifications);

// PUT /api/notifications/:id/read - Mark single as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification system (polling-based)
 */

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     summary: Get unread notifications (for polling)
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unread notifications with count
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications (paginated)
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated notifications
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked as read
 */

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All marked as read
 */

export default router;
