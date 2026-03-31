import { Request, Response } from 'express';
import StocktakeService from './stocktakeService.js';

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.employeeId;
        const session = await StocktakeService.createSession(req.body, userId);
        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getSessionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const session = await StocktakeService.getSessionById(parseInt(String(req.params.id)));
        res.status(200).json(session);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const updateCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const { items } = req.body; // Expect array of { componentId, actualQuantity }
        const result = await StocktakeService.updateCount(id, items);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const finalizeSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await StocktakeService.finalizeSession(parseInt(String(req.params.id)));
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getVariance = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await StocktakeService.getVarianceReport(parseInt(String(req.params.id)));
        res.status(200).json(report);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};
