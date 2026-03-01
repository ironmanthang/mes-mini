import { Request, Response } from 'express';
import ProductionRequestService from './productionRequestService.js';
import MrpService from '../mrp/mrpService.js';
import WorkOrderService from '../workOrders/workOrderService.js';

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

export const recheckFeasibility = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.recheckFeasibility(id);
        const message = result.transitioned
            ? "Feasibility re-check passed — PR status updated to APPROVED"
            : "Feasibility re-check: still WAITING_MATERIAL (shortages remain)";
        res.status(200).json({ message, result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const draftPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.draftPurchaseOrder(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const result = await ProductionRequestService.cancelRequest(String(req.params.id), reason);
        res.status(200).json({ message: "Production Request Cancelled", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await MrpService.calculateForRequest(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const convertRequestsToWorkOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestIds, quantities, productionLineId } = req.body;

        const result = await WorkOrderService.createBulkWorkOrder({
            productionRequestIds: requestIds,
            quantities,
            productionLineId
        }, req.user!.employeeId);

        res.status(201).json({ message: "Work Order Created", result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
