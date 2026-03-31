# Module Relationships & Cardinality (Pure MTS Model)

> [!WARNING]
> **Updated 2026-03-17** to reflect the MTS (Make-to-Stock) architectural pivot. All MTO demand-linking concepts have been removed.

This document defines the core relationships between the primary modules of the MES. It describes how entities relate to each other in terms of cardinality (1:1, 1:N, M:N) and **why** each relationship was designed this way.



---

## Core Philosophy: Production is Customer-Blind

In a pure MTS system, the factory floor has **no knowledge** of customers or sales orders. The system is split into two independent sides that connect only through shared inventory:

- **Production Side:** Production Request → Work Order → Production Batch → Product Instance → QC → Inventory
- **Sales Side:** Sales Order → Dispatch (scan Serial Numbers out of inventory) → Warranty

These two sides share the **Inventory Pool** (finished goods in the Sales Warehouse), but have **no direct FK relationship** between Sales Orders and Production Requests.

---

## 1. SalesOrder ↔ ProductionRequest
**Cardinality:** None (Decoupled in MTS)

- `ProductionRequest.soDetailId` exists in the schema as a **nullable FK** but is **always `null`** in the current system.
- Sales Orders do not create, trigger, or link to Production Requests.
- Production Requests are created purely from internal stock replenishment decisions.

**Why this design:**
In ISA-95 architecture, customer demand planning is Level 4 (ERP). The MES (Level 3) should be "customer-blind." For small Vietnamese factories that cannot afford a separate ERP, the Sales Order acts as a lightweight dispatch record inside the MES, but it never crosses into the production domain.

**The column is kept for future MTO extensibility** — if the factory grows and wants to link customer orders directly to production, the FK is already there. No schema migration needed.

---

## 2. SalesOrder ↔ ProductInstance
**Cardinality:** One-to-Many (1:N from SO to ProductInstance)

- 1 `SalesOrder` can have 0 or many `ProductInstance` records linked to it.
- 1 `ProductInstance` can belong to **0 or 1** `SalesOrder`.
  - **0 Case:** Product is still in the warehouse (`IN_STOCK`), not yet dispatched.
  - **1 Case:** Product has been scanned out for a dispatch order (`SHIPPED`).

**When the link is created:** ONLY at shipping time (dispatch). When a warehouse worker scans a barcode against a Sales Order, the system sets the `salesOrderId` on that `ProductInstance`. This means "this unit was dispatched with this order" — it has **no production-chain meaning**.

**Why this design:**
The Sales Order needs to know exactly which Serial Numbers were shipped (for invoicing, warranty, and traceability). But the link is established at the very end of the product lifecycle, not during production.

---

## 3. ProductionRequest ↔ PurchaseOrderDetail
**Cardinality:** One-to-Many (1:N from PR to PODetail, via optional FK)

- 1 `ProductionRequest` can have 0 or many `PurchaseOrderDetail` records linked to it.
  - **0 Case:** All required components are already in stock. No new purchasing needed.
  - **Multiple Case:** A PR requires components from multiple suppliers, resulting in multiple PO lines.
- 1 `PurchaseOrderDetail` links to **0 or 1** `ProductionRequest`.
  - **0 Case (General Stock):** PM buys components for general warehouse replenishment (volume discounts, maintaining minimum stock levels). No specific PR attached.
  - **1 Case (Expedited):** PM creates a PO specifically because a PR is blocked on `WAITING_MATERIAL`. The PO Detail is hard-linked to that PR to track the dependency.

**Why this design:**
By keeping the PO Detail → PR link as `0..1`, we avoid complex fractional allocation logic. A PO line is either "for general stock" or "for one specific blocker." The warehouse inventory pool handles the distribution of shared resources.

**Known MVP Limitation (Supplier MOQ):** Because a PO Detail can only link to 0 or 1 PR, the system cannot group urgent material needs from multiple PRs into one PO line. If two PRs urgently need the same component and the supplier has a Minimum Order Quantity, the planner must create two separate PO Details — potentially over-purchasing. The workaround: create one PO Detail with `null` PR link (general stock). This is an accepted trade-off for MVP simplicity.

---

## 4. ProductionRequest ↔ WorkOrder
**Cardinality:** Many-to-Many (M:N via `WorkOrderFulfillment` junction table)

- 1 `ProductionRequest` can be fulfilled by 1 or more `WorkOrder` records.
  - *Example: 1 PR for 2,500 phones is split into 5 daily WOs of 500 each to match factory capacity.*
- 1 `WorkOrder` can fulfill 0 or more `ProductionRequest` records **(of the same product only)**.
  - *Example (Multiple): 1 WO for 1,000 Red Phones fulfills PR-100 (500) and PR-101 (500) simultaneously to save setup time.*
  - *Example (Zero): The factory runs a WO to build buffer stock with no specific PR attached.*

