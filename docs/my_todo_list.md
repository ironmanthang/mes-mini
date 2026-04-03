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
    - [x] Dynamic RBAC (Logic Architecture only)
- [ ] Purchase Order List Filter/Sort (Canceled/Deferred)
- [x] **HR Module: Refactored Onboarding & Identity**
    - [x] Automated Password Generator (12 chars + symbols)
    - [x] Nodemailer/Gmail email delivery integration
    - [x] 3-part Address concatenation (street, ward, province)
    - [x] Read-only Identity lock (Email/Username)
    - [x] Auth/Employee Profile duplication removal
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
- [x] **Employee Email Flow:** Verified with Gmail App Password (✅ Test email sent to `nguyennhuthang26112004@gmail.com`)
- [x] **Status Consolidation:** Merged `TERMINATED` into `INACTIVE`. Deleted Hard Delete API logically.
- [ ] **End-to-End Upload Test:** Verify Cloudflare R2 / MinIO 3-step upload via Postman.
- [ ] **Extend AttachmentService:** Implement for `QualityCheck` and `WorkOrder`.
- [ ] **Dynamic RBAC Phase 2:** (Permissions assignments).
- [ ] **Multilingual Framework (I18n)**.
