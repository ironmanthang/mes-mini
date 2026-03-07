# Active Tasks

- [ ] **Phase 3: Purchasing Automation (Procurement Focus)**
    - [ ] **Auto Re-check on Goods Receipt** — In `purchaseOrderService.receiveGoods()`, automatically trigger `recheckFeasibility()` for any Production Request linked to the PO details to transition them from `WAITING_MATERIAL` to `APPROVED`.
    - [ ] **PO Aggregation Tool** — Implement a service to query all `WAITING_MATERIAL` Production Requests and aggregate their shortages into a single draft Purchase Order for a selected supplier.
    - [ ] **Lead Time Tracking** — Update PO schema/service to track `actualDeliveryDate` and calculate supplier performance vs `expectedDeliveryDate`.
    - [ ] **Component Batch Labeling (QR)** — On PO Goods Receipt, generate and print QR labels for each received component batch (linking to PO, supplier, component, and quantity).
    - [ ] **ComponentLot Schema** — The current schema only tracks aggregate `ComponentStock`. Design a `ComponentLot` model to track individual received batches (lot code, supplier, PO link, received date, quantity, warehouse location). This is required for batch-level traceability per `qr_strategy.md`.

# Future Tasks

> The tasks below follow the **Vertical Slice** (SO → PR → PO → WO → QC → Shipping).
> Modules marked ⚠️ have AI-generated scaffolding that needs review/rewriting.

---

## Phase 4: The Build (Work Order Execution) ⚠️

> `workOrderService.ts` is AI-generated. Review/rewrite before building on top of it.

- [ ] **Review & Harden Work Order Service** — Audit the existing AI-generated `workOrderService.ts` for correctness (transaction safety, status transitions, edge cases like double-start, partial completion).
- [ ] **Material Kitting Flow** — Refine the WO Start → Material Request → Warehouse Approval → Stock Deduction pipeline. Ensure atomic deduction and rollback if approval is rejected.
- [ ] **Wastage Buffer (MRP Safety Factor)** — Add `wastagePercent` column to `BillOfMaterial`, apply safety factor in `mrpService.calculateRequirements()` so kitting requests include buffer stock.
- [ ] **Production Line Assignment** — Review `productionLineService.ts` (AI-generated). Implement capacity tracking (active WOs per line) and prevent over-assignment.
- [ ] **Production Batch & Serialization + QR Label** — Review `completeWorkOrder()` logic for batch creation and serial number generation (`SN-{PRD}-{BATCH}-{SEQ}`). Generate QR labels for each finished product instance at this stage.
- [ ] **Traveler Document Generation (Phiếu theo dõi)** — Per `qr_strategy.md` Section 4: generate a printable Traveler for each WO batch containing the Work Order QR, Product SKU & Name, Batch Quantity, and Operation Checklist. Workers scan this to start/stop actions.
- [ ] **WO Progress Tracking** — Add a mechanism for shop-floor workers to report progress (e.g., units completed so far) without fully completing the WO. Support partial output reporting.

---

## Phase 5: Quality Control (QC) ⚠️

> `qualityService.ts` is a **stub** (all methods throw "not implemented"). Schema models (`QualityChecklist`, `QualityCheck`) exist but the service needs a full rewrite.

- [ ] **QC Checklist Management (Master Data)** — CRUD for `QualityChecklist` items (e.g., "Visual Inspection", "Functional Test", "Dimension Check"). Each checklist defines what criteria to evaluate.
- [ ] **QC Gate Enforcement** — After WO completion, `ProductInstance` status should be `WIP` (not `IN_STOCK`). Only after passing QC should it transition to `IN_STOCK`. Block shipping of `WIP` units.
- [ ] **QC Check Recording (Scan QR → Record Result)** — Implement the full `qualityService.createCheck()`: scan a product instance QR, link `QualityCheck` to `ProductInstance` + `Checklist`, record `PASSED`/`FAILED`/`NEEDS_REWORK`, and auto-update `ProductInstance.status`.
- [ ] **Rework Flow** — If QC result is `NEEDS_REWORK`, transition `ProductInstance.status` to `DEFECTIVE`. Create a rework WO linking back to the original batch for traceability.
- [ ] **Scrap Flow** — If QC result is `FAILED` (unrepairable), transition to `SCRAPPED`. Log an inventory transaction (`SCRAP` type) for cost accounting.
- [ ] **QC Dashboard** — Endpoint returning pass/fail/rework rates per product, per production line, per time period. This feeds the real-time monitoring dashboard.

