import { Request, Response } from 'express';
import DashboardService from './dashboardService.js';

export const getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const summary = await DashboardService.getSummary();
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getInventoryOverview = async (req: Request, res: Response): Promise<void> => {
    try {
        const overview = await DashboardService.getInventoryOverview();
        res.status(200).json(overview);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const status = await DashboardService.getProductionStatus();
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

