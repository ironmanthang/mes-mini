# Work Order API Simulation Guide

> This guide walks through the complete Work Order lifecycle using API calls against a **freshly seeded database**. The goal is to produce finished goods with status `PENDING_QC`.

## Prerequisites

- Database has been reset via `docker compose exec backend npx prisma migrate reset --force`
- Database has been seeded via `docker compose exec backend npx tsx prisma/scripts/seed.ts`
- You have access to Swagger at `http://localhost:5000/api-docs`

## Choosing the Right Product

The seeded DB includes several products. For a clean test with **zero Purchase Order overhead**, use `PROD-SMARTWATCH` (Smartwatch V1).

**Why this product:**
- **PR already exists**: `PR-20260310-0002` is in `APPROVED` status with quantity 20
- **Full component stock**: Both BOM components are fully stocked in `WH-MAIN`
  - `COM-SCREEN-OLED` — 100 pcs available (via `LOT-INIT-SCREEN-xxxx`)
  - `COM-BATTERY-500` — 100 pcs available (via `LOT-INIT-BATTERY-xxxx`)
- **BOM**: 1 OLED Screen + 1 Battery per unit
- **No PO needed** — warehouse already has sufficient materials

---

## The Full Flow

### Login

**`POST /api/auth/login`**

```json
{
  "username": "admin",
  "password": "123456"
}
```

---

### Gather IDs

Before creating the Work Order, you need actual database IDs. These change per seed run.

**`GET /api/production-requests`**
- Find `PR-20260310-0002` (Smartwatch, APPROVED)
- Note down `productionRequestId` and `productId`

**`GET /api/warehouses`**
- Find `WH-FG` (type: SALES) — note `warehouseId`
- Find `WH-DEFECT` (type: ERROR) — note `warehouseId`
- or just look in prisma studio

---

### Create Work Order (DRAFT)

**`POST /api/work-orders`**

```json
{
  "productId": "<productId from PR lookup>",
  "quantity": 5,
  "productionRequestIds": ["<productionRequestId of PR-20260310-0002>"],
  "note": "Test WO for Smartwatch — full component stock"
}
```

**What happens:**
- WO is created in `DRAFT` status
- Linked to the PR via `WorkOrderFulfillment`
- Note the `workOrderId` from the response — you'll use it in every subsequent call

---

### Configure Work Order (set line + target warehouses)

**`PUT /api/work-orders/{woId}`**

```json
{
  "productionLineId": 1,
  "targetSalesWarehouseId": "<warehouseId of WH-FG>",
  "targetErrorWarehouseId": "<warehouseId of WH-DEFECT>"
}
```

**What happens:**
- Assigns the WO to a physical production line
- Sets where PASSED_QC units go (`targetSalesWarehouseId`)
- Sets where FAILED_QC units go (`targetErrorWarehouseId`)

**Important**: This is only allowed while the WO is in `DRAFT`. The release step will be blocked if these warehouses are not configured.

---

### Release Work Order (DRAFT -> RELEASED)

**`PUT /api/work-orders/{woId}/release`**

```json
{}
```

**What happens:**
- WO status changes to `RELEASED`
- Planning is locked — the WO can no longer be reconfigured
- **Gate check**: Blocked if `targetSalesWarehouseId` or `targetErrorWarehouseId` is missing

---

### Start Work Order (RELEASED -> IN_PROGRESS)

**`PUT /api/work-orders/{woId}/start`**

```json
{}
```

**What happens (automatic side-effects):**
- WO status -> `IN_PROGRESS`
- Linked PR (`PR-20260310-0002`) -> `IN_PROGRESS`
- **Note**: Material Request is NOT auto-created anymore. You must call the MR creation API manually in the next step.

---

### Create Material Request (Manual Step)

**`POST /api/warehouse-ops/material-requests`**

```json
{
  "workOrderId": "<your workOrderId>"
}
```

**What happens:**
- System creates a `PENDING` Material Request with lines derived from BOM x quantity:
  - 5x `COM-SCREEN-OLED`
  - 5x `COM-BATTERY-500`
- **Gate Check**: This call will fail if the Work Order is not yet `IN_PROGRESS`.

---

### Find the Material Request

**`GET /api/warehouse-ops/material-requests`**

- Look for the MR with status `PENDING` linked to your WO (or use the `requestId` from the `POST` response in the previous step)
- Note down the `requestId`

**Tip: How to find Work Orders that need an MR?**
- Use **`GET /api/work-orders?missingMR=true`** to find all `IN_PROGRESS` Work Orders that haven't had a Material Request created for them yet.

---

### Validate Material Request (stock check preview)

**`PUT /api/warehouse-ops/material-requests/{mrId}/validate`**

```json
{
  "warehouseId": 1
}
```

