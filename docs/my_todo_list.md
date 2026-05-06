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
- [x] **Quality Control & Induction Refactor**: Decoupled QC inspection (`POST /api/quality`) from physical warehouse induction (`POST /api/warehouse-ops/product-induction`). Implemented granular checklist validation, all-or-nothing induction routing, automatic PR attribution, and atomic cost absorption upon batch completion. Created manual test plans.
- [x] **Business Logic Audit**: Audited existing codebase against `docs/00_business_flows.md`.
- [x] **Product Master Data Fix**: Fixed `productService` missing fields for Master Data linking (`checklistId`, `minStockLevel`, `warrantyPeriodDays`, `shelfLifeDays`).
- [x] **Quality Master Data API**: Built module (CRUD for `QualityChecklist` and `InspectionPoint`) and added to Swagger documentation.
- [x] **Quality Documentation**: Documented Quality Master Data historical preservation strategy in `docs/features/quality_check/01_logic.md`.
- [x] **Controller Typings**: Fixed Express parameter typing errors (`string | string[]`) in `qualityChecklistController.ts` by explicitly mapping `req.params.id` as `string`.
- [x] **Structured Error Standardization**: Enforced `AppError` usage across `qualityChecklistController.ts` to cleanly separate operational HTTP errors from unhandled crashes, and formally documented this pattern in `docs/architecture/backend_conventions.md`.
- [x] **QC Phase A Live Verification**: Manually verified `POST /api/quality` end-to-end against a freshly seeded DB. Confirmed Pass/Fail routing, `InspectionResult` row creation, `ProductInstance` status transition, and Atomic Financials trigger behavior. Corrected `inspectionPointId` values after reseed ID shift.
- [x] **ProductInstance List API Fix**: Added `productId` to `getAllProductInstances` select query and Swagger schema in `productInstanceRoutes.ts` so the frontend can resolve the checklist chain without a second lookup.
- [x] **Swagger Contract Fix**: Removed phantom `result` field from `POST /api/quality` request body schema. Added `minItems` constraint and full response schemas for all three quality endpoints.
- [x] **QC Phase A Frontend Guide**: Created `docs/features/quality_check/02_api_simulation.md` documenting the three-call discovery chain and both Pass/Fail test scenarios for the frontend team.
- [x] **QC Phase B Live Verification**: Manually verified `POST /api/warehouse-ops/product-induction` using `SN-QC-TEST-0001` and `SN-QC-TEST-0002` against the live DB. Confirmed automatic routing to Sales/Error warehouses, `receivedAt` stamping, `IMPORT_PRODUCTION` transactions, and `WorkOrderFulfillment` increments.
- [x] **Finalize Quality/Induction Docs**: Ran `/finalize-feature` on all Phase A and Phase B documentation. Transformed transient simulation guides into permanent **Frontend Integration Guides**.
- [x] **Permission Fix (WH_INDUCT)**: Identified and fixed missing `WH_INDUCT` permission for `WH_STAFF` in the seed script.
- [x] **Swagger QC Improvement**: Updated `POST /api/quality` with a concrete electronics checklist example and fixed indentation errors.

## Pending Objectives (Next Session)
- [ ] **FIFO Pick List API**: Create a dedicated `GET /api/sales-orders/:id/pick-list` endpoint to guide warehouse staff before scanning.
- [ ] **Frontend Integration**: Integrate the new FIFO Pick List and Warranty Activation endpoints into the React dashboard.
- [ ] **Audit Logs**: Review the `InventoryTransaction` note format for better traceability during FIFO violations.
- [ ] **Work Order Cost**: Implement Work Order Operational Cost Input (`laborCost`, `overheadCost`) upon completion.
- [ ] **Cost Reporting APIs**: Create `GET /api/costs/materials` and `GET /api/costs/products`.
- [ ] **Line Performance**: Implement Production Line Performance Reporting API (`GET /api/production/reports/line-performance`).
- [ ] **Spoilage Gap**: Address the "Spoilage / Supplementary Material Request" gap in Business logic.
