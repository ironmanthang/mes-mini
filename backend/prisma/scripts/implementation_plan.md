# Seed Script Modularization Plan

This plan outlines the strategy for refactoring the monolithic `backend/prisma/scripts/seed.ts` (1666 lines) into a highly modular, maintainable, and robust folder structure.

## Goal
Transform `seed.ts` from a "God File" into a clean orchestrator, isolating domain logic to reduce merge conflicts and improve readability, without altering the underlying seeding behavior.

## User Review Required

> [!IMPORTANT]
> Please review the proposed folder structure below. Once approved, I will begin the execution phase systematically to ensure nothing is broken.

## Proposed Changes

We will create a new directory `backend/prisma/scripts/seeds/` and distribute the logic into focused modules.

### [Core Config & Orchestrator]

#### [MODIFY] [seed.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seed.ts)
Will be reduced to ~80 lines. It will only contain the `SEED_CONFIG` object, the database connection lifecycle, and the `main()` function which orchestrates calls to the imported modules.

### [Core Security & Configuration]

#### [NEW] [seeds/core.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeds/core.ts)
Will contain the most stable and foundational configuration logic:
- `seedRoles()`
- `seedPermissions()`
- `seedRolePermissions()`
- `seedEmployees()`
- `seedCodeSequences()`

### [Master Data]

#### [NEW] [seeds/master-data.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeds/master-data.ts)
Will contain foundational business definitions:
- `seedSuppliers()`
- `seedAgents()`
- `seedComponents()`
- `seedWarehouses()`
- `seedProducts()` (and BOM)
- `seedProductionLines()`
- `seedSupplierComponents()`

### [Inventory & Traceability]

#### [NEW] [seeds/inventory.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeds/inventory.ts)
Will contain logic for injecting physical stock and managing traceability:
- `seedProductInstances()`
- `injectComponentStock()` (helper function)
- `seedMaterialRequests()`

### [Demo & Enrichment Data]

#### [NEW] [seeds/demo-data.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeds/demo-data.ts)
Will contain the large mock datasets required for populating the UI for testing:
- All `seedDemo*` functions (Agents, Suppliers, Components, Products, Stock, Instances)
- Commercial & Manufacturing transactions: `seedDemoSalesOrders()`, `seedDemoProductionRequests()`, `seedDemoPurchaseOrders()`

### [Complex Scenarios]

#### [NEW] [seeds/scenarios.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seeds/scenarios.ts)
Will isolate complex, multi-stage logic that tests specific edge cases (e.g., the Traffic Light shortage scenario).
- `seedProductionScenarios()`

## Verification Plan

### Automated Tests
- After refactoring, I will run `docker compose exec backend npx tsx prisma/scripts/seed.ts`.
- The success criteria is the script executing completely without errors and outputting `Seeding Completed.`

### Manual Verification
- You can manually verify the database state using Prisma Studio (`npm run prisma-studio`) to ensure all data (users, permissions, products, scenarios) is still being generated identically to the monolithic version.