**What happens:**
- Returns a preview showing available stock vs. required per component
- Check that `canIssue: true` and all lines show `isSufficient: true`
- The response includes `availableLots` with the exact `lotCode` values you need for the next step

**Example response excerpt:**

```json
{
  "canIssue": true,
  "lines": [
    {
      "componentCode": "COM-SCREEN-OLED",
      "requiredQuantity": 5,
      "availableQuantity": 100,
      "isSufficient": true,
      "availableLots": [
        { "lotCode": "LOT-INIT-SCREEN-xxxx", "currentQuantity": 100 }
      ]
    }
  ]
}
```

---

### Complete Material Request (deduct stock -> ISSUED)

**`PUT /api/warehouse-ops/material-requests/{mrId}/complete`**

```json
{
  "warehouseId": 1,
  "consumedLots": [
    {
      "componentId": "<componentId of COM-SCREEN-OLED>",
      "lotCode": "<lotCode from validate response>",
      "quantity": 5
    },
    {
      "componentId": "<componentId of COM-BATTERY-500>",
      "lotCode": "<lotCode from validate response>",
      "quantity": 5
    }
  ]
}
```


**What happens:**
- MR status -> `ISSUED`
- Lot quantities decremented (e.g., `LOT-INIT-SCREEN-xxxx`: 100 -> 95)
- `ComponentStock` aggregate decremented
- `InventoryTransaction(type: EXPORT_PRODUCTION)` records created for audit


---

### Complete Work Order (IN_PROGRESS -> COMPLETED)

**`PUT /api/work-orders/{woId}/complete`**

```json
{
  "quantityProduced": 5,
  "expiryDate": "2027-04-29"
}
```

**Required fields:**
- `quantityProduced` — must be > 0. This determines how many `ProductInstance` records are created
- `expiryDate` — optional, ISO date string for the production batch

**Optional fields:**
- `batchCode` — custom batch code. If omitted, the system auto-generates one

**Gate check:** Completion is blocked unless the linked Material Request has status `ISSUED`.

**What happens:**
- WO status -> `COMPLETED`
- System creates a `ProductionBatch` record
- System generates **5 ProductInstance** records, each with:
  - Unique serial number (for QR/barcode label printing)
  - Status `PENDING_QC`
  - Linked to the production batch for traceability
- check on prisma http://localhost:51212/#schema=public&table=product_instances&view=table&sort=created_at%3Adesc will see the pending_qc products

---

## After Completion: What's Next?

The 5 instances now sit at `PENDING_QC`. The next steps in the product lifecycle (not covered in this guide):

- **QC Inspection**: QC inspector examines each instance and logs `PASSED_QC` or `FAILED_QC`
- **Induction**: System auto-routes based on WO config:
  - `PASSED_QC` -> `targetSalesWarehouseId` (WH-FG), status becomes `IN_STOCK_SALES`
  - `FAILED_QC` -> `targetErrorWarehouseId` (WH-DEFECT), status becomes `IN_STOCK_ERROR`
- **PR Attribution**: When a unit reaches `IN_STOCK_SALES`, the system attributes it to the linked PR via `WorkOrderFulfillment.quantity`

---

## API Call Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Get auth token |
| `GET` | `/api/production-requests` | Find PR ID and product ID |
| `GET` | `/api/warehouses` | Find warehouse IDs |
| `POST` | `/api/work-orders` | Create WO (DRAFT) |
| `PUT` | `/api/work-orders/{id}` | Configure line + target warehouses |
| `PUT` | `/api/work-orders/{id}/release` | DRAFT -> RELEASED |
| `PUT` | `/api/work-orders/{id}/start` | RELEASED -> IN_PROGRESS |
| `POST` | `/api/warehouse-ops/material-requests` | Create MR manually for IN_PROGRESS WO |
| `GET` | `/api/warehouse-ops/material-requests` | List/Find MRs |
| `PUT` | `/api/warehouse-ops/material-requests/{id}/validate` | Preview stock availability |
| `PUT` | `/api/warehouse-ops/material-requests/{id}/complete` | Deduct stock, MR -> ISSUED |
| `PUT` | `/api/work-orders/{id}/complete` | WO -> COMPLETED, creates PENDING_QC instances |

---

## Partial Production (Edge Case)

If `quantityProduced` is less than the planned quantity (e.g., sending `3` when WO planned `5`):

- **Material loss**: Components already issued via MR are treated as irreversible consumption. The "missing" 2 units worth of materials are effectively scrapped in the audit log
- **PR state**: The linked PR returns to `APPROVED` (only if no other linked WO is `IN_PROGRESS`), allowing the team to create a new WO for the remaining deficit
- **New WO required**: A new Work Order must be created, started, and its own Material Request issued before the remaining units can be produced
