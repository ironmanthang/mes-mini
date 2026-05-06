# Quality Control (QC) & Induction Flow

**Status**: Finalized & Implemented

---

## Core Architecture: Decoupled QC & Induction

The Quality Control process is strictly separated into two independent lifecycles to prevent data drift and preserve strict role boundaries.

### Phase A: Quality Check (`POST /api/quality`)
- **Role**: `QC_INSPECTOR`
- **Action**: Evaluates a `PENDING_QC` instance against granular `InspectionPoints` linked to the product's `QualityChecklist`.
- **Logic (One Fail = Total Fail)**: If any single inspection point fails, the overall check result is `FAILED`. Otherwise, it is `PASSED`.
- **Result**: The `ProductInstance` status updates to `PASSED_QC` or `FAILED_QC`. 
- **Boundary**: No warehouse routing, inventory tracking, or production request attribution happens here.

### Phase B: Product Induction (`POST /api/warehouse-ops/product-induction`)
- **Role**: `WH_STAFF`
- **Action**: Receives a batch of `PASSED_QC` or `FAILED_QC` serial numbers at the physical warehouse gate.
- **Semantics**: **All-or-Nothing**. If any single serial number is invalid or in the wrong status, the entire batch is rejected.
- **Routing**: 
  - `PASSED_QC` items route to the parent WorkOrder's `targetSalesWarehouseId` → `IN_STOCK_SALES`.
  - `FAILED_QC` items route to the parent WorkOrder's `targetErrorWarehouseId` → `IN_STOCK_ERROR`.
- **Traceability**: An `IMPORT_PRODUCTION` inventory transaction is logged for each item, and `receivedAt` is stamped for FIFO enforcement.

---

## Data Model (The Schema)

- **QualityChecklist (The Template)**: Master form/rules (e.g., "Standard iPhone Assembly Checklist"). Linked to a `Product`.
- **InspectionPoint (The Questions)**: Individual items defining how checks are performed.
    - **BINARY**: Pass/Fail (e.g., "Does it turn on?").
    - **MEASUREMENT**: Numeric validation against `minValue` and `maxValue`.
- **QualityCheck (The Event)**: The moment an employee inspects a specific `ProductInstance`.
- **InspectionResult (The Answers)**: Specific outcome for each point recorded during a check.

## Master Data Management

- **Immutability of Historical Results**: The `InspectionResult` table stores only the `passed` boolean (and the raw `measuredValue`), not a full snapshot of the criteria at the time. Therefore, the system trusts the `passed` boolean as the authoritative result of the check *at the exact moment it was performed*, regardless of future changes to the `InspectionPoint`.
- **Checklist Deletion Guard**: A `QualityChecklist` cannot be deleted if it is actively linked to any `Product`, or if any historical `QualityCheck` records exist using it. This guarantees the audit trail is never orphaned.
- **Product Integration**: A `Product` must be assigned a `checklistId` during creation or updates to participate in the QC flow.


---

## Execution Flow (The Data Journey)

- **Preparation**: Product assigned a `QualityChecklistId` containing multiple `InspectionPoints`.
- **Execution**: Employee scans a `ProductInstance` (status: `PENDING_QC`).
- **Recording**: API creates a `QualityCheck` for that serial number.
- **Validation**: Employee answers all questions; system creates `InspectionResult` rows.
- **The "One Fail = Total Fail" Rule**: If any `InspectionResult` has `passed: false`, the parent `QualityCheck.result` becomes `FAILED` and `ProductInstance.status` becomes `FAILED_QC`. Otherwise, they become `PASSED` and `PASSED_QC`.

---

## Pre-Configured Routing (Work Order Gate)

Routing is **explicitly pre-configured** at the Work Order level, never automated warehouse-type discovery.

- **Config**: While the WO is in `DRAFT`, the planner sets `targetSalesWarehouseId` and `targetErrorWarehouseId`.
- **Gate**: The Release Gate (`PUT /:id/release`) blocks release if either field is missing.
- **Induction**: At Induction time, the Product Induction Service routes instances strictly according to these WO fields.

---

## Production Request (PR) Attribution

PR attribution happens only during the Product Induction phase, and only for items that successfully reach `IN_STOCK_SALES`.

- **Lookup**: The system finds the parent `WorkOrder` and lists its `WorkOrderFulfillment` records.
- **Sorting**: It sorts them by PR priority (highest first) and creation date (oldest first).
- **Update**: It performs an atomic `increment` on `fulfilledQuantity` for the first eligible PR.
- **Status**: If the total `fulfilledQuantity` meets or exceeds the requested `quantity`, the parent `ProductionRequest` status updates to `FULFILLED`.

---

## Cost Absorption Trigger (Atomic Financials)

To prevent financial reconciliation nightmares, unit production costs are calculated and applied automatically, but only when all instances of a batch finish QC.

- **Trigger**: After every QC check, the system verifies if `PENDING_QC` instances remain for the batch.
- **Execution**: If 0 pending instances remain:
    - **Total Material Cost**: Summed precisely from `EXPORT_PRODUCTION` transactions linked to the WorkOrder's `MaterialRequest`.
    - **Batch Total Cost**: `laborCost` + `overheadCost` + `Total Material Cost`.
- **Distribution**:
    - `PASSED_QC` instances receive `unitProductionCost = Batch Total Cost / passedCount`.
    - `FAILED_QC` instances receive `unitProductionCost = 0`.
- **Zero-Yield Guard**: If 0 instances passed, the batch total cost is recorded directly onto the `WorkOrder` as a production loss, bypassing division to prevent crashes.

---

## Product Metadata Tracking

- **`ProductInstance.receivedAt`**: Captured exactly at warehouse induction. Required for FIFO enforcement.
- **`Product.shelfLifeDays` & `Product.warrantyPeriodDays`**: Drive automated expiration generation downstream.
