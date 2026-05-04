## Status Reference

Sales Order:
- DRAFT
- PENDING
- APPROVED
- IN_PROGRESS
- PARTIALLY_SHIPPED
- SHIPPED
- CANCELLED

Production Request:
- DRAFT
- PENDING
- WAITING_MATERIAL
- APPROVED
- IN_PROGRESS
- FULFILLED
- CANCELLED

Purchase Order:
- DRAFT
- PENDING
- APPROVED
- ORDERED
- RECEIVING
- COMPLETED
- CANCELLED

Work Order:
- DRAFT
- RELEASED
- IN_PROGRESS
- COMPLETED
- CANCELLED

ProductInstanceStatus:
- PENDING_QC
- PASSED_QC
- FAILED_QC
- IN_STOCK_SALES
- IN_STOCK_ERROR
- SHIPPED

---

## Traceability & Physical Scan Points

The system helps Traces the path from Supplier Lot to ComponentLot, through the Work Order and Production Batch, ending at the Product Instance (SN). This answers which specific components went into which unit. it can also Traces the path from Product Instance (SN) to the specific Sales Order and Agent. This answers which customer received which unit. All of these flow serve a purpose: products traceability with barcode scanning.

> [!IMPORTANT]
> These two chains are independent. The link between the manufacturing history and the sales order is established only at the moment of shipping.

---

This is the Single Source of Truth (SSOT) for understanding how the business functions. For more detailed explanations of these flows, read the docs/features folder.



---

## Propagation Precedence

- Rule order: apply these rules top-down; later logic must not downgrade a higher state already reached.
- Terminal lock: SHIPPED, FULFILLED, COMPLETED, and CANCELLED are protected from rollback.
- SO shipping priority: PARTIALLY_SHIPPED/SHIPPED always beats IN_PROGRESS propagation from WO/PR. Once an SO reaches PARTIALLY_SHIPPED/SHIPPED it never moves back to IN_PROGRESS.
- SO start paths: Because shipping is allowed from APPROVED, an SO can move directly from APPROVED to PARTIALLY_SHIPPED/SHIPPED on first shipment without entering IN_PROGRESS first.
- WO start propagation: WO IN_PROGRESS can move linked PR/SO to IN_PROGRESS only when those records are not protected.
- PR fulfillment rule: PR becomes FULFILLED only from QC-passing IN_STOCK_SALES attribution.
- PR underfill fallback: after WO completion, PR returns to APPROVED only if no other linked WO is IN_PROGRESS.
- Cancellation scope: cancellation is valid only in states explicitly marked cancellable per module.
- PO dependency rule: PO in ORDERED/RECEIVING/COMPLETED blocks PO cancellation and blocks PR cancellation through the active link.
- WO completion gate: WO cannot complete unless MR is ISSUED.
- SO linkage timing: ProductInstance.salesOrderId is written only at shipping; warehouse intake can affect PR, not SO.
- Hybrid shipping order: ship MTO-traceable first, then eligible MTS FIFO under fallback eligibility guard.

---

## Order Entry Flows

The process can be started in two ways:

Sales-driven MTO production request:
- Agent places a customer order
- Sales team creates a Sales Order
- Production team creates a Production Request linked to an SO line

Internal MTS production request:
- Production team creates a Production Request without soDetailId, based on current inventory levels
- This is pure Make-to-Stock

---

## Sales Order Lifecycle

