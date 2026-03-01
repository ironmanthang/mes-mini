# Production Request Logics & Use Cases (Implemented)

> **Context:** Small Electronics Manufacturing (5-50 staff).
> **Goal:** High flexibility but strict traceability (Component -> Finished Good).

## 1. The "Manual Dashboard" Workflow (Your Vision)
You are absolutely correct. For a small shop, the "Command Center" is the **Sales Order Dashboard**.

### The "Traffic Light" Logic
When a Manager looks at a Sales Order, the system uses a two-phase check to show status lights, preventing dashboard performance issues while still giving immediate visibility.

#### Phase 1: The Fast Check (On Dashboard Load)
When the dashboard loads, the system quickly checks only the `Finished Goods Inventory` against the `Order Qty`.
1.  **🟢 Green (ATP - Available to Promise):**
    *   *Condition:* `Finished Goods Inventory >= Order Qty`.
    *   *Action:* Warehouse Manager clicks **"Create Shipment"**.
    *   *Result:* Items are picked and shipped.
2.  **⚫ Gray (Unchecked / Needs Production):**
    *   *Condition:* `Finished Goods Inventory < Order Qty`.
    *   *Meaning:* We cannot ship immediately. The heavy BOM explosion is deferred until the user explicitly requests it (Lazy Evaluation).
    *   *Action:* Production Manager clicks **"Check Feasibility"**.

#### Phase 2: The Deep Check (On Demand)
When the user clicks "Check Feasibility" on a Gray order, the system explodes the BOM and checks `Component Stock`.
3.  **🟡 Yellow (CTP - Capable to Promise):**
    *   *Condition:* `Component Stock` is sufficient to build the missing quantity.
    *   *Action:* Manager clicks **"Request Production"** -> Auto-converts to **"Create Work Order"**.
    *   *Result:* Operations team starts building.
4.  **🔴 Red (Material Constraint):**
    *   *Condition:* `Component Stock` insufficient.
    *   *Action:* Button says **"Material Shortage"**.
    *   *System Response:* Clicking it shows the missing parts list -> "Draft Purchase List".
    *   *Result:* Purchasing team buys parts.

### The "Smart Button" Logic (Hybrid Fast-Path)
To balance performance (avoiding N+1 BOM explosions) with immediate Warehouse visibility, the dashboard uses an **On-Demand (Lazy Evaluation) approach** for Capable-to-Promise (CTP) checks:

| Dashboard State | Condition | Button Label | Action |
| :--- | :--- | :--- | :--- |
| **Initial Load** | **Result: Green** (`🟢 Green`) | `[Create Shipment]` | Sufficient Finished Goods. Reserves & Ships. |
| **Initial Load** | **Unchecked** (`⚫ Gray`) | `[Check Feasibility]` | Finished Goods missing. User manually triggers CTP BOM analysis. |
| **After Check** | **Result: Yellow** (`🟡 Yellow`) | `[Start Production]` | Sufficient Components. Creates PR -> Auto-converts to Work Order. |
| **After Check** | **Result: Red** (`🔴 Red`) | `[Material Shortage]` | Insufficient Components. Shows missing parts list -> "Draft Purchase List". |

> **Correction on your thought:** You generally don't click "Purchase Order" directly from a Sales Order.
> *   *Why?* A Sales Order asks for a **Laptop**. A Purchase Order buys **Screws & Screens**.
> *   *The Bridge:* You click "Request Production" first. The System explodes the BOM, realizes you need Screws, and *then* helps you create the Purchase Order for the Screws.

---

## 2. Core Use Case Flows

### UC-1: The "Hole in the Bucket" (Standard Make-to-Order)
*   **Trigger:** Sales Order `SO-101` (100 units) -> Shortage detected.
*   **Action:** Manager clicks "Create PR".
*   **System Logic:**
    1.  **Bom Explosion:** 100 Units = 100 PCBs + 500 Resistors + 100 Displays.
    2.  **Inventory Check:** We have 50 PCBs, 1000 Resistors, 0 Displays.
    3.  **Result:** PR Created (Status: `PENDING_MATERIAL`).
    4.  **Supply Chain:** Purchase Order created for 50 PCBs + 100 Displays.
    5.  **Completion:** Goods Arrive -> PR Status `READY` -> Converted to Work Order `WO-101`.

### UC-2: The "Safety Stock" (Make-to-Stock / Forecast)
*   **Context:** You know you sell 50 "Standard Power Modules" every month. You don't wait for a Sales Order.
*   **Trigger:** Manual Creation by Manager.
*   **Action:** Create PR for 50 Units (No `SalesOrderId` link).
*   **System Logic:** Same BOM Check.
*   **Differentiation:** These units enter `Finished Goods Inventory` as "Free Stock," ready to be snatched by the next incoming Sales Order.

