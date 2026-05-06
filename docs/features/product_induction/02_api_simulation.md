# Product Induction API — Frontend Integration Guide

**Scope**: Phase B (`POST /api/warehouse-ops/product-induction`). Phase A (QC Inspection) is covered in the Quality Check documentation.

---

## Integration Overview

The Warehouse Staff physically receives finished goods at the warehouse gate. They scan a batch of serial number barcodes into the frontend. The frontend sends the list in a single API call. 

**No Routing Logic in Frontend**: The frontend must never hardcode or look up `warehouseId` values before submitting. Routing is pre-configured at the Work Order level by the Production Manager. The backend resolves routing automatically:
- `PASSED_QC` instances → `WorkOrder.targetSalesWarehouseId` (`IN_STOCK_SALES`)
- `FAILED_QC` instances → `WorkOrder.targetErrorWarehouseId` (`IN_STOCK_ERROR`)

---

## API Contract

### Submitting the Batch

The Product Induction endpoint requires a user with the `WH_INDUCT` permission (e.g., `WH_STAFF` role). 

```http
POST /api/warehouse-ops/product-induction
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "serialNumbers": ["SN-QC-TEST-0001", "SN-QC-TEST-0002"]
}
```

### Batch Semantics: All-or-Nothing

Every call to this endpoint is a single atomic database transaction. If **any** serial number in the batch fails validation, the **entire batch is rejected** (no instances updated, no transactions logged).

Validation failures that trigger a `400 Bad Request`:
- One or more serial numbers do not exist.
- One or more instances are not in `PASSED_QC` or `FAILED_QC` status (e.g., still `PENDING_QC` or already inducted).
- The parent Work Order has a missing target warehouse configuration.

**Frontend Implication**: Display the backend `message` exactly as received. Ask the staff to remove or correct the problematic unit from the scanned list and resubmit.

---

## Response Handling

### Success (`200 OK`)

```json
{
  "totalInducted": 2,
  "inducted": [
    {
      "serialNumber": "SN-12345",
      "status": "IN_STOCK_SALES",
      "warehouseId": 3
    },
    {
      "serialNumber": "SN-67890",
      "status": "IN_STOCK_ERROR",
      "warehouseId": 4
    }
  ]
}
```

**What the Frontend Should Display:**
- Render a list or table of the `inducted` items.
- **Warehouse Name**: The `warehouseId` returned is numeric. The frontend should resolve the human-readable name by calling `GET /api/warehouse-ops/inventory` or using cached master data.
- **Status Badges**: Display the unit's new status as a pill/badge: `IN_STOCK_SALES` (e.g., green) or `IN_STOCK_ERROR` (e.g., red/amber).
- **Summary**: Show the `totalInducted` count as a confirmation summary (e.g., "2 units successfully inducted.").

### Errors (`400 Bad Request`)

Example response for a mixed batch where one unit is not ready:
```json
{
  "message": "The following instances are not ready for induction: SN-67890 (PENDING_QC). Only PASSED_QC and FAILED_QC instances can be inducted."
}
```

---

## Internal Backend Processes (For Reference)

While the frontend only sees the status change, the backend silently handles the following critical operations during induction:
- **Traceability**: Creates an `IMPORT_PRODUCTION` inventory transaction for every item.
- **FIFO Enforcement**: Stamps the `receivedAt` timestamp for both passed and failed units.
- **PR Attribution**: Automatically increments the `fulfilledQuantity` of the linked Production Request, but **only** for `PASSED_QC` units. Failed units are absorbed as losses and do not count towards PR fulfillment.
