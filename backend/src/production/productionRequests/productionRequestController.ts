import { Request, Response } from 'express';
import ProductionRequestService from './productionRequestService.js';
import MrpService from '../mrp/mrpService.js';
import WorkOrderService from '../workOrders/workOrderService.js';
import { AppError } from '../../common/utils/AppError.js';

function handleError(error: unknown, res: Response, defaultStatus = 400): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
    } else {
        res.status(defaultStatus).json({ message: (error as Error).message });
    }
}

export const createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.createRequest(req.body, req.user!.employeeId);
        res.status(201).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateDraft = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.updateDraft(id, req.body, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

export const submitRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.submitRequest(id, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.approveRequest(id, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res, 403);
    }
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await ProductionRequestService.getAllRequests(req.query as any, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res, 500);
    }
};

export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const result = await ProductionRequestService.getRequestById(id, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res, 404);
    }
};

export const recheckFeasibility = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.recheckFeasibility(id, req.user!.employeeId, req.user!.roles);
        const message = result.transitioned
            ? "Feasibility re-check passed — PR status updated to PENDING"
            : "Feasibility re-check: still WAITING_MATERIAL (shortages remain)";
        res.status(200).json({ message, result });
    } catch (error) {
        handleError(error, res);
    }
};

export const draftPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await ProductionRequestService.draftPurchaseOrder(id);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason } = req.body;
        const result = await ProductionRequestService.cancelRequest(
            String(req.params.id),
            reason,
            req.user!.employeeId,
            req.user!.roles
        );
        res.status(200).json({ message: "Production Request Cancelled", result });
    } catch (error) {
        handleError(error, res);
    }
};

export const getRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) throw new Error("Invalid Production Request ID");
        const result = await MrpService.calculateForRequest(id);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

// export const convertRequestsToWorkOrder = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { requestIds, quantities, productionLineId } = req.body;

//         const result = await WorkOrderService.createBulkWorkOrder({
//             productionRequestIds: requestIds,
//             quantities,
//             productionLineId
//         }, req.user!.employeeId);

//         res.status(201).json({ message: "Work Order Created", result });
//     } catch (error) {
//         handleError(error, res);
//     }
// };
// TODO: API not ready yet - waiting for work order rework