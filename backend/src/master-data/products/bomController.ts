import { Request, Response } from 'express';
import BomService from './bomService.js';

export const getBom = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params['id'] as string);
        const bom = await BomService.getBom(productId);
        res.status(200).json(bom);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};

export const addBomComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params['id'] as string);
        const { componentId, quantityNeeded } = req.body;
        const entry = await BomService.addComponent(productId, componentId, quantityNeeded);
        res.status(201).json(entry);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product not found' || err.message === 'Component not found') {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(400).json({ message: err.message });
    }
};

export const updateBomComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params['id'] as string);
        const componentId = parseInt(req.params['componentId'] as string);
        const { quantityNeeded } = req.body;
        const entry = await BomService.updateComponent(productId, componentId, quantityNeeded);
        res.status(200).json(entry);
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product not found' || err.message.includes('not found')) {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(400).json({ message: err.message });
    }
};

export const removeBomComponent = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params['id'] as string);
        const componentId = parseInt(req.params['componentId'] as string);
        await BomService.removeComponent(productId, componentId);
        res.status(200).json({ message: 'Component removed from BOM successfully' });
    } catch (error) {
        const err = error as Error;
        if (err.message === 'Product not found' || err.message.includes('not found')) {
            res.status(404).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: err.message });
    }
};