- Sales Orders begin in DRAFT while customer details and product lines are being entered
- Submitting a DRAFT moves it to PENDING, where it awaits manager review
- Manager approval moves the SO to APPROVED, records approver info, and runs availability/shortage checks
- If the order is rejected, it returns to DRAFT with a rejection note for revision
- Approved SOs can be moved to IN_PROGRESS only when a work order of a production request that links to this SO is also IN_PROGRESS. This means IN_PROGRESS of a work order will lead to IN_PROGRESS of its parent PR, which in turn makes the SO IN_PROGRESS
- Shipments can be executed against APPROVED, PARTIALLY_SHIPPED or IN_PROGRESS orders using Hybrid Fulfillment (pulling from linked MTO stock first, then falling back to oldest available MTS stock)
- Clarification: APPROVED SOs do not hold pre-linked ProductInstance records. Product instances are linked to SOs during shipOrder allocation/shipping.
- Cancellation is allowed only from PENDING or APPROVED states. DRAFT orders are deleted instead of canceled. SOs in IN_PROGRESS,  PARTIALLY_SHIPPED or SHIPPED cannot be cancelled


Early Fulfillment rule via MTS:
- If an IN_PROGRESS Sales Order is fully shipped using existing MTS stock before its linked Work Orders finish, the SO will transition to SHIPPED
- The active linked Work Orders are not interrupted; they will continue production
- When those Work Orders eventually finish QC and the goods enter the Sales Warehouse as IN_STOCK_SALES, the system performs PR attribution only
- Warehouse entry does not set salesOrderId and does not directly change SO status
- Units are attributed to PR fulfillment (WO-PR quantity tracking). Any units beyond PR required quantity are treated as independent Make-to-Stock (MTS) inventory
- Later, when these units are shipped against any SO (for example, SO-002), salesOrderId is set at shipping time only. workOrderId and the original PR chain are preserved as permanent manufacturing provenance
- Similarly, when a SO is PARTIALLY_SHIPPED and the remaining balance is fulfilled by MTO production, any surplus units beyond what the SO needs also convert to MTS with the same traceability preserved
- When every sales line product is shipped (scanned at sales warehouse and loaded onto truck), the SO becomes SHIPPED
---

## Production Request Lifecycle

- A Production Request can be created with or without a linked SO
- When submitted (either from DRAFT or submitted directly), PR status is either PENDING or WAITING_MATERIAL based on availability
- A BOM snapshot is taken at the moment the PR transitions to PENDING or WAITING_MATERIAL (i.e., on submission)
- When in WAITING_MATERIAL, a Purchase Order may be created and linked to the PR. All PO receipts are assumed to be complete with no loss or damage during receiving
- WAITING_MATERIAL moves to PENDING only after recheck feasibility (which checks the entire warehouse inventory) is manually or automatically triggered (when all materials for a PR are fully received via PO receiving)
- Only PENDING PRs can be approved
- Once approved, a PR transitions to IN_PROGRESS when any linked Work Order moves to IN_PROGRESS
- A PR can only be canceled while it is in PENDING, WAITING_MATERIAL, or APPROVED states, and only when its linked PO (if any) is in DRAFT, PENDING, or APPROVED state. A linked PO in ORDERED, RECEIVING, or COMPLETED state cannot be canceled and therefore blocks PR cancellation. PRs in IN_PROGRESS or FULFILLED cannot be cancelled. DRAFT PRs are deleted instead of canceled.
- If the PR is in WAITING_MATERIAL (meaning materials are expected from a linked PO), the PO must be canceled first to dissolve the link, then the PR can be canceled

---

## Purchase Order Flow

- A Purchase Order can be created with or without a linked PR
- PO begins as DRAFT and is editable
- Submitting a DRAFT generates an official PO code and moves it to PENDING
- PENDING is the review/approval stage
- Once approved, the PO moves to APPROVED and most financial fields become locked
- ORDERED represents the supplier order placement stage
- RECEIVING begins when components arrive and at least one component lot is recorded. Scan Requirement: Incoming components are assigned an Internal Lot Label barcode upon receipt; scanning this at entry records the supplier batch into the inventory system.
- COMPLETED means the PO is fully received and closed. When all materials for a PR are fully received via PO receiving, the PR automatically moves from WAITING_MATERIAL to PENDING. Users can also manually recheck feasibility, which evaluates component stock across all warehouses
- A PO can only be canceled while it is in PENDING or APPROVED states. DRAFT POs are deleted instead of canceled. Once a PO is ORDERED, RECEIVING, or COMPLETED, it cannot be canceled
- The backend treats ORDERED, RECEIVING, COMPLETED, and CANCELLED as non-editable states
- When a PO is cancelled, any PR-PO link is automatically dissolved. The linked PR remains in its current state (APPROVED/WAITING_MATERIAL). The production team must manually recheck feasibility or raise a new PO

