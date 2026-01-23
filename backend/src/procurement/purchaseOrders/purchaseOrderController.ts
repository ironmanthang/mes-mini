import { Request, Response } from 'express';
import POService from './purchaseOrderService.js';

export const createPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await POService.createPO(req.body, req.user!.employeeId);
        res.status(201).json(po);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};


export const updatePO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const po = await POService.updatePO(id as string, req.body, req.user!.employeeId);
        res.status(200).json(po);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};


export const getAllPOs = async (req: Request, res: Response): Promise<void> => {
    try {
        const list = await POService.getAllPOs();
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getPOById = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await POService.getPOById(req.params.id as string);
        res.status(200).json(po);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const approvePO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.approvePO(id as string, req.user!.employeeId);
        res.status(200).json({ message: 'Purchase Order Approved', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
