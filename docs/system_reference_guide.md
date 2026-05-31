# MES-Mini: System Reference Guide

> A lightweight Manufacturing Execution System designed for small electronics companies.
> This document explains every design decision, the standards we referenced, and the business logic behind each module.

---

## Project Context and Scope

### What is MES

A **Manufacturing Execution System (MES)** is the software layer that sits between **business planning (ERP)** and **shop-floor control (PLCs/machines)**. It manages the real-time execution of production — from receiving raw materials to shipping finished goods.

According to the **ISA-95 / IEC 62264** international standard, manufacturing systems are organized into five levels:

| Level | Name | System | Our Scope |
|-------|------|--------|-----------|
| Level 4 | Business Planning | ERP | Out of scope |
| Level 3 | **Manufacturing Operations Management (MOM)** | **MES** | **In Scope (Implemented)** |
| Level 2 | Supervisory Control | SCADA/HMI | Out of scope |
| Level 1 | Basic Control | PLCs/Sensors | Out of scope |
| Level 0 | Physical Process | Machines | Out of scope |

**References:**
- **ISA-95 / IEC 62264**: *Enterprise-Control System Integration* — defines the MES layer as Level 3 (Manufacturing Operations Management).
- **MESA International**: *MESA-11 Model* — defines 11 core functions of an MES.

### Why "Lite" MES

A full MES (e.g., SAP ME, Siemens Opcenter, Plex) includes all four domains defined by ISA-95 Part 3:

| ISA-95 Domain | Full MES | MES-Mini (Our Scope) |
|---|---|---|
| **Production Operations** | In Scope | In Scope (Production Requests, Work Orders, BOM) |
| **Quality Operations** | In Scope | In Scope (Quality Checklists, Inspection, Pass/Fail) |
| **Inventory Operations** | In Scope | In Scope (Component Lots, Stock Tracking, Material Issuing) |
| **Maintenance Operations** | In Scope | Omitted (equipment maintenance scheduling, CMMS) |

We intentionally omitted **Maintenance Operations** because:
- **Downtime Impact**: Small electronics companies typically have few production lines with manual assembly — equipment downtime scheduling is less critical than in heavy manufacturing.
- **Complexity Tradeoff**: Adding CMMS would significantly increase scope without proportional value for the target audience.
- **Extensibility Design**: The system remains extensible — a Maintenance module could be added as a future phase.

### MESA-11 Function Coverage

The MESA International model defines 11 core MES functions. Here is how MES-Mini covers them:

| Function Name | MES-Mini Coverage | Implementation Details |
|---|---|---|
| Operations/Detail Scheduling | Partial | Production Requests with priority and due dates |
| Resource Allocation and Status | Partial | Production Line assignment to Work Orders |
| Dispatching Production Units | Full | Work Order lifecycle (Draft, Release, Start) |
| Document Control | Partial | Attachment system (invoices, contracts, inspection docs) |
| Data Collection/Acquisition | Partial | Manual data entry at workstations (no IoT integration) |
| Labour Management | Partial | Employee management, role-based access, audit trails |
| **Quality Management** | Full | Checklists, multi-type inspection, pass/fail, cost absorption |
| Process Management | Lite | BOM-driven material requirements (no routing/recipe steps) |
| Maintenance Management | None | Omitted (see scope explanation) |
| **Product Tracking and Genealogy** | Full | Serial numbers, batch codes, lot-level component traceability |
| **Performance Analysis** | Full | Production line performance, cost reports, inventory summary |

We cover nine of eleven MESA functions, with Maintenance and full Process Management (step-by-step routing) omitted due to scope constraints.

---

## System Roles and Access Control (RBAC)

### Reference

ISA-95 requires that personnel are **"unequivocally identified"** and **"authorized"** before performing manufacturing operations. Our RBAC design follows this principle using a `Role -> Permission -> API Endpoint` chain.

### Role Definitions

Roles are configurable, but the the system ships with eight default roles based on a small electronics factory:

