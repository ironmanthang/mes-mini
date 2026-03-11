# Production Request: Frontend & Testing Guide

> **Feature:** Production Request
> **Role:** API documentation, UX flow logic, and manual verification guide.
> **Audience:** Frontend Developers and QA/Testers.

---

## 1. API Reference (From `productionRequestRoutes.ts`)

### A. List All Requests
*   **Endpoint:** `GET /api/production-requests`
*   **Query Params:** `status` (enum), `page`, `limit`.
*   **Response:** Paginated list of PRs with nested Product, SalesOrder, and Fulfillment data.

### B. Create Production Request (The "Logic Trigger")
*   **Endpoint:** `POST /api/production-requests`
*   **Payload:**
    ```json
    {
      "productId": 1,
      "quantity": 50,
      "priority": "HIGH",
      "soDetailId": 3,      // Omit for Make-to-Stock (Blue Path)
      "dueDate": "2026-12-31T23:59:59Z",
      "note": "Urgent"
    }
    ```
*   **Logic:** The backend runs MRP instantly. The response `status` determines the next UX step (`APPROVED` vs `WAITING_MATERIAL`).

### C. Re-check Feasibility
*   **Endpoint:** `PUT /api/production-requests/{id}/recheck`
*   **Usage:** For `WAITING_MATERIAL` PRs after a PO has been received. Transitions the PR to `APPROVED` if stock is now sufficient.

### D. Get Shortage List (Draft PO)
*   **Endpoint:** `GET /api/production-requests/{id}/draft-purchase-order`
*   **Usage:** Returns the "Shopping List" of missing components needed to unblock this PR.

### E. Convert to Work Order (Bulk)
*   **Endpoint:** `POST /api/production-requests/convert-to-work-order`
*   **Payload:**
    ```json
    {
      "requestIds": [1, 2, 5],
      "productionLineId": 101,
      "quantities": [50, 20, 100] // Optional
    }
    ```
*   **Action:** Bundles multiple PRs into a single Work Order for the shop floor.

---

## 2. Integrated User Flows (The 4 Paths)

### 🟢 Path 1: The Green Path (Ship from Stock)
*   **Trigger:** Sales Order shows `availableStock >= quantity`.
*   **UX:** Hide "Request Production" button. Show **`[ Create Shipment ]`**.
*   **Test:** Login as Admin -> `POST /api/sales-orders/{id}/ship` with specific Serial Numbers.

### 🟡 Path 2: The Yellow Path (Produce Now)
*   **Trigger:** SO has shortage, but MRP says "Can Produce" (Yellow Light).
*   **UX:** Click `[ Request Production ]` -> Result is `APPROVED`. Show **`[ Create Work Order ]`**.
*   **Test:** Login -> `POST /api/production-requests` -> Verify response `status: "APPROVED"`.

### 🔴 Path 3: The Red Path (Blocked by Materials)
*   **Trigger:** SO has shortage, AND MRP says "Shortage" (Red Light).
*   **UX:** Click `[ Request Production ]` -> Result is `WAITING_MATERIAL`. 
*   **Action:** Show alert link to `[ View Shortage ]` (Draft PO endpoint).
*   **Test:** 
    1. Create PR -> Status is `WAITING_MATERIAL`.
    2. Add stock to DB (via Prisma Studio or `IMPORT_PO`).
    3. Call `PUT /api/recheck` -> Verify status becomes `APPROVED`.

### 🔵 Path 4: The Blue Path (Make-to-Stock)
*   **Trigger:** Manual replenishment for forecast.
*   **UX:** Simple form to pick Product + Qty. No Sales Order link.
*   **Test:** `POST /api/production-requests` (with `soDetailId: null`). Verify `note` contains "Manual Request (MTS)".

---

## 3. Manual Verification Steps (Swagger)

1.  **Seed Database:** `npx prisma migrate reset --force` followed by `npx tsx prisma/scripts/seed.ts`.
2.  **Log In:** `POST /api/auth/login` (Admin/123456). Apply token to "Authorize" header.
3.  **Execute Path 2 (Yellow):** 
    *   Find a "Gray" order in `GET /api/sales-orders`.
    *   Create PR with its `productId` and `soDetailId`.
    *   Confirm status is `APPROVED` immediately.
4.  **Bundle Work Order:** 
    *   Take the result ID from Step 3.
    *   Call `POST /convert-to-work-order` with that ID.
    *   Verify a new Work Order is created in the `work_orders` table.

---
