import { Request, Response } from 'express';
import POService from './purchaseOrderService.js';
import { AppError } from '../../common/utils/AppError.js';
import AttachmentService from '../../common/services/attachmentService.js';
import { PurchaseOrderStatus } from '../../generated/prisma/index.js';

// ─── Shared error handler ──────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the EntityContext (strategy object) from PO status.
 * Enforces the Attachment Mutability Matrix:
 *   DRAFT / PENDING / APPROVED  → upload ✅  delete ✅
 *   ORDERED / RECEIVING         → upload ✅  delete ❌  (evidence preservation)
 *   COMPLETED / CANCELLED       → upload ❌  delete ❌  (frozen)
 */
function buildPOAttachmentContext(status: PurchaseOrderStatus) {
    const uploadAllowed = new Set<PurchaseOrderStatus>([
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PENDING,
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.ORDERED,
        PurchaseOrderStatus.RECEIVING,
    ]);
    const deleteAllowed = new Set<PurchaseOrderStatus>([
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PENDING,
        PurchaseOrderStatus.APPROVED,
    ]);

    const canUpload = uploadAllowed.has(status);
    const canDelete = deleteAllowed.has(status);

    return {
        canUpload,
        canDelete,
        uploadBlockReason: !canUpload
            ? `Cannot upload attachments. Purchase Order is in '${status}' status — all changes are frozen.`
            : undefined,
        deleteBlockReason: !canDelete
            ? `Cannot delete attachments. Purchase Order is in '${status}' status. ` +
              `Once a PO is ORDERED, its documents are preserved as evidence.`
            : undefined,
    };
}

// ─── Step 1: Request presigned upload URL ─────────────────────────────────
export const requestAttachmentUpload = async (req: Request, res: Response): Promise<void> => {
    try {
        const poId = parseInt(req.params.id as string, 10);
        const po   = await POService.getPOById(poId, req.user!.employeeId);
        const ctx  = buildPOAttachmentContext(po.status);

        const result = await AttachmentService.requestUpload(
            'PURCHASE_ORDER',
            poId,
            req.body,
            ctx,
        );

        res.status(200).json({
            message:   'Presigned upload URL generated. Upload the file to this URL using HTTP PUT.',
            uploadUrl: result.uploadUrl,
            fileKey:   result.fileKey,
            expiresIn: '10 minutes',
        });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Step 2: Confirm upload complete ──────────────────────────────────────
export const confirmAttachmentUpload = async (req: Request, res: Response): Promise<void> => {
    try {
        const poId = parseInt(req.params.id as string, 10);
        const po   = await POService.getPOById(poId, req.user!.employeeId);
        const ctx  = buildPOAttachmentContext(po.status);

        const attachment = await AttachmentService.confirmUpload(
            'PURCHASE_ORDER',
            poId,
            req.body,
            req.user!.employeeId,
            ctx,
        );

        res.status(201).json({
            message:    'Attachment registered successfully.',
            attachment,
        });
    } catch (error) {
        handleError(error, res);
    }
};

// ─── List all attachments (with presigned download URLs) ──────────────────
export const listAttachments = async (req: Request, res: Response): Promise<void> => {
    try {
        const poId = parseInt(req.params.id as string, 10);
        // Verify PO exists + DRAFT isolation is enforced by getPOById
        await POService.getPOById(poId, req.user!.employeeId);
        const attachments = await AttachmentService.listAttachments('PURCHASE_ORDER', poId);
        res.status(200).json(attachments);
    } catch (error) {
        handleError(error, res);
    }
};

// ─── Hard-delete a single attachment ──────────────────────────────────────
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
        const poId         = parseInt(req.params.id as string, 10);
        const attachmentId = parseInt(req.params.attachmentId as string, 10);

        const po  = await POService.getPOById(poId, req.user!.employeeId);
        const ctx = buildPOAttachmentContext(po.status);

        const result = await AttachmentService.deleteAttachment(
            attachmentId,
            req.user!.employeeId,
            ctx,
            req.user!.roles,
        );

        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};
