# Quality Control (QC) & Induction Flow

**Status:** Finalized & Implemented

---

## 1. Core Rule: Binary QC Flow

The QC process enforces a strict **PASSED** or **FAILED** binary structure. The system **does NOT** support intermediate statuses like `NEEDS_REWORK` to preserve database simplicity and maintain strict line-speed execution.

- **PASSED**: The `ProductInstance` is routed to the `targetSalesWarehouseId` defined on the parent Work Order. Status becomes `IN_STOCK_SALES`.
- **FAILED**: The `ProductInstance` is routed to the `targetErrorWarehouseId` defined on the parent Work Order. Status becomes `IN_STOCK_ERROR`.

Once a unit fails, its genealogy is locked and it cannot be re-inducted into the current sales flow.

---

## 2. Pre-Configured Routing (Work Order Gate)

QC routing is **not** automated warehouse-type discovery. It is **explicitly pre-configured** at the Work Order level before any production begins.

**Configuration flow:**
1. While the WO is in `DRAFT`, the planner sets routing via `PUT /api/work-orders/:id`:
   - `targetSalesWarehouseId` — must be a `SALES` type warehouse
   - `targetErrorWarehouseId` — must be an `ERROR` type warehouse
2. The Release Gate (`PUT /:id/release`) **blocks release** if either field is missing.
3. At QC time, `QualityCheckService` reads these fields from the parent `WorkOrder` — it does **not** call `findFirst(warehouseType)`.

**Error behavior:** If a WO somehow reaches QC without routing configured, the QC submission is rejected with an explicit error identifying the WO code and the missing field.

---

## 3. Product Metadata Tracking

To support automated business logic downstream:
- **`ProductInstance.receivedAt`**: Captured when the instance transitions to `IN_STOCK_SALES`. This is the core variable used for Hybrid Fulfillment (MTS + MTO) to ensure **FIFO** processing.
- **`Product.shelfLifeDays` & `Product.warrantyPeriodDays`**: Required constraints for B2B2C business flows. These drive automated expiration generation when a PR is fulfilled.

---

## 4. Strict Traceability Chains

- **Component Consumption (`InventoryTransaction`)**: Material requests must link specifically to a `componentLotId` instead of logging generic transaction notes.
- **Material to Work Order**: A `WorkOrder` is linked 1:1 to a `MaterialRequest` to prevent fractional or duplicated component requests.
- **Transfer Relocations (`TransferRequest`)**: "Blind" warehouse-to-warehouse transfers are blocked. All `TransferRequests` must map out exact physically scanned components (`TransferRequestLot`) or exact finished products (`TransferRequestInstance`).

---

## 5. Production Request (PR) Attribution

When a unit successfully passes QC (`PASSED` result):
- The system finds the parent `WorkOrder` and lists all its associated `WorkOrderFulfillment` records (which link the WO to original Production Requests).
- It sorts them by PR priority (highest first) and creation date (oldest first).
- It finds the first fulfillment where `fulfilledQuantity < quantity` and increments `fulfilledQuantity` by 1.
- If this increment causes the total `fulfilledQuantity` for that PR to meet or exceed the originally requested `quantity`, the parent `ProductionRequest` status is automatically updated to `FULFILLED`.

This ensures that physical stock realization directly updates planning demands accurately and chronologically.
