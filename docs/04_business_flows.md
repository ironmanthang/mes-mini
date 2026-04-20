# Lite MES: Complete Business Flows

> [!WARNING]
> This document describes a **pure MTS (Make-to-Stock)** system. Sales Orders are **Dispatch Records only**. Production never knows about any customer or agent.

> [!IMPORTANT]
> This document is intentionally **schema-agnostic**. It describes the business logic and scope only. Database implementation may change independently.

---

## How The System Works (Big Picture)

```
WAREHOUSES (Supported multiple via WarehouseType, 3 Types):
  Component Warehouse (Kho linh kiện) — raw materials from suppliers
  Sales Warehouse (Kho kinh doanh) — QC-passed finished goods, ready to sell
  Error Warehouse (Kho lỗi) — defective products, scrapped, never reused

> [!IMPORTANT]
> **MVP Constraints (Strict Origin/Destination Rules):** To support multiple warehouses of the same type without catastrophic complexity, **Split-Routing is strictly forbidden**. Every operation (PO, WO, QC, Dispatch) must explicitly target ONE `warehouseId`. If a requirement exceeds stock in one location, humans must perform an Internal Transfer first. The software pushes complexity to physical operations.

PRODUCTION SIDE (Customer-Blind):
  Dashboard shows low stock → PM creates Production Request → Work Order → Factory produces → QC → Passed goods to Sales Warehouse

SALES SIDE (Dispatch Only):
  Agent calls → Sales staff creates Sales Order → Manager approves → Warehouse scans barcodes → Goods shipped

THE TWO SIDES NEVER TOUCH EACH OTHER.
They connect ONLY through the shared INVENTORY POOL (finished goods in the Sales Warehouse).
```
```
1. Agent calls              → Sales Staff creates SO (DRAFT)
2. SO submitted             → Manager approves (APPROVED)
3. Warehouse tries to scan  → Only 19 available, scans 19 (IN_PROGRESS, 19/100)
   ─── THE WAIT BEGINS ───
4. Dashboard (UNRELATED!)   → PM sees: "Red Phone stock = 0" ⚠️
5. PM creates PR            → "Make 500 Red Phones for stock"
6. BOM feasibility check    → "Need 500 Batteries, only have 200" ⚠️
7. PM creates PO            → "Buy 500 Batteries from Supplier B"
   ─── WAIT FOR SUPPLIER ───
8. Supplier delivers        → Warehouse receives Batteries
9. PM creates WO            → "Produce 500 Red Phones on Line Alpha"
10. Line Lead requests materials → Warehouse issues components
11. Workers produce         → 500 Serial Numbers scanned (WIP)
12. QC inspects immediately  → 488 PASS → Sales Warehouse, 12 FAIL → Error Warehouse (scrapped)
    ─── STOCK REPLENISHED ───
13. Warehouse opens pending SO → Scans remaining 81 phones
14. SO auto-completes       → Agent A gets their order (100/100)

```
---

## Flow 1: Sales Order — Dispatch to Agent (Phiếu xuất kho)

**Purpose:** Record the dispatch of finished goods from the Sales Warehouse (Kho kinh doanh) to an Agent (Đại lý).

### Happy Path (Enough Stock)
1. **Sales Staff** creates a Sales Order for Agent A: "100 Red Phones at 5,000,000 VND each."
2. **System** checks finished goods inventory in the **Sales Warehouse**: 500 available → ✅ No shortage.
3. **Sales Staff** submits for approval.
4. **Manager** approves the order.
5. **Warehouse Worker** begins preparing the shipment (System checks for available `IN_STOCK` items).
6. **Warehouse Worker** scans 100 Red Phone barcodes (QR from Mobile App).
   - Each scan marks that specific phone as **SHIPPED** and links it to this Sales Order.
   - Each scan creates an inventory movement record (goods leaving the Sales Warehouse).
7. **System** detects all items shipped (100/100) → auto-marks the Sales Order as **COMPLETED**.

