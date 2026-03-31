import { Request, Response } from 'express';
import WarehouseService from './warehouseService.js';

export const getAllWarehouses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.query;
        
        // Enum validation
        if (type && !['COMPONENT', 'SALES', 'ERROR'].includes(type as string)) {
            res.status(400).json({ message: 'Invalid warehouse type. Allowed values: COMPONENT, SALES, ERROR' });
            return;
        }

        const warehouses = await WarehouseService.getAllWarehouses(req.query as any);
        res.status(200).json(warehouses);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
