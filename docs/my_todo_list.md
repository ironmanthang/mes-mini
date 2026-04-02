# My To-Do List

## 1. Core Modules
- [x] **Procurement & PO Logic**
    - [x] Finalized PO Status Lifecycle & Cancellation Locks
    - [x] Defined "Two-State" Numbering Standard (Draft vs Official)
    - [x] Finalized "Strict ComponentLot" Tracying Architecture
- [x] **Implementation (Next Steps)**
    - [x] Update `schema.prisma` with `ComponentLot` and `ADJUSTMENT` links
    - [x] Implement `POST /api/purchase-orders/:id/submit` (Assign official code)
    - [x] Implement `POST /api/purchase-orders/:id/receive` (Generate Lots)
    - [x] Secure `receiveGoods` API against Split-Routing and Warehouse Poisoning
    - [x] Update swagger to match the backend structure
    - [ ] Add status, dateFrom / dateTo, sortOrder and sortBy to PO list API (Reusable pattern)
- [ ] Dynamic RBAC
- [/] Purchase Order List Filter/Sort (dateRange, status, sortBy)
- [ ] Multingual Framework (I18n)
- [x] **Purchase Order Attachments (Cloudflare R2 Integration)**
    - [x] Polymorphic `Attachment` table architecture + S3-compatible Presigned URLs
    - [x] Mutability controls per PO status & Hard cascade deletes for DRAFT
    - [x] 20MB file limit / 5 whitelisted MIME Types / 10 files per PO limit
    - [x] Implementation of Local MinIO Storage Mock (S3 protocol)
    - [x] Dual-Client `r2Client.ts` fix (`s3Internal` + `s3Public` + `forcePathStyle: true`)
    - [x] `R2_PUBLIC_ENDPOINT` env var for Docker ↔ Host URL separation
    - [x] Restructured `frontend_attachment_guide.md` (Local-first, with Postman walkthrough)
    - [x] Updated Deployment Guide with Cloudflare R2 Secret Registry
- [ ] Implement file attachment logic for `QualityCheck` and `WorkOrder` modules (Reusing `AttachmentService`)

## 2. Next Steps (Session Handoff)
- [ ] **End-to-End Upload Test:** Complete the 3-step upload via Postman and verify the file appears in MinIO Console + GET /attachments returns the `downloadUrl`.
- [ ] **Purchase Order List Filter/Sort** (dateRange, status, sortBy) — currently `[/]` in progress
- [ ] Extend `AttachmentService` to `QualityCheck` and `WorkOrder` modules
- [ ] Dynamic RBAC
- [ ] Multilingual Framework (I18n)