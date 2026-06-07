# Warehouse Stock Detail API — Implementation Plan

> **Status**: Ready for implementation
> **Context**: When a user clicks on a specific warehouse in the Warehouse Management UI, the front-end needs to show **"what's inside this warehouse right now?"**. The answer is type-dependent.

---

## 1. Problem Statement

Currently, the backend has:
- `GET /api/warehouses` — Lists all warehouses (CRUD only, no stock detail)
- `GET /api/warehouse-ops/inventory/status` — Aggregate component stock across warehouses (no lot-level detail for a single warehouse)
- `GET /api/warehouse-ops/inventory/product-status` — Aggregate product stock (no batch grouping)
- `GET /api/product-instances?warehouseId=X` — Flat paginated list of product instances filtered by warehouse (**this already exists and works**)

**Gap**: No single endpoint returns a **grouped, summarized "inside view"** of what a specific warehouse contains, with type-appropriate detail (lots for components, batches for products).

---

## 2. What to Build

### Endpoint: `GET /api/warehouses/:warehouseId/stock`

A single polymorphic endpoint that reads the warehouse type and returns the appropriate grouped stock data.

**Query params:**
- `search` — (optional) search by component name / product name / lot code
- `page` & `limit` — pagination (defaults: page=1, limit=20)

**Permission**: `WH_STOCK_READ` (already exists in `backend/src/common/constants/permissions.ts` line 65)

### What Already Exists (DO NOT Rebuild)

The flat serial number list for SALES/ERROR warehouses is already handled by:
```
GET /api/product-instances?warehouseId=X&status=IN_STOCK_SALES
```
- Route: `backend/src/master-data/product-instances/productInstanceRoutes.ts` (line 19-23)
- Service: `backend/src/master-data/product-instances/productInstanceService.ts` (line 124-128 handles warehouseId filter)
- Validator: `backend/src/master-data/product-instances/productInstanceValidator.ts` (line 12)
- Supports: pagination, search, status filter, productId filter

**The front-end can use this existing endpoint for drill-down into individual serial numbers. No new endpoint needed for that.**

---

## 3. Response Shapes

### 3A. COMPONENT Warehouse → Grouped by Component, nested Lots

```json
{
  "warehouseId": 1,
  "warehouseName": "Main Warehouse (Materials)",
  "warehouseType": "COMPONENT",
  "summary": {
    "totalComponents": 5,
    "totalLots": 12,
    "totalQuantity": 3400
  },
  "items": [
    {
      "componentId": 1,
      "componentCode": "CMP-001",
      "componentName": "Steel Rod 10mm",
      "unit": "pcs",
      "totalCurrentQuantity": 800,
      "minStockLevel": 500,
      "status": "OK",
      "lotCount": 3,
      "lots": [
        {
          "componentLotId": 10,
          "lotCode": "LOT-2026-001",
          "initialQuantity": 500,
          "currentQuantity": 300,
          "receivedAt": "2026-05-15T10:00:00Z",
          "poCode": "PO-2026-042"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5 }
}
```

**Key design decisions:**
- `status` is derived: `"OK"` if `totalCurrentQuantity >= minStockLevel`, else `"LOW_STOCK"`
- `poCode` is traced via `ComponentLot.poDetailId → PurchaseOrderDetail → PurchaseOrder.code`
- **Pagination applies at the Component level** (not the lot level) — each component brings all its lots as nested data

**Prisma data source:**
- `ComponentLot` model (schema line 370-388): `warehouseId`, `componentId`, `currentQuantity`, `initialQuantity`, `lotCode`, `receivedAt`, `poDetailId`
- Join to `Component` (schema line 289-310): `componentName`, `code`, `unit`, `minStockLevel`
- Join to `PurchaseOrderDetail.purchaseOrder` for `poCode`

---

### 3B. SALES Warehouse → Grouped by Product, nested Batches

```json
{
  "warehouseId": 3,
  "warehouseName": "Sales Warehouse",
  "warehouseType": "SALES",
  "summary": {
    "totalProducts": 3,
    "totalInstances": 150
  },
  "items": [
    {
      "productId": 1,
      "productCode": "PRD-001",
      "productName": "Electric Motor A200",
      "unit": "unit",
      "inStockCount": 75,
      "minStockLevel": 50,
      "status": "OK",
      "oldestReceivedAt": "2026-04-10T08:00:00Z",
      "newestReceivedAt": "2026-06-05T16:30:00Z",
      "batches": [
        {
          "batchCode": "BATCH-2026-015",
          "productionDate": "2026-06-01",
          "expiryDate": "2027-06-01",
          "instanceCount": 30,
          "workOrderCode": "WO-2026-010"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3 }
}
```