| Role Code | Display Name | ISA-95 Domain | Real-World Equivalent | Primary Responsibility |
|---|---|---|---|---|
| `SYS_ADMIN` | System Admin | Cross-domain | IT Administrator / Factory Owner | Full system access, user management, system configuration |
| `PROD_MGR` | Production Manager | Production Operations | Production Superintendent | Oversees production planning, approves PRs and WOs, manages production lines |
| `LINE_LEADER` | Line Leader | Production Operations | Shop Floor Supervisor | Leads production workers, manages material requests on the line |
| `PROD_WORKER` | Production Worker | Production Operations | Assembly Operator | Executes work orders, views assignments (read-only operational role) |
| `QC_INSPECTOR` | QC Inspector | Quality Operations | Quality Control Technician | Performs quality inspections on finished product instances |
| `WH_STAFF` | Warehouse Staff | Inventory Operations | Warehouse Operator / Storekeeper | Receives goods, issues materials, manages stock, performs stocktakes |
| `PURCH_STAFF` | Purchasing Staff | Procurement (bridges ERP-MES) | Procurement Officer | Creates and manages Purchase Orders, coordinates with suppliers |
| `SALES_STAFF` | Sales Staff | Sales (bridges ERP-MES) | Sales Representative | Creates Sales Orders, triggers Production Requests for demand |

### Role-Permission Matrix

Our system has 45 granular permissions grouped by module. Here is the full access matrix:

#### Production Module

| Permission | Description | SYS_ADMIN | PROD_MGR | LINE_LEADER | PROD_WORKER | QC_INSPECTOR | WH_STAFF | PURCH_STAFF | SALES_STAFF |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `PR_READ` | View Production Requests | Yes | Yes | — | — | — | — | Yes | Yes |
| `PR_CREATE` | Create Production Requests | Yes | Yes | — | — | — | — | — | Yes |
| `PR_UPDATE` | Edit Production Requests | Yes | Yes | — | — | — | — | — | — |
| `PR_APPROVE` | Approve Production Requests | Yes | Yes | — | — | — | — | — | — |
| `PR_CANCEL` | Cancel Production Requests | Yes | Yes | — | — | — | — | — | — |
| `WO_READ` | View Work Orders | Yes | Yes | Yes | Yes | Yes | — | — | — |
| `WO_CREATE` | Create Work Orders | Yes | Yes | — | — | — | — | — | — |
| `WO_UPDATE` | Edit and transition Work Orders | Yes | Yes | Yes | — | — | — | — | — |
| `WO_COMPLETE` | Complete Work Orders | Yes | Yes | — | — | — | — | — | — |

#### Quality Module

| Permission | Description | SYS_ADMIN | PROD_MGR | LINE_LEADER | PROD_WORKER | QC_INSPECTOR | WH_STAFF | PURCH_STAFF | SALES_STAFF |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `QC_READ` | View quality checks | Yes | Yes | Yes | Yes | Yes | — | — | — |
| `QC_CREATE` | Perform quality inspections | Yes | — | — | — | Yes | — | — | — |

#### Procurement Module

| Permission | Description | SYS_ADMIN | PROD_MGR | LINE_LEADER | PROD_WORKER | QC_INSPECTOR | WH_STAFF | PURCH_STAFF | SALES_STAFF |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `PO_READ` | View Purchase Orders | Yes | Yes | — | — | — | — | Yes | — |
| `PO_CREATE` | Create and edit draft POs | Yes | — | — | — | — | — | Yes | — |
| `PO_SUBMIT` | Submit POs for approval | Yes | — | — | — | — | — | Yes | — |
| `PO_APPROVE` | Approve pending POs | Yes | Yes | — | — | — | — | Yes | — |
| `PO_SEND` | Send approved POs to supplier | Yes | — | — | — | — | — | Yes | — |
| `PO_RECEIVE` | Receive goods against POs | Yes | — | — | — | — | Yes | Yes | — |
| `PO_CANCEL` | Cancel POs | Yes | Yes | — | — | — | — | Yes | — |

#### Warehouse and Inventory Module

