# Procurement & Purchase Order (PO) Business Flows

> [!WARNING]
> **MVP SCOPE EXCLUSIONS:**
> - **No Supplier MOQs:** Minimum Order Quantities are ignored.
> - **No Bulk-Grouping:** Orders are NOT consolidated across multiple Production Requests (PR).
> - **No Grouped Expediting:** Follow-ups are handled per individual PO/Line item.
> - **No Financial Tracking:** We explicitly do NOT track invoices, payments, or AP in this MES.

> [!IMPORTANT]
**Core System Constraints:**
- **One PO = One Supplier:** A Purchase Order header is bound to a single `supplierId`. You cannot mix items from different suppliers in one PO.
- **Line-Item Linking (0..1):** The relationship between a `PurchaseOrderDetail` and a `ProductionRequest` is strictly **0..1**.
  - **Linked:** Exactly one `productionRequestId` per line item.
  - **Unlinked:** `productionRequestId` is `null`.
- **Mixed PO Support:** A single PO can contain both linked and unlinked line items.
- **Immutable PR Links:** Once a PO reaches `ORDERED`, any `productionRequestId` link on a detail becomes immutable. In-flight items cannot be reassigned to a different PR.
- **BOM Validation Required:** Any component linked to a PR must be present in that PR's BOM. The system rejects PO details that do not match the linked PR's bill of materials.

---

## 1. Big Picture Overview

1. A Production Request identifies a material shortage.
2. A Purchaser creates a PO for a specific supplier.
3. The Purchaser adds `PurchaseOrderDetail` items:
   - Linked items include `productionRequestId` for direct PR routing.
   - Unlinked items are general stock replenishment.
4. The Purchaser submits the PO from `DRAFT` to `PENDING`.
5. A Manager reviews and approves the PO, moving it to `APPROVED`.
6. The Purchaser sends the PO to the supplier, moving it to `ORDERED`.
7. When items arrive, Warehouse begins receiving the boxes and the PO transitions to `RECEIVING`.
8. Every received physical box is recorded as a `ComponentLot` for traceability.
9. Received quantities update `ComponentStock` in the designated `COMPONENT` warehouse.
10. When all ordered quantity is received, the PO moves to `COMPLETED`.
11. When PO lines linked to a PR are received, the system triggers `MrpService` to re-evaluate the PR's feasibility against its frozen BOM snapshot.
12. Only if the aggregate physical warehouse stock is mathematically proven to be sufficient (preventing partial unblocks from partial POs or stock sniping), the PR is unblocked and moved from `WAITING_MATERIAL` to `PENDING`.

---

## 2. Status Lifecycles

### Purchase Order Status
The PO lifecycle is:

```text
DRAFT → PENDING → APPROVED → ORDERED → RECEIVING → COMPLETED
```

- **DRAFT**: Optional starting point. Fully editable and deletable by the creator. Drafts are not cancellable.
- **PENDING**: Manager review stage. The PO is submitted for approval. Financial fields are frozen in this state.
- **APPROVED**: Manager approved the purchase. Most financial fields remain locked; only negotiation metadata can still change.
- **ORDERED**: The supplier order is placed. The PO is now legally binding and cannot be cancelled by the system.
- **RECEIVING**: Goods are actively being received. The PO stays in this state until all ordered quantities are received.
- **COMPLETED**: Receipt is finished and all ordered quantity has been stored.
- **CANCELLED**: Terminal state for POs cancelled before supplier ordering.

### Cancellation Rules
- Only `PENDING` or `APPROVED` POs may be cancelled.
- `DRAFT` POs must be deleted instead of cancelled.
- `ORDERED`, `RECEIVING`, and `COMPLETED` POs cannot be cancelled.
- When a PO is cancelled, any PR-PO link is dissolved and the linked PR remains in its current state.

### PR Link Behavior
- A linked PR in `WAITING_MATERIAL` is blocked by an active PO.
- Cancelling that PO releases the PR link and allows the PR to be rechecked or reproposed.

---

## 3. PO Creation & Editing Rules

- The API supports creating a PO in `DRAFT` or `PENDING` only.
- `DRAFT` offers full editability, including supplier, warehouse, financials, and details.
- `PENDING` preserves the review snapshot. Only metadata such as `note`, `expectedDeliveryDate`, and `priority` may change.
- `APPROVED` is further locked: only `note` and `expectedDeliveryDate` may be updated.
- `supplierId` cannot change after creation. A wrong supplier selection requires deleting the draft and starting over.
- If any quantity has already been received on a PO, its detail lines cannot be replaced or altered.

### Field Mutability by Status
- `DRAFT`: all fields mutable.
- `PENDING`: financial fields and line items are locked; only metadata updates allowed.
- `APPROVED`: only `note` and `expectedDeliveryDate` are editable.
- `ORDERED` / `RECEIVING` / `COMPLETED` / `CANCELLED`: fully locked.

---

## 4. Command-Based State Transitions

- State changes are not performed through generic update endpoints.
- The system uses dedicated command endpoints for transitions such as:
  - `POST /api/purchase-orders/:id/submit`
  - `POST /api/purchase-orders/:id/approve`
  - `POST /api/purchase-orders/:id/send-to-supplier`
  - `POST /api/purchase-orders/:id/cancel`
  - `POST /api/purchase-orders/:id/receive`
- This keeps lifecycle logic explicit and ensures RBAC and business guards are correctly applied.

---

## 5. Traceability & Warehouse Constraints

- Every received box becomes a `ComponentLot`.
- Received quantities update the warehouse's `ComponentStock`.
- Receipt must happen into the PO's assigned `COMPONENT` warehouse only.
- The system rejects any receive operation that targets a different warehouse than the PO's destination.

---

## 6. Purchase Order Numbering

- Draft POs get a temporary placeholder code like `D-PO-YYMMDD-[ID]`.
- When a draft is submitted, the system generates a permanent sequential official code like `PO-2026-001`.
- This prevents audit gaps if drafts are created and deleted freely.

---

## 7. Visibility and Draft Isolation

- Draft POs are private to their creator.
- Other users cannot see another user's draft POs.
- Once a PO reaches `PENDING` or later, authorized staff may view it according to RBAC.
- Dashboards and spend calculations must exclude `DRAFT` POs.

---

## 8. Implementation Notes

- The backend must validate linked PO details against the PR BOM.
- The backend must prevent duplicate component line items within the same PO draft.
- The backend must reject PO receive operations when the total received would exceed the ordered quantity.
- The backend should treat `ORDERED`, `RECEIVING`, `COMPLETED`, and `CANCELLED` as non-editable states.
