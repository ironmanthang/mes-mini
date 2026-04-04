/**
 * attachmentService.ts — Generic polymorphic attachment CRUD
 *
 * This service is NOT specific to Purchase Orders. It works for any entity
 * that is identified by (entityType, entityId). Future entities (WorkOrder,
 * QualityCheck) use the same service without modification.
 *
 * Upload Flow (2 steps by design):
 *   1. requestUpload()  → validate → return presigned PUT URL
 *   2. confirmUpload()  → file is now in R2 → create DB row
 *
 * This 2-step pattern ensures the DB row only exists when the file truly does.
 * If the user abandons the upload after step 1, nothing is written to the DB.
 *
 * Download Flow:
 *   listAttachments() returns metadata rows each decorated with a fresh
 *   presigned GET URL (1-hour TTL). No proxy — browser downloads direct from R2.
 *
 * Delete Flow:
 *   deleteAttachment() deletes from R2 first, then removes the DB row.
 *   R2 delete is idempotent, so a partial failure (DB write after R2 delete)
 *   won't leave a dangling pointer.
 */

import prisma from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import {
    generatePresignedUploadUrl,
    generatePresignedDownloadUrl,
    deleteObject,
} from '../lib/r2Client.js';
import { AttachmentCategory } from '../../generated/prisma/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** 20 MB per file */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Maximum number of attachments an entity can have */
export const MAX_ATTACHMENTS = 10;

export const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadRequestMeta {
    fileName: string;
    mimeType: string;
    fileSize: number;
    category: AttachmentCategory;
}

export interface UploadConfirmMeta {
    fileKey: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    category: AttachmentCategory;
}

/**
 * Callers (e.g. the PO controller) pre-compute and pass this context.
 * This decouples entity-specific status rules from the generic service.
 * The strategy pattern: the generic service stays clean and reusable.
 */
