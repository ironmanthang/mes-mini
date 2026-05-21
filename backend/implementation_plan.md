# Costing API Implementation Plan

Implement the analytical costing endpoints:
1. `GET /api/costs/materials` (Raw Material Cost API)
2. `GET /api/costs/products` (Finished Product Cost API)

This provides management with critical metrics on inventory expenditures, production costs, and daily breakdown statistics.

---

## User Review Required

> [!IMPORTANT]
> **New Permission Code**: We propose introducing the `COST_READ` permission code to restrict access to these cost reporting endpoints.
> - `SYS_ADMIN` and `PROD_MGR` (Production Manager) will receive this permission by default.
> - Access will be validated using the standard `authorize(PERM.COST_READ)` middleware.

> [!NOTE]
> **Timezone Grouping**: Daily breakdowns will use the local date representation of the database record's timestamp (using Javascript timezone conversions) to prevent shift data from leaking into incorrect reporting days.

---

## Proposed Changes

### Core Constants and Database Seeders

#### [MODIFY] [permissions.ts](file:///d:/program/mes-mini/backend/src/common/constants/permissions.ts)
- Add `COST_READ: 'COST_READ'` to `PERM` object.

#### [MODIFY] [system.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeders/system.ts)
- Include description for `COST_READ`: `'View financial and product costing reports'`.
- Map `PERM.COST_READ` to roles `SYS_ADMIN` and `PROD_MGR`.

---

### Costing Module

We will create a new costing module under `src/costs/`.

#### [NEW] [costValidator.ts](file:///d:/program/mes-mini/backend/src/costs/costValidator.ts)
Define query schemas using Joi to parse and validate parameters:
- `materialCostQuerySchema`:
  - `startDate`: Optional ISO date
  - `endDate`: Optional ISO date
  - `componentId`: Optional positive integer
  - `supplierId`: Optional positive integer
- `productCostQuerySchema`:
  - `startDate`: Optional ISO date
  - `endDate`: Optional ISO date
  - `productId`: Optional positive integer

#### [NEW] [costService.ts](file:///d:/program/mes-mini/backend/src/costs/costService.ts)
Implement database query logic:
1. **`getMaterialCosts(filters)`**:
   - Query `PurchaseOrderDetail` records for purchase orders where `status: PurchaseOrderStatus.COMPLETED`.
   - Apply `supplierId`, `componentId`, `startDate`, and `endDate` (expanded to end of day) filters.
   - Aggregate:
     - `totalMaterialCost`: Sum of `quantityReceived * unitPrice` across all matched detail lines.
     - `dailyCostBreakdown`: Group matched lines by completion date (`purchaseOrder.updatedAt`) formatted to `YYYY-MM-DD`, mapping to `{ date, cost }`.
     - `dailyQuantityReceived`: Group matched lines by completion date formatted to `YYYY-MM-DD`, mapping to `{ date, quantity }`.
   - Return sorted lists ascending by date.
2. **`getProductCosts(filters)`**:
   - Query `WorkOrder` records where `status: WorkOrderStatus.COMPLETED` and `totalProductionCost` is not null.
   - Apply `productId`, `startDate`, and `endDate` (expanded to end of day) filters.
   - Aggregate:
     - `totalFinishedProductCost`: Sum of `totalProductionCost` across matched Work Orders.
     - `dailyCostBreakdown`: Group by completion date (`updatedAt`) formatted to `YYYY-MM-DD`, mapping to `{ date, cost }`.
     - `dailyQuantityCreated`: Group by completion date formatted to `YYYY-MM-DD`, summing product instances from linked `productionBatches`, mapping to `{ date, quantity }`.
   - Return sorted lists ascending by date.

#### [NEW] [costController.ts](file:///d:/program/mes-mini/backend/src/costs/costController.ts)
- Implement `getMaterialCosts` and `getProductCosts` express handlers.
- Parse query parameters, validate using `Joi` schemas, and call the service.
- Return HTTP 200 with JSON payload or HTTP 400 for validation errors.

#### [NEW] [costRoutes.ts](file:///d:/program/mes-mini/backend/src/costs/costRoutes.ts)
- Mount `GET /materials` and `GET /products` endpoints.
- Protect with `protect` middleware and authorize with `authorize(PERM.COST_READ)`.
- Document Swagger definitions for both endpoints.

---

### Route and Swagger Configuration

#### [MODIFY] [app.ts](file:///d:/program/mes-mini/backend/src/app.ts)
- Import `costRoutes` from `./costs/costRoutes.js`.
- Register router at `app.use('/api/costs', costRoutes);`.

#### [MODIFY] [swaggerConfig.ts](file:///d:/program/mes-mini/backend/src/config/swaggerConfig.ts)
- Add `/src/costs/costRoutes.ts` and `/dist/costs/costRoutes.js` paths to scan.
- Add `Costs` tag details: `{ name: 'Costs', description: 'Financial & Product Costing Reports' }`.

---

## Verification Plan

### Manual Verification
1. **Authentication and Authorization Controls**:
   - Test retrieving material costs using an employee token that lacks the `COST_READ` permission (e.g. `worker` role). Verify that it returns `403 Forbidden`.
   - Test using an employee token with `COST_READ` permission (e.g. `manager` or `admin`). Verify it returns `200 OK`.

2. **Endpoint Behavior**:
   - Request `GET /api/costs/materials` without parameters. Verify successful return of total costing and daily breakdowns.
   - Request `GET /api/costs/materials?startDate=2026-05-01&endDate=2026-05-31` and check if only records within this window are aggregated.
   - Filter by specific `componentId` and `supplierId`. Confirm that total costs and quantity received sum up correctly matching only that component or supplier.
   - Request `GET /api/costs/products` without filters and verify that it returns total production costs and breakdowns.
   - Filter `GET /api/costs/products` by `productId` and date range. Confirm that only completed work order costs for that product are returned.