### UC-3: The "Starved Run" (Partial Fulfillment) ⚡ *Critical for Electronics*
*   **Context:** You need 1000 units. You have parts for 400. The customer is screaming for *anything*.
*   **Action:** Manager views PR (Qty: 1000). System says "Feasible: 400".
*   **Decision:** Manager clicks "Create WO for Available Quantity (400)".
*   **Result:**
    *   `WO-101` Created for 400 units (Status: `RELEASED`).
    *   PR Status: `PARTIALLY_FULFILLED` (Remaining: 600).
    *   Inventory: 400 sets of parts are **Soft Reserved** or **Hard Allocated** immediately.

### UC-4: The "Prototype Run" (NPI - New Product Introduction)
*   **Context:** R&D wants to build 5 units of a new version `v2.0` to test.
*   **Constraint:** The BOM might not be finalized (or components are "hand-soldered" / bypass standard stock).
*   **Action:** Create PR with Type `PROTOTYPE`.
*   **System Logic:**
    *   **Bypass Strict Stock Check?** Maybe allow "Force Release" even if stock is 0 (assuming engineers have parts in their pockets).
    *   **Traceability:** Still requires serial numbers (`PROTO-001`) but costing might be assigned to "R&D Budget" instead of "COGS".

### UC-5: The "Sub-Assembly" Feeder
*   **Context:** Product A is made of Sub-Assembly B + Case C.
*   **Logic:**
    *   PR for Product A (100 units) is created.
    *   **BOM Check:** Needs 100 Sub-Assembly B.
    *   **Shortage:** We have 0 Sub-Assembly B.
    *   **Recursion:** System suggests creating a *Child PR* for 100 Sub-Assembly B.
    *   *Note for MVP:* Keep it simple. Just treat Sub-B as a "Buy" item or manually create the second PR. Don't over-automate recursion yet.

---

## 3. Data Flow & State Machine (FINALIZED)

### Production Request Statuses
| Status | Meaning | Next Step |
| :--- | :--- | :--- |
| **APPROVED** | BOM check passed. All components available. Ready for Work Order. | `PARTIALLY_FULFILLED` / `FULFILLED` |
| **WAITING_MATERIAL** | BOM check found shortage. PO needed. | `APPROVED` (manager clicks "Re-check Feasibility") |
| **PARTIALLY_FULFILLED** | Some WOs created, but not all qty covered. | `FULFILLED` |
| **FULFILLED** | All requested qty has been converted to WOs. | (terminal) |
| **CANCELLED** | Aborted. | (terminal) |

> **Removed statuses:** `DRAFT` (no drafting phase), `PENDING` (BOM check is instant — runs at creation), `REJECTED` (no management approval gate for MVP).

### State Transitions
```
Create PR → (instant BOM check) → APPROVED or WAITING_MATERIAL
WAITING_MATERIAL → (Re-check) → APPROVED
APPROVED → (Create WO) → PARTIALLY_FULFILLED or FULFILLED
PARTIALLY_FULFILLED → (Create more WOs) → FULFILLED
Any active state → CANCELLED
```

---

## 4. Key Decision Points (DECIDED)

### Q1. The "Soft Allocation" Problem
**Decision:** Explicit Allocation via `allocatedQuantity` on `ComponentStock`.
*   `available = quantity - allocatedQuantity`
*   Allocation happens at **Work Order creation**, not PR creation.
*   Race conditions solved via DB transactions with `FOR UPDATE` row locks.
*   **Forced Conversion: NO (MVP).** No negative inventory allowed. If the boss needs to override, use `ADJUSTMENT` inventory transaction as escape hatch.

### Q2. The "Wastage" Buffer
**Decision:** **Skipped for MVP.** Use raw BOM quantities.
*   `quantityNeeded` in `BillOfMaterial` is already `Decimal(10,4)` — can encode small buffers directly if needed.
*   Future upgrade: Add `wastagePercent` column to `BillOfMaterial`.

### Q3. "Kitting" vs "Line Side"
**Decision:** **Logical deduction only (MVP).** Deduct components at WO release via `EXPORT_PRODUCTION` inventory transactions. No physical kitting list in the system.

---

## 5. PR-to-SO Linkage (FINALIZED)

*   PR links to `soDetailId` (specific SO line item), **not** `salesOrderId` (SO header).
*   One active PR per `soDetailId` (system enforced).
*   MTS (Make-to-Stock) requests have `soDetailId = null`.
*   PR quantity is auto-populated from shortage calculation (orderedQty - finishedGoods).

## 6. PO-to-PR Linkage (FINALIZED)

*   `PurchaseOrderDetail` has `productionRequestId` FK (informational, many-to-one).
*   PO creation from PR: System pre-fills shortage components, manager picks supplier/price.
*   `[Create Purchase Order]` button only visible when PR status = `WAITING_MATERIAL`.

---

> **📋 Full Implementation Plan:** See [production_request_implementation_plan.md](file:///d:/program/mes-mini/ai_context/docs/production_request_implementation_plan.md)
