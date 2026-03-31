> [!CAUTION]
> **OUTDATED (2026-03-17):** This document predates the MTS-only pivot. 
> The source of truth is now [docs/05_mts_dispatch_flows.md](cci:7://file:///d:/program/mes-mini/docs/05_mts_dispatch_flows.md:0:0-0:0).
> This file will be revised. Do NOT use it for implementation decisions.

# Production Request: Business & Technical Logic (SSOT)

> **Feature:** Production Request
> **Role:** Single Source of Truth (SSOT) for the "How and Why" of the Production Request module.
> **Audience:** Backend Developers, Architects, and AI Agents.

---

## 1. The Core Philosophy
Production Requests (PR) act as the **Buffer Zone** between Customer Demand (Sales) and Factory Execution (Work Orders). We do not automate creation; we provide the data for a Manager to decide.

---

## 2. The "Traffic Light" System (State Machine)

The system calculates feasibility in two phases to optimize performance.

### Phase 1: The Fast Check (Dashboard Load)
To avoid N+1 query bottlenecks, the **Warehouse Dashboard** provides a real-time aggregate of:
*   **🟢 GREEN (Above Safe Stock):** `Finished Goods >= minStockLevel`.
*   **🔴 RED (Low Stock Alert):** `Finished Goods < minStockLevel`.
    *   *Action:* Production Manager creates a **Production Request** based on these alerts.

### Phase 2: The Deep Check (On-Demand)
The **Production Dashboard** shows existing pending requests. Before creating a new one, the PM triggers a BOM feasibility check.
*   **🟡 YELLOW (Capable to Promise):** `Component Stock` sufficient for production.
    *   *Action:* Manager clicks **"Request Production"** -> Status becomes `APPROVED`.
*   **🔴 RED (Material Shortage):** `Component Stock` insufficient.
    *   *Action:* Manager clicks **"Request Production"** -> Status becomes `WAITING_MATERIAL`.

### Other States
*   **🔵 BLUE (Make-to-Stock / MTS):** A PR created without a `SalesOrderId`. Used for replenishment.
*   **🟣 PARTIALLY_FULFILLED:** When some Work Orders are linked but the full quantity isn't yet in production.

---

## 3. Backend Logic: The "How & Why"

### A. MTO vs. MTS Logic
We support both **Make-to-Order** (linked to `soDetailId`) and **Make-to-Stock** (independent).
*   **Why?** Small factories often combine small customer orders with extra "buffer" stock to fill a production batch efficiently.
*   **Constraint:** An MTO PR is strictly locked to its Sales Order line item to ensure traceability.

### B. Atomic ID Generation (`PR-YYYYMMDD-XXXX`)
PR codes are generated using a Date-based prefix and a random 4-digit suffix.
*   **Engineering Note:** To prevent race conditions during high-volume creation, the service uses a **Retry Loop (3 attempts)**. If a `P2002` unique constraint error occurs on the `code` field, it regenerates and retries.

### C. The MRP "Lazy" Check
The `createRequest` method runs `MrpService.calculateRequirements` **before** database insertion.
*   **Why?** We want the status (`APPROVED` vs `WAITING_MATERIAL`) to be deterministic at the moment of creation.
*   **Concurrency Trap:** Between the "Check" and the "Save," stock could be taken by another user. We use database transactions to ensure that if a request is `APPROVED`, it has a valid claim on components at that microsecond.

### D. Partial Fulfillment & Split Batches
A single `ProductionRequest` can be fulfilled by multiple `WorkOrders`.
*   **Data Model:** Tracked via the `WorkOrderFulfillment` junction table.
*   **Naming Convention:** We use `AllocatedQuantity` in the `ComponentStock` table. This represents components "earmarked" for a Work Order that haven't physically left the warehouse yet.

---

## 4. Architectural Gotchas (Technical Reference)

> [!IMPORTANT]
> **Separation of Creator/Approver:** For Sales Orders, the creator cannot approve. However, for **Production Requests**, we allow the Production Manager to both create and "Approve" (by releasing to WO) because speed is prioritized over financial audit in the shop-floor loop.

### Race Condition Mitigation
In `SalesOrderService.approveSO`, we use a **Hard Stock Reservation (FIFO)**. 
- Specific `SerialNumbers` (ProductInstances) are tagged with the `salesOrderId` immediately.
- This prevents a common MES bug where two salesmen "see" the same 1 remaining unit and both promise it to different customers.

### Missing API Gaps
*   **Serial Picker:** Currently, the frontend lacks an endpoint to query *available* serial numbers reserved for a specific SO.
*   **Wastage Buffer:** The current BOM explosion assumes 100% yield. In electronics (SMT), we should eventually add a `% Wastage` factor to raw material requirements.

---

## 5. BOM Structure Constraints

> [!WARNING]
> **Component-Only BOM Policy:** In this system, a Bill of Materials (BOM) strictly consists of **Components** (`Component` entity) only. 

*   **No Nested Products:** You **cannot** add a `Product` as a component of another `Product`.
*   **Architectural Reason:** To maintain simplicity in our "Lite MES," we differentiate between "Raw Materials/Components" (which are purchased and stored in boxes/lots) and "Finished Goods" (which are assembled onto serializers). 
*   **Database Enforcement:** The `bill_of_materials` table schema only permits a `productId` to `componentId` relationship.

If a product requires another assembly, that assembly must be defined as a **Component** in the system if it is managed as a stockable raw material, or the production flow must be flattened.

---

## 6. BOM Snapshotting — The Frozen Contract

> [!IMPORTANT]
> **Implemented 2026-03-12.** This is one of the most critical architectural decisions in the system. Read this before touching any PR-related service.

### The Problem It Solves
Before snapshotting, `ProductionRequest` calculated material requirements dynamically from the live `BillOfMaterial` table. If an engineer edited the BOM *after* a PR was created (e.g., swapping Component A for Component B), the shop floor would receive a **phantom shortage** on a PR that was already committed. This is a classic MES data integrity failure.

### The Solution: Freeze at Creation Time
When a `ProductionRequest` is created, the MRP result is **atomically persisted** into the `ProductionRequestDetail` table. This "frozen snapshot" becomes the immutable contract for that PR's lifecycle.

```
bill_of_materials (live, editable)
       │
       │ read ONCE at PR creation
       ▼
production_request_details (frozen, immutable per PR)
       │
       ├── recheckFeasibility()
       ├── draftPurchaseOrder()
       ├── calculateForRequest() / GET /:id/requirements
       └── materialRequestService.createFromWorkOrder()
```

### Rule: Which Function Reads What

| Function | Reads From | Reason |
|---|---|---|
| `createRequest` | Master `BillOfMaterial` | Once only — to create the snapshot |
| `recheckFeasibility` | `ProductionRequestDetail` (snapshot) | Must honour original commitment |
| `draftPurchaseOrder` | `ProductionRequestDetail` (snapshot) | Shortages relative to original commitment |
| `calculateForRequest` | `ProductionRequestDetail` (snapshot) | Live MRP view of an existing PR |
| `createFromWorkOrder` | `ProductionRequestDetail` (snapshot) | Uses `fulfillment.quantity × detail.quantityPerUnit` aggregation |
| `calculateRequirements` | Master `BillOfMaterial` | Generic planning tool — no PR context |

### Aggregation Formula for Material Requests
A Work Order can fulfill multiple PRs. When creating a `MaterialExportRequest`, the quantity per component is:
```
qty = Σ (fulfillment.quantity × snapshot.quantityPerUnit)  grouped by componentId
```
This correctly scopes materials to the WO's partial fulfillment, not the full PR total.

### Graceful Fallback (Legacy Data)
PRs created before snapshotting was implemented have no `ProductionRequestDetail` rows. Both `mrpService.calculateFromSnapshot()` and `materialRequestService.createFromWorkOrder()` detect this (empty `details` array) and fall back to master BOM, so existing data is not broken.

### Implementation Reference
- **Migration:** `20260312050436_add_pr_details`
- **Schema model:** `ProductionRequestDetail` in `schema.prisma`
- **Key method:** `mrpService.calculateFromSnapshot(prId)` in `mrpService.ts`
- **Full record:** `docs/features/production_request/03_bom_snapshotting.md`
