import { Request, Response } from 'express';
import QualityCheckService from './qualityService.js';

export const createCheck = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.employeeId;
        const check = await QualityCheckService.createCheck(req.body, userId);
        res.status(201).json(check);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getByProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(String(req.params.productId));
        const checks = await QualityCheckService.getChecksByProduct(productId);
        res.status(200).json(checks);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getByWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const woId = parseInt(String(req.params.woId));
        const checks = await QualityCheckService.getChecksByWorkOrder(woId);
        res.status(200).json(checks);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
