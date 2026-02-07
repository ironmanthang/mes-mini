import { Request, Response } from 'express';
import NotificationService from './notificationService.js';

export const getUnreadNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await NotificationService.getUnreadNotifications(req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await NotificationService.getAllNotifications(req.user!.employeeId, req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await NotificationService.markAsRead(id, req.user!.employeeId);
        res.status(200).json({ message: "Marked as read", result });
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        await NotificationService.markAllAsRead(req.user!.employeeId);
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
