# Purchase Order (PO) Module — Frontend Integration Guide

This guide is the single source of truth for frontend developers integrating with the Purchase Order backend. It describes the lifecycle, role-based access, and data constraints of the module.

---

## 1. Core Concepts & Lifecycle

### 1.1 Status Enum (`PurchaseOrderStatus`)
| Status | Meaning |
| :--- | :--- |
| `DRAFT` | **Private** draft. No official code yet (uses `D-PO-...`). Only the creator can see/edit. |
| `PENDING` | Submitted for approval. Financial fields are frozen. High-level sequential `PO-YYYY-NNN` assigned. |
| `APPROVED` | Manager has approved the budget. Purchaser is negotiating with the supplier. |
| `ORDERED` | Contract is signed/sent. **Legally binding** — cancellation is now blocked. |
| `RECEIVING` | Goods are arriving in the warehouse box-by-box. |
| `COMPLETED` | 100% of quantity has been physically received. |
| `CANCELLED` | Terminal state for rejected/voided orders (pre-ORDERED only). |

### 1.2 State Transition Commands
Do NOT use a generic `PUT` to change status. Every state change is a dedicated `POST` action:


---

## 2. Roles & Permissions (RBAC)

| Endpoint | Action | Allowed Roles | Ownership Rule |
| :--- | :--- | :--- | :--- |
| `GET /` | List POs | All | Users only see their own `DRAFT` POs. |
| `POST /` | Create PO | Admin, Purchasing Staff | Can create as `DRAFT` or `PENDING`. |
| `PUT /:id` | Update data | Admin, Purchasing Staff | Only the creator can edit their `DRAFT`. |
| `DELETE /:id` | Delete PO | Admin, Purchasing Staff | Only possible if status is `DRAFT`. |
| `POST /:id/submit`| Submit | Admin, Purchasing Staff | Only the creator can submit. |
| `POST /:id/approve`| Approve | Admin, Production Manager | Cannot approve your own PO. |
| `POST /:id/cancel` | Cancel | Admin, Purchasing Staff, Manager| Pre-ORDERED only. |
| `POST /:id/receive`| Receive | Admin, Purchasing Staff | Locked to `ORDERED` or `RECEIVING`. |

---

## 3. The Mutability Matrix (`PUT /:id`)

The frontend should disable/hide inputs based on the current PO status. The backend will reject updates to frozen fields with a `400 Bad Request`.

| Field Group | Field Name | DRAFT | PENDING | APPROVED | ORDERED+ |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Header** | `taxRate`, `shippingCost`, `warehouseId` | ✅ | ❄️ **Frozen** | ❄️ **Frozen** | ❌ Locked |
| **Contract**| `paymentTerms`, `deliveryTerms` | ✅ | ❄️ **Frozen** | ❄️ **Frozen** | ❌ Locked |
| **Details** | `details` (line items array) | ✅ | ❄️ **Frozen** | ❄️ **Frozen** | ❌ Locked |
| **Metadata** | `note`, `expectedDeliveryDate` | ✅ | ✅ | ✅ | ❌ Locked |
| **Priority** | `priority` | ✅ | ✅ | ❄️ **Frozen** | ❌ Locked |

> **Recalculation Rule:** When updating financial fields in `DRAFT`, the backend automatically recomputes `totalAmount`.

---

## 4. Endpoint Reference

### 4.1 Create PO (`POST /api/purchase-orders`)
Used for both starting a draft and direct submission.
*   **Default**: Creates `DRAFT` with code `D-PO-YYMMDD-{id}`.
*   **Direct Submit**: Send `"status": "PENDING"` to immediately assign an official `PO-YYYY-NNN` code.
*   **Constraint**: `supplierId` is mandatory and immutable. One PO = One Supplier.

### 4.2 Submit PO (`POST /api/purchase-orders/:id/submit`)
Turns a private `DRAFT` into a public `PENDING` order.
*   **Visual Change**: The code changes from a draft number to an official sequence number.
*   **Trigger**: Use this when the user clicks "Send for Approval".

### 4.3 Cancel PO (`POST /api/purchase-orders/:id/cancel`)
*   **Use-case**: Manager rejects the order OR Supplier rejects the agreement.
*   **Allowed Statuses**: `PENDING`, `APPROVED`.
*   **Result**: Status becomes `CANCELLED`. Official code is preserved for audit.

### 4.4 Receive Goods (`POST /api/purchase-orders/:id/receive`)
Implements the **Box-Level Receiving (Slap Rule)**. Each entry in the `items` array represents **one physical box**.

**Payload Format:**
```json
{
  "items": [
    { "componentId": 1, "quantity": 50, "warehouseId": 1 },
    { "componentId": 1, "quantity": 25, "warehouseId": 1 }
  ]
}
```
*   **Effect**: The example above creates **two** `ComponentLot` records (two boxes).
*   **Validation**: Backend checks `qtyReceived +Incoming <= qtyOrdered`.
*   **Concurrency**: If two workers scan simultaneously, one will receive a `409 Conflict`. UI should tell the user to refresh.

### 4.5 Attachments Flow (Cloudflare R2)
*   **Step 1. Request Upload:** `POST /api/purchase-orders/:id/attachments/request-upload`
    *   **Body:** `{ "fileName": "contract.pdf", "mimeType": "application/pdf", "fileSize": 1024, "category": "CONTRACT" }`
    *   **Returns:** `uploadUrl` (Presigned PUT URL) and `fileKey`.
*   **Step 2. Direct R2 Upload:** Send raw file bytes `PUT` directly to the `uploadUrl`.
*   **Step 3. Confirm Database:** `POST /api/purchase-orders/:id/attachments/confirm`
    *   **Body:** `{ "fileKey": "purchase-orders/X/Y.pdf", "fileName": "contract.pdf", ... }`
*   **View Attachments:** `GET /api/purchase-orders/:id/attachments`
    *   Returns array with `downloadUrl` (Presigned GET URL).

---

## 5. Integration Rules for Frontend

1.  **Two-State Numbering**: Display the `code` field prominently. Users need to know if they are looking at a "Draft" (`D-PO-...`) or an "Official" (`PO-...`) order.
2.  **DRAFT Isolation**: If a user tries to access a `DRAFT` they didn't create via a direct URL link, the backend returns a `403 Forbidden`.
3.  **BOM Validation**: When adding a component to a PO line item that is linked to a PR, expect a `400` error if the component is not in the PR's Bill of Materials.
4.  **The "Box" UI**: After a successful `POST /receive`, the API response contains the generated `lotCode`s. The frontend should immediately show these as barcodes (QR/JsBarcode).
5.  **Attachment Upload Limit**: Files cannot exceed 20MB. Prevent upload attempt on the client-side BEFORE calling the request URL endpoint.
6.  **Attachment Mutability Guards**: The UI should hide "Upload" and "Delete" buttons for Attachments based on PO status (e.g. no deleting contracts once PO is ORDERED).
