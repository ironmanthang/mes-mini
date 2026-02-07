import { Request, Response } from 'express';
import InventoryService from './inventoryService.js';

export const getInventoryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await InventoryService.getInventoryStatus(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getLowStockAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await InventoryService.getLowStockAlerts();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