**Hard Constraint:** A `WorkOrder` produces exactly ONE product type. You cannot combine PRs for different products (Red Phone + Blue Phone) into a single WO, even if they share the same assembly line.

**`WorkOrderFulfillment.quantity` Semantics:**
The `quantity` on the junction table is the **planned/allocated** amount — how many units this WO *intends* to produce for a given PR. It is NOT retroactively updated when QC fails units.

- **Actual good output** = count of Product Instances from this WO that passed QC.
- **If a WO produces fewer good units than planned** (e.g., 488 out of 500 due to QC failures), the shortfall is absorbed by the lowest-priority PR (or the most recently created PR if priorities are equal).
- **Floor fulfillment rule:** Workers scan Serial Numbers against PRs by Priority (HIGH → MEDIUM → LOW), then FIFO (oldest `createdAt`). First PR to reach its target = `FULFILLED`; last PR absorbs any shortfall and stays `PARTIALLY_FULFILLED`.

---

## 5. WorkOrder ↔ ProductionBatch ↔ ProductInstance
**Cardinality:**
- 1 `WorkOrder` → 1 or more `ProductionBatch`
- 1 `ProductionBatch` → 0 or more `ProductInstance` (Serial Numbers)

A Work Order can have multiple batches (e.g., different production dates or different line assignments). Each batch groups the Serial Numbers produced together with a shared batch code, production date, and expiry date.

Each `ProductInstance` (Serial Number) belongs to exactly 1 batch and therefore exactly 1 Work Order. This is the anchor for manufacturing genealogy.

---

## 6. ProductInstance ↔ QualityCheck
**Cardinality:** One-to-Many (1:N from ProductInstance to QualityCheck)

- 1 `ProductInstance` can have multiple `QualityCheck` records (e.g., multiple checklist types: visual inspection, functional test).
- 1 `QualityCheck` belongs to exactly 1 `ProductInstance`.

**Current Policy (Scrap-Only):** FAIL = SCRAPPED. No rework. The `NEEDS_REWORK` enum value exists for future extensibility but is not used in the current system.

---

## 7. ProductInstance ↔ Warranty
**Cardinality:** One-to-One (1:1)

- 1 `ProductInstance` has 0 or 1 `Warranty` (activated by end customer after purchase).
- 1 `Warranty` belongs to exactly 1 `ProductInstance`.

Warranty can only be activated on a product that has status `SHIPPED` (meaning it went through a Sales Order dispatch).

---

## How Traceability Works in MTS

Since Production and Sales are decoupled, traceability uses two **independent chains** that are joined only at the `ProductInstance` level:

### Chain A: Manufacturing Genealogy ("How was it made?")
```
Component (via BOM) → MaterialRequest → WorkOrder → ProductionBatch → ProductInstance
```
This chain answers: What components went into this product? Which Work Order? Which batch? Which production line? When was it made?

### Chain B: Commercial Assignment ("Who got it?")
```
ProductInstance → SalesOrder → Agent
```
This chain answers: Which Agent received this product? When was it shipped? At what price?

> [!IMPORTANT]
> These two chains are **completely independent**. Chain B is established via a direct FK set at shipping time — NOT by traversing the production/fulfillment layers. This is what makes the system "customer-blind" on the factory floor.

### Forward Trace (Recall Scenario)
```
Defective Component Lot → MaterialRequest → WorkOrder → ProductInstance (Serial Numbers)
  → (direct FK, set at shipping) → SalesOrder → Agent → identify impacted products
```

### Reverse Trace (Root Cause Analysis)
```
ProductInstance (Serial Number) → ProductionBatch → WorkOrder
  → MaterialRequest → Component → PurchaseOrderDetail → Supplier
```

---

## Summary Table

| Relationship | Cardinality | Status in MTS |
|---|---|---|
| SalesOrder ↔ ProductionRequest | None (FK exists but always null) | Decoupled |
| SalesOrderDetail → ProductInstance | 1:N | 🔜 Future (currently FK is at SO level, migration planned to SODetail level) |
| ProductionRequest ↔ PurchaseOrderDetail | 1:N (optional FK) | Active |
| ProductionRequest ↔ WorkOrder | M:N (via junction table) | Active |
| WorkOrder → ProductionBatch | 1:N | Active |
| ProductionBatch → ProductInstance | 1:N | Active |
| ProductInstance → QualityCheck | 1:N | Active |
| ProductInstance → Warranty | 1:1 | Active |
| WorkOrder → MaterialExportRequest | 1:N | Active |
