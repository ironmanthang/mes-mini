# Inventory Ledger & Transaction History (SSOT)

> **Role:** The immutable rules for tracking stock movement.
> **Audience:** Backend Developers and Auditors.

---

## 1. The "Transaction First" Principle

**Rule:** We never "overwrite" stock quantities. We only "add transactions".

- **The Source of Truth:** `Current Stock = Sum(All Transactions)`.
- **Self-Healing:** If a stock discrepancy is found, developers can "replay" the transaction history to identify the exact second of the error.

---

## 2. Transaction Types (`InventoryTransactionType`)

| Type | Direction | Business Trigger |
| :--- | :--- | :--- |
| `IMPORT_PO` | **(+) In** | Goods physically arrive and pass QC. |
| `EXPORT_PRODUCTION` | **(-) Out** | Kitting (Materials move to the shop floor). |
| `IMPORT_PRODUCTION` | **(+) In** | Finished units are serialized and pass final QC. |
| `EXPORT_SALES` | **(-) Out** | Goods leave the building for delivery. |
| `ADJUSTMENT` | **+/-** | Manual correction (with required reason). |

---

## 3. Hard vs. Soft Reservation

### Hard Reservation (Sales)
- **Status:** `RESERVED`
- **Logic:** Specific **Serial Numbers** are linked to an SO. The physical unit is "locked".
- **Benefit:** Ensures 100% order accuracy.

### Soft Reservation (Production)
- **Field:** `allocatedQuantity` in `ComponentStock`.
- **Logic:** Incremented when a Work Order is released. 
- **Benefit:** Prevents over-committing raw materials to multiple batches.