### Shortage Path (Not Enough Stock)
1. Same as above, but system shows: "Required: 100, Available: 19 → ⚠️ Shortage Warning."
2. **The warning is informational only.** It does NOT block approval. Manager may approve knowing production is underway.
3. Warehouse Worker scans the **19 available** phones. The order stays **IN_PROGRESS** (19/100 shipped).
4. The order waits. No automatic action.
5. Once the factory produces more phones and QC passes them into the Sales Warehouse, the Warehouse Worker opens the pending order and scans the remaining **81** phones.
6. Order auto-completes (100/100).

### Status Lifecycle
```
DRAFT → PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED
Any state → CANCELLED
```

> [!IMPORTANT]
> **No Soft Allocation:** This system adopts a "Physical First" approach. Approving a Sales Order does NOT reserve stock in the database. Stock is only "consumed" when a barcode is physically scanned during shipping. If two orders target the same limited stock, the first one to be scanned wins. Humans must prioritize shipments manually.

> [!IMPORTANT]
> **Concurrency Rule:** When scanning barcodes, the system must ensure the same phone cannot be assigned to two different Sales Orders simultaneously (transaction lock).

---

## Flow 2: Production Request (Đơn yêu cầu sản xuất nội bộ)

**Purpose:** Internal decision to replenish finished goods stock. Always created manually by the Production Manager. Never linked to any Sales Order.

### Steps
1. **Production Manager** sees low finished goods stock and current pending Sales Orders on the Dashboard.
2. Based on business judgment, creates a Production Request: "Need 500 Red Phones for stock."
3. **System** provides proactive decision support via technical APIs:
   - **Context (`GET /api/products/:id/production-context`)**: Shows Current Stock, Min Level, and Pending Sales Demand to suggest an optimal production quantity.
   - **Live Feasibility (`POST /api/products/:id/production-feasibility`)**: Performs a real-time BOM explosion and checks component availability across all warehouses *before* the request is saved.
4. **Logic**:
   - If components are sufficient → PR becomes `PENDING` and awaits approval.
   - If components are insufficient → PR is flagged as **WAITING_MATERIAL**. PM must procure components first (Flow 3).
5. Once materials are ready and the PR is approved, Work Orders can be created and completed, and the PR transitions through its lifecycle.

### Status Lifecycle
```
DRAFT → PENDING → APPROVED
      → WAITING_MATERIAL → PENDING
APPROVED → PARTIALLY_FULFILLED → FULFILLED
Any state → CANCELLED
```

### Key MTS Rules
- **No link to Sales Orders.** The PR is purely internal — the factory floor has no idea why it's making phones.
- **The PM decides quantity based on business judgment**, not on any specific customer demand.
- One PR can be fulfilled by **multiple Work Orders** (e.g., split into batches).

---

## Flow 3: Purchase Order — Procurement (Đơn đặt hàng linh kiện)

**Purpose:** Buy raw materials (components) from Suppliers to replenish the Component Warehouse.

