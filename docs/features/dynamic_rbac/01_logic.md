# Dynamic Permission-Based RBAC (SSOT)

> **Role:** Defines how authorization works across the entire backend.
> **Audience:** Backend developers, DevOps, and Security auditors.

---

## 1. Design Decisions

### Why Dynamic Permissions over Static Roles?
Routes are guarded by **granular permission codes** (`authorize(PERM.PO_APPROVE)`), not role names. Which roles have which permissions is a database concern managed at runtime via a UI — not hardcoded in source. This eliminates Role Explosion and decouples security policy from deployments.

### Why Direct PostgreSQL, No Redis?
A well-indexed `Employee → Role → RolePermission → Permission` JOIN resolves in ~1-3ms. Adding Redis would introduce cache invalidation risks — if an admin revokes a permission but a `redis.del()` fails silently, the user retains unauthorized access until TTL expires. In an MES where floor safety matters, this split-brain state is unacceptable.

### Why Immutable Codes?
All logic binds to immutable `roleCode` (e.g., `SYS_ADMIN`) and `permCode` (e.g., `PO_CREATE`). Display names like "System Admin" are for humans and can be renamed freely without breaking anything.

### Why Explicit Assignment for SYS_ADMIN (No Wildcard)?
`SYS_ADMIN` receives every permission explicitly in the seed. There is no middleware-level `if (role === 'admin') skip check` bypass. This means when a new permission is added, the migration must also assign it to `SYS_ADMIN`. The tradeoff is full transparency in the Permission Management UI.

---

## 2. Schema

```
Employee ──1:M── EmployeeRole ──M:1── Role ──1:M── RolePermission ──M:1── Permission
    │                                   │
    └── sessionVersion (Int)            └── roleCode (String, unique, immutable)
```

| Model | Purpose |
|---|---|
| `Permission` | Catalog of all granular actions (`permCode`, `module`, `description`). Managed via code/seed, not API. |
| `RolePermission` | M2M join between `Role` and `Permission`. Managed dynamically via `PUT /api/roles/:id/permissions`. |

---

## 3. Auth Flow (Per Request)

```
Request → protect() → authorize(PERM.X) → Handler

protect():
  1. Verify JWT → extract { id, sessionVersion }
  2. Single DB query: Employee + Roles + Permissions (nested select, no over-fetch)
  3. Check: status === ACTIVE
  4. Check: DB.sessionVersion === JWT.sessionVersion (mismatch → 401 "Session expired")
  5. Flatten all permCodes into req.user.permissions[]

authorize(...requiredPerms):
  - Pure in-memory check (zero DB queries)
  - OR logic: user needs at least ONE of the required permissions
  - O(n·m) where n ≈ 40 max, m ≈ 1-2 → effectively O(1)
```

---

## 4. Session Invalidation

JWTs are stateless — revoking permissions doesn't kill existing tokens. The `sessionVersion` field on `Employee` solves this:

- JWT payload includes `sessionVersion` at login time.
- `protect()` compares JWT's version against DB on every request.
- `PATCH /api/employees/:id/force-logout` increments `sessionVersion` → all existing tokens for that user are instantly rejected.

---

## 5. Compile-Time Safety

All permission codes live in a single `PERM` const object (`src/common/constants/permissions.ts`). Routes use `authorize(PERM.PO_READ)` — a typo like `PERM.PO_RAED` is caught by TypeScript at compile time, not at runtime in production.

```typescript
import { PERM } from '../../common/constants/permissions.js';
router.get('/', protect, authorize(PERM.PO_READ), getAllPOs);
```

---

## 6. Permission Catalog

All codes follow `MODULE_ACTION` naming. Full list in `src/common/constants/permissions.ts`.

| Module | Codes |
|---|---|
| EMP | `EMP_READ`, `EMP_CREATE`, `EMP_UPDATE`, `EMP_STATUS` |
| ROLE | `ROLE_MANAGE` |
| PO | `PO_READ`, `PO_CREATE`, `PO_SUBMIT`, `PO_APPROVE`, `PO_SEND`, `PO_RECEIVE`, `PO_CANCEL` |
| SO | `SO_READ`, `SO_CREATE`, `SO_SUBMIT`, `SO_APPROVE`, `SO_SHIP`, `SO_CANCEL` |
| PR | `PR_READ`, `PR_CREATE`, `PR_UPDATE`, `PR_CANCEL`, `PR_LINK_PO` |
| WO | `WO_READ`, `WO_CREATE`, `WO_UPDATE`, `WO_COMPLETE` |
| LINE | `LINE_READ`, `LINE_CREATE`, `LINE_UPDATE`, `LINE_DELETE` |
| QC | `QC_READ`, `QC_CREATE` |
| WH | `WH_STOCK_READ`, `WH_STOCK_ADJUST`, `WH_MANAGE` |
| MR | `MR_READ`, `MR_CREATE`, `MR_APPROVE` |
| ST | `ST_READ`, `ST_CREATE`, `ST_COMPLETE` |
| ATTACH | `ATTACH_UPLOAD`, `ATTACH_DELETE_ANY` |
| NOTIF | `NOTIF_READ` |
| DASH | `DASH_READ` |
| PRODUCT | `PRODUCT_READ`, `PRODUCT_CREATE`, `PRODUCT_UPDATE` |
| COMP | `COMP_READ`, `COMP_CREATE`, `COMP_UPDATE` |
| SUPPLIER | `SUPPLIER_READ`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE` |
| AGENT | `AGENT_READ`, `AGENT_CREATE`, `AGENT_UPDATE` |

---

## 7. Default Role Assignments

> These are the **seed defaults**. Admins can modify role-permission assignments at runtime via the Management API (Section 8). `NOTIF_READ` is automatically assigned to every role.

### `SYS_ADMIN` — System Admin
All 58 permissions (explicitly assigned, no wildcard bypass).

### `PROD_MGR` — Production Manager (33 permissions)
The factory floor authority. Approves POs/SOs, manages the full production lifecycle.

| Area | Permissions |
|---|---|
| Procurement | `PO_READ`, `PO_APPROVE`, `PO_CANCEL` |
| Sales | `SO_READ`, `SO_APPROVE`, `SO_CANCEL` |
| Production | `PR_READ`, `PR_CREATE`, `PR_UPDATE`, `PR_CANCEL`, `PR_LINK_PO` |
| Work Orders | `WO_READ`, `WO_CREATE`, `WO_UPDATE`, `WO_COMPLETE` |
| Lines | `LINE_READ`, `LINE_CREATE`, `LINE_UPDATE`, `LINE_DELETE` |
| Quality | `QC_READ` |
| Warehouse | `WH_STOCK_READ`, `MR_READ`, `MR_APPROVE`, `ST_READ` |
| Master Data | `PRODUCT_READ`, `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `COMP_READ`, `COMP_CREATE`, `COMP_UPDATE`, `SUPPLIER_READ` |
| Other | `DASH_READ`, `NOTIF_READ` |

