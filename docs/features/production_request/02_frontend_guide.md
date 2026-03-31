# Production Request: Frontend Integration Guide

> **Feature:** Production Request ( replenishment of finished goods)
> **Role:** Implementation guide for the "Create Production Request" form and dashboard integration.
> **Audience:** Frontend Developers (Web/Mobile).

---

## 1. Core API Reference

### A. Decision Support (Call these *before* creating a PR)
*   **`GET /api/products/:id/production-context`**
    *   **Usage**: Triggered when a product is selected.
    *   **Provides**: Current Stock, Min Level, Pending Demand, and `suggestedQuantity`.
*   **`POST /api/products/:id/production-feasibility`**
    *   **Usage**: Triggered when the user types/changes the **Quantity** (Debounced).
    *   **Payload**: `{ "quantity": number }`
    *   **Provides**: `canProduce` status and a detailed component requirement list.

### B. Execution
*   **`POST /api/production-requests`**
    *   **Usage**: Final submission.
    *   **Payload**: `{ "productId": number, "quantity": number, "priority": string, "dueDate": date }`
*   **`GET /api/production-requests`**
    *   **Usage**: List view for tracking status (`APPROVED` vs `WAITING_MATERIAL`).

---

## 2. Recommended Form Logic (The "Proactive Flow")

This flow ensures the Production Manager (PM) is never "surprised" by a shortage after submitting.

### Step 1: Select Product
- **Action**: UI calls `GET /api/products/:id/production-context`.
- **Result**: Display a "Status Card" showing:
    - 📊 **Current Stock**: 0
    - 🛡️ **Safety Stock**: 20
    - 📦 **Pending Orders**: 18
    - ✨ **Suggested**: **38** (Pre-fill the quantity input with this value).

### Step 2: Input Quantity
- **Action**: User types `50`. UI calls `POST /api/products/:id/production-feasibility`.
- **Result**: Display the **Live Feasibility** panel:
    - 🟢 **Green**: "Materials sufficient. This request will be approved immediately."
    - 🔴 **Red**: "Shortage detected! You need 100 more Batteries. This request will be placed on **Hold**."

### Step 3: Submission
- **Action**: User clicks `[ Save Request ]`.
- **Result**: PR is created. If feasibility was Red, the user should be redirected to a "Create Purchase Order" screen or shown a "View Shortages" prompt.

---

## 3. Dashboard Integration
The **Warehouse Dashboard** (`GET /api/warehouse/dashboard`) provides the high-level signals to start the flow above.
- **KPI**: `totalGap` (The sum of all units missing across all low-stock products).
- **Action**: Clicking any item in the `lowStockProducts` list should navigate the user to the "Create Production Request" form with that product ID pre-selected.

---

## 4. Manual Verification (QA)
1.  **Clean State**: `npx prisma migrate reset --force` (Ensures 50 Laptops/30 Smartwatches in Sales WH).
2.  **Verify Healthy**: Dashboard should show **0 Gap** for Laptops and Smartwatches.
3.  **Verify Shortage**: Dashboard should show **Gap: 5** for Monitor M1 Pro.
4.  **Verify Context**: `GET /api/products/1/production-context` should return a `suggestedQuantity` that accounts for current stock and pending orders.

---
