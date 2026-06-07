# Common Prisma Queries (The Most Important Part)

These are all the Prisma query methods your backend uses. Every example below is sourced from real code in this project.

---

## The Basic Pattern

Every Prisma query follows this shape:
```typescript
await prisma.<modelName>.<method>({ options });
```

- `<modelName>` = a table in your database (e.g., `component`, `product`, `supplier`)
- `<method>` = what you want to do (e.g., `findMany`, `create`, `update`, `delete`)

---

## 1. `findMany` — Get a List of Records

The most used query. Returns an **array** of records.

```typescript
// Get ALL components (no filter)
const components = await prisma.component.findMany();

// Filter by exact match (unit = 'kg')
const components = await prisma.component.findMany({
    where: { unit: 'kg' }
});

// Search by text (name contains 'steel', case-insensitive)
const components = await prisma.component.findMany({
    where: {
        componentName: { contains: 'steel', mode: 'insensitive' }
    }
});

// Sort results (newest first)
const components = await prisma.component.findMany({
    orderBy: { createdAt: 'desc' }
});

// Pagination (skip first 20, take next 20)
const components = await prisma.component.findMany({
    skip: 20,
    take: 20
});

// Return only specific fields (not the entire row)
const components = await prisma.component.findMany({
    select: { componentId: true, componentName: true, code: true }
    // Only returns these 3 fields
});
```

**Real example from `inventoryService.ts`:**
```typescript
// Search by name only (no OR needed if filtering 1 field)
const components = await prisma.component.findMany({
    where: {
        componentName: { contains: query.search, mode: 'insensitive' }
    },
    orderBy: { componentName: 'asc' }
});
```

---

## 2. `findUnique` — Get Exactly ONE Record by a Unique Field

Use this when you know the exact ID or unique code. Returns one record or `null`.

```typescript
// By primary key (ID)
const component = await prisma.component.findUnique({
    where: { componentId: 5 }
});

// By unique field (code is marked @unique in schema.prisma)
const component = await prisma.component.findUnique({
    where: { code: 'COM-001' }
});
```

> **Rule**: You can only use `findUnique` on fields marked `@id` or `@unique` in `schema.prisma`. If the field is not unique, you'll get a TypeScript error.

---

## 3. `findFirst` — Get the First Record That Matches

Like `findMany` but returns only the **first** result (or `null`). Useful for existence checks.

```typescript
// Check if a component is already used in a Purchase Order
const inPO = await prisma.purchaseOrderDetail.findFirst({
    where: { componentId: 5 }
});
if (inPO) throw new Error('Cannot delete: component is used in a PO.');
```

**Real example from `supplierService.ts`** (combining `NOT` and `OR`):
```typescript
// Find any supplier that has the same code, email, OR phone — but exclude self
const conflict = await prisma.supplier.findFirst({
    where: {
        NOT: { supplierId: currentSupplierId },  // exclude yourself
        OR: [
            { code: data.code },
            { email: data.email },
            { phoneNumber: data.phoneNumber }
        ]
    }
});
```

---

## 4. `create` — Insert One New Record

```typescript
const newComponent = await prisma.component.create({
    data: {
        code: 'COM-NEW',
        componentName: 'New Part',
        unit: 'pcs',
        minStockLevel: 10,
        standardCost: 25.50
    }
});
// Returns the created component (including auto-generated id)
```

---

## 5. `createMany` — Insert Multiple Records at Once

More efficient than calling `create` in a loop.

**Real example from `notificationService.ts`:**
```typescript
// Notify all managers at once (insert many notifications in one DB call)
await prisma.notification.createMany({
    data: employees.map(emp => ({
        type: 'ALERT',
        title: 'Low Stock',
        message: 'Component X is below minimum level',
        employeeId: emp.employeeId,
    }))
});
```

> `createMany` does NOT return the created records by default — it only returns `{ count: N }`.

---

## 6. `update` — Change ONE Existing Record

```typescript
const updated = await prisma.component.update({
    where: { componentId: 5 },      // WHICH record to update (must be unique)
    data: { componentName: 'Updated Name' }  // WHAT to change
});
// Only changes 'componentName'. All other fields are untouched.
```

**Real example from `notificationService.ts`:**
```typescript
// Mark a single notification as read
await prisma.notification.update({
    where: { notificationId: 12 },
    data: { isRead: true }
});
```

---

## 7. `updateMany` — Change MULTIPLE Records at Once

```typescript
// Mark ALL of a user's unread notifications as read in one query
await prisma.notification.updateMany({
    where: { employeeId: 3, isRead: false },  // filter: which rows to change
    data: { isRead: true }                    // what to change
});
// Returns: { count: 5 }  (how many rows were updated)
```

---

## 8. `delete` — Remove ONE Record

```typescript
await prisma.component.delete({
    where: { componentId: 5 }
});
```

---

## 9. `deleteMany` — Remove MULTIPLE Records at Once

**Real example from `supplierService.ts`:**
```typescript
// Remove all links between a supplier and a component
const result = await prisma.supplierComponent.deleteMany({
    where: {
        supplierId: 2,
        componentId: 7
    }
});
// Returns: { count: 1 }
```

---

## 10. `count` — Count How Many Records Match

Returns a plain number, not an array.

```typescript
// Count all components
const total = await prisma.component.count();
// Returns: 42

// Count only kg components
const kgCount = await prisma.component.count({
    where: { unit: 'kg' }
});
```

---

