import { Request, Response } from 'express';
import MaterialRequestService from './materialRequestService.js';

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await MaterialRequestService.getRequests(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await MaterialRequestService.getRequestById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await MaterialRequestService.approveRequest(id, req.user!.employeeId);
        res.status(200).json({ message: "Material Issued Successfully", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getDispatchSlip = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await MaterialRequestService.getDispatchSlip(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};