### Steps
1. **Production Manager** identifies a component shortage (from Dashboard or from Flow 2's feasibility check).
2. Creates a Purchase Order for Supplier B: "500 Batteries at 50,000 VND each."
3. Submits for approval → **Manager** approves.
4. **PO is sent to the Supplier** (assigned official code, status = ORDERED).
5. **Supplier delivers goods** (may arrive in multiple physical boxes). 
6. **Warehouse Clerk / Receiver** performs a "Physical-First" receipt using a mobile phone:
    - Scans boxes and enters the quantity for each (e.g., 5 boxes of 50 units).
    - **System** generates unique internal `lotCode`s (e.g., `LOT-260331-001`) for **each physical box**.
    - **System** provides these codes back to the Receiver to render as QR labels (`qrcode.react`) on the screen.
    - Receiver "slaps" these labels (virtually or physically) on each box.
    - **System** updates component stock and creates an `InventoryTransaction`.
    - **No incoming QC (IQC)** for components.
7. If all ordered quantities are fully received → PO auto-completes.

### Status Lifecycle
```
DRAFT → PENDING → APPROVED → ORDERED → RECEIVING → COMPLETED
PENDING or APPROVED → CANCELLED (cancel)
DRAFT → [deleted] (hard-delete only)
```

> [!NOTE]
> **No automatic PO creation.** When a Material Request or PR shows a component shortage, the system only shows a warning. The PM manually decides whether and how much to order. This avoids ERP-level automation complexity.

---

## Flow 4: Work Order Lifecycle (Lệnh sản xuất)

**Purpose:** Execute production on the factory floor. This is the longest and most complex flow.

### Steps

#### 4.1 Create & Plan
1. **Production Manager** creates a Work Order: "Produce 500 Red Phones on Line Alpha."
2. Links the WO to one or more Production Requests (specifying how many units this WO contributes to each PR).
3. **PM** configures the Production Batch:
   - Batch code prefix and code length.
   - Production date rule (options: current date / WO creation date / warehouse entry date).
   - Expiry date rule (X days after production date; X can be pre-configured per product line).
4. **PM** releases the WO to the floor (makes it visible to Line Leads).

#### 4.2 Material Request (Yêu cầu xuất linh kiện)
5. **Line Lead** creates a Material Request based on BOM × quantity (e.g., 500 Screens, 500 Batteries, 1000 Chips).
6. **Production Manager** approves the Material Request.
7. **Warehouse Clerk** issues the components from the Component Warehouse.
   - Component stock decreases in the Component Warehouse.
   - Materials are now on the production floor.
8. WO moves to **IN_PROGRESS**.

#### 4.3 Production — Create Serial Numbers
9. **Line Lead** prints barcode labels for the batch (Serial Numbers from prefix-0001 to prefix-0500).
10. **Workers** assemble products and scan each barcode into the system.
    - Each scan creates a Product Instance (Serial Number) linked to this WO's batch.
    - Status of each instance: **WIP** (Work In Progress).

#### 4.4 Post-Production
11. **QC Inspector** inspects each Product Instance immediately after assembly (simple Pass/Fail, no rework):
    - **PASS** → Product gets serial barcode printed, enters **Sales Warehouse** directly. Status: **IN_STOCK**.
    - **FAIL** → Product enters **Error Warehouse**. Status: **SCRAPPED**. No further changes.
12. **Line Lead** reports surplus/damaged components:
    - Good surplus → returned to Component Warehouse.
    - Damaged components → sent to Error Warehouse (scrapped).
13. WO is marked **COMPLETED** when all units are QC'd and accounted for.

### Status Lifecycle
```
PLANNED → RELEASED → IN_PROGRESS → COMPLETED → CLOSED
IN_PROGRESS → ON_HOLD → IN_PROGRESS (resumable)
Any state → CANCELLED
```

> [!NOTE]
> **Actual output ≠ planned quantity.** The WO says "make 500," but the actual yield is the count of Product Instances that pass QC. If 12 fail QC, the actual yield is 488.

---

## Flow 5: Quality Control (Kiểm tra chất lượng)

**Purpose:** Gate between the Production Floor and the Sales Warehouse. QC happens **immediately after assembly** — there is no separate Production Warehouse. Only QC-passed products enter the Sales Warehouse.

### Steps
1. **QC Inspector** inspects each Product Instance immediately after assembly on the production floor.
2. For each unit, records: **PASS** or **FAIL** (simple Pass/Fail only, no checklist).
3. **PASS** → Serial barcode printed, Product Instance enters the **Sales Warehouse** directly. Status: **IN_STOCK** (available for sale).
4. **FAIL** → Product Instance enters the **Error Warehouse**. Status: **SCRAPPED**. Its genealogy is locked — no further changes.

### Scrap-Only Policy
- **No rework flow.** Failed = scrapped. Period.
- This massively simplifies the QC module for MVP.
- The QC pass rate (passed / total) feeds into the Dashboard as a KPI.

---

## Flow 6: Inventory Movements Summary

All physical movements of goods are tracked as inventory transactions. Here is the complete map:

> [!NOTE]
> Physical goods move between defined `warehouseId`s. There is no "Production Warehouse" — QC happens on the production floor and products go directly to the assigned Sales or Error warehouse.

| Movement Type | Trigger Flow | From | To | What |
|---------------|-------------|------|----|------|
| Import (PO) | Flow 3 | Supplier | Component Warehouse (Specific ID) | Component lots arriving |
| Export (Production) | Flow 4 | Component Warehouse (Specific ID) | Production Floor | Components issued to WO |
| Import (QC Pass) | Flow 4/5 | Production Floor | Sales Warehouse (Specific ID) | QC-passed finished goods |
| Scrap (QC Fail) | Flow 4/5 | Production Floor | Error Warehouse (Specific ID) | Defective goods (scrapped) |
| Export (Sales) | Flow 1 | Sales Warehouse (Specific ID) | Agent | Finished goods shipped |
| Return In | Flow 4 | Production Floor | Component Warehouse (Specific ID) | Unused components |
| Return Out | Flow 1 | Agent | Sales Warehouse (Specific ID) | Returned products |
| Adjustment | Flow 7 | — | Any Warehouse (Specific ID) | Stocktake corrections |
| Transfer | Flow 11 | Any Warehouse (ID: X) | Any Warehouse (ID: Y) | Internal relocation of stock |

---

## Flow 7: Stocktaking (Kiểm kê)

**Purpose:** Periodic physical count vs. system count reconciliation.

### Steps
1. **PM** creates a Stocktake session for a specific warehouse.
2. **System** pre-fills expected quantities for all items in that warehouse.
3. **Warehouse Staff** physically counts each item and enters the actual quantity.
4. **System** highlights discrepancies (surplus or shortage).
5. **PM** reviews and approves adjustments → system stock is corrected.

---

## Flow 8: Warranty Activation (Bảo hành)

**Purpose:** Post-sale product lifecycle tracking. Activated by the end customer.

### Steps
1. **Customer** buys a Red Phone from Agent A and scans the QR code (via Mobile App or Web).
2. **System** verifies the Serial Number is valid and has been shipped.
3. **System** creates a Warranty record:
   - Start date = activation date.
   - End date = start date + product line's warranty period.
4. Customer can later query the Serial Number to see the product's full lifecycle.

### Traceability Query (Genealogy)
When anyone queries a Serial Number, the system traces:
```
Serial Number: RP-250317-001-0042
├── Product: Red Phone
├── Production Batch: RP-250317-001
│   ├── Production Date: 2026-03-17
│   ├── Expiry Date: 2028-03-17
│   └── Production Line: Line Alpha
├── Work Order: WO-2026-0042
│   └── Production Request: PR-2026-0015 (internal stock replenishment)
├── QC Result: PASSED (Inspector: Nguyen Van B, Date: 2026-03-17)
├── Inventory History:
│   ├── 2026-03-17: Produced → QC Passed → Sales Warehouse
│   └── 2026-03-20: Shipped → Agent A (SO-2026-0008)
├── Sales Order: SO-2026-0008 (Agent A, Price: 5,000,000 VND)
└── Warranty: Active until 2027-03-20 (Customer: Tran Van C)
```

---

## Flow 9: Production Cost Calculation (Chi phí sản xuất)

**Purpose:** Calculate the cost of producing each unit so the Sales team can set profitable prices.

### Steps
1. **PM / Accountant** assigns costs to a Work Order by category (Raw Materials, Labor, Overhead, etc.).
2. **System** calculates: `Unit Cost = Total Costs / Actual Yield` (yield = units that passed QC).
3. Unit cost is stored on each Product Instance for reference.
4. When creating a Sales Order, the Sales team can see the production cost to ensure the sale price covers it (markup).

---

## Flow 10: Role-Specific Dashboards (Báo cáo tổng quan)

**Purpose:** Provide real-time visibility for specific business roles. The Dashboard is split into vertical slices to ensure fast performance and focused data.

### 10.1 Warehouse Dashboard (`GET /api/warehouse/dashboard`)
**Primary Role:** Warehouse Manager / Clerk
- **Finished Goods Stock:** Focuses on "Health Gaps" — lists products below `minStockLevel`. Returns `totalGap` (sum of all missing units) for global context.
- **Component Health:** Ratio of tracked components currently above their safety stock levels, including a `totalGap` sum for procurement planning.
- **Alerts Feed:** Combined list of low-stock products, component shortages, and recent PO receipts.
- **Top-Down Context**: Filtering by `warehouseId` compares local stock against the **Global** `minStockLevel` (Safety stock is a company-wide requirement).
- **Drill-down Utilities**: Complemented by `/inventory/low-stock-details` (unified shortage list) and `/inventory/stock-status` (per-item breakdown).

### 10.2 Sales Dashboard (`GET /api/sales/dashboard`)
**Primary Role:** Sales Staff / Manager
- **Pending Sales Orders:** Total count of orders waiting for stock.
- **Order Details:** Flattened list of pending line items showing Agent, Product, and Shipped/Remaining quantities.

### 10.3 Production Dashboard (`GET /api/production/dashboard`)
**Primary Role:** Production Manager / Line Lead
- **Pending Requests:** Count and list of Production Requests awaiting factory capacity or materials.
- **Production Performance (Future):** Active Work Orders, QC Pass Rate, and Cost per Unit (currently stubbed as `null` in MVP).

---

### Notifications & Alerts
The system monitors these specific triggers even outside the dashboard:
- **Low Stock:** Product inventory falls below `minStockLevel`.
- **Shortage:** A Production Request cannot start because components are missing.
- **Receiving:** A Purchase Order is fully received (ready for PM to use in PR).
- **Completion:** An SO is fully shipped (Sales team can notify Agent).

---

## Flow 11: Internal Stock Transfer (Chuyển kho nội bộ)

**Purpose:** Move stock between warehouses to satisfy strict origin/destination constraints.

### Steps
1. **Warehouse Manager** identifies that an upcoming Work Order or Sales Order will fail due to insufficient stock at the requested `warehouseId`, even though total company stock is sufficient.
2. Initiates an Internal Transfer request from Warehouse A -> Warehouse B.
3. System verifies stock lock in Warehouse A (creates an EXPORT_TRANSFER transaction).
4. System credits stock in Warehouse B (creates an IMPORT_TRANSFER transaction).
5. Both legs are committed in a single database transaction.

---

## The Cascading Wait: How Shortages Propagate

This is the most important concept in a pure MTS system. When demand exceeds supply, the system creates a **chain of human-driven decisions**, not automated triggers.

```
Agent wants 100 phones → SO created (Flow 1)
  └── Only 19 in stock → SO stays IN_PROGRESS (partial shipped)
      └── PM sees low stock on Dashboard (Flow 10)
          └── PM creates PR for 500 phones (Flow 2)
              └── BOM check: need 500 Batteries, only have 200
                  └── PM sees component shortage (Flow 10)
                      └── PM creates PO for 500 Batteries (Flow 3)
                          └── Supplier delivers Batteries
                              └── Component stock updated
                                  └── PM creates WO (Flow 4)
                                      └── Floor produces phones
                                          └── QC passes them (Flow 5)
                                              └── 488 phones now available for sale
                                                  └── Warehouse scans remaining 81 for Agent A
                                                      └── SO auto-completes (Flow 1)
```

> [!IMPORTANT]
> **Pure Physical Stock:** Every arrow (└──) in this chain is a HUMAN DECISION. There is no automated "Soft Allocation" or "Reservation" in the database. The system provides transparency through dashboards, but inventory is only committed through physical scanning. This is the fundamental design principle of a Lite MES that avoids ERP-level automation complexity.