| Permission | Description | SYS_ADMIN | PROD_MGR | LINE_LEADER | PROD_WORKER | QC_INSPECTOR | WH_STAFF | PURCH_STAFF | SALES_STAFF |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `WH_STOCK_READ` | View inventory/stock levels | Yes | Yes | — | — | — | Yes | — | — |
| `WH_STOCK_ADJUST` | Adjust inventory balances | Yes | — | — | — | — | Yes | — | — |
| `WH_MANAGE` | Full CRUD on warehouse entities | Yes | — | — | — | — | Yes | — | — |
| `WH_INDUCT` | Induct finished products | Yes | Yes | — | — | — | Yes | — | — |
| `MR_READ` | View material requests | Yes | Yes | Yes | Yes | — | Yes | — | — |
| `MR_CREATE` | Create material requests | Yes | — | Yes | — | — | Yes | — | — |
| `MR_APPROVE` | Issue material (fulfill requests) | Yes | Yes | — | — | — | Yes | — | — |

#### Sales Module

| Permission | Description | SYS_ADMIN | PROD_MGR | LINE_LEADER | PROD_WORKER | QC_INSPECTOR | WH_STAFF | PURCH_STAFF | SALES_STAFF |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `SO_READ` | View Sales Orders | Yes | Yes | — | — | — | — | — | Yes |
| `SO_CREATE` | Create and edit draft SOs | Yes | — | — | — | — | — | — | Yes |
| `SO_SUBMIT` | Submit SOs for approval | Yes | — | — | — | — | — | — | Yes |
| `SO_APPROVE` | Approve pending SOs | Yes | Yes | — | — | — | — | — | Yes |
| `SO_SHIP` | Ship/fulfill SOs | Yes | — | — | — | — | Yes | — | Yes |
| `SO_CANCEL` | Cancel SOs | Yes | Yes | — | — | — | — | — | Yes |

### Separation of Duties (Two-Man Rule)

To prevent fraud and enforce accountability, the system implements a **two-man rule** on critical approval actions:

- **Purchase Order Approval**: The creator of a Purchase Order cannot approve their own PO.
- **Production Request Approval**: The creator of a Production Request cannot approve their own PR.
- **Sales Order Approval**: The creator of a Sales Order cannot approve their own SO.

This is enforced at the service level to ensure compliance across all API operations:

- **Employee-Level Enforcement**: Constraints are evaluated using unique employee IDs rather than roles. For example, if two employees hold the exact same role (e.g., both are Purchasing Staff), Employee A can create a Purchase Order and Employee B can approve it. However, Employee A is strictly blocked from self-approving.
- **Collaborative peer review**: Having multiple users with the same role facilitates collaborative approval flows without needing to escalate to separate roles, as long as two distinct human accounts are involved.
- **Audit trail tracing**: The database stores distinct foreign keys (`employeeId` for the creator and `approverId` for the approver) to guarantee permanent cryptographic and operational traceability.

---

## Business Flow: End-to-End Manufacturing Lifecycle

### Flow Overview

```
Inventory Report -> Low Stock Alert
    ├─ Low Component -> Purchase Order -> Goods Receipt -> Component Lots
    └─ Low Product  -> Production Request -> Work Order -> Production -> QC -> Warehouse
```

### Step-by-Step Flow

#### Inventory Summary Report
- **Roles involved**: Production Manager, Warehouse Staff.
- **Stock tracking**: Provides real-time inventory visibility for both components (raw materials) and finished products:
  - **Component Stock**: Aggregated from the `ComponentStock` table across warehouses. Marked as `LOW_STOCK` when available quantity is equal or falls below the minimum stock level.
  - **Product Stock**: Counted from `ProductInstance` records with status `IN_STOCK_SALES`. Marked as `LOW_STOCK` when available count is equal or below minimum, and `OUT_OF_STOCK` when zero.
- **Decision pathways**: Based on the report, users decide whether to create a Purchase Order for low components (procurement path) or create a Production Request for low products (manufacturing path).

