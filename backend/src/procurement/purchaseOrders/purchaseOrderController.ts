import { Request, Response } from 'express';
import POService from './purchaseOrderService.js';
import { AppError } from '../../common/utils/AppError.js';

// ─── Shared error handler ──────────────────────────────────────────────────
// Uses AppError.statusCode if available, falls back to provided default.
function handleError(error: unknown, res: Response, defaultStatus = 400): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
    } else {
        res.status(defaultStatus).json({ message: (error as Error).message });
    }
}

// ─── List ──────────────────────────────────────────────────────────────────
export const getAllPOs = async (req: Request, res: Response): Promise<void> => {
    try {
        const list = await POService.getAllPOs(req.query as any, req.user!.employeeId);
        res.status(200).json(list);
    } catch (error) {
        handleError(error, res, 500);
    }
};

// ─── Detail ────────────────────────────────────────────────────────────────
export const getPOById = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await POService.getPOById(req.params.id as string, req.user!.employeeId);
        res.status(200).json(po);
    } catch (error) {
        handleError(error, res, 404);
    }
};

// ─── Create ────────────────────────────────────────────────────────────────
export const createPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await POService.createPO(req.body, req.user!.employeeId);
        res.status(201).json(po);
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Generic Edit (field-level restrictions enforced in service) ────────────
export const updatePO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const po = await POService.updatePO(id as string, req.body, req.user!.employeeId);
        res.status(200).json(po);
    } catch (error) {
        handleError(error, res);
    }
};

// ─── State Transition: DRAFT → PENDING ────────────────────────────────────
export const submitPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.submitPO(id as string, req.user!.employeeId);
        res.status(200).json({ message: 'Purchase Order submitted successfully', result });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── State Transition: PENDING → APPROVED ─────────────────────────────────
export const approvePO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.approvePO(id as string, req.user!.employeeId);
        res.status(200).json({ message: 'Purchase Order approved', result });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── State Transition: APPROVED → ORDERED ─────────────────────────────────
export const sendToSupplierPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.sendToSupplier(id as string, req.body, req.user!.employeeId);
        res.status(200).json({ message: 'Purchase Order sent to supplier', result });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── State Transition: PENDING|APPROVED → CANCELLED ───────────────────────
export const cancelPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.cancelPO(
            id as string,
            req.user!.employeeId,
            req.user!.roles,
            req.body.note
        );
        res.status(200).json({ message: 'Purchase Order cancelled successfully', result });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Hard Delete: DRAFT only ───────────────────────────────────────────────
export const deletePO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await POService.deletePO(id as string, req.user!.employeeId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Receive Goods (ORDERED|RECEIVING → RECEIVING|COMPLETED) ──────────────
export const receiveGoods = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { items } = req.body;

        const result = await POService.receiveGoods(id as string, items, req.user!.employeeId);
        res.status(200).json({ 
            message: 'Goods Received Successfully', 
            purchaseOrder: result.po,
            generatedLots: result.generatedLots 
        });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Get Generated Lots for a PO ───────────────────────────────────────────
export const getLotsByPO = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const lots = await POService.getLotsByPO(id as string, req.user!.employeeId);
        res.status(200).json(lots);
    } catch (error) {
        handleError(error, res);
    }
};
