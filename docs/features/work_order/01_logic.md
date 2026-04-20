# Work Order (Factory Floor) Business Flow

> [!NOTE]
> **IN-SCOPE**: Work Order planning, grouping, starting production, completing items into inventory, and cancellation.  
> **OUT-OF-SCOPE**: Detailed Material Requirements Planning (MRP), raw material issuance logic, shift scheduling, and physical machine integrations.

## Overview
The Work Order (WO) module represents the actual shop-floor execution to fulfill requested manufacturing demand (Production Requests). It manages the lifecycle of production batches from initial planning to final inventory deposit.

```text
[Production Request] 
       | (Drafted -> Approved)
       v
[Work Order Planning]
       | (Checks Material, Groups Requests)
       v
   [PLANNED] -----> [CANCELLED]
       |
  (Start Work)
       | (Triggers Material Request)
       v
 [IN_PROGRESS]
       |
  (Complete Work)
       | (Generates Batch, Serial Nos., Inventory Logs)
       v
  [COMPLETED]
```

## Flow Breakdown

### 1. Planning Work Orders (Creation)
**Purpose**: Plan manufacturing execution by linking one or more actionable Production Requests to a tangible shop-floor task.

- **Steps**:
  - `[User]` Selects grouping of Production Requests (or limits quantities per request).
  - `[System]` Validates all selected requests are for the identical product and currently actionable.
  - `[System]` Checks if sufficient raw materials exist in inventory (Does not block creation if missing, just logs a warning).
  - `[System]` Derives the overarching quantity and computes the earliest due date for the batch.
  - `[System]` Generates a unique traceable code for the Work Order.
- **Paths**:
  - **Happy Path**: Successfully planned. Production Request states transition accordingly to reflect fulfillment progress.
  - **Edge Case (Missing Materials)**: Work Order still goes to `PLANNED`, system logs a warning, but enforcement waits for the warehouse to fulfill missing materials later down the line.
- **State Changes**:
  - Work Order -> `PLANNED`
  - Linked Production Request -> Transitions to `PARTIALLY_FULFILLED` or `FULFILLED` depending on coverage.

### 2. Starting Production
**Purpose**: Officially commence work on the shop floor and notify the warehouse that materials are actively required.

- **Steps**:
  - `[User]` Triggers the start action on a specific PLANNED Work Order.
  - `[System]` Auto-generates a Material Request, signaling warehouse operators to pick and transport the necessary raw components to the production line.
- **Paths**:
  - **Happy Path**: Request is successfully sent to warehouse and work execution begins.
- **State Changes**:
  - Work Order -> `IN_PROGRESS`

### 3. Completing Production 
**Purpose**: Record finished goods, generate traceability records, and inject the newly produced stock into the active warehouse.

- **Steps**:
  - `[User]` Submits the completed output quantity, and optionally provides custom batch codes or expiry dates.
  - `[System]` Registers a Production Batch to encapsulate the ongoing run.
  - `[System]` Generates strictly unique Serial Numbers for every individual unit yielded from the process.
  - `[System]` Logs individual Inventory Transactions and instantiates physical products into stock exactly mapped to the target warehouse.
- **Paths**:
  - **Happy Path**: Manufactured items are seamlessly serialized and securely deposited into the warehouse structure.
  - **Failure Case**: Attempting to complete with 0 or negative items will be immediately rejected to maintain data integrity.
- **State Changes**:
  - Work Order -> `COMPLETED`
  - New Inventory Units -> `IN_STOCK`

### 4. Cancelling a Work Order
**Purpose**: Abort an existing Work Order and accurately return the demanded capacity back to the parent Production Requests.

- **Steps**:
  - `[User]` Cancels the Work Order and provides an explicit cancellation reason.
  - `[System]` Verifies the Work Order has not definitively finished or been previously cancelled.
  - `[System]` Re-evaluates all parent Production Requests without this specific Work Order's structural contribution.
- **Paths**:
  - **Happy Path**: The executing Work Order is rendered obsolete; underlying Production Requests correctly recalculate their fulfillment limits so fresh plans can be remade.
- **State Changes**:
  - Work Order -> `CANCELLED`
  - Linked Production Request -> Reverts backwards to `PARTIALLY_FULFILLED` or completely back to baseline `APPROVED`.

## Inventory Traceability: Component Lots

When raw materials are received or issued, the system tracks them down to the physical box level using `ComponentLot` records.

- **Quantity Strategy**: Each lot uses a Dual-Quantity approach for real-time warehouse visibility:
  - `initialQuantity`: The immutable quantity delivered by the supplier.
  - `currentQuantity`: The mutable "remaining balance" in the box. This is decremented atomically whenever components are picked for a Work Order.
- **Traceability Linkage**: Every `InventoryTransaction` that involves a lot-tracked component must eventually link back to its `componentLotId` (Planned improvement). This ensures a perfect audit trail from the Purchase Order receipt to the final Work Order consumption.

## Constraints and Rules
- **Homogeneous Grouping**: Generating consolidated Work Orders for differently schemed products is severely prohibited.
- **Immutable Termination**: Once a Work Order permanently enters `COMPLETED` or `CANCELLED` status, it relies exclusively on historical audit tracking. Its status cannot be mutated backwards.
- **Strict Traceability**: Every individually produced unit is forcibly assigned a permanent, unique Serial Number securely tied back to its originating Work Order and Production Batch upon completion. No bulk anonymous outputs are permitted.
