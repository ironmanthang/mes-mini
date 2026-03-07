# MES Mini: Project Documentation (Front Door)

**Goal:** Track components from Supplier to Agent with 100% Traceability.

---

## 🗺️ Documentation Directory

### 1. Global Architecture (The DNA)
These rules apply to the entire system regardless of the specific feature.
- `docs/architecture/qr_strategy.md`: Labeling, QR types, and Scan API rules.
- `docs/architecture/costing.md`: Real-time costing formulas and ledger logic.
- `docs/architecture/inventory_ledger.md`: Transaction-first principle and stock audit rules.

### 2. Feature Logic (The Organs)
Deep-dives into specific business modules.
- **Sales Order**: `docs/features/sales_order/01_logic.md` / `02_frontend_guide.md`
- **Production Request**: `docs/features/production_request/01_logic.md` / `02_frontend_guide.md`

---

## 🚀 Roadmap & Status

### ✅ Phase 1: The Trigger (Sales Order)
- Real-time stock detection and FIFO reservation.

### ✅ Phase 2: The Brain (Production Planning)
- MRP/BOM explosion and feasibility checks.

### 🔵 Phase 3: The Supply (Purchasing) - *In Progress*
- Purchase Order reception and internal lot labeling.

### 🟡 Phase 4: The Build (Execution) - *Planned*
- Shop floor terminals, Travelers, and Unit Serialization.

### 🟡 Phase 5: The End (Costing & Shipping) - *Planned*
- Final QC, unit costing, and customer shipment.

### 📐 System-Wide Capabilities (Cross-cutting concerns)
- Notification & Alert Engine (Low Stock, PO Approval, Material Issued)
- Role-Based Access Control (DB-driven Permissions)
- QR Code & Universal Scan API (Traceability)
- Dashboard & Real-Time Monitoring
- Inventory Ledger & Transaction History (Tracking all material movements)

---

## ⚡ The Narrative
The MES works like a nervous system:
1.  **Demand** arrives via a **Sales Order**.
2.  If stock fails, the **Brain** (Production Request) runs a feasibility check.
3.  If parts are missing, **Supply** (Purchase Order) feeds the warehouse.
4.  Once parts arrive, the **Workshop** (Work Order) assembles units.
5.  Everything is tracked via **QR Scans** at every single gate.