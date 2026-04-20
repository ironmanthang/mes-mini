# MES-Mini System Context
- **Infra**: Docker+Postgres. Prisma on Windows (follow `docker-prisma-windows-workflow`).
- **Naming**: `[PREFIX]-YYYYMM-[SEQ]` (SEQ 3-digit, monthly reset). Drafts: `D-PR-YYMMDD-ID`.
- **PR Module**: `POST /api/products/:id/production-feasibility` (BOM Preview) & `POST /api/production-requests` (PR+MRP).
- **Architecture Decisions**:
  - `RequestType`: Derived dynamically (`soDetailId == null` ? "Make to Stock" : "Make to Order"). No DB column.
  - `Lifecycle`: Standard ISA-95. PR tracks overall completion (Approved -> Fulfilled). Work Orders (WO) track shop-floor execution (Planned -> In Progress -> Completed).
  - `Timeline`: PR uses `dueDate`. `requestDate` is historical.
- **Current Focus**: Finalizing Work Order (WO) execution logic.
---
*Last Updated: 2026-04-11*

