# Supplier & Warehouse Operations (Receiving)

This document covers the physical receiving processes when a Supplier delivers components, including traceability, handling of linked vs. unlinked inventory, and the cascading effects on the production floor.

> [!TIP]
> **Mixed Shipment Support:** A single shipment (PO) can contain a mix of components for specific Production Requests and general stock. The system handles the routing of each individual box based on the Line-Item link.

## 1. Traceability & Receiving Math

> [!IMPORTANT]
> **ComponentLot Traceability (The "Box" Rule & The "Slap" Workflow)**
> - The MES enforces strict Box-Level traceability for all incoming raw materials (Option 1).
> - When a PO arrives, the warehouse CANNOT just input "Received 1,000 aggregate units". They must explicitly register each supplier box into the system. The system auto-generates a unique `ComponentLot` ID (e.g., `LOT-260328-001`) which the worker must attach to the physical box.
> - **The "Slap" Workflow:**
>   1.  **Registry**: Worker scans/inputs box details. API generates the internal `lotCode`.
>   2.  **Labeling**: UI triggers a Barcode Popup (Virtual Label).
>   3.  **Application**: Worker "slaps" the identification on the physical box.
> - **The Issuing Rule**: When the Production floor requests materials (`MaterialExportRequest`), the warehouse worker MUST explicitly scan/select the exact `ComponentLot` barcodes they are picking from to maintain the end-to-end traceability chain.

> [!NOTE]
> **Receiving Math**
> - The `quantityReceived` on a detail line can never safely exceed the `quantityOrdered` without forcing an exception. If suppliers over-deliver, it requires creating a separate unlinked PO item to capture the free stock, ensuring standard costs match.

## 2. Physical-to-System Mapping (The Reality Check)

When goods arrive physically, the system relies on the **Frontend UI** (mobile scanner/tablet) to act as the bridge between human actions and the backend API (`POST /api/purchase-orders/{id}/receive`).

*   **`componentId`**: The employee doesn't memorize system IDs. They select the incoming PO on their tablet, match physical labels to the expected item list on the screen, and tap the corresponding row. The UI translates this to the correct `componentId`.
*   **`quantity`**: The employee physically counts the units in **one specific box** (or reads the supplier's valid sticker for that box) and inputs that number. *Rule: Each receipt payload strictly represents ONE physical box.*
*   **`warehouseId`**: The PO contract already explicitly locked in the destination warehouse. The UI auto-fills this field based on the PO header to prevent physical routing errors upon receipt.

### The Real-World Anchor: Supplier Paperwork
If a truck arrives with mixed components fulfilling multiple POs simultaneously (a cross-docking scenario), the system enforces order through **Supplier Packing Slips (Phiếu giao hàng)**:
1. The physical paperwork identifies which boxes fulfill which PO (e.g., "Boxes 1-5 fulfill PO-100", "Boxes 6-10 fulfill PO-101").
2. The warehouse worker must open EACH purchase order individually on their device to receive the specific boxes linked to that PO. The API inherently blocks receiving a random unmarked box without a PO context.

> [!WARNING]
> **The "No Split-Routing" Rule**
> The MES strictly enforces ONE destination `warehouseId` per Purchase Order. You cannot legally contract a supplier to deliver "half to Warehouse A and half to Warehouse B" on a single PO. This constraint keeps both physical trucking logic and digital receiving logic clean, fast, and error-free.

## 3. Receiving Flows

### Flow 1: Linked Procurement (Direct Routing)
**Purpose:** Receiving exact quantities for a specific production demand, bypassing general stock.

1. **System** identifies components needed for `PR-101` that are not currently in stock.
2. **Purchaser** creates a PO and explicitly sets `PurchaseOrderDetail.productionRequestId = PR-101`.
3. **Manager** approves the PO, making the link immutable upon ordering.
4. **Supplier** delivers the items.
5. **Warehouse** receives the items physically in boxes and generates `ComponentLot` codes.
6. **System** detects the `PR-101` link. All received items go to general `ComponentStock`. The link to `PR-101` is tracked via `PurchaseOrderDetail.productionRequestId` only — there is no separate staging area.

**Happy Path:**
Everything is received in full. `PR-101` is unblocked, and the PO enters `COMPLETED` state.

**[Shortage / Partial Delivery] Path:**
- **Supplier** sends less than ordered (e.g., ordered 100, received 60).
- **Warehouse** registers the 60 items into `ComponentLot`s.
- **System** marks the PO as `RECEIVING` indefinitely (until the rest arrive).
- `PR-101` receives 60 items but remains effectively "Waiting Material" if the deficit prevents assembly. The Purchaser must manually follow up.

---

### Flow 2: General Stock Procurement (Min-Max Replenishment)
**Purpose:** Receiving components to replenish general inventory bins based on `minStockLevel` warnings, independent of specific PRs.

1. **Purchaser** creates a PO for `Component_X` and leaves `productionRequestId` as `null`.
2. **Manager** approves the PO.
3. **Supplier** delivers the items.
4. **Warehouse** receives the boxes and generates `ComponentLot` codes.
5. **System** sees no PR link, so it places the `ComponentLot`s into the general `Component_X` stock area, incrementing the balance.

---

## 4. Cross-Flow Reference Table

| Type | Trigger | From | To | What |
|------|---------|------|----|------|
| PO Creation (Linked) | PR Shortage | Demand Module | Procurement | Component List (Linked) |
| PO Creation (General) | Low Stock Alert | Inventory Module | Procurement | Component List (Unlinked) |
| Direct Receipt | Physical Verification | Loading Dock | General ComponentStock | Linked ComponentLots (tracked via `productionRequestId`) |
| Stock Receipt | Physical Verification | Loading Dock | General ComponentStock | Unlinked ComponentLots |

---

## 5. Cascading Dependency Narrative

To illustrate how a delay from a Supplier flows down to the shop floor:

```text
Event: Supplier delays shipment of PO #999 (Linked to PR-101)
  └── PO remains stuck in ORDERED state
      └── Warehouse has nothing to receive (Direct Receipt blocked)
          └── No ComponentStock increase for PR-101's linked components
              └── PR-101 remains in "Waiting Material" status
                  └── Production Line cannot start Assembly
```
---

## 6. Warehouse Safety Features

To ensure operational reliability, the system provides dedicated "Safety Net" endpoints for the warehouse floor:
- **Scanner Lookup (`GET /api/inventory/lots/{lotCode}`)**: Allows workers to quickly scan any box barcode to answer "What is in here?" without navigating complex menus.
- **Label Reprint (`POST /api/inventory/lots/{lotCode}/reprint`)**: An audit-logged action to re-trigger the label generator if a physical sticker is damaged, lost, or needs replacement.

> [!NOTE]
> **Design Philosophy Behind The Chain:**
> This direct, hard-linked dependency eliminates the race conditions of "who gets the parts first" when a truck arrives. The shop floor clearly sees *why* they are waiting (Supplier for PO #999), and procurement sees exactly *who* is affected (PR-101).
