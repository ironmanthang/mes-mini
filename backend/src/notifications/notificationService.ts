import prisma from '../common/lib/prisma.js';
import { NotificationType } from '../generated/prisma/index.js';

interface CreateNotificationData {
    type: NotificationType;
    title: string;
    message: string;
    employeeId: number;
    relatedEntityType?: string;
    relatedEntityId?: number;
}

class NotificationService {

    /**
     * Create a notification for a specific user
     */
    async createNotification(data: CreateNotificationData) {
        return prisma.notification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                employeeId: data.employeeId,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
            }
        });
    }

    /**
     * Create notifications for multiple users (e.g., all managers)
     */
    async notifyByRole(roleName: string, data: Omit<CreateNotificationData, 'employeeId'>) {
        // Find all employees with the given role
        const employees = await prisma.employee.findMany({
            where: {
                status: 'ACTIVE',
                roles: {
                    some: {
                        role: { roleName }
                    }
                }
            },
            select: { employeeId: true }
        });

        if (employees.length === 0) return [];

        // Create notifications for all matched employees
        return prisma.notification.createMany({
            data: employees.map(emp => ({
                type: data.type,
                title: data.title,
                message: data.message,
                employeeId: emp.employeeId,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
            }))
        });
    }

    /**
     * Get unread notifications for a user (for polling)
     */
    async getUnreadNotifications(employeeId: number) {
        const notifications = await prisma.notification.findMany({
            where: {
                employeeId,
                isRead: false
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to recent 20
        });

        const count = await prisma.notification.count({
            where: { employeeId, isRead: false }
        });

        return { notifications, unreadCount: count };
    }

    /**
     * Get all notifications for a user (paginated)
     */
    async getAllNotifications(employeeId: number, query: { page?: number; limit?: number } = {}) {
        const { getPaginationParams, createPaginatedResponse } = await import('../common/utils/pagination.js');
        const { page, limit, skip } = getPaginationParams(query);

        const [data, total] = await Promise.all([
            prisma.notification.findMany({
                where: { employeeId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.notification.count({ where: { employeeId } })
        ]);

        return createPaginatedResponse(data, total, page, limit);
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: number, employeeId: number) {
        const notification = await prisma.notification.findFirst({
            where: { notificationId, employeeId }
        });

        if (!notification) throw new Error("Notification not found");

        return prisma.notification.update({
            where: { notificationId },
            data: { isRead: true }
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(employeeId: number) {
        return prisma.notification.updateMany({
            where: { employeeId, isRead: false },
            data: { isRead: true }
        });
    }
}

export default new NotificationService();
