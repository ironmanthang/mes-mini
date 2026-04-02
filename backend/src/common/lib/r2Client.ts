/**
 * r2Client.ts — Cloudflare R2 / MinIO SDK wrapper
 *
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK with a custom endpoint.
 * We only expose three functions: presign upload, presign download, delete object.
 * The backend never handles file bytes directly — files travel Frontend ↔ R2
 * bypassing our server entirely (presigned URL pattern).
 *
 * Object Key Convention: "{entityType-slug}/{entityId}/{filename}"
 *   e.g. "purchase-orders/47/contract.pdf"
 *
 * ── Dual-Client Architecture (Local Dev) ──────────────────────────────────
 * In Docker, the backend reaches MinIO at "http://minio:9000" (internal DNS).
 * But presigned URLs are consumed by the BROWSER (on the host machine), which
 * needs "http://localhost:9000". We solve this with two S3 clients:
 *   - s3Internal: for server-side operations (deleteObject)
 *   - s3Public:   for generating browser-facing presigned URLs
 *
 * In production (Cloudflare R2), both endpoints are the same public URL,
 * so both clients behave identically. Zero behavior change.
 */

import {
    S3Client,
    DeleteObjectCommand,
    PutObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─────────────────────────────────────────────────────────────────────────────
// Validate required env vars at startup
// ─────────────────────────────────────────────────────────────────────────────
const R2_ENDPOINT     = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY   = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY   = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET       = process.env.R2_BUCKET_NAME!;

/** Public endpoint for presigned URLs. Defaults to R2_ENDPOINT if not set. */
const R2_PUBLIC_ENDPOINT = process.env.R2_PUBLIC_ENDPOINT || R2_ENDPOINT;

if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET) {
    throw new Error(
        'R2 configuration is incomplete. Ensure R2_ENDPOINT, R2_ACCESS_KEY_ID, ' +
        'R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are set in .env'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// S3 Clients
// ─────────────────────────────────────────────────────────────────────────────

const sharedCredentials = {
    accessKeyId:     R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
};

/**
 * Internal client — used for server-side operations (deleteObject).
 * Endpoint: Docker-internal (e.g. http://minio:9000) or production R2.
 */
const s3Internal = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: sharedCredentials,
    forcePathStyle: true,   // Both R2 and MinIO support path-style
});

/**
 * Public client — used exclusively for generating presigned URLs.
 * Endpoint: Host-reachable (e.g. http://localhost:9000) or production R2.
 * The signature is bound to this endpoint, so the browser MUST use it as-is.
 */
const s3Public = new S3Client({
    region: 'auto',
    endpoint: R2_PUBLIC_ENDPOINT,
    credentials: sharedCredentials,
    forcePathStyle: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
/** How long (seconds) the presigned upload URL is valid. 10 minutes. */
const PRESIGN_UPLOAD_EXPIRES_SEC   = 600;

/** How long (seconds) the presigned download URL is valid. 1 hour. */
const PRESIGN_DOWNLOAD_EXPIRES_SEC = 3600;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 * The browser calls HTTP PUT on this URL with the file as the body.
 *
 * @param fileKey   R2 object key, e.g. "purchase-orders/47/contract.pdf"
 * @param mimeType  MIME type, e.g. "application/pdf". Enforced so browser cannot upload .exe.
 * @param fileSize  Expected byte size. Enforced by ContentLength.
 */
export async function generatePresignedUploadUrl(
    fileKey:  string,
    mimeType: string,
    fileSize: number,
): Promise<string> {
    const cmd = new PutObjectCommand({
        Bucket:        R2_BUCKET,
        Key:           fileKey,
        ContentType:   mimeType,
        ContentLength: fileSize,
    });
    return getSignedUrl(s3Public, cmd, { expiresIn: PRESIGN_UPLOAD_EXPIRES_SEC });
}

/**
 * Generates a presigned GET URL for direct R2-to-browser download.
 * Expires in 1 hour — enough to view/download, short enough for security.
 *
 * @param fileKey  R2 object key, e.g. "purchase-orders/47/contract.pdf"
 */
export async function generatePresignedDownloadUrl(fileKey: string): Promise<string> {
    const cmd = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key:    fileKey,
    });
    return getSignedUrl(s3Public, cmd, { expiresIn: PRESIGN_DOWNLOAD_EXPIRES_SEC });
}

/**
 * Hard-deletes an object from R2.
 * R2 delete is idempotent — deleting a non-existent key returns success.
 * Callers must handle any thrown errors (network / auth issues).
 *
 * Uses the INTERNAL client because this runs server-side inside Docker.
 *
 * @param fileKey  R2 object key
 */
export async function deleteObject(fileKey: string): Promise<void> {
    const cmd = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key:    fileKey,
    });
    await s3Internal.send(cmd);
}
