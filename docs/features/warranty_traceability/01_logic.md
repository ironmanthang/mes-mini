# Warranty and Traceability Implementation

This document outlines the technical rules and implementation details for product shelf-life, FIFO inventory management, and the public warranty portal.

## 1. Shelf-Life and Expiry Logic
Shelf-life is managed at the product definition level and applied at the time of manufacturing.

- **Trigger:** `WorkOrderService.completeWorkOrder`
- **Logic:** 
  - If a custom `expiryDate` is not provided during completion, the system retrieves `Product.shelfLifeDays`.
  - `ProductionBatch.expiryDate = ProductionDate + shelfLifeDays`.
- **Data Model:** The expiry date is stored in the `ProductionBatch` table. All `ProductInstance` records belonging to that batch inherit this expiration context.

## 2. FIFO and Eligibility Guard
The system enforces a strict "Option A" Pick List validation to maintain inventory integrity.

### Strict FIFO Validation
- **Trigger:** `SalesOrderService.shipOrder`
- **Rule:** When an employee scans serial numbers, the backend validates them against a system-generated "Pick List".
- **Pick List Logic:**
  1. Priority 1: MTO (Make-to-Order) instances reserved specifically for this Sales Order.
  2. Priority 2: MTS (Make-to-Stock) instances, sorted by `receivedAt` ASC (Oldest First).
- **Enforcement:** If a scanned serial number is not in the top-N list (where N is the quantity to ship), the API throws a `FIFO/Allocation Violation` error.

### Concurrency Protection
- **PR Attribution:** During QC induction, `fulfilledQuantity` on `WorkOrderFulfillment` is updated using an atomic `updateMany` condition (`fulfilledQuantity < quantity`).
- **Shipping:** `ProductInstance` status is updated using `updateMany` with a `status: IN_STOCK_SALES` guard to prevent double-shipping.

## 3. Public Warranty Portal
A dedicated unauthenticated API slice enables consumer-facing services.

- **Base Path:** `/api/public/warranties`
- **Endpoints:**
  - `GET /lookup/:serialNumber`: Returns product details and current warranty status (if any).
  - `POST /activate`: Allows end-customers to activate their warranty.
- **Activation Logic:**
  - Calculates `warrantyEndsAt = Today + Product.warrantyPeriodDays`.
  - Atomically creates or finds a `Customer` record.
  - Creates a `Warranty` ticket linked to the specific `ProductInstance`.
  - **Constraint:** Warranty can only be activated for instances with status `SHIPPED`.

## 4. Stocktaking
- **List View:** `GET /api/warehouse-ops/stocktaking` provides a paginated list of all sessions for the dashboard.
- **Verification:** Current implementation provides a Variance Report. Inventory adjustments based on stocktake results must be triggered manually as a follow-up feature.
