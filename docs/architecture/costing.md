# Real-Time Costing & Financial Logic (SSOT)

> **Role:** Rules for calculating the unit cost of every product manufactured.
> **Audience:** Accountants, Production Managers, and Analysts.

---

## 1. The Formula
Unlike enterprise ERPs that run batch costing at month-end, this system calculates cost **per unit** in real-time upon completion of a Work Order.

```javascript
TotalUnitCost = MaterialCost + LaborCost + MachineCost + Overhead
```

### Components:
*   **MaterialCost**: Sum of the `MovingAverageCost` of each component lot used (FIFO).
*   **LaborCost**: Calculated via `(CheckInTime - CheckOutTime) * OperatorHourlyRate`.
*   **Machine/Overhead**: Applied as an allocated percentage based on cycle time.

---

## 2. The Flexible Ledger Architecture
We do not store costs in fixed columns (e.g., `labor_cost`). Instead, we use the `ProductionCost` table (Category + Amount).

- **Why?** This allow us to add new cost types (Electricity, Rent, Taxes) without database schema changes.
- **Categories:** Linked to `CostCategory` table for easy reporting.

---

## 3. Trigger Points
- **Estimation:** MRP Calculation (Production Request phase).
- **Actuals:** Calculated automatically when a Work Order moves to `COMPLETED`.
- **Visibility:** Sales staff see the "Estimated Profitability" based on ATP (Available to Promise) stock levels.
