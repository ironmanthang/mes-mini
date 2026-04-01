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
- [x] Purchase Order Attachments (Cloudflare R2)
    - [x] Polmorphic `Attachment` table architecture + Cloudflare R2 Presigned URLs
    - [x] Mutability controls per PO status & Hard cascade deletes for DRAFT
    - [x] 20MB file limit / 5 whitelisted MIME Types / 10 files per PO limit
    - [x] Formulated `04_frontend_attachment_guide.md` for Frontend 3-step R2 Upload & CORS config handoff
- [ ] Implement file attachment logic for `QualityCheck` and `WorkOrder` modules (Reusing `AttachmentService`)