#### Purchase Order (Procurement Path)
- **Roles involved**: Purchasing Staff creates, Production Manager or another Purchasing Staff member approves.
- **Status lifecycle progression**: Draft -> Pending -> Approved -> Ordered -> Receiving -> Completed.
- **Transition workflow**:
  - **Draft to Pending**: Initiated by Purchasing Staff submission.
  - **Pending to Approved**: Approved by Production Manager or a different Purchasing Staff member (two-man rule enforced).
  - **Approved to Ordered**: Sent to the supplier by Purchasing Staff.
  - **Ordered to Receiving**: Initiated by Warehouse Staff upon partial shipment arrival.
  - **Receiving to Completed**: Completed by Warehouse Staff when all ordered quantities are fully received.

**Why APPROVED before ORDERED?** In small companies, the manager approves the budget/supplier, but the purchasing staff actually contacts the supplier. This separation ensures financial approval happens before any commitment is made.


#### Goods Receipt and Component Lots
- **Roles involved**: Warehouse Staff.
- **Receipt action**: Warehouse Staff receives goods against an Ordered or Receiving PO.
- **Lot generation**: Creates unique `ComponentLot` records with receipt-specific lot codes for full material traceability.
- **Aggregate updates**: Increments the `ComponentStock` aggregate and logs an `InventoryTransaction` of type `IMPORT_PO` for audits.
**Lot-level traceability:** Every box/batch of components gets a unique `lotCode`. This enables:
- **Forward traceability:** Which finished products used components from lot X?
- **Backward traceability:** If a product fails, which component lot caused the defect?
- **Auto-unblocking**: If the PO is linked to a Production Request in `WAITING_MATERIAL` status, the system runs an MRP check. If materials are sufficient, the PR status is promoted to `PENDING`.

#### Production Request
- **Roles involved**: Production Manager or Sales Staff creates, Production Manager approves.
- **Status lifecycle progression**:
  - **Material sufficient**: Draft -> Pending -> Approved -> In Progress -> Fulfilled.
  - **Material shortage**: Draft -> Waiting Material -> [procure materials] -> Pending -> Approved -> In Progress -> Fulfilled.
- **MRP Feasibility Check**: On submission, the system evaluates the Bill of Materials (BOM) for the product, calculates the required quantity per component, and compares it against aggregate `ComponentStock`.
- **BOM snapshotting**: Requirements are frozen as `ProductionRequestDetail` records at submission, protecting in-flight requests from subsequent BOM modifications.

#### Work Order
- **Roles involved**: Production Manager creates, Line Leader manages on the floor.
- **Status lifecycle progression**: Draft -> Released -> In Progress -> Completed.
- **Core constraints**:
  - **Prerequisite status**: Can only be created from Approved Production Requests.
  - **Batch grouping**: Allows grouping multiple PRs for the same product into one Work Order.
  - **Splitting capacity**: Allows splitting a single PR across multiple Work Orders for partial execution.
  - **Target warehouse routing**: Requires configuring target warehouse destinations (`targetSalesWarehouseId` and `targetErrorWarehouseId`) before release.

#### Material Request and Material Issuing
- **Roles involved**: Line Leader creates Material Request, Warehouse Staff issues material.

This is the sub-process that transfers components from the warehouse to the production floor:
- **Request generation**: Auto-generated from the Work Order. The system calculates required components using the frozen BOM snapshot from the linked Production Requests.
- **Stock validation**: Warehouse Staff runs a validation endpoint to verify component availability in the source warehouse.
- **Material issuing**: Warehouse Staff consumes specific lots, which decrements the `ComponentStock` aggregate, deducts `ComponentLot.currentQuantity`, logs an `EXPORT_PRODUCTION` transaction, and sets the request status to ISSUED.
**Why lot-level consumption?** For electronics, component traceability is critical. If a defective batch of capacitors is identified, the factory must know exactly which finished products used capacitors from that lot.

#### Work Order Completion
- **Roles involved**: Production Manager.
- **Output confirmation**: Work Orders are completed by confirming actual quantity produced, labor cost, and overhead cost.
- **Batch and instance setup**: The system generates a `ProductionBatch` record and individual `ProductInstance` records with unique serial numbers starting in `PENDING_QC` status, WO transitions to `COMPLETED`.

