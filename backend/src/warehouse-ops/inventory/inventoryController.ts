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

export const getLowStockDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
        const result = await InventoryService.getLowStockDetails(warehouseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getStockStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, type } = req.query;
        if (!id || !type) {
            res.status(400).json({ message: 'Missing id or type parameter' });
            return;
        }

        const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
        const result = await InventoryService.getStockStatus(
            Number(id), 
            type as 'PRODUCT' | 'COMPONENT', 
            warehouseId
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
