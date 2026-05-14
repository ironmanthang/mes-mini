# Backend Integration Testing Standard

This document defines the architecture, principles, and execution protocols for the MES-Mini automated backend integration tests.

## 1. Goal
To ensure end-to-end business logic integrity across all core manufacturing and warehouse modules. These tests verify the "Full-Stack Needle" — from API request to database persistence and downstream side-effects (e.g., PR auto-updates).

## 2. Core Principles

### Test Case (TC) Isolation
Each test case must be **independent**. 
- **Setup**: Every `it()` block or `describe()` block should use unique data (Serial Numbers, PO Codes, etc.).
- **No Chaining**: Test B must never depend on the result of Test A. If Test A fails, Test B should still have a clean environment to run.
- **Fixtures**: Use helper functions (e.g., `createInProgressWorkOrderFixture`) to generate fresh, valid data states inside each test.

### Environment Consistency
Tests run against a **live containerized database**.
- **Global Setup**: Every test run automatically triggers a database reset (migrations) and a full re-seed (`prisma/scripts/seed.ts`).
- **Data Safety**: Avoid hardcoding IDs. Always fetch IDs dynamically from the database or the result of a fixture creation.

### Sequential Execution
Due to shared database state in the Docker container, tests MUST run sequentially to prevent lock contention or race conditions.
- **Command**: Always use `--runInBand` (aliased in `npm run test`).

## 3. Coverage (Core Modules)

| Module | Test File | Key Validations |
| :--- | :--- | :--- |
| **Production Requests** | `productionRequests.test.ts` | BOM validation, status transitions, quantity boundaries. |
| **Purchase Orders** | `purchaseOrders.test.ts` | MTS vs MTO creation, BOM strictness for linked PRs. |
| **PO Receiving** | `receivePO.test.ts` | Partial receipt logic, `ComponentLot` generation, PR auto-fulfillment. |
| **Material Requests** | `materialRequests.test.ts` | Stock validation (canIssue), inventory deduction, atomicity on failure. |
| **Work Orders** | `workOrders.test.ts` | State machine (DRAFT -> IN_PROGRESS -> COMPLETED), MR gate validation. |
| **Quality Control** | `qualityControl.test.ts` | Inspection result persistence, All-or-nothing pass/fail logic. |
| **Product Induction** | `productInduction.test.ts` | Routing to Sales/Error warehouses, `IMPORT_PRODUCTION` traceability. |

## 4. Execution Guide

### Inside Docker (Primary)
Run all tests:
```bash
docker compose exec backend npm run test
```

Run a specific module:
```bash
docker compose exec backend npm run test -- tests/modules/receivePO.test.ts
```

### Reporting
Jest is configured to output pass/fail status per TC. Any failure in these modules indicates a break in the **Single Source of Truth (SSOT)**.
