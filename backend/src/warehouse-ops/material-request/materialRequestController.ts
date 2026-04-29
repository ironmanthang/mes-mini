import { Request, Response } from 'express';
import MaterialRequestService from './materialRequestService.js';

const parsePositiveInt = (value: unknown, fieldName: string): number => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${fieldName} must be a positive integer.`);
    }
    return parsed;
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await MaterialRequestService.getRequests(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        const message = (error as Error).message;
        const statusCode = message.startsWith('Invalid Material Request status') ? 400 : 500;
        res.status(statusCode).json({ message });
    }
};

export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parsePositiveInt(req.params.id, 'Material Request ID');
        const result = await MaterialRequestService.getRequestById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};


export const validateRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parsePositiveInt(req.params.id, 'Material Request ID');
        const warehouseId = parsePositiveInt(req.body?.warehouseId, 'warehouseId');
        const result = await MaterialRequestService.validateRequest(id, warehouseId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const completeRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parsePositiveInt(req.params.id, 'Material Request ID');
        const warehouseId = parsePositiveInt(req.body?.warehouseId, 'warehouseId');
        
        const consumedLots = req.body?.consumedLots;
        if (!Array.isArray(consumedLots) || consumedLots.length === 0) {
            throw new Error("consumedLots array is required to complete material issue.");
        }

        const result = await MaterialRequestService.completeRequest(id, req.user!.employeeId, warehouseId, consumedLots);
        res.status(200).json({ message: 'Material Issue Completed', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getDispatchSlip = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parsePositiveInt(req.params.id, 'Material Request ID');
        const result = await MaterialRequestService.getDispatchSlip(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};
