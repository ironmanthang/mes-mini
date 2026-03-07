# Sales Order: Frontend & Testing Guide

> **Feature:** Sales Order
> **Role:** API documentation, UX flow logic, and manual verification guide.
> **Audience:** Frontend Developers and QA/Testers.

---

## 1. API Reference (From `salesOrderRoutes.ts`)

### A. List & Search
*   **Endpoint:** `GET /api/sales-orders`
*   **Query Params:** `page`, `limit`, `search` (Search by Code or Agent Name).
*   **Response:** Paginated list of orders enriched with `hasShortage` and `availableStock` flags.

### B. Create / Update (Drafting)
*   **Endpoint:** `POST /api/sales-orders` (Create) / `PUT /api/sales-orders/{id}` (Update)
*   **Constraint:** Updates are only allowed while status is `DRAFT` or `PENDING_APPROVAL`.
*   **Payload:** Includes `agentId`, `details` (array of items), and financial terms.

### C. The Approval Workflow
*   **Submit:** `PUT /api/sales-orders/{id}/submit` -> Moves from `DRAFT` to `PENDING_APPROVAL`.
*   **Approve:** `PUT /api/sales-orders/{id}/approve` -> Moves to `APPROVED`. **Requires Production Manager role.**
*   **Reject:** `PUT /api/sales-orders/{id}/reject` -> Moves back to `DRAFT`. **Requires reason.**

### D. Inventory Operations
*   **Check Feasibility:** `GET /api/sales-orders/{id}/feasibility` -> Runs MRP check.
*   **Start Processing:** `PUT /api/sales-orders/{id}/process` -> Moves to `IN_PROGRESS`.
*   **Ship Order:** `POST /api/sales-orders/{id}/ship` -> SCAN Serial Numbers to deduct stock.

---

## 2. Integrated User Flows

### 🛒 Flow 1: The Sales Cycle (Draft to Approval)
1.  **Sales Staff** creates a new order (`POST /`). Note the code is `D-xxxxx`.
2.  **Sales Staff** adds items and adjusts discounts (`PUT /`).
3.  **Sales Staff** clicks "Submit for Approval" (`PUT /submit`). The code changes to `SO-YYYY-XXX`.
4.  **Production Manager** reviews and clicks "Approve" (`PUT /approve`).
    *   *System Action:* Specific Serial Numbers are marked as `RESERVED`.

### 📦 Flow 2: Fulfillment & Shipping
1.  **Warehouse Staff** views "Approved" orders.
2.  **Warehouse Staff** clicks "Start Processing" (`PUT /process`).
3.  **Warehouse Staff** scans Serial Numbers for each line item.
4.  **Warehouse Staff** clicks "Complete Shipment" (`POST /ship`).
    *   *System Action:* Status moves to `COMPLETED` once all items are shipped.

---

## 3. Manual Verification Steps (Swagger)

1.  **Create Draft:** `POST /api/sales-orders` with 1 line item. Verify status is `DRAFT`.
2.  **Submit:** Call `PUT /submit`. Verify code changed from `D-` to `SO-`.
3.  **Approve:** Login as Manager. Call `PUT /approve`. 
    *   Check `product_instances` table: Verify the specific number of units now have `status: "RESERVED"` and `sales_order_id` linked.
4.  **Feasibility Check:** Call `GET /feasibility`. Verify it returns `GREEN` if stock is available, or `RED/YELLOW` if not.
5.  **Shipping Test:** 
    *   Scan an SN that belongs to a *different* product. Verify API returns Error.
    *   Scan an SN that is `IN_STOCK` but not `RESERVED` for this SO. Verify API allows it (Flex picking).
    *   Scan an SN already `SHIPPED`. Verify Error.

---

## 4. Troubleshooting & FAQ

*   **"Why can't I delete my SO?"** -> You can only delete `DRAFT` orders. If it has an official `SO-` code, use the "Cancel" function instead to maintain the audit trail.
*   **"The Approve button is disabled!"** -> Ensure you are logged in as a Production Manager or higher. The creator of the order cannot approve their own request.
