# MES Mini: Project Documentation (Front Door)

> [!WARNING]
> **Business Model:** Pure **MTS (Make-to-Stock)** with Dispatch-only Sales Orders. Production is **customer-blind**. The factory floor has no knowledge of customers or agents. See `04_business_flows.md` for the complete source of truth.

**Goal:** Track components from Supplier to Agent with 100% Traceability via Barcode scanning.

---

## 🗺️ Documentation Directory

### Source of Truth
- `04_business_flows.md` — Complete business flows for the MTS system (10 flows + cascading wait concept)
- `01_thesis_scope.md` — HCMUT capstone project scope and requirements (Vietnamese)

### Global Architecture (The DNA)
These rules apply to the entire system regardless of the specific feature.
- `architecture/identification_strategy.md` — Barcode types, labeling, and Scan API rules
- `architecture/costing.md` — Real-time costing formulas and flexible ledger
- `architecture/inventory_ledger.md` — Transaction-first principle and stock audit rules

### Feature Logic (The Organs)
Deep-dives into specific business modules.
- `features/cardinality_module_relationships.md` — Entity relationships, cardinality, and traceability chains
- `features/purchase_order/01_logic_brainstorm.md` — PO constraints and 1:1 expediting rules
- `features/_qc/_01_logic_brainstorm.md` — QC scrap-only policy and known blind spots
- `features/production_request/01_logic.md` — ⚠️ Outdated, pending rewrite
- `features/sales_order/01_logic.md` — ⚠️ Outdated, pending rewrite

### Operations & Planning
- `02_deployment_guide.md` — Cloud Run + Supabase + Cloudflare Pages ($0/month hosting)
- `04_detailed_workflow.md` — Original 20-step workflow (Vietnamese, partially outdated)
- `my_todo_list.md` — Active and future task backlog
- `po_plan.md` — PO phase critique and proposed schema changes (ComponentLot, aggregation)

---

## ⚡ How The System Works (MTS Big Picture)

```
PRODUCTION SIDE (Customer-Blind):
  Role-specific Dashboard shows low stock
  → PM creates Production Request
  → Work Order created → Factory produces
  → QC (Scrap-Only) → Finished goods in Sales Warehouse

SALES SIDE (Dispatch Only):
  Agent calls → Sales staff creates SO (Dispatch Record)
  → Manager approves → Warehouse scans barcodes
  → Goods shipped → SO auto-completes

THE TWO SIDES NEVER TOUCH EACH OTHER.
They connect ONLY through the shared INVENTORY POOL.
```

### The Cascading Wait (Key MTS Concept)
When demand exceeds supply, the system creates a chain of **human-driven decisions**, not automated triggers:
```
Agent wants 100 phones → SO created, only 19 in stock → SO stays IN_PROGRESS
  → PM sees low stock on Dashboard → Creates PR for 500 phones
    → BOM check: need 500 Batteries, only have 200
      → PM creates PO for 500 Batteries → Supplier delivers
        → PM creates WO → Floor produces → QC passes 488
          → Warehouse scans remaining 81 for Agent → SO completes
```
> Every step is a **human decision**, not an automated system trigger.

---

## 🧵 Traceability (Two Independent Chains)

### Chain A: Manufacturing Genealogy ("How was it made?")
```
Component (via BOM) → MaterialRequest → WorkOrder → ProductionBatch → ProductInstance (SN)
```

### Chain B: Commercial Assignment ("Who got it?")
```
ProductInstance (SN) → SalesOrder → Agent
```

> These two chains are **completely independent**. Chain B is set at shipping time via a direct FK — NOT by traversing the production chain. This is what makes the factory floor "customer-blind."

### Barcode Scan Points
| Phase | Object | Barcode |
|-------|--------|---------|
| Receiving | Component Box | Internal Lot Label |
| Production | Work Order Batch | Traveler (Phiếu theo dõi) |
| Assembly | Finished Unit | Serial Number (SN) |
| Shipping | Dispatch | SO Label → links SN to Sales Order |

---

## 🚀 Roadmap & Status

- [x] **Phase 1: Sales Order** — Dispatch record, FIFO reservation, approval workflow
- [x] **Phase 2: Production Planning** — MRP/BOM feasibility, PR lifecycle, BOM snapshotting
- [/] **Phase 3: Purchasing** — PO reception, goods receipt (ComponentLot pending)
- [ ] **Phase 4: Work Order Execution** — Shop floor, material kitting, Production Batch, serialization
- [ ] **Phase 5: QC** — Scrap-Only inspection, pass/fail, move to Sales/Error warehouse
- [ ] **Phase 6: Shipping & Dispatch** — Barcode scan → link SN to SO → auto-complete
- [ ] **Phase 7: Costing** — Per-unit material + labor + overhead calculation
- [ ] **Phase 8: Warranty** — Customer activates via SN scan, warranty period tracking
- [x] **Phase 9: Dashboard** — Role-specific KPIs (Warehouse, Sales, Production) with live stock alerts and pending order tracking.