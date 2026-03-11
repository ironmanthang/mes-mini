# Seed Data Enrichment Plan for Demo

Enrich `seed.ts` with realistic demo data for a teacher demo tomorrow. The goal is to populate all Swagger-documented API domains with 10-15 rows for important tables (SO, PO, PR) and 5-10 rows for normal tables (Agents, Suppliers, Components, Products).

> [!IMPORTANT]
> **This is seed-only data inserted via Prisma `upsert`/`create`, bypassing the API service layer entirely.** This means we skip service-level validations (e.g., SO code auto-generation, MRP feasibility checks). The data must be **structurally valid** against the Prisma schema but does not need to pass runtime business rules. We insert statuses directly.

---

## Proposed Changes

### Master Data Foundation (Seed before transactional data)

#### [MODIFY] [seed.ts](file:///d:/program/mes-mini/backend/prisma/scripts/seed.ts)

**1. Agents (Currently: 1 → Target: 6)**

| Code | Name | City |
|------|------|------|
| AGT-001 | Authorized Dealer Alpha | Hanoi *(exists)* |
| AGT-002 | Beta Electronics | Ho Chi Minh City |
| AGT-003 | Gamma Distribution | Da Nang |
| AGT-004 | Delta Tech Solutions | Hai Phong |
| AGT-005 | Epsilon Trading Co. | Can Tho |
| AGT-006 | Zeta Systems JSC | Binh Duong |

---

**2. Suppliers (Currently: 3 → Target: 7)**

| Code | Name | Note |
|------|------|------|
| SUP-HP | Hoa Phat Steel | *(exists)* |
| SUP-SS | Samsung Electronics | *(exists)* |
| SUP-LG | Logistics Global | *(exists)* |
| SUP-INTEL | Intel Vietnam | Chips, CPUs |
| SUP-FOXCONN | Foxconn Assembly | PCBs, Connectors |
| SUP-KINGSTON | Kingston Memory | RAM, Storage |
| SUP-CORSAIR | Corsair Components | PSUs, Cooling |

**New SupplierComponent links** (required by PO service `createPO` validation):

| Supplier | Components |
|----------|-----------|
| SUP-INTEL | COM-CPU-ULTRA, COM-CHIP-X1 |
| SUP-FOXCONN | COM-SCREW-M5, COM-SCREEN-OLED |
| SUP-KINGSTON | COM-RAM-32GB, COM-BATTERY-500 |
| SUP-CORSAIR | COM-PSU-850W |

---

**3. Components (Currently: 7 → Target: 13)**

| Code | Name | Unit | Cost | MinStock |
|------|------|------|------|----------|
| *7 existing* | | | | |
| COM-DISPLAY-15 | Display Panel 15.6" | pcs | 3500000 | 50 |
| COM-SSD-512 | SSD 512GB NVMe | pcs | 1800000 | 80 |
| COM-WIFI-AX | WiFi AX Module | pcs | 250000 | 200 |
| COM-CASE-ALLOY | Aluminum Case Body | pcs | 800000 | 100 |
| COM-KB-MECH | Mechanical Keyboard Unit | pcs | 650000 | 60 |
| COM-FAN-120 | Cooling Fan 120mm | pcs | 150000 | 150 |

New ComponentStock entries for these in `WH-MAIN` (so MRP can check them).

---

**4. Products (Currently: 3 → Target: 6)**

| Code | Name | BOM |
|------|------|-----|
| *3 existing* | | |
| PROD-TABLET-A1 | Tablet A1 | 1x COM-SCREEN-OLED, 1x COM-BATTERY-500, 1x COM-WIFI-AX |
| PROD-DESKTOP-Z5 | Desktop Z5 Workstation | 1x COM-CPU-ULTRA, 2x COM-RAM-32GB, 1x COM-SSD-512, 1x COM-PSU-850W |
| PROD-MONITOR-M1 | Monitor M1 Pro | 1x COM-DISPLAY-15, 1x COM-CASE-ALLOY |

