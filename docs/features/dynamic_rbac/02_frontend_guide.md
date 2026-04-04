# Frontend Integration Guide: Dynamic RBAC

> **Status:** Backend is Live (Implemented in Phase 1)
> **Core Principle:** Use the `permissions[]` array for all UI gating. **Never** hardcode role names (e.g., "System Admin") in frontend logic.

---

## 1. Authentication & Payload

The `/api/auth/login` and `/api/auth/profile` responses now include a flattened `permissions` array:

```json
{
  "token": "...",
  "user": {
    "employeeId": 1,
    "permissions": ["PO_READ", "PO_CREATE", "PO_APPROVE", "SO_SHIP", "..."],
    "roles": [{ "roleCode": "SYS_ADMIN", "roleName": "System Admin" }]
  }
}
```

**Recommendation:** Store the `permissions` array in your Global State (Redux / Context / Pinia) alongside the user object.

---

## 2. UI Gating (Buttons & Features)

Create a helper function to verify access. This keeps your components clean.

### Recommended Helper (Typescript)
```typescript
/**
 * Returns true if the user has ANY of the required permissions.
 * Usage: hasPermission(user, 'PO_APPROVE') or hasPermission(user, ['PO_CREATE', 'PO_UPDATE'])
 */
export function hasPermission(user: User | null, required: string | string[]): boolean {
  if (!user || !user.permissions) return false;
  
  const requiredArray = Array.isArray(required) ? required : [required];
  return requiredArray.some(p => user.permissions.includes(p));
}
```

### Component Usage
```tsx
// Only show the Approve button if user has PO_APPROVE permission
{hasPermission(user, 'PO_APPROVE') && (
  <Button onClick={handleApprove}>Approve PO</Button>
)}
```

---

## 3. Route Guarding

In your React/Vue/Angular router, check the permissions array before entering a protected route.

```typescript
// Example: React Router protected route
const ProtectedRoute = ({ requiredPermission, children }) => {
  const { user } = useAuth();
  
  if (!hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Application definition
<Route 
  path="/purchase-orders/approve" 
  element={<ProtectedRoute requiredPermission="PO_APPROVE"><ApprovePage /></ProtectedRoute>} 
/>
```

---

## 4. Handling Session Invalidation (Forced Logout)

The backend now uses `sessionVersion` for security. If an Admin hits "Force Logout" on a user, the next request from that user will return a **401 Unauthorized**.

**Requirement:** Ensure your Axios/Fetch interceptor handles 401s by cleaning up local storage and redirecting to `/login`.

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session invalidated (possibly via force-logout)
      authService.logout(); 
      window.location.href = '/login?msg=session_expired';
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Cheat Sheet: Common Permission Codes

| You want to show... | Use Permission Code |
|---|---|
| **PO List/Detail** | `PO_READ` |
| **Approve PO Button** | `PO_APPROVE` |
| **SO List/Detail** | `SO_READ` |
| **Ship Goods Button** | `SO_SHIP` |
| **User/Employee List** | `EMP_READ` |
| **Role/Perm Mgmt UI** | `ROLE_MANAGE` |
| **Stocktake Tools** | `ST_CREATE` |

> [!TIP]
> The full list of all 58 codes is available in `backend/src/common/constants/permissions.ts`.

---

## 6. Building the Roles & Permission Management Dashboard

> [!IMPORTANT]
> All endpoints in this section require the `ROLE_MANAGE` permission. Gate the entire "Roles & Permissions" nav item behind `hasPermission(user, 'ROLE_MANAGE')`.

This section covers the **Admin Management Flow** — the UI that allows a System Admin to create roles, assign permissions, and manage the RBAC system at runtime.

### 6.1 Page Layout Concept

The recommended layout is a **two-panel design**:
- **Left Panel:** Role list (table or sidebar list showing all roles).
- **Right Panel:** Permission grid (checkbox matrix grouped by module) that updates when a role is selected.

### 6.2 API Reference

| Step | Method | Endpoint | Body | Purpose |
|---|---|---|---|---|
| List all roles | `GET` | `/api/roles` | — | Populate the left panel role list |
| Create a role | `POST` | `/api/roles` | `{ "roleName": "Floor Lead" }` | `roleCode` auto-generates if omitted |
| Rename a role | `PUT` | `/api/roles/:id` | `{ "roleName": "New Name" }` | Update display name only |
| Delete a role | `DELETE` | `/api/roles/:id` | — | Fails if role is assigned to any employee |
| Get permission catalog | `GET` | `/api/roles/permissions` | — | Full list of all 58 seeded permissions (for rendering checkboxes) |
| Get role's current perms | `GET` | `/api/roles/:id/permissions` | — | Which boxes to pre-check when a role is selected |
| Save permission changes | `PUT` | `/api/roles/:id/permissions` | `{ "permCodes": ["PO_READ", "SO_READ"] }` | **Full-replace** — send ALL checked permissions, not just changes |

### 6.3 Rendering the Checkbox Grid

1. Call `GET /api/roles/permissions` once on page load. This returns the **full catalog**:
   ```json
   [
     { "permissionId": 1, "permCode": "EMP_READ", "module": "EMP", "description": "View employees" },
     { "permCode": "PO_CREATE", "module": "PO", "description": "Create Purchase Orders" },
     ...
   ]
   ```
2. Group the results by `module` to create collapsible sections (EMP, PO, SO, WO, etc.).
3. When the admin clicks a role in the left panel, call `GET /api/roles/:id/permissions` to get the currently assigned codes. Use those to pre-check the matching boxes.

### 6.4 Saving Changes (Full-Replace Pattern)

When the admin clicks "Save", collect **every checked checkbox** into a single array and send it:

```typescript
// Collect ALL checked permission codes from the UI
const checkedCodes = checkboxes
  .filter(cb => cb.checked)
  .map(cb => cb.permCode);

// Send the full state — backend wipes old assignments and writes these atomically
await api.put(`/api/roles/${selectedRoleId}/permissions`, {
  permCodes: checkedCodes  // e.g., ["PO_READ", "PO_APPROVE", "EMP_READ"]
});
```

> [!WARNING]
> This is a **full-replace** (`PUT`), not a delta/patch. If the admin unchecks `PO_READ` and clicks Save, the backend deletes the old `PO_READ` assignment. If you only send the *newly checked* items, you will accidentally remove all previously existing permissions.

### 6.5 Safety Guards (Backend-Enforced)

These rules are enforced server-side. The frontend does **not** need to implement them, but should handle the error responses gracefully:

| Guard | What happens |
|---|---|
| `SYS_ADMIN` role cannot be deleted | Backend returns `400` with message |
| `SYS_ADMIN` permissions cannot be modified | Backend returns `400` with message |
| Role assigned to employees cannot be deleted | Backend returns `400` with message |
| Invalid `permCodes` in the array | Backend returns `400` listing the invalid codes |

### 6.6 Optional: Force-Logout After Permission Change

After saving permission changes for a role, consider prompting the admin: *"Do you want to force-logout all users with this role so the changes take effect immediately?"*

If yes, call `PATCH /api/employees/:id/force-logout` for each affected employee. Without this, users keep their old permissions until their JWT naturally expires.