#### Quality Check
- **Roles involved**: QC Inspector.
- **Inspection process**: Each `ProductInstance` is inspected individually using the product's associated `QualityChecklist` and its defined `InspectionPoint`s.
- **Evaluation criteria**: Inspectors must evaluate all checklist points. The outcome is binary: a single point failure fails the entire unit ("One Fail = Total Fail").
- **Cost absorption calculation**: Good units absorb the cost of defective units. Unit production cost is calculated as `(laborCost + overheadCost + totalMaterialCost) / passedCount`. Failed units are assigned a unit cost of zero.

#### Product Induction
- **Roles involved**: Warehouse Staff.
- **Induction action**: Warehouse Staff physically receives and scans units at the warehouse gate:
  - **Passed units**: Directed to the Sales Warehouse and updated to `IN_STOCK_SALES`.
  - **Failed units**: Directed to the Error Warehouse and updated to `IN_STOCK_ERROR`.
- The routing is determined by the Work Order's `targetSalesWarehouseId` and `targetErrorWarehouseId` configuration.
- **Attribution loop**: Each inducted unit attributes to the oldest matching Production Request, incrementing the fulfilled quantity until the PR moves to `FULFILLED`.

---

## Database Design Rationale

### Inspection Types

```prisma
enum InspectionType {
  BINARY        // Go/No-Go attribute inspection
  MEASUREMENT   // Variable inspection with min/max tolerance
  SELECTION     // Categorical/visual assessment
}
```

These three types map directly to international quality inspection standards:

| Type | Standard Mapping | Example in Electronics | Data Captured |
|---|---|---|---|
| **BINARY** | ISO 2859 (Attribute Inspection) | LED power verification | `passed: boolean` |
| **MEASUREMENT** | ISO 3951 (Variable Inspection) | Output voltage tolerance checks | `measuredValue: Decimal` compared against min/max bounds |
| **SELECTION** | ISO 2859 (Multi-level Attribute) | Cosmetic grading or solder joints | `passed: boolean` and detailed grading comments |

- **Design decision**: BINARY and MEASUREMENT satisfy the vast majority of electronic inspection needs. SELECTION was added to handle subjective/categorical assessments (e.g., cosmetic grade, surface finish classification) that are common in consumer electronics but don't fit a simple Yes/No or numeric range. In manufacturing, this is sometimes called **"Sensory Inspection"** or **"Visual Grading"**.
- **Scope limitation**: Additional specialized types were omitted to prioritize simplicity for the capstone scope.

### Warehouse Types

```prisma
enum WarehouseType {
  COMPONENT    // Stores raw materials and components
  SALES        // Stores QC-passed finished products ready for sale
  ERROR        // Stores QC-failed products for rework or disposal
}
```

**Reference:** ISA-95 defines **Material Storage** as part of Inventory Operations. The 3-type model reflects the physical reality of small electronics factories:
- Raw materials warehouse (receiving area)
- Finished goods warehouse (shipping area)
- Quarantine/defect holding area (required for ISO 9001 non-conformance management)

### Product Instance Status Lifecycle

```prisma
enum ProductInstanceStatus {
  PENDING_QC       // Just produced, awaiting quality inspection
  PASSED_QC        // Inspection passed, ready for induction
  FAILED_QC        // Inspection failed, awaiting error warehouse induction
  IN_STOCK_SALES   // In sales warehouse, available for shipping
  IN_STOCK_ERROR   // In error warehouse, awaiting disposition
  SHIPPED          // Sent to customer
}
```

- **Genealogy tracking**: Provides a granular lifecycle history for each individual unit, enabling full tracking from initial production through quality inspection, warehouse induction, and customer shipment.

### Bill of Materials and Snapshot Strategy

- **BOM immutability**: The master `BillOfMaterial` table is mutable. To prevent production errors if a design changes mid-run, BOM requirements are copied as a static snapshot into `ProductionRequestDetail` at request submission. All downstream material staging checks reference this snapshot.

### Component Lot Traceability

- **Forward and backward tracing**: Every raw material receipt generates a `ComponentLot` with a unique `lotCode`. Material requests track consumption down to these specific lots, allowing teams to trace a defective component lot to the specific finished goods that consumed it.

### Inventory Transaction Log