BOM must be seeded to enable Production Requests.

---

### Transactional Data (Depends on Master Data above)

**5. Purchase Orders (Currently: 0 → Target: 12)**

> [!IMPORTANT]
> PO `createPO` service validates `SupplierComponent` links. Since we seed via Prisma directly, we only need FK integrity. But for realism, each PO's supplier must actually supply the components in its details.

| Code | Supplier | Status | Priority | Components |
|------|----------|--------|----------|-----------|
| PO-2026-001 | SUP-HP | COMPLETED | HIGH | Steel 5mm (100), Steel 10mm (50) |
| PO-2026-002 | SUP-SS | COMPLETED | MEDIUM | Chip X1 (200) |
| PO-2026-003 | SUP-INTEL | SENT_TO_SUPPLIER | HIGH | CPU Ultra (50) |
| PO-2026-004 | SUP-KINGSTON | PARTIALLY_RECEIVED | MEDIUM | RAM 32GB (100) |
| PO-2026-005 | SUP-CORSAIR | PENDING_APPROVAL | LOW | PSU 850W (30) |
| PO-2026-006 | SUP-FOXCONN | DRAFT | MEDIUM | Screw M5 (5000) |
| PO-2026-007 | SUP-INTEL | CANCELLED | LOW | CPU Ultra (10) |
| PO-2026-008 | SUP-KINGSTON | SENT_TO_SUPPLIER | HIGH | RAM 32GB (200), Battery 500 (100) |
| PO-2026-009 | SUP-HP | DRAFT | MEDIUM | Steel 5mm (200) |
| PO-2026-010 | SUP-FOXCONN | PENDING_APPROVAL | HIGH | Screen OLED (300) |
| PO-2026-011 | SUP-CORSAIR | COMPLETED | MEDIUM | PSU 850W (50) |
| PO-2026-012 | SUP-SS | SENT_TO_SUPPLIER | LOW | Chip X1 (500) |

- `COMPLETED` POs: set `quantityReceived = quantityOrdered`
- `PARTIALLY_RECEIVED`: set partial received counts
- `SENT_TO_SUPPLIER`: approverId set to manager
- `PENDING_APPROVAL` / `DRAFT`: no approver
- `CANCELLED`: no approver
- Each PO uses `employeeId` = Purchasing Staff, `approverId` = Manager (for approved ones)

---

**6. Sales Orders (Currently: 3 scenario SOs → Target: 12 total with varied statuses)**

| Code | Agent | Status | Priority | Product(s) |
|------|-------|--------|----------|-----------|
| *3 existing scenario SOs* | | | | |
| SO-2026-001 | AGT-002 | DRAFT | MEDIUM | Laptop X1 (5) |
| SO-2026-002 | AGT-003 | PENDING_APPROVAL | HIGH | Laptop X1 (10) |
| SO-2026-003 | AGT-004 | APPROVED | HIGH | Laptop X1 (3) |
| SO-2026-004 | AGT-005 | IN_PROGRESS | MEDIUM | Laptop X1 (8) |
| SO-2026-005 | AGT-002 | COMPLETED | LOW | Gaming PC (2) |
| SO-2026-006 | AGT-006 | CANCELLED | MEDIUM | Smartwatch V1 (15) |
| SO-2026-007 | AGT-003 | DRAFT | LOW | Tablet A1 (20) |
| SO-2026-008 | AGT-004 | APPROVED | HIGH | Desktop Z5 (5) |
| SO-2026-009 | AGT-005 | PENDING_APPROVAL | MEDIUM | Monitor M1 (10), Laptop X1 (2) |

- `APPROVED` / `IN_PROGRESS` SOs: set `approverId` = Manager (different employee from creator)
- `COMPLETED`: set `quantityShipped = quantity`, create additional ProductInstances as needed
- `CANCELLED`: append cancel note
- `employeeId` = Sales Staff (employee 6)
- `approverId` = Manager (employee 2) — different from creator to satisfy audit rule

