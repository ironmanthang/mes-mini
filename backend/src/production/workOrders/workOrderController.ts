import { Request, Response } from 'express';
import WorkOrderService from './workOrderService.js';

export const createWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await WorkOrderService.createWorkOrder(req.body, req.user!.employeeId);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllWorkOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await WorkOrderService.getALlWO(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getWorkOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await WorkOrderService.getWOById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const startWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await WorkOrderService.startWorkOrder(id, req.user!.employeeId);
        res.status(200).json({ message: "Work Order Started & Material Request Created", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const completeWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const { quantityProduced } = req.body;

        if (!quantityProduced || quantityProduced <= 0) {
            res.status(400).json({ message: "Quantity Produced must be > 0" });
            return;
        }

        const result = await WorkOrderService.completeWorkOrder(id, quantityProduced, req.user!.employeeId);
        res.status(200).json({ message: "Work Order Completed", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
