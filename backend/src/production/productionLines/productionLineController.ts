import { Request, Response } from 'express';
import ProductionLineService from './productionLineService.js';
import { AppError } from '../../common/utils/AppError.js';

function handleError(error: unknown, res: Response, defaultStatus = 400): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
    } else {
        res.status(defaultStatus).json({ message: (error as Error).message });
    }
}

export const getAllProductionLines = async (req: Request, res: Response): Promise<void> => {
    try {
        const lines = await ProductionLineService.getAllProductionLines();
        res.status(200).json(lines);
    } catch (error) {
        handleError(error, res, 500);
    }
};

export const getProductionLineById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError('Invalid Production Line ID', 400);
        const line = await ProductionLineService.getProductionLineById(id);
        res.status(200).json(line);
    } catch (error) {
        handleError(error, res, 404);
    }
};

export const createProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const line = await ProductionLineService.createProductionLine(req.body);
        res.status(201).json(line);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError('Invalid Production Line ID', 400);
        const line = await ProductionLineService.updateProductionLine(id, req.body);
        res.status(200).json(line);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteProductionLine = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new AppError('Invalid Production Line ID', 400);
        await ProductionLineService.deleteProductionLine(id);
        res.status(200).json({ message: 'Production Line deleted successfully' });
    } catch (error) {
        handleError(error, res);
    }
};