**Key design decisions:**
- `inStockCount` = count of `ProductInstance` where `warehouseId = X AND status = IN_STOCK_SALES`
- `status`: `"OK"` | `"LOW_STOCK"` | `"OUT_OF_STOCK"` based on count vs `Product.minStockLevel`
- `oldestReceivedAt` / `newestReceivedAt` = min/max of `ProductInstance.receivedAt` → FIFO relevance
- `batches[]` = grouped by `ProductionBatch` → instance count per batch, with expiry and WO traceability

**Prisma data source:**
- `ProductInstance` model (schema line 548-570): `warehouseId`, `productId`, `status`, `receivedAt`, `productionBatchId`
- Join to `Product` (schema line 265-287): `productName`, `code`, `unit`, `minStockLevel`
- Join to `ProductionBatch` (schema line 532-546): `batchCode`, `productionDate`, `expiryDate`, `workOrderId`
- Join to `WorkOrder` for `workOrderCode` (via `ProductionBatch.workOrder.code`)

---

### 3C. ERROR Warehouse → Grouped by Product, nested Batches + Production Line

```json
{
  "warehouseId": 4,
  "warehouseName": "Error Warehouse",
  "warehouseType": "ERROR",
  "summary": {
    "totalProducts": 2,
    "totalDefectiveInstances": 18
  },
  "items": [
    {
      "productId": 1,
      "productCode": "PRD-001",
      "productName": "Electric Motor A200",
      "unit": "unit",
      "defectiveCount": 12,
      "batches": [
        {
          "batchCode": "BATCH-2026-015",
          "productionDate": "2026-06-01",
          "instanceCount": 8,
          "workOrderCode": "WO-2026-010",
          "productionLineName": "Line A"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2 }
}
```

**Key design decisions:**
- No `minStockLevel` or stock status — not meaningful for error warehouses
- `productionLineName` is included here (not in SALES) because it's critical for root-cause analysis: "which line is producing defects?"
- `productionLineName` traced via `ProductionBatch.productionLine.lineName`

---

## 4. Files to Create / Modify

### Architecture Decision

The stock detail service lives under `master-data/warehouses/` (NOT `warehouse-ops/inventory/`) because:
- The route is `GET /api/warehouses/:id/stock` — a sub-resource of the warehouse
- `warehouseService.ts` handles CRUD → keep it clean, stock logic goes in a **new** file
- This avoids circular concerns between master-data and warehouse-ops

```
backend/src/master-data/warehouses/
├── warehouseController.ts   ← MODIFY: add getWarehouseStock handler
├── warehouseRoutes.ts       ← MODIFY: add GET /:id/stock route
├── warehouseService.ts      ← DO NOT TOUCH (CRUD only)
└── warehouseStockService.ts ← NEW: all stock query logic
```

---

### 4A. [NEW] `warehouseStockService.ts`

This is the core file. It contains the polymorphic stock query logic.

**Class structure:**
```typescript
class WarehouseStockService {
    // Main orchestrator — reads warehouse type, delegates to the right method
    async getWarehouseStock(warehouseId: number, query: StockQuery): Promise<WarehouseStockResponse>

    // Type-specific private methods
    private async getComponentWarehouseStock(warehouse, query): Promise<ComponentStockResponse>
    private async getSalesWarehouseStock(warehouse, query): Promise<SalesStockResponse>
    private async getErrorWarehouseStock(warehouse, query): Promise<ErrorStockResponse>
}
```

**Implementation approach for each type:**

