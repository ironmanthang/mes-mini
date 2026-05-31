# Unified Error Handling: `AppError` Migration

## Problem Statement

The backend has two independent error-handling problems:

1. **Service Layer**: Most services throw bare `throw new Error(...)`. These carry no HTTP status code, so the controller cannot distinguish a 404 from a 409 from a 500.
2. **Controller Layer**: Controllers use 4 different ad-hoc patterns to guess the status code from the error message — string-prefix parsing, hardcoded defaults, message equality checks, and `includes()` substring matching. All of these are fragile and wrong.

## Architecture Goal

**Strict separation:**

| Error Type | Class | Source | HTTP Result |
|---|---|---|---|
| **Operational** (expected) | `AppError` | Validation, not-found, auth, conflict, status-lock | `error.statusCode` + `error.message` → client |
| **Programmer/Runtime** (unexpected) | `Error` | Unhandled exceptions, DB crashes, null references | `500 Internal Server Error` (message **never** leaked) |

After this migration, every catch block becomes a simple 4-line function. Zero string matching.

---

## Phase 1 — Service Layer: `throw new Error()` → `throw new AppError()`

### Status Code Legend

| Code | Meaning | Pattern |
|------|---------|---------|
| `400` | Bad Request | Invalid input, validation failure, empty required field |
| `401` | Unauthorized | Wrong credentials, expired session |
| `403` | Forbidden | Permission denied, self-demotion safety |
| `404` | Not Found | Record not in DB |
| `409` | Conflict | Duplicate code/email, entity in use (cannot delete), concurrent write |
| `422` | Unprocessable | Valid input but impossible state transition (wrong status, over-fulfillment) |
| `500` | Server Error | Only for true infrastructure failures (env vars missing, retry exhausted) |

### Already Migrated ✅ (No changes needed)

These files already use `AppError` consistently:

- [purchaseOrderService.ts](file:///d:/program/mes-mini/backend/src/procurement/purchaseOrders/purchaseOrderService.ts)
- [productionLineService.ts](file:///d:/program/mes-mini/backend/src/production/productionLines/productionLineService.ts)
- [productionRequestService.ts](file:///d:/program/mes-mini/backend/src/production/productionRequests/productionRequestService.ts)
- [attachmentService.ts](file:///d:/program/mes-mini/backend/src/common/services/attachmentService.ts)

---

### `common/` — Shared Utilities

#### [MODIFY] [reporting.ts](file:///d:/program/mes-mini/backend/src/common/utils/reporting.ts)
All errors are query param validation → **`400`**

| Line | Message | Status |
|------|---------|--------|
| 11 | `${fieldName} must be supplied only once.` | 400 |
| 14 | `${fieldName} must be a string.` | 400 |
| 21 | `${fieldName} must use YYYY-MM-DD format.` | 400 |
| 24 | `${fieldName} must be a valid date.` | 400 |
| 34 | `${fieldName} must be a positive integer.` | 400 |
| 50 | `startDate must be before or equal to endDate.` | 400 |

#### [MODIFY] [r2Client.ts](file:///d:/program/mes-mini/backend/src/common/lib/r2Client.ts)
Startup env guard → **`500`** (genuinely a server misconfiguration)

| Line | Message | Status |
|------|---------|--------|
| 43 | `R2 configuration is incomplete...` | 500 |

---

### `core/`

#### [MODIFY] [authService.ts](file:///d:/program/mes-mini/backend/src/core/auth/authService.ts)

| Line | Message | Status |
|------|---------|--------|
| 86 | `Invalid credentials` | 401 |
| 87 | `Invalid credentials` (wrong password) | 401 |
| 88 | `Account is inactive. Contact admin.` | 403 |
| 139 | `Employee not found or update failed` | 404 |
| 160 | `Incorrect current password` | 401 |

#### [MODIFY] [employeeService.ts](file:///d:/program/mes-mini/backend/src/core/employees/employeeService.ts)
Partially migrated. P2025 catch blocks already use `AppError`. Fix remaining raw `Error`:

| Line | Message | Status |
|------|---------|--------|
| 180 | `One or more Role IDs are invalid.` | 400 |
| 217 | `Email already in use` | 409 |
| 218 | `Phone number already in use` | 409 |
| 219 | `Username already taken` | 409 |
| 220 | `A unique constraint was violated.` | 409 |
| 230 | `Security Safety: You cannot terminate your own account.` | 403 |
| 262 | `Security Violation: You cannot remove the System Admin role...` | 403 |
| 288 | `Phone number already in use` (update path) | 409 |
| 289 | `A unique constraint was violated.` (update path) | 409 |
| 309 | `Phone number already in use` (profile path) | 409 |
| 310 | `A unique constraint was violated.` (profile path) | 409 |

#### [MODIFY] [roleService.ts](file:///d:/program/mes-mini/backend/src/core/roles/roleService.ts)

| Line | Message | Status |
|------|---------|--------|
| 32 | `Role name is required` | 400 |
| 42 | `Role code '...' already exists` | 409 |
| 46 | `Role name '...' already exists` | 409 |
| 62 | `Role not found` | 404 |
| 66 | `System Safety: The SYS_ADMIN roleCode is immutable...` | 403 |
| 74 | `Role code already exists` | 409 |
| 81 | `Role name already exists` | 409 |
| 104 | `Role not found` | 404 |
| 108 | `System Safety: The root Administrator role can never be deleted.` | 403 |
| 113 | `Cannot delete role because it is assigned to users.` | 409 |
| 159 | `Role not found` | 404 |
| 179 | `Role not found` | 404 |
| 188 | `Invalid permission codes: ...` | 400 |

---

### `master-data/`

#### [MODIFY] [warehouseService.ts](file:///d:/program/mes-mini/backend/src/master-data/warehouses/warehouseService.ts)

| Line | Message | Status |
|------|---------|--------|
| 46 | `Warehouse not found` | 404 |
| 71 | `Warehouse not found` | 404 |
| 74 | `Cannot delete warehouse: it contains existing...` | 409 |

#### [MODIFY] [supplierService.ts](file:///d:/program/mes-mini/backend/src/master-data/suppliers/supplierService.ts)

| Line | Message | Status |
|------|---------|--------|
| 54 | `Supplier not found` | 404 |
| 61 | `Supplier code "..." already exists.` | 409 |
| 74 | `Email already in use.` | 409 |
| 75 | `Phone number already in use.` | 409 |
| 85 | `Supplier not found` | 404 |
| 102 | `Supplier code "..." already exists.` | 409 |
| 103 | `Email already in use.` | 409 |
| 104 | `Phone number already in use.` | 409 |
| 117 | `Cannot delete supplier...` | 409 |
| 186 | `This component is not assigned to this supplier.` | 404 |

#### [MODIFY] [agentService.ts](file:///d:/program/mes-mini/backend/src/master-data/agents/agentService.ts)

| Line | Message | Status |
|------|---------|--------|
| 42 | `Agent not found` | 404 |
| 48 | `Agent code "..." already exists.` | 409 |
| 56 | `Agent not found` | 404 |
| 60 | `Agent code "..." already exists.` | 409 |
| 73 | `Cannot delete: This agent has Sales Orders.` | 409 |

#### [MODIFY] [productService.ts](file:///d:/program/mes-mini/backend/src/master-data/products/productService.ts)

| Line | Message | Status |
|------|---------|--------|
| 58 | `Product not found` | 404 |
| 64 | `Product code "..." already exists.` | 409 |
| 77 | `Product not found` | 404 |
| 81 | `Product code "..." already exists.` | 409 |
| 96 | `Product Category with ID ... not found.` | 404 |
| 100 | `Quality Checklist with ID ... not found.` | 404 |
| 108 | `Cannot delete: This product is in Sales Orders.` | 409 |
| 111 | `Cannot delete: This product is in Work Orders.` | 409 |
| 114 | `Cannot delete: This product is in Production Requests.` | 409 |
| 122 | `Product not found` | 404 |

#### [MODIFY] [bomService.ts](file:///d:/program/mes-mini/backend/src/master-data/products/bomService.ts)

| Line | Message | Status |
|------|---------|--------|
| 20 | `Product not found` | 404 |
| 32 | `Product not found` | 404 |
| 36 | `Component not found` | 404 |
| 43 | `Component "..." is already in the BOM...` | 409 |
| 55 | `Product not found` | 404 |
| 61 | `BOM entry not found...` | 404 |
| 73 | `Product not found` | 404 |
| 79 | `BOM entry not found...` | 404 |

#### [MODIFY] [qualityChecklistService.ts](file:///d:/program/mes-mini/backend/src/master-data/qualityChecklists/qualityChecklistService.ts)

| Line | Message | Status |
|------|---------|--------|
| 39 | `Checklist not found` | 404 |
| 68 | `Checklist not found` | 404 |
| 82 | `Cannot delete: ... assigned to products.` | 409 |
| 86 | `Cannot delete: ... has quality check records.` | 409 |
| 94 | `Checklist not found` | 404 |
| 107 | `Inspection point not found` | 404 |
| 120 | `Cannot delete: ... has inspection results.` | 409 |

#### [MODIFY] [productCategoryService.ts](file:///d:/program/mes-mini/backend/src/master-data/productCategories/productCategoryService.ts)

| Line | Message | Status |
|------|---------|--------|
| 23 | `Product category not found` | 404 |
| 31 | `Category "..." already exists.` | 409 |
| 39 | `Product category not found` | 404 |
| 45 | `Category "..." already exists.` | 409 |
| 54 | `Product category not found` | 404 |
| 57 | `Cannot delete: ... assigned to products.` | 409 |

#### [MODIFY] [productInstanceService.ts](file:///d:/program/mes-mini/backend/src/master-data/product-instances/productInstanceService.ts)

| Line | Message | Status |
|------|---------|--------|
| 279 | `Product Instance not found` | 404 |

#### [MODIFY] [componentService.ts](file:///d:/program/mes-mini/backend/src/master-data/components/componentService.ts)

| Line | Message | Status |
|------|---------|--------|
| 66 | `Component not found` | 404 |
| 73 | `Component code "..." already exists.` | 409 |
| 81 | `Component not found` | 404 |
| 85 | `Component code "..." already exists.` | 409 |
| 99 | `Cannot delete: ... part of a BOM.` | 409 |
| 103 | `Cannot delete: ... exists in Purchase Orders.` | 409 |
| 109 | `Cannot delete: Physical stock still exists.` | 409 |
| 120 | `Component not found` | 404 |
| 141 | `Component not found` | 404 |

---

### `notifications/`

#### [MODIFY] [notificationService.ts](file:///d:/program/mes-mini/backend/src/notifications/notificationService.ts)
(Will audit during execution — likely 404/400 guards)

---

### `production/`

#### [MODIFY] [workOrderService.ts](file:///d:/program/mes-mini/backend/src/production/workOrders/workOrderService.ts)

| Line | Message pattern | Status |
|------|---------|--------|
| 66 | `Some Production Requests not found` | 404 |
| 71 | `Cannot group requests for different products.` | 400 |
| 74 | `All requests must be APPROVED.` | 422 |
| 118 | `... already fully fulfilled.` | 422 |
| 120 | `Quantity to produce must be > 0...` | 400 |
| 124 | `Cannot over-fulfill...` | 422 |
| 135 | `Total quantity must be > 0` | 400 |
| 206 | `Failed to generate unique Work Order code...` | 500 |
| 218 | `Invalid Work Order status: ...` | 400 |
| 266 | `Work Order not found` | 404 |
| 277 | `Work Order not found.` | 404 |
| 279 | `Only DRAFT Work Orders can be updated.` | 422 |
| 286 | `Production Line ID ... not found.` | 404 |
| 292 | `Warehouse ID ... not found.` | 404 |
| 294 | `Target Sales Warehouse must be SALES type.` | 422 |
| 301 | `Warehouse ID ... not found.` | 404 |
| 303 | `Target Error Warehouse must be ERROR type.` | 422 |
| 327 | `Work Order not found` | 404 |
| 329 | `Only DRAFT orders can be released.` | 422 |
| 334 | `Cannot release: targetSalesWarehouseId not configured.` | 422 |
| 337 | `Cannot release: targetErrorWarehouseId not configured.` | 422 |
| 366 | `Work Order not found` | 404 |
| 368 | `Only RELEASED orders can be started.` | 422 |
| 447 | `Work Order not found` | 404 |
| 451 | `Cannot complete. Status is ...` | 422 |
| 452 | `Quantity produced must be > 0` | 400 |
| 454 | `Quantity produced ... cannot exceed planned quantity ...` | 422 |
| 459 | `Cannot complete: linked MR must be ISSUED.` | 422 |
| 464 | `Cannot complete: linked MR still PENDING.` | 422 |
| 568 | `No warehouse available...` | 500 |
| 602 | `Work Order not found` | 404 |
| 611 | `Cannot cancel Work Order in status ...` | 422 |
| 615 | `Cancellation reason is required...` | 400 |

#### [MODIFY] [qualityCheckService.ts](file:///d:/program/mes-mini/backend/src/production/qualityChecks/qualityCheckService.ts)
(Will audit during execution)

#### [MODIFY] [mrpService.ts](file:///d:/program/mes-mini/backend/src/production/mrp/mrpService.ts)
(Will audit during execution)

#### [MODIFY] [feasibilityService.ts](file:///d:/program/mes-mini/backend/src/production/mrp/feasibilityService.ts)
(Will audit during execution)

---

### `sales/`

#### [MODIFY] [salesOrderService.ts](file:///d:/program/mes-mini/backend/src/sales/salesOrders/salesOrderService.ts)

| Line | Message pattern | Status |
|------|---------|--------|
| 146 | `Duplicate products found in list.` | 400 |
| 151 | `Agent not found` | 404 |
| 157 | `Product with ID ... not found.` | 404 |
| 245 | `Sales Order not found` | 404 |
| 249 | `State Lock: Cannot edit order in ... status.` | 422 |
| 253 | `Privilege Violation: You can only edit your own orders.` | 403 |
| 267 | `Duplicate products found in list.` | 400 |
| 323 | `Order not found` | 404 |
| 328 | `Audit Trail: Cannot delete non-draft orders.` | 422 |
| 332 | `Privilege Violation: You can only delete your own drafts.` | 403 |
| 475 | `Sales Order not found` | 404 |
| 498 | `Order not found` | 404 |
| 499 | `Process Violation: Cannot approve order in ... status.` | 422 |
| 502 | `Audit Violation: You cannot approve your own SO.` | 403 |
| 564 | `Order not found` | 404 |
| 565 | `Cannot submit. Current status is ...` | 422 |
| 566 | `Only the creator can submit this order.` | 403 |
| 590 | `Order not found` | 404 |
| 591 | `Cannot reject. Current status is ...` | 422 |
| 592 | `You cannot reject your own order.` | 403 |
| 613 | `Order not found` | 404 |
| 615 | `Cannot start processing. Order status must be APPROVED...` | 422 |
| 695 | `Sales Order not found` | 404 |
| 699 | `Cannot generate pick list for order in ... status.` | 422 |
| 744 | `Sales Order not found` | 404 |
| 749 | `Process Violation: Cannot ship order in ... status.` | 422 |
| 754 | `Product ID ... is not on this Order.` | 400 |
| 760 | `Over-shipment: ...` | 422 |
| 773 | `FIFO/Allocation Violation: ...` | 422 |
| 787 | `Serial ... was already shipped...` | 409 |

---

### `warehouse-ops/`

#### [MODIFY] [inventoryService.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/inventory/inventoryService.ts)
(Will audit during execution)

#### [MODIFY] [materialRequestService.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/material-request/materialRequestService.ts)
(Will audit during execution — not found → 404, status guards → 422, stock → 422)

#### [MODIFY] [productInductionService.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/productInduction/productInductionService.ts)
(Will audit during execution)

#### [MODIFY] [transferRequestService.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/transferRequest/transferRequestService.ts)
(~30 throw sites, will audit during execution. Patterns: not found → 404, same source/target → 400, wrong warehouse type → 422, qty ≤ 0 → 400, insufficient stock → 422, concurrent → 409, status guard → 422)

---

### `public/`

#### [MODIFY] [warrantyController.ts](file:///d:/program/mes-mini/backend/src/public/warranties/warrantyController.ts)
Inline `throw new Error()` inside transaction → convert to `AppError`:
| Line | Message | Status |
|------|---------|--------|
| 52 | `Product instance not found.` | 404 |
| 56 | `Product must be shipped before warranty can be activated.` | 422 |
| 60 | `Warranty is already activated for this product.` | 409 |
| 64 | `This product does not have a configured warranty period.` | 422 |

---

## Phase 2 — Controller Layer: Unified `handleError()`

### Problem: 4 Anti-Patterns Found

#### Anti-Pattern 1 — String Equality Matching
```typescript
// warehouseController.ts
if (msg === 'Warehouse not found') {
    res.status(404).json({ message: msg });
} else {
    res.status(500).json({ message: msg });
}
```

#### Anti-Pattern 2 — String Prefix Matching
```typescript
// workOrderController.ts
const statusCode = message.startsWith('Invalid Work Order status') ? 400 : 500;
```

#### Anti-Pattern 3 — Hardcoded Default Status (wrong for many callers)
```typescript
// salesOrderController.ts — getSOById
res.status(404).json({ message: (error as Error).message });
// But approveSO uses:
res.status(400).json({ message: (error as Error).message });
// Both call the same service. Neither is always correct.
```

#### Anti-Pattern 4 — Leaking crash messages to client
```typescript
// inventoryController.ts, warehouseDashboardController.ts, salesDashboardController.ts
res.status(500).json({ message: (error as Error).message }); // LEAK!
```

### Solution: Standard `handleError()` Function

Create a single shared utility that ALL controllers use:

#### [NEW] [handleError.ts](file:///d:/program/mes-mini/backend/src/common/utils/handleError.ts)

```typescript
import { Response } from 'express';
import { AppError } from './AppError.js';

/**
 * handleError() — Universal controller error handler.
 *
 * Rules:
 *   1. AppError → use error.statusCode + error.message (operational, expected)
 *   2. Error    → always 500 + generic message (unexpected crash, NEVER leak)
 *
 * This replaces all ad-hoc catch blocks, string matching, and hardcoded status codes.
 */
export function handleError(error: unknown, res: Response): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
    } else {
        console.error('[Unexpected Error]', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
```

### Controller Files To Migrate

Every controller below replaces its catch block(s) with `handleError(error, res)`.

> [!IMPORTANT]
> Three controllers already use this pattern (with minor differences):
> - `productionLineController.ts` ✅
> - `productionRequestController.ts` ✅
> - `purchaseOrderController.ts` ✅
> 
> **BUT** even these have a flaw: their `handleError` falls back to `defaultStatus` for non-AppError, which still **leaks the crash message**. These will be updated to use the new shared import instead.

#### Controllers needing full replacement (no `handleError` today):

| Controller | Anti-Patterns Present |
|---|---|
| [authController.ts](file:///d:/program/mes-mini/backend/src/core/auth/authController.ts) | String equality (`err.message === 'Invalid credentials'`) |
| [roleController.ts](file:///d:/program/mes-mini/backend/src/core/roles/roleController.ts) | Hardcoded `400` for all errors |
| [warehouseController.ts](file:///d:/program/mes-mini/backend/src/master-data/warehouses/warehouseController.ts) | String equality + `includes()` substring |
| [supplierController.ts](file:///d:/program/mes-mini/backend/src/master-data/suppliers/supplierController.ts) | Hardcoded defaults (need to check) |
| [agentController.ts](file:///d:/program/mes-mini/backend/src/master-data/agents/agentController.ts) | Hardcoded defaults |
| [productController.ts](file:///d:/program/mes-mini/backend/src/master-data/products/productController.ts) | Hardcoded defaults |
| [bomController.ts](file:///d:/program/mes-mini/backend/src/master-data/products/bomController.ts) | Hardcoded defaults |
| [productCategoryController.ts](file:///d:/program/mes-mini/backend/src/master-data/productCategories/productCategoryController.ts) | Hardcoded defaults |
| [productInstanceController.ts](file:///d:/program/mes-mini/backend/src/master-data/product-instances/productInstanceController.ts) | Hardcoded defaults |
| [componentController.ts](file:///d:/program/mes-mini/backend/src/master-data/components/componentController.ts) | Hardcoded defaults |
| [qualityCheckController.ts](file:///d:/program/mes-mini/backend/src/production/qualityChecks/qualityCheckController.ts) | Hardcoded `400`/`500` |
| [workOrderController.ts](file:///d:/program/mes-mini/backend/src/production/workOrders/workOrderController.ts) | `startsWith()` + hardcoded `404`/`400` |
| [salesOrderController.ts](file:///d:/program/mes-mini/backend/src/sales/salesOrders/salesOrderController.ts) | Hardcoded `400`/`404`/`500` depending on route |
| [materialRequestController.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/material-request/materialRequestController.ts) | `startsWith()` + hardcoded `404`/`400` + `throw new Error()` in controller |
| [transferRequestController.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/transferRequest/transferRequestController.ts) | Hardcoded `400`/`500` |
| [productInductionController.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/productInduction/productInductionController.ts) | Hardcoded `400` |
| [inventoryController.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/inventory/inventoryController.ts) | Hardcoded `500` (leaks crash messages) |
| [warehouseDashboardController.ts](file:///d:/program/mes-mini/backend/src/warehouse-ops/dashboard/warehouseDashboardController.ts) | Hardcoded `500` (leak) |
| [salesDashboardController.ts](file:///d:/program/mes-mini/backend/src/sales/dashboard/salesDashboardController.ts) | Hardcoded `500` (leak) |
| [productionDashboardController.ts](file:///d:/program/mes-mini/backend/src/production/dashboard/productionDashboardController.ts) | Hardcoded `500` (leak) |
| [productionFeasibilityController.ts](file:///d:/program/mes-mini/backend/src/production/mrp/productionFeasibilityController.ts) | (Need to check) |
| [costReportController.ts](file:///d:/program/mes-mini/backend/src/costs/costReportController.ts) | (Need to check) |
| [notificationController.ts](file:///d:/program/mes-mini/backend/src/notifications/notificationController.ts) | (Need to check) |
| [warrantyController.ts](file:///d:/program/mes-mini/backend/src/public/warranties/warrantyController.ts) | Inline raw `Error` + hardcoded `400`/`404`/`500` |

#### Controllers already using `handleError` (update to shared import):

| Controller | Change |
|---|---|
| [productionLineController.ts](file:///d:/program/mes-mini/backend/src/production/productionLines/productionLineController.ts) | Replace local `handleError` → import shared |
| [productionRequestController.ts](file:///d:/program/mes-mini/backend/src/production/productionRequests/productionRequestController.ts) | Replace local `handleError` → import shared |
| [purchaseOrderController.ts](file:///d:/program/mes-mini/backend/src/procurement/purchaseOrders/purchaseOrderController.ts) | Replace local `handleError` → import shared |
| [qualityChecklistController.ts](file:///d:/program/mes-mini/backend/src/master-data/qualityChecklists/qualityChecklistController.ts) | (Need to check if local or shared) |
| [employeeController.ts](file:///d:/program/mes-mini/backend/src/core/employees/employeeController.ts) | (Need to check if local or shared) |

> [!WARNING]
> **Special case — `materialRequestController.ts`**: Line 7 has `throw new Error(...)` directly in the controller (the `parsePositiveInt` helper). This should become `throw new AppError(..., 400)`.
>
> **Special case — `salesOrderController.ts`**: Lines 102 and 126 have `throw new Error(...)` in the controller. These should also become `throw new AppError(..., 400)`.

---

## Execution Order

1. Create shared `handleError.ts` utility
2. `common/` services (`reporting.ts`, `r2Client.ts`)
3. `core/` services + controllers (`auth`, `employee`, `role`)
4. `master-data/` services + controllers (9 service files, ~10 controller files)
5. `notifications/` service + controller
6. `production/` services + controllers
7. `sales/` services + controllers
8. `warehouse-ops/` services + controllers (highest complexity)
9. `public/warrantyController.ts`
10. Update 3 existing `handleError` controllers to use shared import

---

## Verification Plan

### Manual Verification

After migration, test each status code category:

**404 — Not Found**
- `GET /api/suppliers/999999` → HTTP `404`, `{ "message": "Supplier not found" }`

**409 — Conflict**
- `POST /api/suppliers` with duplicate `code` → HTTP `409`

**422 — State Violation**
- `PATCH /api/work-orders/:id/release` on a `COMPLETED` WO → HTTP `422`

**401 — Unauthorized**
- `POST /api/auth/login` with wrong password → HTTP `401`

**403 — Forbidden**
- Approve your own Sales Order → HTTP `403`

**400 — Validation**
- `GET /api/reports?startDate=not-a-date` → HTTP `400`

**500 — Unexpected Crash (verify message NOT leaked)**
- Simulate a DB disconnect → HTTP `500`, `{ "message": "Internal Server Error" }` (NOT the Prisma error)
