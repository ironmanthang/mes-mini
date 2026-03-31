# Procurement & Purchase Order (PO) Business Flows

> [!WARNING]
> **MVP SCOPE EXCLUSIONS:**
> - **No Supplier MOQs:** Minimum Order Quantities are ignored.
> - **No Bulk-Grouping:** Orders are NOT consolidated across multiple Production Requests (PR).
> - **No Grouped Expediting:** Follow-ups are handled per individual PO/Line item.
> - **No Financial Tracking:** We explicitly do NOT track invoices, payments ("hoàn tất thanh toán"), or AP in this MES.

> [!IMPORTANT]
**Core System Constraints:**
- **One PO = One Supplier:** A Purchase Order header is bound to a single `supplierId`. You cannot mix items from different suppliers in one PO.
- **Line-Item Linking (0..1):** The relationship between a `PurchaseOrderDetail` and a `ProductionRequest` is strictly **0..1**.
  - **Linked:** (Direct Routing) Exactly one `productionRequestId` per line item.
  - **Unlinked:** (General Stock) `productionRequestId` is `null`.
- **No Split-Linking:** A single line item **CANNOT** be linked to multiple PRs. (e.g., If you need 50 for PR-A and 50 for PR-B, you must create **two** separate line items on two seperated PO for the that two components, you cannot have two line items for the same component on the same PO).
- **Mixed PO Support:** A single PO can contain a mix of Linked and Unlinked items to optimize shipping and administration.
- **Immutable Links:** Once a PO is `ORDERED` (Sent to Supplier), the `productionRequestId` link becomes **IMMUTABLE**. You cannot re-allocate "in-flight" items to a different PR.

> [!CAUTION]
> **BOM Integrity Validation:**
> The system MUST validate that any component linked to a `productionRequestId` is actually present in that PR's Bill of Materials (BOM). You cannot "charge" a PR for parts it doesn't need.

---

## 1. Big Picture Overview


1. **System** identifies a material shortage for an upcoming `ProductionRequest` (PR).
2. **Purchaser** creates a new `PurchaseOrder` (Status: `DRAFT`) for a specific **Supplier**.
3. **Purchaser** adds `PurchaseOrderDetail` line items. 
   - For immediate PR needs, they link the specific `productionRequestId` (after the system validates the BOM).
   - For stock needs, they add unlinked items.
4. **Purchaser** submits the PO for approval (Status: `PENDING`).
5. **Manager** reviews the PO budget and constraints, then approves it (Status: `APPROVED`).
6. **Purchaser** formally dispatches the PO to the Supplier (Status: `ORDERED`).
7. **Supplier** physically ships the goods to the factory.
8. **Warehouse** begins receiving the shipment in physical boxes (Status: `RECEIVING`).
9. **System** mandates that every physical box must be registered as a `ComponentLot` (generating an internal Barcode e.g. `LOT-260328-001`) to ensure strict traceability.
10. **All received items** (Linked or Unlinked) go to general `ComponentStock`. There is **no staging area**. The PR link is tracked via `PurchaseOrderDetail.productionRequestId` only — not by physical warehouse segregation.
11. **Warehouse** completes the receipt of all items (Status: `COMPLETED`).
12. **System** updates PR status if all linked materials have arrived, unblocking the production line.

---

## 2. Individual Flows & Traceability
*(These physical receiving flows and `ComponentLot` constraints have been moved to [02_supplier_warehouse.md](./02_supplier_warehouse.md))*


---

## 3. Status Lifecycles

### Purchase Order Status
The PO lifecycle follows a strict sequence. **Cancellation is ONLY allowed from `PENDING` or `APPROVED` states.** DRAFTs use hard-delete (DELETE) instead — see Section 4 API Constraints. Once `ORDERED`, the contract is legally binding and the system locks out cancellation.
```
`DRAFT` (Optional) → `PENDING` → `APPROVED` → `ORDERED` → `RECEIVING` → `COMPLETED`
```

1. **DRAFT** (Nháp): Order created but not sent to management. *(Note: Draft is optional, users can create POs directly into Pending)*. Can freely edit or delete here. (DRAFTs cannot be cancelled — use DELETE.)
2. **PENDING** (Chờ duyệt): Submitted to management for budget review. Line items are frozen. 
   - **Cancellation Path:** If management rejects, status becomes **CANCELLED**.
3. **APPROVED** (Đã duyệt): Approved by management. Purchaser negotiates with the Supplier via external email/contract.
   - **Cancellation Path:** If the Supplier rejects terms/costs, status becomes **CANCELLED**. (No editing allowed; you must create an entirely new PO).
4. **ORDERED** (Đã đặt hàng): Supplier agreed to terms. Items are expected.
   - ⚠️ **CANCEL LOCKOUT:** From this state onward, the PO cannot be cancelled in the system. Any physical or financial disputes are handled legally via the contract.
5. **RECEIVING** (Đang nhập kho): Supplier physically delivering items. 
   - *Rule:* If there is a dispute, interruption, or short delivery, the PO stays in `RECEIVING` permanently.
6. **COMPLETED** (Hoàn tất): 100% of the actual ordered quantity is received and stored.
7. **CANCELLED** (Đã hủy): Terminal state for rejected POs prior to ordering.