#### COMPONENT type:
1. Query `ComponentLot` where `warehouseId = X AND currentQuantity > 0`
2. Include `component` relation (for name, code, unit, minStockLevel)
3. Include `poDetail.purchaseOrder` relation (for poCode)
4. Group results in JS by `componentId` (Prisma doesn't support GROUP BY with nested includes)
5. Calculate `totalCurrentQuantity` per component (sum of lot quantities)
6. Derive `status` from totalCurrentQuantity vs minStockLevel
7. Apply pagination at the component level
8. Apply search filter on component name/code/lot code

#### SALES type:
1. Query `ProductInstance` where `warehouseId = X AND status = IN_STOCK_SALES`
2. Include `product` relation (for name, code, unit, minStockLevel)
3. Include `productionBatch` relation (for batchCode, productionDate, expiryDate)
4. Include `productionBatch.workOrder` relation (for WO code)
5. Group results in JS by `productId`
6. For each product: count instances, find oldest/newest receivedAt, sub-group by batch
7. Apply pagination at the product level
8. Apply search filter on product name/code

#### ERROR type:
1. Same as SALES but filter `status = IN_STOCK_ERROR`
2. Additionally include `productionBatch.productionLine` (for lineName)
3. No minStockLevel / stock status calculation

---

### 4B. [MODIFY] `warehouseController.ts`

Add one new handler:

```typescript
export const getWarehouseStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await WarehouseStockService.getWarehouseStock(Number(id), req.query as any);
        res.status(200).json(result);
    } catch (error) {
        const msg = (error as Error).message;
        if (msg === 'Warehouse not found') {
            res.status(404).json({ message: msg });
        } else {
            res.status(500).json({ message: msg });
        }
    }
};
```

---

### 4C. [MODIFY] `warehouseRoutes.ts`

Add the new route BEFORE the existing `POST /` route (after `GET /`):

```typescript
import { getWarehouseStock } from './warehouseController.js';

// Add after line 13 (after GET /)
router.get('/:id/stock',
    authorize(PERM.WH_STOCK_READ),
    getWarehouseStock
);
```

Add the corresponding Swagger documentation block.

---

## 5. Codebase Conventions to Follow

These patterns were observed from existing code and MUST be followed:

| Pattern | Example Source | Rule |
|---|---|---|
| Service as singleton class | `warehouseService.ts` line 83 | `export default new WarehouseStockService()` |
| Error throwing pattern | `warehouseService.ts` line 46 | Throw `new Error('Warehouse not found')`, controller catches and maps to HTTP status |
| Prisma import | `warehouseService.ts` line 1 | `import prisma from '../../common/lib/prisma.js'` |
| Type imports | `warehouseService.ts` line 2 | `import type { Warehouse } from '../../generated/prisma/index.js'` |
| Pagination utils | `productInstanceService.ts` line 3 | `import { getPaginationParams, createPaginatedResponse } from '../../common/utils/pagination.js'` |
| Controller error handling | `warehouseController.ts` line 50-56 | Match error message string → return appropriate HTTP status |
| Permission constant | `warehouseRoutes.ts` line 11 | Use `PERM.WH_STOCK_READ` from `../../common/constants/permissions.js` |
| File extensions in imports | All files | Use `.js` extension (ESM) |

---

## 6. Edge Cases to Handle

1. **Warehouse not found** → 404 with message
2. **Warehouse exists but empty** → Return valid response with `items: []` and zero summary counts
3. **ComponentLot with `currentQuantity = 0`** → Exclude from results (depleted lots are noise)
4. **Search with no results** → Return empty `items: []`, don't error
5. **Invalid warehouseId (NaN)** → The `Number()` parse will produce NaN → Prisma will throw → 500. Consider adding validation.

---

## 7. Verification Plan (Manual)

1. **Start the backend dev server**: `npm run dev` in `backend/`
2. **Test COMPONENT warehouse**:
   - `GET /api/warehouses/{componentWarehouseId}/stock` → Verify components appear with nested lots
   - Check `totalCurrentQuantity` sums match individual lot quantities
   - Check `status` is `LOW_STOCK` when below minStockLevel
   - Check `poCode` traces correctly to the purchase order
3. **Test SALES warehouse**:
   - `GET /api/warehouses/{salesWarehouseId}/stock` → Verify products appear with nested batches
   - Check `inStockCount` matches actual instance count
   - Check `oldestReceivedAt` / `newestReceivedAt` are correct
   - Check batch instance counts sum to total `inStockCount`
4. **Test ERROR warehouse**:
   - `GET /api/warehouses/{errorWarehouseId}/stock` → Verify products appear with `productionLineName`
   - Check `defectiveCount` matches actual `IN_STOCK_ERROR` instances
5. **Test empty warehouse**: Create a new empty warehouse → should return `items: []`
6. **Test search**: `?search=steel` → should filter components/products by name
7. **Test pagination**: `?page=1&limit=2` → should paginate at the component/product level
8. **Test 404**: Use a non-existent warehouse ID → should return 404

---

## 8. Sequence Diagram

```
Frontend                    Backend (warehouseRoutes)              warehouseStockService
   |                              |                                      |
   |  GET /warehouses/3/stock     |                                      |
   |----------------------------->|                                      |
   |                              |  getWarehouseStock(3, query)         |
   |                              |------------------------------------->|
   |                              |                                      |
   |                              |  1. Find warehouse (get type)        |
   |                              |  2. Switch on warehouseType          |
   |                              |     - COMPONENT → getComponentStock  |
   |                              |     - SALES → getSalesStock          |
   |                              |     - ERROR → getErrorStock          |
   |                              |  3. Return typed response            |
   |                              |<-------------------------------------|
   |  { warehouseType, items[] }  |                                      |
   |<-----------------------------|                                      |
```
