# Production Request: Business Requirements (Current Codebase State)


## Module Boundaries
- **In scope**: Creating PRs, draft management, submission and feasibility checks, approval, cancellation, requirement calculation, and PO drafting support.
- **In scope (stable)**: Automatic PR status changes triggered by Purchase Order receive flow.
- **In scope (provisional)**: Work Order-driven PR status transitions are documented as current implementation only and are pending refactor.
- **Out of scope**: Direct PR-to-WO conversion API in PR routes (currently commented out and not active).

## Active API Surface
- **GET `/api/production-requests`**: List PRs with pagination and optional status filter.
- **POST `/api/production-requests`**: Create PR as draft by default, or submit immediately when `asDraft=false`.
- **PUT `/api/production-requests/:id`**: Update draft PR fields.
- **GET `/api/production-requests/:id`**: Get PR detail with fulfillments, PO links, and computed scheduling fields.
- **PUT `/api/production-requests/:id/submit`**: Submit draft for feasibility decision.
- **PUT `/api/production-requests/:id/approve`**: Approve pending PR (with self-approval block).
- **PUT `/api/production-requests/:id/recheck`**: Re-check WAITING_MATERIAL feasibility from PR snapshot.
- **GET `/api/production-requests/:id/draft-purchase-order`**: Return shortage-only component list for PO prefill.
- **PUT `/api/production-requests/:id/cancel`**: Cancel PR when cancellation guards pass.
- **GET `/api/production-requests/:id/requirements`**: Return MRP result for existing PR using snapshot logic.

## Permission Matrix (Route Layer)
- **PR_READ**: `GET /`, `GET /:id`, `GET /:id/requirements`.
- **PR_CREATE**: `POST /`.
- **PR_UPDATE**: `PUT /:id`, `PUT /:id/submit`, `PUT /:id/recheck`.
- **PR_APPROVE**: `PUT /:id/approve`.
- **PR_LINK_PO**: `GET /:id/draft-purchase-order`.
- **PR_CANCEL**: `PUT /:id/cancel`.

## Core Data And Statuses
- **Primary entity**: `ProductionRequest` with fields for quantity, product, creator, optional approver, optional Sales Order detail link, note, and lifecycle status.
- **Status enum**: `DRAFT`, `PENDING`, `WAITING_MATERIAL`, `APPROVED`, `IN_PROGRESS`, `FULFILLED`, `CANCELLED`.
- **Snapshot entity**: `ProductionRequestDetail` stores frozen per-component requirement data at submit time.

## Business Rules For Create And Draft
- **Quantity guard**: Quantity must be greater than zero.
- **BOM guard**: Product must exist and have at least one BOM row.
- **Code generation**: PR code uses `PR-YYYYMMDD-XXXX`, with retry on uniqueness collision.
- **MTS tagging**: If no `soDetailId`, note is auto-prefixed with `Manual Request (MTS)`.
- **Default mode**: `asDraft` defaults to true, so create stores `DRAFT` unless explicitly submitted.

## Sales Order Linked Rules
- **SO detail existence**: `soDetailId` must exist.
- **SO status guard**: Linked Sales Order must be `APPROVED` or `IN_PROGRESS`.
- **Product match guard**: PR `productId` must match linked SO detail product.
- **Quantity guard**: PR quantity cannot exceed remaining SO demand (`quantity - quantityShipped`).
- **Uniqueness guard**: Only one non-cancelled PR can exist for the same SO detail.
- **Coverage timing**: SO-linked guards are enforced on create, draft update, and submit.

## Submission And Feasibility Logic
- **Submit source**: Submit runs through a transactional helper that re-loads PR and checks `DRAFT` status.
- **Snapshot creation**: Submit writes `ProductionRequestDetail` rows from current BOM requirement calculation.
- **Feasibility decision**: MRP `canProduce=true` sets `PENDING`; otherwise sets `WAITING_MATERIAL`.
- **Atomicity**: Status update and snapshot creation occur in one transaction.
- **Immediate submit path**: `POST /` with `asDraft=false` creates DRAFT then submits in same transaction.

## MRP Calculation Model
- **Live BOM mode**: `calculateRequirements` uses current product BOM and current component stock.
- **Snapshot mode**: `calculateFromSnapshot` uses frozen `ProductionRequestDetail` rows for existing PRs.
- **Fallback mode**: If legacy PR has no snapshot rows, system falls back to live BOM calculation.
- **Requirements endpoint**: `GET /:id/requirements` always calls snapshot-oriented path.

## Recheck And Draft PO Behavior
- **Recheck eligibility**: Only `WAITING_MATERIAL` PRs can be rechecked.
- **Recheck actor guard**: Allowed for creator, `PROD_MGR`, or `SYS_ADMIN`.
- **Recheck outcome**: If shortages cleared, status transitions to `PENDING`; otherwise stays `WAITING_MATERIAL`.
- **Draft PO eligibility**: Only `WAITING_MATERIAL` PRs can call draft PO endpoint.
- **Draft PO output**: Returns shortage subset only (`missingQuantity > 0`), not full requirement list.
- **Important nuance**: Draft PO result can be `components: []` while PR is still `WAITING_MATERIAL` until explicit recheck is triggered.

