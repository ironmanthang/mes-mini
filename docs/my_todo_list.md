# My To-Do List

## 1. Refine Production Request

### Architecture Decisions (Locked In)
- **PR Approval pattern:** Two-man rule — the Approver MUST be a different user who also has the `PRO_MANAGER` role (not the creator).
- **Submit flow:** On submit, system runs BOM check. If pass → `PENDING`. If fail → `WAITING_MATERIAL`. No human decision at this step.
- **Hybrid Transition Pattern:**
    - **Linked PO** (PO detail has `productionRequestId`): When all linked components are fully received, auto-transition PR from `WAITING_MATERIAL` → `PENDING`. Fire notification to `PRO_MANAGER` users via `PR_UNBLOCKED`. A second manager must still approve (`PENDING` → `APPROVED`).
    - **Unlinked PO**: No state change. Fire notification only: *"Materials received. Check blocked PRs."*
- **Approve flow:** `PENDING` → `APPROVED`. Requires a second `PRO_MANAGER` user. Guarded by `PR_APPROVE` permission.
- allow hard deletion for drafts.
 
---

### Schema Changes
- [x] model `ProductionRequest`:
    - [x] Delete `requestDate`.
    - [x] Add `approverId` (nullable FK → `Employee`) for Two-man Rule.
    - [x] Add `approvedAt` (nullable `DateTime`).
- [x] Update `ProductionRequestStatus` enum:
    - Add `DRAFT` (new).
    - Keep `PENDING`, `WAITING_MATERIAL`, `APPROVED`, `IN_PROGRESS`, `FULFILLED`, `CANCELLED`.
    - Remove `PARTIALLY_FULFILLED` (replaced by `IN_PROGRESS`).
- [x] Add `PR_APPROVE` permission to `PERM` constant and update seed.
- [x] Add `PR_UNBLOCKED` to `NotificationType` enum.

### Database Migration Strategy
- **Dev Environment Reset:** Since this is a dev environment, we used `docker compose exec backend prisma migrate reset` to drop and recreate the schema. We do NOT need to worry about manually migrating existing records with old statuses like `PARTIALLY_FULFILLED`.

### API Implementation (the api can be reference from the purchaseorderservice)
- [x] Refactor `ProductionRequestService.createRequest`:
    - Support two paths: "Save as Draft" (`DRAFT`) and "Submit" (`PENDING` or `WAITING_MATERIAL`).
    - **Fix:** Delay creating the BOM snapshot (`ProductionRequestDetail` rows) until the PR is actually "Submitted" (WAITING_MATERIAL or PENDING ). Drafts should not have frozen BOM snapshot, otherwise if the quantity/product changes while in DRAFT, the snapshot goes out of sync.
    - On "Submit": Call the Global BOM Check Algorithm to decide status.
- [x] Implement `PUT /api/production-requests/:id` (Update Draft):
    - Guard: Target PR MUST be in `DRAFT` status.
    - Allows updating `productId`, `quantity`, `priority`, `dueDate`, `soDetailId`, `note`.
- [x] Implement `PUT /api/production-requests/:id/submit`:
    - Transitions `DRAFT` → `PENDING` or `WAITING_MATERIAL` (via Global BOM Check Algorithm).
    - **Critical**: Uses `prisma.$transaction` to ensure PR status update and the frozen BOM snapshot generation (`ProductionRequestDetail` rows) happen atomically.
- [x] Implement `PUT /api/production-requests/:id/approve`:
    - Guard: Caller must have `PR_APPROVE` permission AND must NOT be the original creator (`employeeId`).
    - Guard: Caller must have `PRO_MANAGER` role.
    - Transitions `PENDING` → `APPROVED`.
    - Sets `approverId` and `approvedAt`.
- [x] **Fix** `ProductionRequestService.recheckFeasibility`:
    - Change target transition status from `APPROVED` → `PENDING` (since a manager must still approve).
- [x] **Fix** `ProductionRequestService.getAllRequests`:
    - Update `orderBy: { requestDate: 'desc' }` to `orderBy: { createdAt: 'desc' }` since `requestDate` is being deleted from the schema.
- [x] **Fix** `ProductionDashboardService`:
    - Update `orderBy: { requestDate: 'asc' }` to `orderBy: { createdAt: 'asc' }` to align with the schema change.
- [x] Automatic State Transition: Move PR to `IN_PROGRESS` when first linked Work Order starts.
- [x] Automatic State Transition: Move PR to `FULFILLED` when Sum of WO fulfillments >= PR quantity.
- [x] **Fix** auto-transition in `PurchaseOrderService.receiveGoods`: Change target status from `APPROVED` → `PENDING` for linked PRs. Add notification to `PRO_MANAGER` users via `notifyByRole('PRO_MANAGER', ...)` with `PR_UNBLOCKED` type.

## 2. Complete Work Order Module
- [ ] **WO-PR Synchronization Logic (ISA-95 Alignment):**
    - [x] Update `WorkOrderStatus` enum: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
    - [x] Refactor `WorkOrderService.createBulkWorkOrder`: Stop premature fulfillment. Set PR to `IN_PROGRESS` only.
    - [x] Refactor `WorkOrderService.completeWorkOrder`: Sum only *completed* WO quantities to transition PR to `FULFILLED`.
    - [x] Update `cancelWorkOrder`: Correctly revert PR status to `IN_PROGRESS` or `APPROVED`.
    - [x] Refactor `WorkOrderService` (AI cleanup): Remove all legacy `PARTIALLY_FULFILLED` guards/checks.
- [ ] **Frontend & Dashboard Support:**
    - [ ] Expose `remainingQtyToSchedule` (`quantity - sum(fulfillments)`) in `productionRequestController.ts` for Info Cards.
    - [ ] Implement and refine overall Work Order CRUD functionality.

## 3. Backlog
- [ ] Multilingual Framework (I18n)