### `WH_STAFF` — Warehouse Staff (20 permissions)
Handles inventory, stocktaking, goods receipt (PO), and goods issue (SO shipping).

| Area | Permissions |
|---|---|
| Inventory | `WH_STOCK_READ`, `WH_STOCK_ADJUST`, `WH_MANAGE` |
| Material Requests | `MR_READ`, `MR_CREATE`, `MR_APPROVE` |
| Stocktake | `ST_READ`, `ST_CREATE`, `ST_COMPLETE` |
| Cross-module | `PO_RECEIVE`, `SO_SHIP`, `ATTACH_UPLOAD` |
| Master Data | `PRODUCT_READ`, `COMP_READ`, `COMP_CREATE`, `COMP_UPDATE`, `SUPPLIER_READ`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE` |
| Other | `NOTIF_READ` |

### `SALES_STAFF` — Sales Staff (14 permissions)
Owns the entire Sales Order lifecycle and agent/customer management.

| Area | Permissions |
|---|---|
| Sales | `SO_READ`, `SO_CREATE`, `SO_SUBMIT`, `SO_APPROVE`, `SO_SHIP`, `SO_CANCEL` |
| Production | `PR_READ`, `PR_CREATE` |
| Master Data | `PRODUCT_READ`, `AGENT_READ`, `AGENT_CREATE`, `AGENT_UPDATE` |
| Other | `DASH_READ`, `NOTIF_READ` |

### `PURCH_STAFF` — Purchasing Staff (15 permissions)
Owns the entire Purchase Order lifecycle and supplier relationships.

| Area | Permissions |
|---|---|
| Procurement | `PO_READ`, `PO_CREATE`, `PO_SUBMIT`, `PO_APPROVE`, `PO_SEND`, `PO_RECEIVE`, `PO_CANCEL` |
| Production | `PR_READ`, `PR_LINK_PO` |
| Master Data | `PRODUCT_READ`, `COMP_READ`, `SUPPLIER_READ`, `SUPPLIER_CREATE` |
| Other | `ATTACH_UPLOAD`, `NOTIF_READ` |

### `LINE_LEADER` — Line Leader (9 permissions)
Supervises work order execution on the production floor.

| Area | Permissions |
|---|---|
| Work Orders | `WO_READ`, `WO_UPDATE` |
| Lines | `LINE_READ` |
| Quality | `QC_READ` |
| Material Requests | `MR_READ`, `MR_CREATE` |
| Master Data | `PRODUCT_READ`, `COMP_READ` |
| Other | `NOTIF_READ` |

### `PROD_WORKER` — Production Worker (6 permissions)
Read-only access to their assigned work and materials.

| Area | Permissions |
|---|---|
| Work Orders | `WO_READ` |
| Quality | `QC_READ` |
| Material Requests | `MR_READ` |
| Master Data | `PRODUCT_READ`, `COMP_READ` |
| Other | `NOTIF_READ` |

### `QC_INSPECTOR` — QC Inspector (6 permissions)
Performs and records quality checks on work orders.

| Area | Permissions |
|---|---|
| Quality | `QC_READ`, `QC_CREATE` |
| Work Orders | `WO_READ` |
| Master Data | `PRODUCT_READ`, `COMP_READ` |
| Other | `NOTIF_READ` |

---

## 8. Management API

| Method | Path | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/permissions` | `ROLE_MANAGE` | List all permission codes (for assignment UI) |
| `GET` | `/api/roles/:id/permissions` | `ROLE_MANAGE` | Get permissions assigned to a role |
| `PUT` | `/api/roles/:id/permissions` | `ROLE_MANAGE` | Full-replace permission assignments for a role |
| `PATCH` | `/api/employees/:id/force-logout` | `EMP_STATUS` | Invalidate all sessions for a user |

Permissions themselves are **not** CRUD-managed via API. They are defined in code and deployed via migrations. Only the assignment of permissions to roles is dynamic.

---

## 9. Login Response Contract

```json
{
  "token": "eyJ...",
  "user": {
    "employeeId": 1,
    "username": "admin",
    "sessionVersion": 1,
    "roles": [{ "roleId": 1, "roleCode": "SYS_ADMIN", "roleName": "System Admin" }],
    "permissions": ["EMP_READ", "PO_READ", "PO_APPROVE", "..."]
  }
}
```

The frontend uses the `permissions[]` array for UI feature gating — never role names.
