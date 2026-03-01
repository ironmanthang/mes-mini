# Frontend Integration Guide: Production Requests

This guide explains how the Frontend should interact with the Backend APIs to implement the Production Request (PR) workflow, focusing on the "Traffic Light" system (Green, Yellow, Red, Blue paths).

---

## 1. The Sales Order Dashboard (The Trigger Point)

The primary entry point for managing production demand is the Sales Order Dashboard.

### A. Fetching Sales Orders
**Endpoint:** `GET /api/sales-orders`

**What to look for in the response:**
*   Each `SalesOrder` has a `hasShortage` boolean. If `true`, it means there are missing Finished Goods and the order is in the ⚫ **GRAY** state (needs a Feasibility Check). Do **not** show a 🔴 Red indicator at this stage.
*   Check `SalesOrder.details` for `quantity` vs `availableStock`.

**The "Fast Check" UI Logic:**
1.  **🟢 GREEN (Available to Promise):**
    *   *Condition:* `availableStock >= quantity`
    *   *UI:* Hide the `[ Request Production ]` button. Reveal the **`[ Create Shipment ]`** button.
    *   *Next Step:* User must select specific **Serial Numbers** to ship (See Section 5).
2.  **⚫ GRAY (Unchecked / Needs Production):**
    *   *Condition:* `availableStock < quantity`
    *   *UI:* Show a **`[ Check Feasibility ]`** button. This triggers the deep BOM check.

---

## 2. Checking Feasibility (Traffic Lights)

When the user clicks `[ Check Feasibility ]` on a Gray line item:

### A. The Feasibility API Call
**Endpoint:** `GET /api/sales-orders/{id}/feasibility`

**Handling the Response (`lineItems` array):**
Look at the `status` field for each item in the `lineItems` array from the response.

1.  **🟡 YELLOW (Capable to Promise):**
    *   *Condition:* The API returns `"status": "YELLOW"`.
    *   *Meaning:* No Finished Goods, but Raw Materials are sufficient.
    *   *UX:* Morph the button into a bold **`[ Request Production ]`**.
2.  **🔴 RED (Material Shortage):**
    *   *Condition:* The API returns `"status": "RED"`.
    *   *Meaning:* Missing both Finished Goods AND Raw Materials. (chỉ cần thiếu một cái cũng sẽ là màu đỏ)
    *   *UX:* Morph the button into **`[ Request Production (Shortage) ]`**. Show a "Red" status badge to alert the manager.
    *   *Action:* Clicking this behaves exactly like the YELLOW path (calls `POST /api/production-requests`). The resulting status will be `WAITING_MATERIAL`, which should then prompt the user to view the PR Details to resolve the shortage (See Section 4).

---

## 3. Creating the Production Request (The "Morphing" UI)

### A. The Creation API Call
**Endpoint:** `POST /api/production-requests`
**Payload:**
```json
{
  "productId": [ID],
  "quantity": [Ordered - Available],
  "priority": "HIGH",
  "soDetailId": [Line Item ID]
}
```

**Handling the Instant Result:**
The backend runs MRP instantly. The response `status` determines the next UX step:

1.  **If Status == `APPROVED` (Yellow Path):**
    *   *Success Toast:* "PR Created & Approved. Materials are reserved."
    *   *Button Morph:* Instantly hide the request button. Show **`[ Create Work Order ]`**.
    *   **The Next Step (Convert to Work Order):**
        *   **Endpoint:** `POST /api/production-requests/convert-to-work-order`
        *   **Payload:** `{ "requestIds": [1, 2], "productionLineId": 5 }`
2.  **If Status == `WAITING_MATERIAL` (Red Path):**
    *   *Warning Toast:* "PR Created, but waiting for Materials."
    *   *UI:* Show a 🔴 `Waiting Material` status. Reveal the link to the PR details.

---

## 4. Resolving Shortages (Red Path Recovery)

### A. The "Shopping List"
**Endpoint:** `GET /api/production-requests/{id}/draft-purchase-order`
**UX:** Display the missing components in an alert box so the user can copy/paste or click to create a Purchase Order.

### B. The Re-check Button
**Endpoint:** `PUT /api/production-requests/{id}/recheck`
**UX:** On the PR details page, show a **`[ 🔄 Re-check Feasibility ]`** button.
*   **On Success:** If it turns `APPROVED`, show a confetti/success toast and enable the `[ Create Work Order ]` button.

---

## 5. Shipping (Green Path Finish)

When the status is **GREEN**, bypass production and go straight to shipping.

**Endpoint:** `POST /api/sales-orders/{id}/ship`
**Payload:**
```json
{
  "shipments": [
    {
      "productId": 2,
      "serialNumbers": ["SN-1", "SN-2"]
    }
  ],
  "courierShippingCost": 15.50
}
```
**UX Step:** Open a scan/picker modal where the user selects specific **Serial Numbers** from the list of `ProductInstances` currently in stock.

> [!WARNING]  
> **API Gap Identified:** The exact endpoint to query *which* Serial Numbers are available for this specific Sales Order does not exist yet. The frontend needs an endpoint (e.g., `GET /api/product-instances?productId=X&status=RESERVED&salesOrderId=Y`) to populate this picker correctly. Coordinate with the backend team before implementing this modal. Phần này chưa code

---

## 6. The "Blue" Path (Make-to-Stock)

For manual replenishment of stock (no Sales Order).

**Endpoint:** `POST /api/production-requests`
**Payload:** Omit `soDetailId`.
**UX:** Same result handling as Section 3. The goods will enter "Free Stock" in the warehouse once produced.

---

## Summary of State Transitions for UX

| Status | Start Button | End Button | Notification |
| :--- | :--- | :--- | :--- |
| **GREEN** | `[ Check Feasibility ]` | `[ Create Shipment ]` | None |
| **YELLOW** | `[ Request Production ]` | `[ Create Work Order ]` | 🟢 Success Toast |
| **RED** | `[ Request Production ]` | `[ Waiting Material ]` | 🟡 Warning Toast |
| **RECHECKED**| `[ 🔄 Re-check ]` | `[ Create Work Order ]` | 🟢 Unblocked Toast |