---

## Work Order Flow

- Work Orders are created from APPROVED Production Requests
- Multiple approved PRs for the same finished product may be grouped into one Work Order
- Work Orders are created in DRAFT status while the execution plan is still being prepared
- When in DRAFT, the user can assign the Work Order to a specific physical Production Line, configure the Production Batch details (batch code generation rules, and setting the Expiration Date based on the product type), and explicitly define the target destination warehouses:
  - targetSalesWarehouseId: Where PASSED_QC units will be inducted.
  - targetErrorWarehouseId: Where FAILED_QC units will be sent for scrap/investigation.
- After planning is complete, it moves to RELEASED
- Next user can click on button start to move WO to IN_PROGRESS, which is the operational production stage where materials are consumed and output is made. The moment a WO is IN_PROGRESS, its linked PR and SO also become IN_PROGRESS
- Completion generates a production batch, creates product instances (with assigned lot/batch data and expiration dates), records inventory transactions, and sets the WO to COMPLETED
- COMPLETED WO triggers QC attribution. A PR moves to FULFILLED only when its required quantity is fully satisfied by QC-passing instances (that are in IN_STOCK_SALES)
- QC distributed to linked PRs is processed in order of priority ASC, then createdAt ASC. Each passing instance increments the fulfilled quantity tracked on the WO-PR link. FAILED_QC instances are never attributed
- If a WO completes with partial fulfillment (not all QC-passing instances cover the PR demand), the affected PR returns to APPROVED only if no other linked WOs are currently IN_PROGRESS. If other WOs remain IN_PROGRESS, the PR stays IN_PROGRESS. This allows the production team to create a new WO to cover the remaining deficit. There is no automatic re-production trigger
- A WO can only be canceled while it is in DRAFT, RELEASED, or IN_PROGRESS states. Once a WO is COMPLETED, it cannot be canceled. Before complete a WO, manager need to input Operational Cost
- If we cancel a WO when it is in IN_PROGRESS, no product instances exist yet and none need to be voided. Any linked PRs that are currently IN_PROGRESS (and not yet FULFILLED) will return to APPROVED. Similarly, any linked SOs that are currently IN_PROGRESS (and not yet SHIPPED, PARTIALLY_SHIPPED or CANCELLED) will return to APPROVED
- Cancellation policy: Canceling an IN_PROGRESS WO requires a cancellation reason. Components already issued are treated as irreversible consumption (loss/scrap) and are not auto-reversed. Inventory transactions must remain as audit evidence.
- A single WO completion can partially fulfill some PRs and fully fulfill others (when some products failed the quality control phase)

---

## Batch Mapping Rule

- Core mapping: One PR can be fulfilled by multiple WOs, and each WO produces exactly one Production Batch on completion
- Relationship summary: 1 PR -> Multiple WOs -> 1 Batch per WO
- Batch ownership: One Production Batch belongs to one WO only. A batch cannot be shared across multiple WOs
- Instance linkage: Every ProductInstance created by a WO completion must carry that WO's productionBatchId
- Traceability: Through productionBatchId -> WO -> PR (and optional soDetailId), each shipped unit keeps stable manufacturing provenance

---

## Material Request

This records the flow of moving components from COMPONENT warehouse to production line (to fulfill work order).
- A Work Order moves to IN_PROGRESS when the production team starts it
- After the WO is IN_PROGRESS, production staff must manually create a Material Request for it
- BOM Strict Enforcement: The MR line quantities must exactly match the WO BOM multiplied by the planned production quantity. The backend rejects any request that deviates from this derived amount — no over-requesting or under-requesting is allowed
- Only one active MR (in PENDING status) is allowed per Work Order at a time

