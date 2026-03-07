# Production Request: Business & Technical Logic (SSOT)

> **Feature:** Production Request
> **Role:** Single Source of Truth (SSOT) for the "How and Why" of the Production Request module.
> **Audience:** Backend Developers, Architects, and AI Agents.

---

## 1. The Core Philosophy
Production Requests (PR) act as the **Buffer Zone** between Customer Demand (Sales) and Factory Execution (Work Orders). We do not automate creation; we provide the data for a Manager to decide.

---

## 2. The "Traffic Light" System (State Machine)

The system calculates feasibility in two phases to optimize performance.

### Phase 1: The Fast Check (Dashboard Load)
To avoid N+1 query bottlenecks, the Sales Order dashboard only does a shallow check on **Finished Goods**.
*   **🟢 GREEN (Available to Promise):** `Finished Goods >= Order Qty`.
    *   *Action:* Warehouse clicks **"Create Shipment"**.
*   **⚫ GRAY (Unchecked / Needs Production):** `Finished Goods < Order Qty`.
    *   *Action:* Production Manager clicks **"Check Feasibility"** to trigger the Deep Check.

### Phase 2: The Deep Check (On-Demand)
Triggered manually to run the MRP/BOM explosion.
*   **🟡 YELLOW (Capable to Promise):** `Component Stock` sufficient for production.
    *   *Action:* Manager clicks **"Request Production"** -> Status becomes `APPROVED`.
*   **🔴 RED (Material Shortage):** `Component Stock` insufficient.
    *   *Action:* Manager clicks **"Request Production"** -> Status becomes `WAITING_MATERIAL`.

### Other States
*   **🔵 BLUE (Make-to-Stock / MTS):** A PR created without a `SalesOrderId`. Used for replenishment.
*   **🟣 PARTIALLY_FULFILLED:** When some Work Orders are linked but the full quantity isn't yet in production.

---

## 3. Backend Logic: The "How & Why"

### A. MTO vs. MTS Logic
We support both **Make-to-Order** (linked to `soDetailId`) and **Make-to-Stock** (independent).
*   **Why?** Small factories often combine small customer orders with extra "buffer" stock to fill a production batch efficiently.
*   **Constraint:** An MTO PR is strictly locked to its Sales Order line item to ensure traceability.

### B. Atomic ID Generation (`PR-YYYYMMDD-XXXX`)
PR codes are generated using a Date-based prefix and a random 4-digit suffix.
*   **Engineering Note:** To prevent race conditions during high-volume creation, the service uses a **Retry Loop (3 attempts)**. If a `P2002` unique constraint error occurs on the `code` field, it regenerates and retries.

### C. The MRP "Lazy" Check
The `createRequest` method runs `MrpService.calculateRequirements` **before** database insertion.
*   **Why?** We want the status (`APPROVED` vs `WAITING_MATERIAL`) to be deterministic at the moment of creation.
*   **Concurrency Trap:** Between the "Check" and the "Save," stock could be taken by another user. We use database transactions to ensure that if a request is `APPROVED`, it has a valid claim on components at that microsecond.

### D. Partial Fulfillment & Split Batches
A single `ProductionRequest` can be fulfilled by multiple `WorkOrders`.
*   **Data Model:** Tracked via the `WorkOrderFulfillment` junction table.
*   **Naming Convention:** We use `AllocatedQuantity` in the `ComponentStock` table. This represents components "earmarked" for a Work Order that haven't physically left the warehouse yet.

---

## 4. Architectural Gotchas (Technical Reference)

> [!IMPORTANT]
> **Separation of Creator/Approver:** For Sales Orders, the creator cannot approve. However, for **Production Requests**, we allow the Production Manager to both create and "Approve" (by releasing to WO) because speed is prioritized over financial audit in the shop-floor loop.

### Race Condition Mitigation
In `SalesOrderService.approveSO`, we use a **Hard Stock Reservation (FIFO)**. 
- Specific `SerialNumbers` (ProductInstances) are tagged with the `salesOrderId` immediately.
- This prevents a common MES bug where two salesmen "see" the same 1 remaining unit and both promise it to different customers.

### Missing API Gaps
*   **Serial Picker:** Currently, the frontend lacks an endpoint to query *available* serial numbers reserved for a specific SO.
*   **Wastage Buffer:** The current BOM explosion assumes 100% yield. In electronics (SMT), we should eventually add a `% Wastage` factor to raw material requirements.

```mermaid
graph TD
    %% Styling
    classDef trigger fill:#e5f1f9,stroke:#0071c5,stroke-width:2px,color:#000;
    classDef decision fill:#fff,stroke:#333,stroke-width:2px,color:#000;
    classDef greenPath fill:#e8f4e8,stroke:#2e7d32,stroke-width:2px,color:#000;
    classDef yellowPath fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#000;
    classDef redPath fill:#fee0e0,stroke:#d32f2f,stroke-width:2px,color:#000;
    classDef bluePath fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000;
    classDef action fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,color:#000;

    %% Node Bắt đầu
    A[Phát sinh nhu cầu hàng hóa]:::trigger --> B{Nguồn gốc nhu cầu?}:::decision

    %% Trường hợp 1: Nhánh Blue (Make-to-Stock)
    B -->|Sản xuất lưu kho / MTS <br> Không qua Sales Order| C[Tạo PR Độc lập <br> 🔵 BLUE PATH]:::bluePath
    C --> MRP_Stock{Check Kho Linh Kiện <br> MRP}:::decision
    MRP_Stock -->|Đủ Linh Kiện| Final_WO[Tạo Work Order <br> APPROVED]:::action
    MRP_Stock -->|Thiếu Linh Kiện| Stock_PO[Tạo Purchase Order <br> WAITING_MATERIAL]:::redPath

    %% Trường hợp 2: Nhánh Sales Order
    B -->|Từ Sales Order| D{Check Kho Thành Phẩm}:::decision

    %% Nhánh 2.1: Nhánh Green
    D -->|Đủ Thành Phẩm| E[Bỏ qua Production Request <br> Ship thẳng cho khách <br> 🟢 GREEN PATH]:::greenPath

    %% Nhánh 2.2 & 2.3: Feasibility Check
    D -->|Thiếu Thành Phẩm| F{Check Kho Linh Kiện <br> Feasibility Check}:::decision

    %% Nhánh 2.2: Nhánh Yellow
    F -->|Đủ Linh Kiện| G[Tạo PR Link Sales Order <br> 🟡 YELLOW PATH]:::yellowPath
    G --> Final_WO

    %% Nhánh 2.3: Nhánh Red
    F -->|Thiếu Linh Kiện| H[Tạo PR Link Sales Order <br> 🔴 RED PATH]:::redPath
    H --> H_PO[Tạo Purchase Order <br> WAITING_MATERIAL]:::redPath
    H_PO -->|Nhập kho vật tư & Re-check| Final_WO
```
---
