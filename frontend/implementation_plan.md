# Implementation Plan — Material Request Logic Alignment

This plan outlines the remaining frontend fixes needed for Material Requests to conform to backend rules and remove mock/fake interactions. The Work Order details and configuration fixes have already been successfully implemented in this session.

---

## Architectural Context (Audit Notes)

The Work Orders and Material Requests pages handle shop floor transitions:
- **DRAFT** configures warehouses and lines, then transitions to **RELEASED**.
- **RELEASED** transitions to **IN_PROGRESS**.
- **IN_PROGRESS** tracks material usage and outputs a production batch to complete the order (**COMPLETED**).

### Completed in this Session:
1. **View Details (Data Gap):** Resolved. Clicking "View Details" now fetches the full `WorkOrderDetail` by ID from the API before opening the modal.
2. **Record Output (Schema Gap):** Resolved. Added UI inputs for `laborCost` and `overheadCost`, validated them, and mapped the payload keys correctly to the backend's expected `CompleteWorkOrderRequest`.
3. **Draft Configuration (Action Gap):** Resolved. Added a configuration button to DRAFT work orders and built the `ConfigureWorkOrderModal` component to update draft configurations.

### Remaining Mismatches (To be implemented next session):
1. **Creating Duplicate Requests:** The "+ New Request" modal dropdown displays all `IN_PROGRESS` Work Orders instead of filtering out orders that already have an MR, which leads to duplicate requests and API errors.
2. **Mock Cancellation:** The PENDING requests list shows a manual "Cancel" button that just alerts success locally without calling any API (since the backend does not support manual cancellation of MRs; they are cancelled automatically when the parent Work Order is cancelled).

---

## Proposed Changes (Remaining Tasks)

### Component: Material Requests Alignment

#### [MODIFY] [NewMaterialRequestModal.tsx](file:///d:/program/mes-mini/frontend/src/screens/NewMaterialRequestModal.tsx)
- In the `useEffect` loading work orders for the dropdown, update the service call to fetch only eligible work orders:
  ```typescript
  WorkOrderServices.getAllWorkOrders({ limit: 500, missingMR: true })
  ```
  This ensures that `IN_PROGRESS` Work Orders that already have a linked Material Request (in `PENDING` or `ISSUED` status) are filtered out, avoiding duplicate MR creation.

#### [MODIFY] [MaterialRequests.tsx](file:///d:/program/mes-mini/frontend/src/screens/MaterialRequests.tsx)
- Remove the `handleCancel` function.
- Remove the mock manual "Cancel" button from the action column rendering for `PENDING` requests, as the backend does not expose a manual cancel API (MR cancellation is automated via the parent Work Order's cancellation).

---

## Completed Changes (Already in Codebase)

The following changes have already been written to the codebase in this session and do not need to be re-implemented:
- [x] Mapped `CompleteWorkOrderRequest` payload type in [workOrderServices.ts](file:///d:/program/mes-mini/frontend/src/services/workOrderServices.ts).
- [x] Integrated full detail loading and DRAFT Configure trigger in [WorkOrders.tsx](file:///d:/program/mes-mini/frontend/src/screens/Production/components/WorkOrders.tsx).
- [x] Added `laborCost` and `overheadCost` inputs to [RecordOutputModal.tsx](file:///d:/program/mes-mini/frontend/src/screens/Production/components/RecordOutputModal.tsx).
- [x] Created [ConfigureWorkOrderModal.tsx](file:///d:/program/mes-mini/frontend/src/screens/Production/components/ConfigureWorkOrderModal.tsx).

---

## Verification Plan (Remaining Tasks)

### Manual Verification
1. **Material Requests Dropdown Filter:**
   - Go to `http://localhost:5173/production/material-requests`.
   - Click **+ New Request** and open the dropdown.
   - Verify that Work Orders that already have an active/pending Material Request (e.g. `WO-DEMO-PR008`) do **not** appear in the list.
2. **Cancellation Button Check:**
   - Verify that there are no manual mock "Cancel" (`XCircle`) buttons next to PENDING requests on the Material Requests screen.
