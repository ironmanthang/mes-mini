# MES Project Tracker

## Completed Tasks (Recent)
- [x] **Warranty/Shelf-Life Logic**: Implemented `expiryDate` calculation on `ProductionBatch` at WO Completion and `receivedAt` stamping at QC induction.
- [x] **Concurrent Stock Hardening**: Implemented atomic `updateMany` for PR attribution and shipping.
- [x] **Strict FIFO Validation**: Implemented Option A (Pick List validation) in `shipOrder` to prevent FIFO violations and ensure MTO allocation integrity.
- [x] **Architectural Purge**: Completely removed unused `Stocktake` and `Costing` modules to reduce technical debt.
- [x] **Public Warranty Portal**: Implemented unauthenticated lookup and activation endpoints at `/api/public/warranties`.
- [x] **Bug Fix**: Fixed broken relative imports in `warrantyController.ts`.
- [x] **`fulfilledQuantity` bug in QC service**: Verified schema contains `fulfilledQuantity`, ran `prisma generate` to update client.
- [x] **WO API Simulation Guide**: Verified the full WO lifecycle end-to-end against a freshly seeded DB (DRAFT -> RELEASED -> IN_PROGRESS -> MR validate -> MR complete -> COMPLETED). Confirmed 5x `PENDING_QC` ProductInstances are generated on completion. Created `docs/features/work_order/02_api_simulation.md` as the permanent frontend reference.
- [x] **Decoupled Material Request Flow**: Decoupled auto-MR creation from WO start. Exposed manual `POST /api/warehouse-ops/material-requests` API and added `IN_PROGRESS` state gate to MR creation. Updated Swagger docs.

## Pending Objectives (Next Session)
- [ ] **QC Flow Integration Test**: Now that WO completion generates `PENDING_QC` instances, verify the QC module (pass/fail, warehouse induction, PR attribution to FULFILLED) with a live end-to-end test against the seeded DB.
- [ ] **FIFO Pick List API**: Create a dedicated `GET /api/sales-orders/:id/pick-list` endpoint to guide warehouse staff before scanning.
- [ ] **Frontend Integration**: Integrate the new FIFO Pick List and Warranty Activation endpoints into the React dashboard.
- [ ] **Audit Logs**: Review the `InventoryTransaction` note format for better traceability during FIFO violations.
