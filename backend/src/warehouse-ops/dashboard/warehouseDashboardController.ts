import { Request, Response } from 'express';
import WarehouseDashboardService from './warehouseDashboardService.js';

export const getWarehouseDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
        const metrics = await WarehouseDashboardService.getMetrics(warehouseId);
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Warehouse Dashboard Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