- Warehouse staff opens the MR, confirms the component list, and when ready, follows a two-step process

Step 1 — Validate:
- The staff calls the validate endpoint to check whether the warehouse has sufficient stock for each MR line
- The system returns a preview showing which lines are fully available and which fall short
- Staff can address shortages before attempting completion

Step 2 — Complete:
- When all lines show sufficient stock, the staff submits the completion call
- For each line, the system decrements the lot current quantity by the issued amount, and creates an inventory transaction record to permanently log the consumption
- Once all lines are processed, the MR status changes to ISSUED
- If any lot falls short during the completion call, the MR stays PENDING. No inventory changes are made. Staff must either adjust quantities or wait for new stock to arrive before retrying

- A single component line may be fulfilled using multiple lots. The total issued quantity across all lots must meet exactly the required quantity
- Material Request statuses:
  - PENDING: manually created by production staff, awaiting warehouse validation and completion
  - ISSUED: all lines fulfilled, stock decremented
  - CANCELLED: voided because the parent WO was cancelled
- A Work Order cannot be marked COMPLETED unless its linked Material Request has status ISSUED. This ensures all planned component consumption is fully recorded before production is considered finished. If a WO is cancelled, its open MR is also cancelled. Components already issued will be gone.

> Note: The Material Request (MR) is backed by MaterialRequest — it handles production material consumption only (components → work order). For general warehouse-to-warehouse relocations of components or products, see TransferRequest below.

---

## Quality Control

- Checklist Templates: Every finished product is associated with a specific Quality Checklist template A checklist consists of multiple Inspection Points (discrete steps or criteria)
- After clicking the complete work order button, all product instances are created directly with status PENDING_QC and await QC inspection
- The system automatically generates a unique QR code or Barcode identifier for each instance
- Production employees print and slap these QR labels onto the physical products
- Scan Requirement: Each finished unit is labeled with a unique Serial Number (SN); scanning this during Quality Control initiates the inspection flow
- Inspection Execution: The QA inspector must evaluate every Inspection Point defined in the product's associated checklist
- Binary Outcome Rule: Despite having multiple inspection points, the final result for the unit is strictly binary:
  - PASSED_QC: All inspection points passed
  - FAILED_QC: Any single inspection point failed (One Fail = Total Fail)
- After QC inspection, the instance status strictly remains as PASSED_QC or FAILED_QC. The units are physically still at the production staging area and are not yet in the warehouse inventory.
- Warehouse Induction (Handover): To physically accept the goods into the warehouse, warehouse staff must explicitly induct them (e.g., via a POST /warehouse-ops/product-induction API call).
  - The API receives a list of scanned Serial Numbers at the warehouse receiving gate.
  - The system validates and routes the instances based on their Work Order configuration:
    - PASSED_QC instances are moved to the targetSalesWarehouseId and their status changes to IN_STOCK_SALES.
    - FAILED_QC instances are moved to the targetErrorWarehouseId and their status changes to IN_STOCK_ERROR.
  - This induction step generates an InventoryTransaction(type: IMPORT_PRODUCTION) for the incoming finished goods.
- If the configured target warehouses no longer exist or are inactive at the time of induction, the induction call is rejected for those instances.

---

## Product Induction

