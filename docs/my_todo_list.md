# Active Tasks

- [ ] **Production Request Redesign** ([Implementation Plan](file:///d:/program/mes-mini/ai_context/docs/production_request_implementation_plan.md))
    - [x] **Step 1: Schema Migration**
        - [x] Update `ProductionRequestStatus` enum (remove `PENDING`/`REJECTED`, add `WAITING_MATERIAL`)
        - [x] Replace `salesOrderId` with `soDetailId` on `ProductionRequest`
        - [x] Add `productionRequests` relation to `SalesOrderDetail`
        - [x] Remove `productionRequests` relation from `SalesOrder`
        - [x] Add `productionRequestId` FK to `PurchaseOrderDetail`
        - [x] Run `prisma migrate dev --name production_request_redesign`
    - [x] **Step 2: MRP Service Fix**
        - [x] Subtract `allocatedQuantity` from available stock in `mrpService.calculateRequirements()`
    - [x] **Step 3: Production Request Service Rewrite**
        - [x] Rewrite `createRequest()` — BOM check at creation, `soDetailId` link, `APPROVED`/`WAITING_MATERIAL` status
        - [x] Remove `approveRequest()` and `rejectRequest()`
        - [x] Add `recheckFeasibility()` — re-run BOM check on `WAITING_MATERIAL` PRs
        - [x] Add `draftPurchaseOrder()` — return shortage list for PO pre-fill
        - [x] Update `cancelRequest()`, `getRequestById()`, `getAllRequests()`
        - [x] Update controller, routes, validator (`salesOrderId` → `soDetailId`)
    - [x] **Step 4: Feasibility Service (New)**
        - [x] Create `feasibilityService.ts` under `src/production/mrp/`
        - [x] Implement Traffic Light logic (GREEN/YELLOW/RED per SO line item)
        - [x] Register route `GET /api/sales-orders/:id/feasibility`
    - [x] **Step 5: Cross-Module Integration**
        - [x] Update `salesOrderService.cancelSO()` — query PRs via `SalesOrderDetail.productionRequests`
        - [x] Update `salesOrderService.getSOById()` — include linked PRs per detail
        - [x] Update `purchaseOrderService` — accept `productionRequestId` per detail
        - [x] Update `workOrderService` — remove `PENDING` from status type unions
    - [x] **Step 6: Verification**
        - [x] Write integration tests in `production_request_flow.test.ts` (8 scenarios)
        - [x] Update existing tests that reference old PR statuses
        - [x] Manual Swagger walkthrough (Guide provided, user testing)

# Future Tasks

- [ ] **Wastage Buffer** — Add `wastagePercent` column to `BillOfMaterial`, apply safety factor in MRP calculations
- [ ] **Forced Conversion** — Allow WO creation when components are short (negative availability for urgent orders)
- [ ] **Physical Kitting List** — Generate printable pick-list document from PR/WO for warehouse staff
- [ ] **Auto Re-check on Goods Receipt** — When PO goods are received, auto-trigger `recheckFeasibility()` on linked `WAITING_MATERIAL` PRs
- [ ] **PO Aggregation** — Merge component shortages across multiple PRs into a single PO to save shipping costs
- [ ] **Batch Tracking System** — Component traceability via Batches (Reels/Boxes), split-batch support, FIFO auto-assignment
- [ ] **Deep Traceability (Genealogy)** — Link specific Supplier Batches to specific Product Serials
- [ ] **Database-Backed Permission System** — Migrate from hardcoded Role strings to dynamic DB-driven Permissions
- [ ] **Real-Time Costing System** — Track actual utilization cost per unit (Material + Labor + Machine)
- [ ] **Quality Gates Enforcement** — Prevent WO completion unless QC is passed
- [ ] **Material Return Request** — Return unused materials from production floor back to warehouse