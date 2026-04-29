# Transfer Request (Warehouse-to-Warehouse Relocation)

**Status:** Finalized & Implemented

---

## Purpose

The `TransferRequest` module handles standalone physical stock relocations between warehouses. It is **not** linked to Work Orders or Production Requests. Its sole concern is the physical movement of existing inventory.

---

## Core Rules

- **Type-locked routing**: `entityType` determines which warehouse types are valid. `COMPONENT` transfers must move between COMPONENT warehouses. `PRODUCT` transfers must move between SALES warehouses.
- **No blind relocations**: Every completion requires the receiving warehouse staff to physically scan each item. No item count alone is accepted.
- **Atomic completion**: On completion, `warehouseId` updates on the moved lots/instances and `InventoryTransaction(type: TRANSFER)` records are written in a single database transaction.

---

## Lifecycle

```
[PENDING] ──── (scan & submit) ────> [COMPLETED]
```

Two statuses only. Cancellation is out of scope for MVP.

---

## API Contracts

### Create — `POST /api/warehouse-ops/transfer-requests`

**Permission:** `TR_MANAGE`

```json
{
  "sourceWarehouseId": 1,
  "targetWarehouseId": 2,
  "entityType": "COMPONENT",
  "note": "optional",
  "details": [
    { "entityId": 5, "quantity": 100 }
  ]
}
```

**Validation rules:**
- `sourceWarehouseId !== targetWarehouseId`
- At least one detail line required
- `entityId` is `componentId` when `entityType = COMPONENT`, `productId` when `PRODUCT`
- Warehouse types must match `entityType`

### Complete — `PUT /api/warehouse-ops/transfer-requests/:id/complete`

**Permission:** `TR_MANAGE`

```json
{
  "scannedItems": [
    {
      "detailId": 1,
      "lots": [
        { "lotCode": "LOT-20260428-1234", "quantity": 100 }
      ]
    }
  ]
}
```

For `PRODUCT` transfers, use `instances` instead of `lots`:

```json
{
  "scannedItems": [
    {
      "detailId": 2,
      "instances": [
        { "serialNumber": "SN-ABC-001" }
      ]
    }
  ]
}
```

**Enforcement rules on completion:**
- Every detail line in the TR must have a matching scanned entry
- For COMPONENT: total scanned lot quantity must equal the detail `quantity`
- For PRODUCT: scanned instance count must equal the detail `quantity`
- Lot/instance must physically reside in `sourceWarehouseId` before completion
- `ProductInstance` must be in `IN_STOCK_SALES` status to be transferred

### List — `GET /api/warehouse-ops/transfer-requests`

**Permission:** `TR_READ`

Query params: `status`, `page`, `limit`

### Get by ID — `GET /api/warehouse-ops/transfer-requests/:id`

**Permission:** `TR_READ`

---

## Inventory Impact

On `COMPLETE`, for each scanned item:

| Operation | Effect |
|---|---|
| `ComponentLot.warehouseId` | Updated to `targetWarehouseId` |
| `ComponentStock` (source) | Decremented |
| `ComponentStock` (target) | Upserted (incremented or created) |
| `ProductInstance.warehouseId` | Updated to `targetWarehouseId` |
| `InventoryTransaction` | Created with `type: TRANSFER` |
| `TransferRequestLot` | Bridging record created |
| `TransferRequestInstance` | Bridging record created |

---

## Permissions

| Code | Description |
|---|---|
| `TR_READ` | View transfer requests |
| `TR_MANAGE` | Create and complete transfer requests |

---

## Code Generation

Format: `TR-YYYYMMDD-RRRR` (e.g., `TR-20260428-4821`)

Uses a retry loop (max 3 attempts) on `P2002` unique constraint collision.
