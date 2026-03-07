# Phase 3: Purchasing Automation - Critique & Plan

## ⚠️ Architectural Critique of the Current To-Do List
The current sequence and logic proposed in `my_todo_list.md` for Phase 3 contains a few architectural gaps that conflict with the "100% Traceability" goal and the existing database schema.

### Flaw 1: The "Bucket Problem" (Missing Traceability)
*   **Current State:** `purchaseOrderService.receiveGoods()` currently increments a generic bucket in the `ComponentStock` table. If we receive 100 Resistors from Supplier A today, and 50 from Supplier B tomorrow, they become 150 generic Resistors. 
*   **The Issue:** We immediately lose traceability. When production consumes a Resistor, we won't know if it came from Supplier A or B. 
*   **Correction:** Task 5 (`ComponentLot` Schema) is not just a nice-to-have; it is the **absolute prerequisite** for the entire purchasing phase. We must design and migrate the DB schema to support `ComponentLot` before touching the service layer.

### Flaw 2: The Aggregation Contradiction
*   **Current State:** The proposed "PO Aggregation Tool" wants to group multiple `WAITING_MATERIAL` PR shortages into a single draft PO.
*   **The Issue:** In `schema.prisma`, `PurchaseOrderDetail` has an optional `productionRequestId` column. If we aggregate shortages of the same component from PR #1 and PR #2 into a single PO Detail line item, we can only link **one** PR ID to it. 
*   **Correction:** We have two choices:
    1.  **Strict Line Items:** The PO Aggregation Tool creates multiple line items for the same component on the PO (e.g., Line 1: 50 Resistors for PR #1, Line 2: 50 Resistors for PR #2). This preserves the 1-to-1 DB relationship but might look strange on a printed PO to a supplier.
    2.  **Schema Change (Junction Table):** Drop `productionRequestId` from `PurchaseOrderDetail` and create a junction table `PurchaseOrderDetailFulfillment` (similar to how `WorkOrderFulfillment` works). This is the cleaner, more scalable approach.

### Flaw 3: Auto Re-check Danger
*   **The Issue:** Triggering `recheckFeasibility()` automatically on Goods Receipt to approve a PR is dangerous if a PR requires *multiple* components. If a PO arrives with Component X, but Component Y is still pending on another PO, we should not blindly approve the PR. The `recheckFeasibility()` must evaluate the *entire* BOM for that PR again.

---

## 🛠️ Proposed Corrected Execution Plan

Here is the exact order of operations we should follow to cleanly implement Phase 3 without introducing technical debt:

### STEP 1: Schema Overhaul (The Foundation)
1.  **Create `ComponentLot` Model:** `lotCode`, `supplierId`, `purchaseOrderId`, `componentId`, `quantityReceived`, `quantityRemaining`, `status`.
2.  **Create `PurchaseOrderDetailFulfillment` Model:** Remove `productionRequestId` from `PurchaseOrderDetail` and replace it with a 1-to-many junction table so one PO line item can satisfy multiple PRs seamlessly.
3.  **Update `PurchaseOrder` Model:** Add `actualDeliveryDate` for Lead Time Tracking.

### STEP 2: The Core Services
1.  **Update `purchaseOrderService.ts`:** Rewrite `receiveGoods` to generate `ComponentLot` records instead of just incrementing `ComponentStock`.
2.  **PO Aggregation Tool:** Build a service method `aggregateShortagesToPO(supplierId, prIds[])` that correctly handles the new Fulfillment mapping.

### STEP 3: The Cross-Cutting Logic
1.  **Auto Re-check Logic:** Hook into the end of `receiveGoods` to trigger MRP against any PRs linked via the new Fulfillment table. Only transition PRs if *all* shortages are met.
2.  **QR Label Generation:** Integrate a barcode generation library to output the new `ComponentLot.lotCode` upon receipt.

## User Review Required
Before we proceed with editing any files, we need to confirm:
1. Do you agree with creating a `PurchaseOrderDetailFulfillment` table to solve the aggregation issue?
2. Do you agree with making the `ComponentLot` schema the immediate next step?
