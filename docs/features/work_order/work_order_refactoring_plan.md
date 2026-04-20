# 🏭 Work Order Module Refactoring Plan (Updated)

## 📜 Overview

This document outlines the plan to refactor the Work Order module (`workOrderController`, `workOrderService`, etc.). The goal is to achieve state consistency, modularity, and transactional integrity across *both* the Work Order and Production Request domains.

**Key Learnings from PR Module:**
The Production Request module is the primary trigger for WO creation and manages complex status lifecycles (DRAFT $\to$ PENDING $\to$ APPROVED $\to$ WAITING\_MATERIAL $\to$ FULFILLED). The architectural refactoring must ensure the Work Order service:
1.  Respects and interacts with the Production Request's defined status flow reliably.
2.  Handles the shared state transitions (e.g., when a WO completes, it must correctly update the associated PR status).

**Key Concerns Addressed:**
1.  Status transition complexity (tightly coupled state logic in both PR and WO).
2.  Inconsistent error handling and dependency management.
3.  Shared Domain Model integrity (shared enums, types).
4.  Performance in bulk database operations.

---

## ✨ Refactoring Goals

*   **Cross-Module State Consistency:** Establish a single source of truth for status transitions that govern both WO and PR.
*   **Decouple Responsibilities:** Separate business state logic from data access logic into dedicated State Machine services.
*   **Improve Service Interoperability:** Ensure reliable handshakes and data flow between the WO and PR services.
*   **Enhance Performance:** Vectorize database writes for bulk operations in both modules.

## 🗺️ Implementation Breakdown

This project will be handled in four distinct phases.

### Phase 1: Abstraction and Common Foundation (Low Priority) 🌐
**Goal:** Establish a shared, type-safe contract that both modules rely on.

*   **Task 1.1: Centralize Type Definitions:**
    *   *Action:* Create a shared types file (e.g., `domain/commonTypes.ts`).
    *   *Impact:* Move all shared enums (e.g., `WorkOrderStatus`, `ProductionRequestStatus`), complex types, and utility interfaces here. This is critical for enforcing consistency between WO and PR services.
*   **Task 1.2: Define Standardized Error Handling:**
    *   *Action:* Implement a custom, unified error architecture (e.g., `ApplicationError`).
    *   *Impact:* Ensures the API layer can catch and respond to structured, business-logic failures from either the PR or WO domain gracefully.

### Phase 2: Core Logic Refinement - State Machine (Medium Priority) ⚙️
**Goal:** Isolate and formalize the complex rules governing status changes for *both* domains.

*   **Task 2.1: Dedicated State Machine Service:**
    *   *Action:* Implement a generalized State Machine service (can be housed in a new `StateMachine` folder).
    *   *Mechanism:* This service will govern the transitions *between* `ProductionRequestStatus` and `WorkOrderStatus` based on explicit actions (e.g., `REQUEST_SUBMITTED`, `WO_COMPLETED`).
    *   *Focus (Most Critical):* The `completeWorkOrder` workflow must be reworked to use this machine to check if the WO completion *is sufficient* to advance the linked PR status (PR status update is driven by WO completion).

*   **Task 2.2: Refactor `createBulkWorkOrder` & `createProductionRequest`:**
    *   *Action:* Both creation methods will be updated to pass to and rely on the new State Machine for initial status validation and update.

### Phase 3: Data Integrity & Optimization (High Priority) ⚡️
**Goal:** Optimize data writes and ensure transactional safety under high volume.

*   **Task 3.1: Optimize Completion/Fulfillment Transaction:**
    *   *Challenge:* Unit-by-unit database writes are performance sinks.
    *   *Action:* Refactor the transaction logic across both modules (especially `completeWorkOrder` and potentially a future PR fulfillment step) to minimize DB round trips using optimized bulk inserts/updates.

*   **Task 3.2: Dependency Injection & Isolating External Calls:**
    *   *Action:* Fully adopt Dependency Injection for external service calls (e.g., `MaterialRequestService`, `MrpService`).
    *   *Impact:* Makes both WO and PR services independently testable by mocking their dependencies.

### Phase 4: Verification & Finalization (Medium Priority) 🚀

*   **Task 4.1: Update Controllers and Routes:** Update all API endpoints to adopt the new error handling and routing patterns.
*   **Task 4.2: Comprehensive Integration Testing:** Focus on E2E workflows spanning both PR and WO:
    1.  Create PR (Draft) $\to$ Submit (Pending) $\to$ Approve (Work Order created).
    2.  Work Order completion ($WO\_COMPLETE$) $\to$ PR status update ($PR\_FULFILLED$).
    3.  Handling of cancellations in both domains.

---
*This plan now explicitly addresses the bi-directional state dependency between Production Requests and Work Orders.*