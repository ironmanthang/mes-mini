# Sales Order: Business & Technical Logic (SSOT)

> **Feature:** Sales Order
> **Role:** Single Source of Truth (SSOT) for the lifecycle of a Customer Order.
> **Audience:** Backend Developers, Architects, and AI Agents.

---

## 1. The Lifecycle (State Machine)

Sales Orders follow a strict linear progression to ensure financial and inventory auditability.

*   **⚪ DRAFT:** The initial state. The order has a temporary code (`D-YYMMDD-ID`). It is invisible to the Production Manager.
*   **🟡 PENDING_APPROVAL:** Submitted by Sales Staff. An official sequential code (`SO-YYYY-XXX`) is assigned.
*   **🟢 APPROVED:** Approved by a Production Manager. This triggers the **Hard Stock Reservation**.
*   **🔵 IN_PROGRESS:** Transitioned when warehouse starts picking or production is linked.
*   **🏁 COMPLETED:** All line items have been shipped in full.
*   **🔴 CANCELLED:** Order is voided. Reserved stock is released.
*   **🔄 REJECTED:** Transitioned from PENDING_APPROVAL back to DRAFT for corrections.

---

## 2. Core Business Logic

### A. Code Generation Strategy
To provide immediate feedback while maintaining sequential integrity:
*   **Drafts:** Use the pattern `D-YYMMDD-{ID}`. These can be hard-deleted from the database.
*   **Official:** Upon submission, they receive an `SO-YYYY-{SEQ}` code. These **cannot** be hard-deleted; the `delete` operation on an official code transitions the status to `CANCELLED` instead.

### B. Hard Stock Reservation (FIFO)
Unlike "Soft Reservations" that just decrement a counter, this MES implements **Hard Reservations** upon `APPROVE`:
1.  Specific `ProductInstance` records (based on Serial Number) are searched for where `status = 'IN_STOCK'`.
2.  The records are sorted by `createdAt` (FIFO).
3.  The `status` is updated to `RESERVED` and the `salesOrderId` is linked.
4.  **Why?** This ensures that once an order is approved, the physical units on the shelf are legally "sold" and cannot be picked for another order.

### C. The "Traffic Light" Integration
The Sales Order dashboard integrates with the `FeasibilityService` to show real-time fulfillment status:
*   **GREEN:** Available stock >= Order quantity.
*   **YELLOW:** Stock is low, but Bill of Materials (BOM) check says we can produce it.
*   **RED:** Material shortage; cannot ship or produce immediately.

### D. Goods Issue (Shipping)
Shipping is performed by scanning Serial Numbers:
*   **Validation:** The system ensures the scanned SN is either `IN_STOCK` or specifically `RESERVED` for this order.
*   **Traceability:** Each unit shipped creates an `InventoryTransaction` of type `EXPORT_SALES` linked to the specific `ProductInstance`.
*   **Auto-Complete:** Once `quantityShipped == quantity` for all lines, the order status moves to `COMPLETED` automatically.

---

## 3. Technical Constraints & Safety

### Atomic Approval
The `approveSO` method runs inside a **Database Transaction**.
*   **The Guard:** It checks current stock levels *inside* the transaction to prevent race conditions where two managers approve orders simultaneously for the same 1 remaining unit.

### Audit Trail
*   **Note Appending:** When an order is `REJECTED` or `CANCELLED`, the system requires a reason string which is timestamped and appended to the `note` field to preserve the history of why the state changed.
*   **Role Logic:** Sales Staff cannot approve their own orders. Only a `Production Manager` or `System Admin` handles the "Approval" gate.

---

## 4. Workflows & Mermaid

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create (D-Code)
    DRAFT --> PENDING_APPROVAL : Submit (SO-Code)
    DRAFT --> [*] : Hard Delete
    
    PENDING_APPROVAL --> DRAFT : Reject (Reason Added)
    PENDING_APPROVAL --> APPROVED : Approve (Stock Reserved)
    
    APPROVED --> IN_PROGRESS : Start Processing
    APPROVED --> CANCELLED : Cancel (Stock Released)
    
    IN_PROGRESS --> COMPLETED : Ship All Items
    IN_PROGRESS --> CANCELLED : Cancel (Stock Released)
    
    COMPLETED --> [*]
    CANCELLED --> [*] (Soft Delete if SO-Code)
```
