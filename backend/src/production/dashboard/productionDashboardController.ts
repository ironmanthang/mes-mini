import { Request, Response } from 'express';
import ProductionDashboardService from './productionDashboardService.js';

export const getProductionDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const metrics = await ProductionDashboardService.getMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Production Dashboard Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