---

**7. Production Requests (Currently: 0 → Target: 8)**

| Code | Product | Qty | Status | SO Detail Link |
|------|---------|-----|--------|---------------|
| PR‑20260310‑0001 | Gaming PC | 20 | WAITING_MATERIAL | SO-SCENARIO-TRAFFIC (SO Detail) |
| PR‑20260310‑0002 | Smartwatch | 20 | APPROVED | SO-SCENARIO-YELLOW (SO Detail) |
| PR‑20260310‑0003 | Laptop X1 | 30 | APPROVED | None (MTS) |
| PR‑20260310‑0004 | Tablet A1 | 15 | WAITING_MATERIAL | None (MTS) |
| PR‑20260310‑0005 | Desktop Z5 | 5 | APPROVED | SO-2026-008 Detail |
| PR‑20260310‑0006 | Gaming PC | 10 | CANCELLED | None (MTS) |
| PR‑20260310‑0007 | Monitor M1 | 25 | PARTIALLY_FULFILLED | None (MTS) |
| PR‑20260310‑0008 | Laptop X1 | 50 | FULFILLED | None (MTS) |

- `WAITING_MATERIAL`: products whose components have shortages
- `APPROVED`: products whose components have sufficient stock
- `CANCELLED`: with reason note
- `FULFILLED`: linked to a completed work order already
- `PARTIALLY_FULFILLED`: linked to one work order with partial qty
- `employeeId` = Manager (employee 2)

---

**8. Support Data**

- **ComponentStock**: seed stock for new components in WH-MAIN warehouse
  - Enough stock for Tablet BOM and Monitor BOM (for APPROVED PRs)
  - Insufficient stock for Desktop Z5 (for some WAITING_MATERIAL scenario)
- **ProductInstances**: Create ~20 additional for new products where needed (for SO shipping)
- **WorkOrders**: Minimal for FULFILLED/PARTIALLY_FULFILLED PRs

---

## Code Organization

All new seed functions will follow the existing pattern:
1. New function per logical group (e.g., `seedPurchaseOrders()`, `seedSalesOrders()`, `seedProductionRequests()`)
2. Added to `SEED_CONFIG` toggle panel
3. Called from `main()` in correct dependency order
4. All use `upsert` with unique `code` field to be idempotent

**Execution order** (respecting FKs):
```
Roles → Employees → Suppliers → Components → Warehouses → Products/BOM 
→ SupplierComponents → Agents → ComponentStock 
→ ProductInstances → PurchaseOrders → SalesOrders → ProductionRequests
```

---

## Verification Plan

### Automated Test (Primary)

```bash
# 1. Reset DB and run seed
docker compose exec backend npx prisma migrate reset --force

# 2. Verify seed runs without errors
docker compose exec -T backend npx prisma db seed
```

Expected: No errors, all console logs show checkmarks.

### Manual Verification via Swagger

1. **Start server**: `docker compose up -d`
2. **Open Swagger**: `http://localhost:5000/api-docs/`
3. **Login**: POST `/api/auth/login` → `{"username": "admin", "password": "123456"}`
4. **Check each API** for populated data:
   - `GET /api/sales-orders` → should show 12+ orders with mixed statuses
   - `GET /api/purchase-orders` → should show 12 POs with mixed statuses
   - `GET /api/production-requests` → should show 8 PRs with mixed statuses
   - `GET /api/agents` → should show 6 agents
   - `GET /api/suppliers` → should show 7 suppliers
   - `GET /api/components` → should show 13 components
   - `GET /api/products` → should show 6 products
5. **Spot-check**: Open one APPROVED SO detail, verify `availableStock` and `shortage` are calculated
6. **Spot-check**: Open one PARTIALLY_RECEIVED PO, verify `quantityReceived < quantityOrdered`
