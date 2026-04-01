# PO Attachments (Cloudflare R2 Integration)

> [!IMPORTANT]
> **Polymorphic Architecture:** The `Attachment` database table uses the `entityType` and `entityId` pattern. It is explicitly designed to be reused by other modules (e.g., `QualityCheck`, `WorkOrder`, `ProductionRequest`) without requiring database schema migrations. The `AttachmentService` is fully generic.

## System Constraints

- **Storage Provider:** Cloudflare R2 (S3-compatible API).
- **Upload Strategy:** 2-Step Presigned URL. The backend **never** handles file bytes directly to avoid bandwidth and memory bottlenecks.
- **File Size Limit:** 20 MB per file.
- **Allowed MIME Types:** PDF, JPEG, PNG, WEBP, MP4.
- **Quantity Limit:** Maximum of 10 attachments per PO.

## Mutability & Status Guards

Documents attached to a Purchase Order serve as official evidence (contracts, invoices, delivery proofs). Thus, modifications are tightly coupled to the PO lifecycle:

| PO Status | Upload Allowed | Hard-Delete Allowed | Rationale |
| :--- | :---: | :---: | :--- |
| `DRAFT` | ✅ | ✅ | Temporary state; users can fix mistakes. |
| `PENDING` | ✅ | ✅ | Internal review; documents can be updated. |
| `APPROVED`| ✅ | ✅ | Just before sending; last chance for corrections. |
| `ORDERED` | ✅ | ❌ | **LOCKED:** PO is legally binding. Evidence (like the signed spec) cannot be deleted. New uploads (like shipping updates) are allowed. |
| `RECEIVING`| ✅ | ❌ | **LOCKED:** Goods arriving. Inspection videos or packing slips can be uploaded, nothing deleted. |
| `COMPLETED`| ❌ | ❌ | **FROZEN:** PO is closed. No further changes. |
| `CANCELLED`| ❌ | ❌ | **FROZEN:** PO is void. No further changes. |

> [!CAUTION]
> Hard Cascade Deletion: When a `DRAFT` PO is hard-deleted via the `/api/purchase-orders/:id` DELETE endpoint, the backend must manually orchestrate the deletion of all associated `Attachment` records from the database **and** their physical files from Cloudflare R2 *before* deleting the PO row.

## API Flow (2-Step Upload)

### Step 1: Request Upload URL
- **Client calls:** `POST /api/purchase-orders/:id/attachments/request-upload`
- **Body:** `{ fileName, mimeType, fileSize, category }`
- **Backend Action:** Validates limits and PO status. Calls R2 to generate a `PUT` presigned URL (valid for 10 minutes).
- **Returns:** `{ uploadUrl, fileKey }`

### Step 2: Client Direct Upload
- **Client Action:** Executes a raw HTTP `PUT` request directly to the `uploadUrl` provided in Step 1, with the binary file as the body and the correct `Content-Type`.

### Step 3: Confirm Registration
- **Client calls:** `POST /api/purchase-orders/:id/attachments/confirm`
- **Body:** `{ fileKey, fileName, mimeType, fileSize, category }`
- **Backend Action:** Verifies the `fileKey` format, checks PO status again, and creates the `Attachment` row in PostgreSQL.

### Downloading Attachments
- **Client calls:** `GET /api/purchase-orders/:id/attachments`
- **Backend Action:** Returns all metadata for the PO's attachments, decorating each with a fresh, 1-hour presigned `GET` URL from Cloudflare R2.
- **Client Action:** Opens or downloads the file directly from the presigned URL.
