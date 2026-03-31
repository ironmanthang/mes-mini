# Architecture: Multi-Role Dashboards & Health Metrics

> **Scope:** Lite MES (Capstone Project)
> **Principle:** Domain-Specific Vertical Slices (Warehouse, Sales, Production)

## 1. The Three Vertical Slices
To ensure fast performance and focused data, the system maintains exactly **3 Main Dashboard APIs**. Each represents a different business perspective.

| Role | API Endpoint | Primary Metric (KPI) | Status |
| :--- | :--- | :--- | :--- |
| **Warehouse** | `/api/warehouse/dashboard` | **Health Gap** (Shortage Sum) | ✅ Implemented |
| **Sales** | `/api/sales/dashboard` | **Order Backlog** (Pending Units) | ⏳ Planned |
| **Production** | `/api/production/dashboard` | **Capacity Demand** (Active WOs) | ⏳ Planned |

---

## 2. Core Logic: The "Top-Down Context" Rule

### A. Global vs. Local Health
In a multi-warehouse system, "Health" is defined by **Company-Wide Safety Requirements (`minStockLevel`)**, not by individual shelf space.

- **The Rule**: When filtering a dashboard by a specific `warehouseId`, the system compares the **Local Stock** against the **Global Safety Level**.
- **Reasoning**: If a product has a global safety minimum of 100, and Warehouse A only has 20, Warehouse A is "Unhealthy" even if its shelves are full.

### B. The "Health Gap" Formula
The system calculates the **Gap** for any item where `CurrentStock < MinStockLevel`:
`Gap = MinStockLevel - CurrentStock`

The **Total Gap** displayed on the dashboard is the `SUM(Gap)` for all items below their minimum. This gives the manager a single number representing the "Total Urgency" of the inventory state.

---

## 3. Decision Support (Proactive MRP)

The Dashboards are the "Signal," but the **Product Context** APIs are the "Tool" for action.

### GET `/api/products/:id/production-context`
Provides the "Why" for a production request by calculating the **Suggested Quantity**:
`max(0, (MinStock + PendingSalesDemand) - CurrentStock)`

### POST `/api/products/:id/production-feasibility`
Provides the "Can We" by running a **Live BOM Explosion**. It checks every component's availability across ALL warehouses to determine if a production request of `X` quantity can be fulfilled immediately.

---

## 4. Implementation Details
- **Services**: All dashboard logic is housed in `*DashboardService.ts` files, which consume authoritative data from the `InventoryService` in the Warehouse slice.
- **Stock Tracking**: Finished Goods are tracked via `ProductInstance` (Serial Numbers), while Components are tracked via `ComponentStock` (Bulk Totals). Soft allocation and `RESERVED` statuses have been removed to prioritize physical stock accuracy.
