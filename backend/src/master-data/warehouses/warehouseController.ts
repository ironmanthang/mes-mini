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

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { warehouseName, location, warehouseType } = req.body;
        
        if (!warehouseName || !warehouseType) {
            res.status(400).json({ message: 'warehouseName and warehouseType are required' });
            return;
        }

        if (!['COMPONENT', 'SALES', 'ERROR'].includes(warehouseType as string)) {
            res.status(400).json({ message: 'Invalid warehouse type' });
            return;
        }

        const warehouse = await WarehouseService.createWarehouse({ warehouseName, location, warehouseType });
        res.status(201).json(warehouse);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { warehouseName, location } = req.body;

        const warehouse = await WarehouseService.updateWarehouse(Number(id), { warehouseName, location });
        res.status(200).json(warehouse);
    } catch (error) {
        const msg = (error as Error).message;
        if (msg === 'Warehouse not found') {
            res.status(404).json({ message: msg });
        } else {
            res.status(500).json({ message: msg });
        }
    }
};

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await WarehouseService.deleteWarehouse(Number(id));
        res.status(200).json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
        const msg = (error as Error).message;
        if (msg === 'Warehouse not found') {
            res.status(404).json({ message: msg });
        } else if (msg.includes('Cannot delete warehouse')) {
            res.status(400).json({ message: msg });
        } else {
            res.status(500).json({ message: msg });
        }
    }
};
