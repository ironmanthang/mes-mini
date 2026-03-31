import { Request, Response } from 'express';
import SalesDashboardService from './salesDashboardService.js';

export const getSalesDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const metrics = await SalesDashboardService.getMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Sales Dashboard Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
