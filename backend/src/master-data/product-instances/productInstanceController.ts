import { Request, Response } from 'express';
import ProductInstanceService from './productInstanceService.js';

export const getAllProductInstances = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductInstanceService.getAllProductInstances(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getProductInstanceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const instance = await ProductInstanceService.getProductInstanceById(req.params.id as string);
        res.status(200).json(instance);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product Instance not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};
