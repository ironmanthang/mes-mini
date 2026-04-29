import { Request, Response } from 'express';
import TransferRequestService from './transferRequestService.js';

export const createTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.employeeId;
        const transfer = await TransferRequestService.createTransferRequest(req.body, userId);
        res.status(201).json(transfer);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const completeTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const userId = (req as any).user.employeeId;
        const result = await TransferRequestService.completeTransferRequest(id, req.body, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllTransfers = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await TransferRequestService.getAll(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getTransferById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await TransferRequestService.getById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
