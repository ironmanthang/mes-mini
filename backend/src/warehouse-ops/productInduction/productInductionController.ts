import { Request, Response } from 'express';
import ProductInductionService from './productInductionService.js';

export const inductProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.employeeId;
        const result = await ProductInductionService.inductProducts(
            req.body.serialNumbers,
            userId
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
