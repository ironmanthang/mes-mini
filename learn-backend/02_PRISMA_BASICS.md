# 2. Prisma Basics — The Database Layer

## What is Prisma?

Prisma is a tool that lets you talk to the database using TypeScript instead of raw SQL.

Without Prisma (raw SQL):
```sql
SELECT * FROM components WHERE component_id = 5;
```

With Prisma (TypeScript):
```typescript
prisma.component.findUnique({ where: { componentId: 5 } });
```

Both do the exact same thing. Prisma just translates TypeScript into SQL for you.

---

## The Schema File — Your Database Blueprint

Open: `backend/prisma/schema.prisma`

This file defines **every table** in your database. Each `model` = one database table.

### Reading a Model (using Component as example)

```prisma
model Component {
  componentId   Int      @id @default(autoincrement()) @map("component_id")
  componentName String   @map("component_name")
  description   String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  code          String   @unique
  minStockLevel Int      @default(0) @map("min_stock_level")
  standardCost  Decimal  @default(0) @map("standard_cost") @db.Decimal(10, 2)
  unit          String

  @@map("components")
}
```

Let's break this down piece by piece:

| Code | What it means |
|---|---|
| `componentId Int` | A field called "componentId" that stores a number |
| `@id` | This is the PRIMARY KEY (unique identifier for each row) |
| `@default(autoincrement())` | The database auto-generates this number (1, 2, 3, ...) |
| `@map("component_id")` | In the actual database table, the column name is "component_id" (snake_case) but in TypeScript we use "componentId" (camelCase) |
| `String?` | The `?` means this field is OPTIONAL (can be null/empty) |
| `@unique` | No two components can have the same value for this field |
| `@default(0)` | If you don't provide a value, it defaults to 0 |
| `@updatedAt` | Prisma automatically updates this timestamp when you change the record |
| `@@map("components")` | The actual table name in PostgreSQL is "components" |

### Field Types You'll See

| Prisma Type | What it stores | Example |
|---|---|---|
| `Int` | Whole number | 42 |
| `String` | Text | "Steel Sheet" |
| `Boolean` | True or False | true |
| `DateTime` | Date and time | 2026-06-04T12:00:00Z |
| `Decimal` | Precise number (for money) | 1234.56 |
| `Float` | Decimal number (less precise) | 3.14 |

### Optional vs Required

```prisma
componentName String    // REQUIRED — must provide a value
description   String?   // OPTIONAL — can be null (the ? makes it optional)
```

---

## How to Add a New Field — Step by Step

Let's say the reviewer asks: "Add a `weight` field to the Component model."

### Step 1: Edit `schema.prisma`

Add the new field inside the `model Component { }` block:

```prisma
model Component {
  componentId   Int      @id @default(autoincrement()) @map("component_id")
  componentName String   @map("component_name")
  description   String?
  // ... existing fields ...
  unit          String
  weight        Decimal? @map("weight") @db.Decimal(10, 2)   // ← NEW FIELD
  
  // ... relations below ...
}
```

Why `Decimal?` (with the `?`)?
- Because existing components don't have a weight value yet
- Making it optional means old data won't break
- The `@db.Decimal(10, 2)` means: up to 10 digits total, 2 after decimal point (e.g., 12345678.99)

### Step 2: Run Migration

After changing the schema, you need to tell the database:

```bash
# Inside the backend container (or your terminal):
npx prisma migrate dev --name add_weight_to_component
```

This command:
1. Compares your schema.prisma with the current database
2. Generates a SQL file (the "migration") that adds the new column
3. Runs that SQL against your database
4. Regenerates the Prisma client (so TypeScript knows about the new field)

**Important**: After migration, the new field is ALREADY available in your API responses! Prisma automatically includes all fields when querying.

### Step 3: Update Validator (if you want users to SET the field)

In `componentValidator.ts`, add the field to both create and update schemas:

```typescript
// In createComponentSchema, add:
weight: Joi.number().min(0).optional()

// In updateComponentSchema, add:
weight: Joi.number().min(0).optional()
```

### That's it!

You don't need to change the Controller or Service files for simple field additions, because:
- The service uses `prisma.component.create({ data: data as any })` — it passes ALL data through
- The controller returns whatever the service returns
- Prisma already includes all fields when reading

---

## Common Prisma Queries (The Most Important Part)

These are the Prisma commands your services use. You NEED to understand these.

### 1. Find Many (Get a list)
```typescript
// Get ALL components
const components = await prisma.component.findMany();

// Get components with filter
const components = await prisma.component.findMany({
    where: { unit: 'kg' }  // only components measured in kg
});

// Get components with search (name contains "steel")
const components = await prisma.component.findMany({
    where: {
        componentName: { contains: 'steel', mode: 'insensitive' }
    }
});

// Get components with sorting
const components = await prisma.component.findMany({
    orderBy: { createdAt: 'desc' }  // newest first
});

// Get only specific fields
const components = await prisma.component.findMany({
    select: { componentId: true, componentName: true, code: true }
    // Only returns these 3 fields, not everything
});
```

### 2. Find Unique (Get ONE record by unique field)
```typescript
// By primary key
const component = await prisma.component.findUnique({
    where: { componentId: 5 }
});

// By unique field
const component = await prisma.component.findUnique({
    where: { code: 'COM-001' }
});
```

### 3. Create (Insert new record)
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

### 4. Update (Change existing record)
```typescript
const updated = await prisma.component.update({
    where: { componentId: 5 },   // WHICH record to update
    data: { componentName: 'Updated Name' }  // WHAT to change
});
```

### 5. Delete
```typescript
const deleted = await prisma.component.delete({
    where: { componentId: 5 }
});
```

### 6. Count
```typescript
const total = await prisma.component.count();
// Returns: 42  (just a number)

const filtered = await prisma.component.count({
    where: { unit: 'kg' }
});
```

### 7. Include Related Data
```typescript
// Get a product WITH its category info
const product = await prisma.product.findUnique({
    where: { productId: 1 },
    include: { category: true }  // joins the ProductCategory table
});
// Result includes: { productId: 1, productName: '...', category: { categoryId: 1, categoryName: '...' } }
```

---

## Relations (How Tables Connect)

In your schema, tables are connected via foreign keys:

```prisma
model Product {
  productId  Int              @id @default(autoincrement())
  categoryId Int?             @map("category_id")
  category   ProductCategory? @relation(fields: [categoryId], references: [categoryId])
  //         ↑ relation name   ↑ which field in THIS table   ↑ which field in OTHER table
}
```

This means:
- Each Product can belong to a ProductCategory
- `categoryId` in the Product table points to `categoryId` in the ProductCategory table
- `category` is not a real column — it's a virtual field that Prisma uses for `include`

---

## Prisma Studio — See Your Data Visually

You already have it running! Open: `http://localhost:5555`

This gives you a visual table view of all your data. Very useful to:
- Check if your migration added the new column
- See what data exists
- Manually verify after testing with Postman