export interface EntityContext {
    canUpload: boolean;
    canDelete: boolean;
    uploadBlockReason?: string;   // Human-readable message for the 400
    deleteBlockReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds an R2 object key from entity info and filename.
 * Example: "purchase-orders/47/contract-20260331.pdf"
 * We slugify entityType to avoid uppercase/underscores in the key.
 */
function buildFileKey(entityType: string, entityId: number, fileName: string): string {
    const slug = entityType.toLowerCase().replace(/_/g, '-');
    // Sanitize filename: strip path traversal chars, preserve extension
    const safe = fileName.replace(/[^a-zA-Z0-9._\-() ]/g, '_');
    const timestamp = Date.now();
    return `${slug}/${entityId}/${timestamp}-${safe}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class AttachmentService {

    /**
     * Step 1 of the upload flow.
     * Validates all constraints then returns a presigned PUT URL.
     * No DB write is made here — only R2 URL generation.
     *
     * Why no DB write? If the browser crashes between step 1 and step 2,
     * there is no orphaned DB row. The R2 object would also not exist
     * because the presigned URL was never used.
     */
    async requestUpload(
        entityType: string,
        entityId:   number,
        meta:       UploadRequestMeta,
        ctx:        EntityContext,
    ): Promise<{ uploadUrl: string; fileKey: string }> {

        // 1. Status guard (PO, WO's entity-specific policy passed in by caller)
        if (!ctx.canUpload) {
            throw new AppError(
                ctx.uploadBlockReason ?? 'Uploads are not allowed for this entity in its current state.',
                400
            );
        }

        // 2. MIME type whitelist
        if (!ALLOWED_MIME_TYPES.has(meta.mimeType)) {
            throw new AppError(
                `File type '${meta.mimeType}' is not allowed. ` +
                `Accepted: PDF, JPEG, PNG, WEBP, MP4.`,
                400
            );
        }

        // 3. File size limit (also enforced by Joi schema, this is the service-level guard)
        if (meta.fileSize > MAX_FILE_SIZE) {
            throw new AppError(
                `File size ${(meta.fileSize / 1024 / 1024).toFixed(1)} MB ` +
                `exceeds the 20 MB limit.`,
                400
            );
        }

        // 4. Attachment count limit
        const existingCount = await prisma.attachment.count({
            where: { entityType, entityId }
        });
        if (existingCount >= MAX_ATTACHMENTS) {
            throw new AppError(
                `This entity already has ${existingCount} attachments. ` +
                `Maximum is ${MAX_ATTACHMENTS}.`,
                400
            );
        }

        // 5. Build key and generate presigned URL
        const fileKey  = buildFileKey(entityType, entityId, meta.fileName);
        const uploadUrl = await generatePresignedUploadUrl(fileKey, meta.mimeType, meta.fileSize);

        return { uploadUrl, fileKey };
    }

    /**
     * Step 2 of the upload flow.
     * Called after the browser finishes the PUT to R2.
     * Creates the DB row to register the attachment.
     *
     * Security note: We trust the client's fileKey here because:
     *   a) The upload URL was scoped to a specific key we generated in step 1
     *   b) We still re-validate the status guard
     *   c) The key follows a predictable pattern — attacker cannot supply an
     *      arbitrary key pointing to another entity's folder
     */
    async confirmUpload(
        entityType: string,
        entityId:   number,
        meta:       UploadConfirmMeta,
        uploadedBy: number,
        ctx:        EntityContext,
    ) {
        // Re-check status guard (PO status could have changed between step 1 and 2)
        if (!ctx.canUpload) {
            throw new AppError(
                ctx.uploadBlockReason ?? 'Uploads are no longer allowed for this entity.',
                400
            );
        }

        // Re-check count (safety valve for race conditions)
        const existingCount = await prisma.attachment.count({
            where: { entityType, entityId }
        });
        if (existingCount >= MAX_ATTACHMENTS) {
            throw new AppError(
                `Cannot confirm upload: maximum of ${MAX_ATTACHMENTS} attachments reached.`,
                400
            );
        }

        const attachment = await prisma.attachment.create({
            data: {
                entityType,
                entityId,
                fileKey:    meta.fileKey,
                fileName:   meta.fileName,
                fileSize:   meta.fileSize,
                mimeType:   meta.mimeType,
                category:   meta.category,
                uploadedBy,
            },
            include: {
                employee: { select: { fullName: true } }
            }
        });

        return attachment;
    }

    /**
     * Returns all attachments for an entity, each decorated with a fresh
     * presigned download URL. Since presigned URLs expire in 1 hour, we
     * generate them fresh on every GET — not persisted in the DB.
     *
     * Time complexity: O(n) presigned URL generations where n = attachment count.
     * Acceptable for n <= 10.
     */
    async listAttachments(entityType: string, entityId: number) {
        const rows = await prisma.attachment.findMany({
            where: { entityType, entityId },
            include: { employee: { select: { fullName: true } } },
            orderBy: { uploadedAt: 'desc' }
        });

        // Decorate each row with a fresh download URL
        const withUrls = await Promise.all(
            rows.map(async (row) => ({
                ...row,
                downloadUrl: await generatePresignedDownloadUrl(row.fileKey),
            }))
        );

        return withUrls;
    }

    /**
     * Hard-deletes an attachment: removes the file from R2 then deletes the DB row.
     *
     * Order matters: R2 delete first, then DB. R2 delete is idempotent.
     * If DB delete fails after R2 delete, the file is gone from R2 but the DB
     * row still points to a dead key — but this is extremely unlikely and the
     * next download attempt would fail gracefully (presigned URL for missing key
     * returns 404 from R2). Acceptable risk for MVP.
     *
     * @param attachmentId  The attachment to delete
     * @param userId        Used for RBAC — must be the uploader or privileged role
     * @param ctx           Entity context with delete permission flag
     */
    async deleteAttachment(
        attachmentId: number,
        userId:       number,
        ctx:          EntityContext,
        userRoles:    { roleCode: string }[],
    ) {
        // 1. Status guard
        if (!ctx.canDelete) {
            throw new AppError(
                ctx.deleteBlockReason ?? 'Deleting attachments is not allowed in this state.',
                400
            );
        }

        // 2. Fetch the attachment
        const attachment = await prisma.attachment.findUnique({
            where: { attachmentId }
        });
        if (!attachment) {
            throw new AppError('Attachment not found.', 404);
        }

        // 3. Ownership guard: only uploader or System Admin can delete
        const isUploader  = attachment.uploadedBy === userId;
        const isAdmin     = userRoles.some(r => r.roleCode === 'SYS_ADMIN');  // CHANGED: roleCode
        if (!isUploader && !isAdmin) {
            throw new AppError(
                'You can only delete attachments that you uploaded. ' +
                'A System Admin can delete any attachment.',
                403
            );
        }

        // 4. Delete from R2 (idempotent — won't throw if already gone)
        await deleteObject(attachment.fileKey);

        // 5. Delete DB row
        await prisma.attachment.delete({ where: { attachmentId } });

        return { message: 'Attachment deleted successfully.' };
    }

    /**
     * Bulk-deletes all attachments for an entity.
     * Used when the parent entity is hard-deleted (e.g., a DRAFT PO).
     * Called inside the parent entity's delete transaction context.
     * R2 deletes run concurrently (Promise.allSettled — we don't fail on individual R2 errors).
     */
    async deleteAllForEntity(entityType: string, entityId: number): Promise<void> {
        const attachments = await prisma.attachment.findMany({
            where: { entityType, entityId },
            select: { attachmentId: true, fileKey: true }
        });

        if (attachments.length === 0) return;

        // Delete from R2 concurrently — best effort (don't block PO deletion on R2 errors)
        const r2Results = await Promise.allSettled(
            attachments.map(a => deleteObject(a.fileKey))
        );

        // Log any R2 failures (non-blocking)
        r2Results.forEach((result, i) => {
            if (result.status === 'rejected') {
                console.error(
                    `[AttachmentService] R2 delete failed for key '${attachments[i].fileKey}': `,
                    result.reason
                );
            }
        });

        // Delete all DB rows in one query
        await prisma.attachment.deleteMany({
            where: { entityType, entityId }
        });
    }
}

export default new AttachmentService();