- When a product instance transitions to IN_STOCK_SALES (has passed QC and been received at the Sales Warehouse), the system automatically attributes it to a linked Production Request
- The PR is selected based on priority (priority ASC, then createdAt ASC) among all PRs linked to the Work Order that produced this instance
- The system increments WorkOrderFulfillment.quantity by +1 for the chosen PR-WO link
- If the PR required quantity is now fully satisfied, the PR status changes to FULFILLED
- FAILED_QC instances (which become IN_STOCK_ERROR) never contribute to PR fulfillment
- Each ProductInstance retains permanent manufacturing provenance: workOrderId (which WO produced it), and through the WO-PR chain, the original soDetailId (the SO that caused the PR to be created)
- Clarification: For PRs created without SO linkage (soDetailId is null), provenance intentionally ends at the PR/WO chain. This is valid for pure MTS production.
- Attribution path:
  - MTO-linked PR: If soDetailId is not null, units are attributed to that PR fulfillment until the PR is fulfilled. Any excess becomes MTS surplus.
  - Pure-MTS PR: If soDetailId is null, units are treated as MTS at IN_STOCK_SALES attribution.
- When an IN_STOCK_SALES unit is later shipped against an SO (via shipOrder with hybrid fulfillment), salesOrderId is written on that shipped instance only. The workOrderId and original PR chain are preserved for traceability
- Sales warehouse to Sales warehouse transfers are a separate flow with no WO linkage

---

## Shipping Finished Goods

- Scan Requirement: At the point of sale, the Serial Number (SN) is scanned and linked to a Sales Order ID, which triggers the final inventory decrement and completes the commercial chain of custody.
- An employee scans the products at the Sales Warehouse and calls the shipOrder API
- Selection rule: The system first selects eligible IN_STOCK_SALES instances whose manufacturing provenance traces to PRs linked to this SO (MTO-first selection)
- If MTO-traceable units are insufficient, the system uses Hybrid Fulfillment by pulling the oldest available MTS IN_STOCK_SALES units (FIFO by receivedAt).
- Scan Validation: The system generates a digital Pick List for the employee. If the employee scans a newer serial number before the older ones, the system rejects the scan with a FIFO Violation error.
- Fallback eligibility guard:
  - For each fallback candidate instance, trace provenance via productionBatchId -> WO -> PR -> soDetailId -> SO
  - If any reachable SO is IN_PROGRESS or PARTIALLY_SHIPPED, that instance is blocked from fallback
  - Reachable SOs in PENDING, APPROVED, SHIPPED, or CANCELLED are eligible
  - PR with null soDetailId is always eligible
  - Eligibility must be validated at shipOrder commit time (final confirmation step)
- Write rule: During shipping, each selected instance is assigned salesOrderId for this SO, then status changes to SHIPPED
- After the user confirms, all selected instances transition from IN_STOCK_SALES to SHIPPED
- When the first instance is shipped, the SO moves to PARTIALLY_SHIPPED
- When all sales lines are fully covered by SHIPPED instances, the Sales Order transitions to SHIPPED
- The cycle is complete. The goods have left the building

---

## Check production progress

this is simply get apis (in sales order/production request/work order)

---

## Cost Tracking: Two GET APIs

1. Raw Material Cost API (/costs/materials)
- Filters: Date range (based on when the Purchase Order reached COMPLETED status), Component ID, Supplier ID.
- Returns: Total material cost, daily cost breakdown, and daily quantity received.
- Purpose: Tracks how much money the company spent purchasing specific components, buying from specific suppliers, or the total component spend over a date range. It strictly measures the cost of raw materials entering the system.

2. Finished Product Cost API (/costs/products)
- Filters: Date range (calculated from the Work Order completion date), Product ID.
- Returns: Total finished product cost, daily cost breakdown, and total product instances created each day.
- Purpose: Reports the cost of manufactured products.
- Calculation Rule: The unit cost for a product instance is calculated as (Total Material Cost + Conversion Cost) / (Count of PASSED_QC instances).

Cost Calculation & Absorption Rules for products:

- Cost Accumulation: The manager inputs the Labor Cost and Overhead Cost (which sum up to the Conversion Cost) before a Work Order moves to COMPLETED. These fields cannot be edited once the Work Order is COMPLETED.
- Component Cost Calculation:
  - The system identifies every ComponentLot consumed by the Work Order via the MaterialRequest.
  - For each lot, it fetches the unit price from the original PurchaseOrderDetail.
  - Total Material Cost = Sum of (Issued Quantity x Lot Unit Price).
  - The system calculates the BatchTotalCost by summing the Conversion Cost with the Total Material Cost.