## 11. `upsert` — Insert if Not Exists, Otherwise Update

"Update or Insert". Checks if a record exists — if yes, updates it; if no, creates it.

**Real example from `supplierService.ts`:**
```typescript
// Link a supplier to a component — avoid duplicates
await prisma.supplierComponent.upsert({
    where: {
        supplierId_componentId: { supplierId: 2, componentId: 7 }
        // ↑ This is a composite unique key (two fields together must be unique)
    },
    update: {},           // If it already exists, do nothing (empty update)
    create: {             // If it doesn't exist, create it
        supplierId: 2,
        componentId: 7
    }
});
```

---

## 12. `groupBy` — Aggregate Data Grouped by a Field

Like SQL's `GROUP BY`. Used for counting or summing data per group.

**Real example from `inventoryService.ts`:**
```typescript
// Count how many product instances exist per product, for products in stock
const stockCounts = await prisma.productInstance.groupBy({
    by: ['productId'],          // Group rows by productId
    where: {
        productId: { in: [1, 2, 3] },
        status: 'IN_STOCK_SALES'
    },
    _count: { productInstanceId: true }  // Count rows in each group
});
// Returns: [{ productId: 1, _count: { productInstanceId: 15 } }, ...]

// Sum quantities per component across all warehouses
const stockAgg = await prisma.componentStock.groupBy({
    by: ['componentId'],
    where: { componentId: { in: [1, 2, 3] } },
    _sum: { quantity: true }  // Sum the quantity field in each group
});
// Returns: [{ componentId: 1, _sum: { quantity: 200 } }, ...]
```

---

## The `where` Object — All Filter Options

This is the heart of every query. Here is a full reference of what you can put inside `where`:

### Direct Field Matching (AND logic by default)
```typescript
where: {
    unit: 'kg',              // unit equals 'kg'
    minStockLevel: 10,       // AND minStockLevel equals 10
    isActive: true           // AND isActive equals true
}
// All conditions must be true (AND)
```

### String Operators
```typescript
where: {
    componentName: { contains: 'steel' },              // contains substring
    componentName: { contains: 'steel', mode: 'insensitive' }, // case-insensitive
    code: { startsWith: 'COM-' },                      // starts with
    code: { endsWith: '-001' },                        // ends with
}
```

### Number / Date Operators
```typescript
where: {
    minStockLevel: { gt: 0 },    // greater than (>)
    minStockLevel: { gte: 10 },  // greater than or equal (>=)
    standardCost: { lt: 100 },   // less than (<)
    standardCost: { lte: 100 },  // less than or equal (<=)
}
```

### List Operators
```typescript
where: {
    unit: { in: ['kg', 'pcs', 'l'] },       // unit must be one of these values
    unit: { notIn: ['set'] },                // unit must NOT be any of these
    productId: { in: [1, 2, 3, 4, 5] },     // productId must be in this list
}
```

### `OR` — At Least One Condition Must Match
```typescript
where: {
    OR: [
        { componentName: { contains: 'steel', mode: 'insensitive' } },
        { code: { contains: 'steel', mode: 'insensitive' } }
    ]
}
// Returns components whose name OR code contains 'steel'
```

### `NOT` — Exclude Records That Match
```typescript
where: {
    NOT: { supplierId: 5 }
}
// Returns all suppliers EXCEPT the one with supplierId = 5

where: {
    status: { not: 'SHIPPED' }
}
// Returns all records where status is NOT 'SHIPPED'
```

### Combining Everything Together
```typescript
// Real pattern from inventoryService.ts:
where: {
    productId: { in: productIds },   // must be in this list (AND)
    status: { not: 'SHIPPED' }       // AND status is not SHIPPED
}
```

---

## `include` — Fetch Related Tables (JOIN)

```typescript
// Get a component with its stock levels from all warehouses
const component = await prisma.component.findUnique({
    where: { componentId: 5 },
    include: {
        componentStocks: true  // joins the ComponentStock table
    }
});
// Result: { componentId: 5, componentName: '...', componentStocks: [...] }

// Deep include: nested relations
const component = await prisma.component.findUnique({
    where: { componentId: 5 },
    include: {
        componentStocks: {
            include: { warehouse: true }  // also include the Warehouse for each stock entry
        }
    }
});
```

---

## `select` — Return Only Specific Fields

Use this to avoid fetching unnecessary data (better performance).

```typescript
const products = await prisma.product.findMany({
    select: {
        productId: true,
        code: true,
        productName: true,
        unit: true,
        minStockLevel: true
        // createdAt, updatedAt, description, etc. are NOT returned
    }
});
```

> **`include` vs `select`**: You can't use both at the same level. Use `select` when you want only specific own fields. Use `include` when you want to pull in related tables.

---

## Quick Cheat Sheet

| Method | Returns | Use Case |
|---|---|---|
| `findMany` | Array of records | Get a list |
| `findUnique` | One record or `null` | Get by ID or unique code |
| `findFirst` | One record or `null` | Existence check, get first match |
| `create` | The created record | Insert one new row |
| `createMany` | `{ count: N }` | Insert many rows at once |
| `update` | The updated record | Change fields of one row |
| `updateMany` | `{ count: N }` | Change fields of many rows |
| `delete` | The deleted record | Remove one row |
| `deleteMany` | `{ count: N }` | Remove many rows |
| `upsert` | The record | Create or update if exists |
| `count` | A number | Count matching rows |
| `groupBy` | Array of groups | Aggregate (sum, count) by field |