## Approval Behavior
- **Approval eligibility**: Only `PENDING` PR can be approved.
- **Two-person rule**: Creator cannot approve their own PR.
- **Approval write**: Sets status `APPROVED`, `approverId`, and `approvedAt` timestamp.
- **Approval notification**: Sends notification to creator with type currently set to `PO_APPROVED`.

## Cancellation Behavior
- **Cancel actor guard**: Allowed for creator, `PROD_MGR`, or `SYS_ADMIN`.
- **Cancel status guard**: Cannot cancel if already `FULFILLED` or `CANCELLED`.
- **Work Order guard**: Any existing work-order fulfillment relation blocks PR cancellation.
- **Note behavior**: Cancellation reason is appended to note when provided.
- **PO traceability**: If linked PO details exist, warning with linked PO codes is appended to note.
- **Cancel write**: Final status becomes `CANCELLED`.

## Visibility And Retrieval Rules
- **Draft isolation in list**: Users can see all non-draft PRs plus only their own draft PRs.
- **Draft isolation by id**: Non-creator cannot view another user's draft PR.
- **List ordering**: Sorted by `createdAt DESC`.
- **List pagination**: Uses shared pagination utility (`page`, `limit`, `skip`).
- **Detail enrichments**: Single PR response includes `fulfilledQuantity` and `remainingQtyToSchedule`.

## Cross-Module PR Status Side Effects
- **Work Order createBulk (provisional)**: For `APPROVED` PRs, status can move immediately to `IN_PROGRESS` or `FULFILLED` based on scheduled fulfillment quantity.
- **Work Order start (provisional)**: Moves linked PR from `APPROVED` to `IN_PROGRESS` when work starts.
- **Work Order complete (provisional)**: Recomputes completed fulfillment totals; sets PR to `FULFILLED` when completed total meets PR quantity.
- **Work Order cancel (provisional)**: Recomputes linked PR status to `APPROVED`, `IN_PROGRESS`, or `FULFILLED` from remaining active fulfillments.
- **Purchase Order receive**: For linked `WAITING_MATERIAL` PRs, full receipt of linked PO details moves PR to `PENDING` and notifies `PRO_MANAGER` role.
- **Sales Order cancel side effect**: Linked active PRs are not auto-cancelled; system appends alert note for manual review.

## Reliability Note For Work Order Integration
- **Current status**: Work Order-related PR transitions above reflect what current code does, not final business policy.
- **Known issue**: WO logic is incorrect/incomplete and plans a dedicated revisit.
- **Documentation rule**: Treat WO bullets as temporary implementation notes until WO refactor is complete.
- **Update trigger**: After WO refactor, this section must be revised before calling the behavior final.

## Primary User Flows
### Flow: Draft-first planning
- **Step**: User creates PR with default `asDraft=true`.
- **System result**: PR saved in `DRAFT` without frozen requirement snapshot.
- **Step**: Creator edits draft fields as needed.
- **System result**: Draft can be updated only by creator while still in `DRAFT`.
- **Step**: Creator submits draft.
- **System result**: Snapshot is frozen and status becomes `PENDING` or `WAITING_MATERIAL`.

### Flow: Immediate submit
- **Step**: User creates PR with `asDraft=false`.
- **System result**: System creates draft and submits atomically in one transaction.
- **Outcome**: User receives PR in `PENDING` or `WAITING_MATERIAL` with snapshot details.

### Flow: Material shortage recovery
- **Step**: PR lands in `WAITING_MATERIAL`.
- **Step**: User requests draft PO data to see shortage-only component list.
- **Step**: Procurement receives goods through PO receiving process.
- **System result**: PR may be auto-moved to `PENDING` after full linked receipt.
- **Step**: User can run explicit recheck to confirm transition if needed.

### Flow: Approval to execution
- **Step**: Approver with `PR_APPROVE` approves `PENDING` PR.
- **System result**: PR becomes `APPROVED` with approver metadata.
- **Step**: Planner creates one or more work orders against approved PR.
- **System result (provisional)**: PR can shift to `IN_PROGRESS` or `FULFILLED` based on current WO scheduling and execution logic.


## Current Non-Goals And Known Gaps
- **Inactive endpoint**: PR `convert-to-work-order` endpoint remains commented out.
- **Update validation gap**: `PUT /:id` has no Joi validator attached at route level.
- **Status timing nuance**: PR can transition during WO creation, not only when WO starts.
- **WO reliability gap**: WO-driven PR status transitions are known unstable and should be treated as tentative until refactor.