- Unit Cost Attribution (Absorption Model):
  - The unit production cost on individual instances remains NULL while they are PENDING_QC.
  - The Trigger: Once the system detects that all instances in a ProductionBatch have received a QC result (PASSED_QC or FAILED_QC), the calculation fires automatically. (Assumption: The business enforces that 100% of generated instances will eventually be checked).
    - Unit Cost = (BatchTotalCost) / (Count of PASSED_QC instances). Note: Any fractional cent drift due to rounding is accepted and not reconciled.
    - Zero Yield Guard: If yield is 0 (all units failed), the Final Unit Cost is not calculated for individual instances. The BatchTotalCost is recorded as a total production loss explicitly on the Work Order.
    - The system performs a bulk update where PASSED_QC instances receive the Final Unit Cost.
    - FAILED_QC instances receive a cost of 0 (the good units have absorbed their cost as a production loss).
- Drift Prevention: Once the unit production cost is saved to the ProductInstance, it becomes a Frozen Snapshot. Any future changes to component prices or Bill of Materials will not affect the historical cost of these specific units.
- Traceability: Because the cost is linked to specific lots and Purchase Orders, the Production Manager can audit the exact financial source of any finished unit.

(Note for implementation: New schema fields will be required on `WorkOrder` such as `laborCost`, `overheadCost`, `totalMaterialCost`, and `totalProductionCost` to support this frozen snapshot).

---

## Production Line Performance Reporting

- Report on the performance of physical production lines over any given time period (from date to date).
- Required Metrics: The report must aggregate total production output, broken down by specific finished products for each production line.
- Quality Breakdown: For the total quantity produced, the system must separate the count of units that passed quality control (Good) versus those that failed (Defective).
- Critical Business Edge Cases:
  - Timezone Boundaries: Date ranges selected by the user in local time must be accurately mapped to the system's underlying UTC timestamps. Failure to do so will cause shift data to leak into incorrect reporting days.
  - Orphaned Production: Any units manufactured from batches or work orders that lack an explicitly assigned production line must not be silently excluded. They must be grouped under an "Unassigned" category to ensure factory-wide totals remain accurate.

---

## Product Lifecycle Traceability

Sales Staff/Customers:
- When looking up a barcode for a finished product or semi-finished product, the system must provide full information about the product's lifecycle (product line, order requirements, production line, batch/lot, inventory history, production cost, etc.).


---

## Warehouse

The system has three types of warehouse:

- COMPONENT warehouse for storing components
- SALES warehouse for storing PASSED_QC items
- ERROR warehouse for storing FAILED_QC items

---

## Transfer Request (Warehouse-to-Warehouse)

This covers standalone stock transfers between warehouses for both components and products. These are not linked to Work Orders or Production Requests.

- An employee creates a TransferRequest specifying source warehouse, target warehouse, and line items
- entityType distinguishes COMPONENT (from Component warehouse) or PRODUCT (from Sales warehouse)
- Both sourceWarehouseId and targetWarehouseId are mandatory — this is a relocation, not a consumption
- Request starts in PENDING, awaiting for the truck driver to deliver
- On delivery, the receiving warehouse staff must physically scan the exact items arriving:
  - If COMPONENT: Scan the specific Internal Lot Label barcodes to record which exact lots were moved.
  - If PRODUCT: Scan the specific Serial Number (SN) barcodes to record which exact product instances were moved.
- Once scanned and submitted, the request moves to COMPLETED, an InventoryTransaction(type: TRANSFER) is created, and the warehouseId on those specific lots/instances is updated.
- TransferRequest statuses:
  - PENDING: awaiting delivery
  - COMPLETED: delivered, exact lots/instances scanned and moved




