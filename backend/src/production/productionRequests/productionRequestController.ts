import { Request, Response } from 'express';
import ProductionRequestService from './productionRequestService.js';

export const createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.createRequest(req.body, req.user!.employeeId);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.getAllRequests(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await ProductionRequestService.getRequestById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.approveRequest(String(req.params.id));
        res.status(200).json({ message: "Production Request Approved", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.rejectRequest(String(req.params.id));
        res.status(200).json({ message: "Production Request Rejected/Cancelled", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
