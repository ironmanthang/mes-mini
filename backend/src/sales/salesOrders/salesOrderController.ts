import { Request, Response } from 'express';
import SOService from './salesOrderService.js';

export const createSO = async (req: Request, res: Response): Promise<void> => {
    try {
        const so = await SOService.createSO(req.body, req.user!.employeeId);
        res.status(201).json(so);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateSO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const so = await SOService.updateSO(id as string, req.body, req.user!.employeeId);
        res.status(200).json(so);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllSOs = async (req: Request, res: Response): Promise<void> => {
    try {
        const list = await SOService.getAllSOs(req.query as any);
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getSOById = async (req: Request, res: Response): Promise<void> => {
    try {
        const so = await SOService.getSOById(req.params.id as string);
        res.status(200).json(so);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const approveSO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await SOService.approveSO(id as string, req.user!.employeeId);
        res.status(200).json({ message: 'Sales Order Approved', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const submitSO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await SOService.submitSO(id as string, req.user!.employeeId);
        res.status(200).json({ message: 'Sales Order Submitted for Approval', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const rejectSO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            res.status(400).json({ message: 'Rejection reason is required' });
            return;
        }
        const result = await SOService.rejectSO(id as string, req.user!.employeeId, reason);
        res.status(200).json({ message: 'Sales Order Rejected', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
