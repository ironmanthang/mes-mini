# Material Request (Production Issue) Business Flow

> [!NOTE]
> **IN-SCOPE**: Material Request creation from Work Order start, warehouse validation/completion, stock deduction, inventory transaction logging, and cancellation coupling with Work Orders.  
> **OUT-OF-SCOPE**: Purchase receiving, standalone warehouse transfer flows, and machine-side consumption telemetry.

## Overview
Material Request (MR) controls component consumption from COMPONENT warehouse to active production Work Orders.

```text
[Work Order RELEASED]
       |
    (Start)
       v
[Work Order IN_PROGRESS]
       |
(Manually create MR)
       v
 [MR PENDING] -----> [MR CANCELLED]
       |                  ^
       |                  |
(Validate stock)          | (Parent WO cancelled while MR still open)
       |
(Complete issue: atomic deduction + transaction logs)
       v
 [MR ISSUED]
```

## Flow Breakdown

### Manual Creation from Work Order
- **Trigger**: Production staff explicitly calls the MR creation API.
- **Precondition**: The associated Work Order must be in `IN_PROGRESS` status.
- **Behavior**: System creates one pending MR for the Work Order. It is idempotent (will return existing pending MR if one already exists for that WO).
- **Quantity Source**: Material lines are aggregated from linked Production Request BOM snapshots; legacy data without snapshots falls back to master BOM.
- **Result**: MR is created in `PENDING`.

### Validate Request
- **Purpose**: Run a read-only stock sufficiency check before any inventory mutation.
- **Input**: `warehouseId` and target `requestId`.
- **Behavior**: System evaluates each line and returns required quantity, available quantity, missing quantity, and `canIssue` summary.
- **Result**: No stock changes occur in this step.

### Complete Request (Lot-Level Traceability)
- **Precondition**: MR status is `PENDING` and all lines are sufficiently available at completion time.
- **Scanner-First Validation**: The API requires a `consumedLots` payload containing specific lot barcodes (`lotCode`) and quantities. The system mathematically proves the sum of scanned lots perfectly matches the requested component quantity.
- **Atomic Processing**: The system decrements the specific `ComponentLot.currentQuantity`, decrements the aggregate `ComponentStock`, and writes immutable `EXPORT_PRODUCTION` inventory transactions (which log the `lotCode` in the note) in a single transaction.
- **Concurrency Safety**: If concurrent stock updates cause shortage, the request fails and no partial issue is committed.
- **Result**: MR becomes `ISSUED`, and completion metadata (`completedBy`, `completedAt`) is recorded.

### Cancellation Coupling with Work Order
- **Pending MR**: If parent WO is cancelled while MR is `PENDING`, MR is auto-cancelled.
- **Issued MR**: If MR is already `ISSUED`, issued quantity is treated as irreversible consumption and kept as audit evidence.

## Statuses
- **PENDING**: Manually created from IN_PROGRESS WO and waiting for warehouse completion.
- **ISSUED**: All lines have been issued and inventory has been decremented.
- **CANCELLED**: Request is voided because parent WO was cancelled before issue completion.

## Constraints and Rules
- **Two-Step Warehouse Process**: Validate first, complete second.
- **Work Order Completion Gate**: A Work Order cannot be marked `COMPLETED` unless linked MR status is `ISSUED`.
- **Allocation Flexibility**: A component requirement can be fulfilled from multiple lots as long as total issued quantity meets required quantity.
- **Scope Boundary**: MR is only for production consumption; general warehouse relocation uses TransferRequest flow.
