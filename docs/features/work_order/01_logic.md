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
    [DRAFT] -----> [CANCELLED]
       |
     (Release)
       v
   [RELEASED] -----> [CANCELLED]
       |
    (Start Work)
       | (Triggers Material Request)
       v
 [IN_PROGRESS]
       | \
       |  \ (Cancel with reason required)
       |   \
       |    > [CANCELLED]
       |
   (Complete Work, only if MR is ISSUED)
       | (Generates Batch, Serial Nos., Inventory Logs)
       v
  [COMPLETED]
```

## Flow Breakdown

### Planning Work Orders (Creation)
**Purpose**: Plan manufacturing execution by linking one or more actionable Production Requests to a tangible shop-floor task.

- **Steps**:
  - `[User]` Selects grouping of Production Requests (or limits quantities per request).
  - `[System]` Validates all selected requests are for the identical product and currently actionable.
  - `[System]` Checks if sufficient raw materials exist in inventory (Does not block creation if missing, just logs a warning).
  - `[System]` Derives the overarching quantity and computes the earliest due date for the batch.
  - `[System]` Generates a unique traceable code for the Work Order.
  - `[User]` While in `DRAFT`, configures QC routing via `PUT /api/work-orders/:id`:
    - `targetSalesWarehouseId` — where PASSED_QC units are inducted (must be a `SALES` warehouse).
    - `targetErrorWarehouseId` — where FAILED_QC units are sent (must be an `ERROR` warehouse).
- **Paths**:
  - **Happy Path**: Successfully planned. Work Order is created and linked to selected requests.
  - **Edge Case (Missing Materials)**: Work Order still goes to `DRAFT`, system logs a warning, but enforcement waits for the warehouse flow before completion.
- **State Changes**:
  - Work Order -> `DRAFT`
  - Linked Production Request -> no fulfillment-state advancement at planning time.

### Releasing Work Orders
**Purpose**: Lock planning and mark the Work Order ready for execution.

- **Steps**:
  - `[User]` triggers release on a DRAFT Work Order.
  - `[System]` validates current status is DRAFT.
  - `[System]` **enforces Release Gate**: blocks release if `targetSalesWarehouseId` or `targetErrorWarehouseId` is not configured.
- **State Changes**:
  - Work Order -> `RELEASED`

### Starting Production
**Purpose**: Officially commence work on the shop floor and notify the warehouse that materials are actively required.

- **Steps**:
  - `[User]` Triggers the start action on a specific RELEASED Work Order.
  - `[System]` Auto-generates a Material Request, signaling warehouse operators to pick and transport the necessary raw components to the production line.
  - `[System]` Propagates status to linked PR and SO where allowed by state protections.
- **Paths**:
  - **Happy Path**: Request is successfully sent to warehouse and work execution begins.
- **State Changes**:
  - Work Order -> `IN_PROGRESS`
  - Linked Production Request -> `IN_PROGRESS` when applicable.
  - Linked Sales Order -> `IN_PROGRESS` when applicable.

### Completing Production
**Purpose**: Record finished goods, generate traceability records, and inject the newly produced stock into the active warehouse.

- **Steps**:
  - `[User]` Submits the completed output quantity, and optionally provides custom batch codes or expiry dates.
  - `[System]` Verifies the linked Material Request has status `ISSUED` before allowing completion.
  - `[System]` Registers a Production Batch to encapsulate the ongoing run.
  - `[System]` Generates strictly unique Serial Numbers for every individual unit yielded from the process.
  - `[System]` Logs individual inventory transactions and creates product instances as `PENDING_QC`.
- **Paths**:
  - **Happy Path**: Manufactured items are seamlessly serialized and securely deposited into the warehouse structure.
  - **Failure Case**: Attempting to complete with 0 or negative items will be immediately rejected to maintain data integrity.
- **State Changes**:
  - Work Order -> `COMPLETED`
  - New Product Instances -> `PENDING_QC`
- **Fulfillment Timing**:
  - PR does not become `FULFILLED` on WO completion alone.
  - PR fulfillment is driven later by QC-passing units that transition to `IN_STOCK_SALES`.

### Cancelling a Work Order
**Purpose**: Abort an existing Work Order and accurately return the demanded capacity back to the parent Production Requests.

- **Steps**:
  - `[User]` Cancels the Work Order.
  - `[System]` Allows cancellation only from `DRAFT`, `RELEASED`, or `IN_PROGRESS`.
  - `[System]` Requires cancellation reason when current status is `IN_PROGRESS`.
  - `[System]` Cancels linked open MR (`PENDING`) and keeps issued-consumption records as irreversible audit evidence.
  - `[System]` Re-evaluates linked PR/SO progression according to active in-progress links.
- **Paths**:
  - **Happy Path**: The executing Work Order is rendered obsolete; underlying Production Requests correctly recalculate their fulfillment limits so fresh plans can be remade.
- **State Changes**:
  - Work Order -> `CANCELLED`
  - Linked Production Request -> returns to `APPROVED` only when no other linked WO remains `IN_PROGRESS`; otherwise remains `IN_PROGRESS`.
  - Linked Sales Order -> may return to `APPROVED` only when no linked PR remains `IN_PROGRESS` and the SO is not in a protected terminal shipping state.

## Related Flow

- **Material Request**: Detailed MR lifecycle is documented in material_request/01_logic.md.
- **Coupling Rule**: Work Order flow in this document remains dependent on MR issue completion rules.

## Constraints and Rules
- **Homogeneous Grouping**: Generating consolidated Work Orders for differently schemed products is severely prohibited.
- **QC Routing Gate**: A Work Order cannot be released unless both `targetSalesWarehouseId` (SALES type) and `targetErrorWarehouseId` (ERROR type) are configured.
- **Routing Type Enforcement**: `targetSalesWarehouseId` must be a `SALES` warehouse; `targetErrorWarehouseId` must be an `ERROR` warehouse. Wrong types are rejected at update time.
- **Update Window**: `PUT /api/work-orders/:id` is only valid when status is `DRAFT`. Released or active WOs cannot be reconfigured.
- **Completion Gate**: A Work Order cannot be completed unless a linked Material Request is `ISSUED`.
- **Cancellation Scope**: Cancellation is valid only from `DRAFT`, `RELEASED`, or `IN_PROGRESS`; reason required for `IN_PROGRESS`.
- **Immutable Termination**: Once a Work Order reaches `COMPLETED` or `CANCELLED`, it remains terminal.
- **Strict Traceability**: Every produced unit is assigned a unique serial tied to its Production Batch and Work Order.
