import { Request, Response } from 'express';
import ProductionLineService from './productionLineService.js';

export const getAllProductionLines = async (req: Request, res: Response): Promise<void> => {
    try {
        const lines = await ProductionLineService.getAllProductionLines();
        res.status(200).json(lines);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductionLineById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const line = await ProductionLineService.getProductionLineById(id);
        res.status(200).json(line);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const createProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const line = await ProductionLineService.createProductionLine(req.body);
        res.status(201).json(line);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const line = await ProductionLineService.updateProductionLine(id, req.body);
        res.status(200).json(line);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        await ProductionLineService.deleteProductionLine(id);
        res.status(200).json({ message: 'Production Line deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