---

## Phase 6: Shipping & Fulfillment

> No `Shipment` model exists in schema yet. This phase requires schema design first.

- [ ] **Shipment Schema Design** — Design `Shipment` and `ShipmentDetail` models. A Shipment links to a `SalesOrder` and contains multiple `ProductInstance` records (units being shipped).
- [ ] **Pick & Pack Flow (Scan QR → Assign to Shipment)** — Given an approved SO with available finished goods (`IN_STOCK` + QC passed), generate a pick list. Scan product QR to assign `ProductInstance` to `Shipment`.
- [ ] **Partial Shipment Support** — Allow shipping a subset of SO line items. Track `quantityShipped` on `SalesOrderDetail` (field already exists in schema). Auto-update SO status to `IN_PROGRESS` or `COMPLETED`.
- [ ] **Shipping Confirmation & Inventory Deduction** — On shipment confirmation, update `ProductInstance.status` to `SHIPPED`, log `EXPORT_SALES` inventory transaction, and link `ProductInstance.salesOrderId`.
- [ ] **Delivery Note / Packing Slip Generation** — Generate a printable shipping document listing serial numbers, product details, and agent/customer info.

---

## Phase 7: Costing

> `ProductionCost` and `CostCategory` models exist in schema. `ProductInstance.unitProductionCost` field exists.

- [ ] **Direct Material Cost Calculation** — On WO completion, calculate material cost from BOM quantities × `Component.standardCost`. Store per-unit cost on `ProductInstance.unitProductionCost`.
- [ ] **Cost Category Tracking** — Allow logging additional cost entries (Labor, Overhead, Machine Time) per WO via `ProductionCost` model. Roll up total cost per unit.
- [ ] **Cost Report / Margin Analysis** — Endpoint comparing `ProductInstance.unitProductionCost` vs `SalesOrderDetail.salePrice` per product for profit margin analysis.

---

## Phase 8: Traceability Queries (Genealogy)

> This phase builds the **query engine** that connects all the QR/scan data generated in Phases 3–6.
> Architecture doc: `docs/architecture/qr_strategy.md`.

- [ ] **Universal Scan API** — Single scan endpoint that accepts any QR/barcode and returns entity type + details (component batch, product instance, WO, etc.). This powers the mobile scanner app.
- [ ] **Forward Traceability** — Given a supplier component batch, trace which Product Instances consumed it (Supplier Batch → PO → WO → Production Batch → Serial Numbers).
- [ ] **Reverse Traceability** — Given a Product Instance serial number, trace back to which supplier batches/components were used in its production.

---

## Cross-Cutting Concerns

- [ ] **Low Stock Alert System** — When `availableQuantity` (physical stock minus allocated stock for work orders) drops below `Component.minStockLevel`, auto-create a `LOW_STOCK` notification for warehouse managers.
- [ ] **Material Return Request** — Return unused/excess materials from production floor back to warehouse after WO completion. Log `RETURN_IN` inventory transaction.
- [ ] **Database-Backed Permission System** — Migrate from hardcoded Role strings to dynamic DB-driven Permissions (the `Role` model exists, but permissions are not granular).
- [ ] **Dashboard Real-Time Monitoring** — Aggregate endpoints for: SO pipeline status, WO progress per line, QC pass rates, inventory levels, and overdue PO alerts. (The `dashboard` module exists but likely needs expansion.)
- [ ] **Inventory Ledger & Transaction History** — Ensure all material movements (PO receipt, WO consumption, Scrap, Shipping) log a corresponding `InventoryTransaction` for full traceability. (Model already exists).