- **Audit trail integrity**: The `InventoryTransaction` table functions as an append-only ledger. No records are ever deleted. Adjustments, transfers, imports, and production consumption are logged permanently with user credentials and timestamps, preventing data drift.

---

## Key Design Decisions and Justifications

### Separation of Production Request and Work Order

- **Design separation**: The Production Request handles material requirements planning and business demand authorization (Level 4 to Level 3 interface, follows the ISA-95). The Work Order handles physical floor execution, line scheduling, and cost tracking (Level 3 internal).
- **Operational flexibility**: A single Production Request can be split across multiple Work Orders (e.g., capacity bottlenecks), and multiple requests can be combined into a single production batch for manufacturing efficiency.

### Separated Material Request Step

- **Accountability boundary**: Separates material planning from physical floor execution. The warehouse staff must explicitly validate and confirm stock availability, ensuring no components are removed without authorization.
- **Genealogy accuracy**: Forces manual selection of specific component lots upon issue, preserving the integrity of the material genealogy path.

### Manual Product Induction After Quality Control

- **Physical alignment**: Ensures the system database updates only when products are physically transferred and received at the warehouse gates.
- **Dual-control validation**: Establishes a verification loop where warehouse staff verify physical counts and serial numbers against the completed production batch before declaring stock available for sales.

### Document Lifecycles

- **Draft phase**: Allows the creator to draft records, edit line items, and adjust details without locking system resources.
- **Pending verification**: Freezes financial and quantity fields during the review cycle, preventing changes while approvals are in progress.
- **Approved state**: Formally commits resources (allocating material for SOs or authorizing vendor expenditures for POs).

---

## Technology Stack

Our technology selections prioritize stability, strong typing, and rapid development within the capstone scope:

- **Frontend**: React, TypeScript, and Vite for a fast, component-driven single-page application.
- **Backend**: Node.js, Express, and TypeScript to maintain language consistency and simplify API development.
- **Database**: PostgreSQL to ensure strict transaction safety and relational integrity for financial and inventory data.
- **ORM**: Prisma 7 for database access security, type-safety, and automated migration management.
- **Auth**: JWT with bcrypt hashing for secure token-based sessions.
- **Infrastructure**: Docker Compose to guarantee environment parity during developer testing and grading evaluations.

---

## Limitations and Future Work

Due to time constraints, several advanced features were left out of the MVP scope:

| Feature Area | Implementation Status | Scope Justification |
|---|---|---|
| Maintenance Operations (CMMS) | Omitted | Equipment scheduling is not critical for manual workbench operations. |
| IoT and Machine Integration | Omitted | Relies entirely on manual database entry rather than machine interfaces. |
| Advanced Scheduling | Omitted | Simplified dispatching without Gantt chart or machine load logic. |
| Multi-step Production Routing | Simplified | Uses a single-step BOM assembly process instead of complex multi-operation routing. |
| Statistical Process Control (SPC) | Omitted | Standard quality inspection without real-time control charts. |
| Barcode/QR Scanning Hardware | Partial | Handled using standard device camera scanning rather than dedicated hardware. |
| Localization | Omitted | Relies on a single-language English interface. |
| Notification Channels | Partial | Restricts alerts to in-app notification boards without SMS or email hooks. |

---

## References

- **ISA-95 / IEC 62264**: Enterprise-Control System Integration
  - Part 1: Models and Terminology.
  - Part 3: Activity Models of Manufacturing Operations Management (defines Production, Quality, Inventory, Maintenance domains).
- **MESA International**: MESA-11 Model (11 core MES functions).
  - Web reference: https://www.mesa.org
- **ISO 2859**: Sampling procedures for inspection by attributes (basis for BINARY and SELECTION inspection types).
- **ISO 3951**: Sampling procedures for inspection by variables (basis for MEASUREMENT inspection type).
- **ISO 9001:2015**: Quality Management Systems (non-conformance management mapping to the Error Warehouse concept).
- **SAP ME (Manufacturing Execution)**: Commercial MES reference for workflow design.
  - Focus areas: Production Order lifecycle, Quality Inspection types, Material staging.
- **Siemens Opcenter Execution**: Commercial MES reference for lot traceability and genealogy concepts.
