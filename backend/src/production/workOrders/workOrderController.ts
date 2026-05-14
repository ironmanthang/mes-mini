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

export const updateWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await WorkOrderService.updateWorkOrder(id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getAllWorkOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await WorkOrderService.getALlWO(req.query as any);
        res.status(200).json(result);
    } catch (error) {
        const message = (error as Error).message;
        const statusCode = message.startsWith('Invalid Work Order status') ? 400 : 500;
        res.status(statusCode).json({ message });
    }
};

export const cancelWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const workOrderId = parseInt(String(req.params.id));
        const userId = req.user!.employeeId;
        const reasonStr = String(reason || ''); // Force string conversion safely

        const result = await WorkOrderService.cancelWorkOrder(workOrderId, userId, reasonStr);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
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
        res.status(200).json({ message: "Work Order Started", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const releaseWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await WorkOrderService.releaseWorkOrder(id);
        res.status(200).json({ message: 'Work Order Released', result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const completeWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const { quantityProduced, batchCode, expiryDate, warehouseId, laborCost, overheadCost } = req.body;

        if (!quantityProduced || quantityProduced <= 0) {
            res.status(400).json({ message: "Quantity Produced must be > 0" });
            return;
        }

        const parsedExpiryDate = expiryDate ? new Date(expiryDate) : undefined;

        const result = await WorkOrderService.completeWorkOrder(
            id,
            {
                quantityProduced,
                laborCost: Number(laborCost),
                overheadCost: Number(overheadCost),
                batchCode,
                expiryDate: parsedExpiryDate,
                targetWarehouseIdOverride: warehouseId
            },
            req.user!.employeeId
        );
        res.status(200).json({ message: "Work Order Completed", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