### Purchase Order Detail Status
*Note: In our simplified MVP, **individual details** do not hold complex status enums; instead, fulfillment is derived mathematically.*

```text
STATUS = (quantityReceived == 0) ? PENDING : (quantityReceived < quantityOrdered) ? PARTIAL : FULFILLED
```

---

## 4. Key Rules / Callouts

> [!IMPORTANT]
> **Allocation Isolation (No Shared Pool)**
> - In this MVP, items ordered specifically for `PR-A` (Linked) cannot be "stolen" or used for `PR-B`, even if `PR-B` suddenly becomes a higher priority. 
> - To shift allocation, the original PO must be cancelled and re-created, or a new PO must be generated.


### API Contract Constraints (Status Management)
- **Creation (`POST /api/purchase-orders`)**: A new Purchase Order can ONLY be created in the `DRAFT` or `PENDING` states. Any payload attempting to create a PO directly into `APPROVED`, `ORDERED`, `RECEIVING`, `CANCELLED` or `COMPLETED` MUST be rejected with a 400 Bad Request.
- **Updating Data (`PUT /api/purchase-orders/:id`)**: The generic update endpoint is strictly for modifying mutable data. The backend enforces a strict Field-Mutability Matrix:
  - **DRAFT**: All fields (including financial fields like `taxRate`, `shippingCost`, and `details` array) are mutable.
  - **PENDING**: Financial fields are **FROZEN** to prevent bait-and-switch pricing during manager review. Only non-financial metadata (`note`, `expectedDeliveryDate`, `priority`) can be changed.
  - **APPROVED**: Further frozen to only allow `note` and `expectedDeliveryDate` (for supplier negotiation tracking).
  The backend MUST explicitly strip, ignore, or reject any `status` field included in the update payload. Note: The `supplierId` CANNOT be changed once a PO is created. If the user selected the wrong supplier, they must delete the `DRAFT` and create a new one.
- **State Transitions (Commands)**: Advancing a PO through its lifecycle MUST be handled by dedicated endpoints (e.g., `POST /api/purchase-orders/:id/approve` or `/submit`). This ensures state-specific side effects, concurrency locks, and Role-Based Access Control (RBAC) are properly enforced without creating a "God Function" in a generic update controller.
- **Cancellation (`POST /api/purchase-orders/:id/cancel`)**: Only permitted if the current PO status is `PENDING` or `APPROVED`. DRAFT POs cannot be cancelled — use DELETE instead. If the PO has reached `ORDERED` or beyond, the API MUST reject the request with a 400 Bad Request.
- **Deletion (`DELETE /api/purchase-orders/:id`)**: Hard-deletion is strictly limited to the `DRAFT` state (which only has a temporary code `D-PO-...`). Any PO that has progressed to `PENDING` or beyond CANNOT be hard-deleted; it must be cancelled instead to preserve the official `PO-YYYY-NNN` sequence.

### The Two-State Numbering Pattern
To prevent "Missing Sequence" audit failures caused by users creating and aggressively deleting drafts:
1. **Draft Phase**: The system assigns a temporary code prefix (e.g., `D-PO-YYMMDD-[ID]`). 
2. **Submission Phase**: The exact moment the user transitions the PO from `DRAFT` to `PENDING`, the backend mathematically generates and permanently assigns the official sequential code (e.g., `PO-2026-001`). 

### Visibility & Ownership (Role-Based Isolation)
- **DRAFT Isolation:** A Purchase Order in `DRAFT` status is strictly private to the user who created it (`employeeId`). The `GET /api/purchase-orders` endpoint MUST actively filter `DRAFT` POs so that users can only see their own drafts. Direct access (`GET /api/purchase-orders/:id`) to a draft by a different user MUST return a 403 Forbidden or 404 Not Found.
- **Public/Submitted Visibility:** Once a PO moves to `PENDING` or beyond, it becomes visible to authorized staff (Managers, Warehouse, etc.) according to standard RBAC rules.
- **DRAFT Filtering:** Any system dashboard or calculation assessing "expected spend" or "incoming materials" MUST exclude POs in `DRAFT` status to prevent Phantom Data from corrupting metrics.

---

---

## 5. Security & Architectural Constraints

### 5.1 The "No Split-Routing" Enforcement
The physical operations dictate that one delivery (PO) goes to one physical warehouse location.
- **Contract Lock (`createPO`, `updatePO`)**: The backend asserts that the selected `warehouseId` strictly belongs to a Warehouse of type `COMPONENT`. You cannot order raw materials into a `SALES` or `ERROR` warehouse (Warehouse Type Poisoning protection).
- **Execution Lock (`receiveGoods`)**: The API completely rejects any attempt by a frontend client to receive items into a `warehouseId` that does not perfectly match the `po.warehouseId` defined in the contract.

### 5.2 Defensive Integrity Guard (Double Lock)
When receiving goods, the system implements a strict "Double Lock" strategy to prevent inventory drift:
1. **Pre-flight Guard**: Validates that the requested `componentId` exists in the contract, and validates `qty(requested) <= qty(ordered) - qty(received)`.
2. **Optimistic Lock**: The database executes an atomic `updateMany` with a `where: { quantityReceived: { lte: Ordered - Incoming } }`. If two warehouse workers scan the exact same box milliseconds apart, the database catches the race condition and throws an HTTP 409 Conflict.
