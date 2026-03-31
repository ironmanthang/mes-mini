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
- [ ] Purchase Order Attachments (Cloudflare R2)
    - Implement PDF/Video storage logic
- [ ] Update `PurchaseOrder` schema with `attachmentUrl`