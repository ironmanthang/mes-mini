# 1. The Big Picture — How Your Backend Works

## What Even IS a Backend?

Think of a restaurant:
- **Frontend** = the dining area (what the customer sees — menus, tables)
- **Backend** = the kitchen (where food is actually prepared)
- **Database** = the pantry/fridge (where ingredients are stored)
- **API** = the waiter (carries orders from dining area to kitchen, brings food back)

Your backend does the same thing:
1. Frontend sends a **request** (e.g., "give me all components")
2. Backend **processes** the request (checks permissions, queries database)
3. Database **returns data**
4. Backend sends a **response** back to frontend

---

## The 4-Layer Architecture (Your Actual Code)

Every feature in your backend follows this exact same pattern:

```
[User/Postman] → Route → Controller → Service → Database (Prisma)
                   ↓          ↓           ↓           ↓
               "what URL"  "unpack     "actual      "talk to
                matches"    request,    business     PostgreSQL
                            send        logic"       database"
                            response"
```

### Layer 1: Routes (`componentRoutes.ts`)
**Job**: "If someone calls GET /api/components, send them to THIS function"
```typescript
// This says: when someone visits GET /api/components, 
// first check their login (protect), 
// then check permission (authorize), 
// then call the getAllComponents function
router.get('/', authorize(PERM.COMP_READ), getAllComponents);
```
Think of it as a **receptionist** — it doesn't do any work, just directs people to the right desk.

### Layer 2: Controller (`componentController.ts`)
**Job**: "Take the request, call the service, send back the response"
```typescript
export const getAllComponents = async (req: Request, res: Response) => {
    try {
        // Call the service (the brain)
        const components = await ComponentService.getAllComponents(req.query);
        // Send back result with status 200 (OK)
        res.status(200).json(components);
    } catch (error) {
        // If something goes wrong, send error with status 500
        res.status(500).json({ message: error.message });
    }
};
```
Think of it as a **cashier** — takes the order, passes it to the kitchen, gives the receipt.

### Layer 3: Service (`componentService.ts`)
**Job**: "The actual brain — business logic + database queries"
```typescript
async getAllComponents(query) {
    // Build filter
    const where = {};
    if (query.search) {
        where.OR = [
            { componentName: { contains: query.search } },
            { code: { contains: query.search } }
        ];
    }
    // Ask database for data
    const data = await prisma.component.findMany({ where });
    return data;
}
```
Think of it as the **chef** — actually does the cooking (logic) and gets ingredients (data from DB).

### Layer 4: Prisma (Database)
**Job**: "Translate TypeScript code into SQL and talk to PostgreSQL"
```typescript
// This TypeScript code:
prisma.component.findMany({ where: { code: "COM-001" } })

// Becomes this SQL automatically:
// SELECT * FROM components WHERE code = 'COM-001'
```
Think of it as a **translator** — you speak TypeScript, the database speaks SQL, Prisma translates.

---

## Where Do These Files Live?

```
backend/
├── prisma/
│   └── schema.prisma          ← DATABASE BLUEPRINT (models/tables)
├── src/
│   ├── app.ts                 ← MAIN APP (wires all routes together)
│   ├── server.ts              ← Starts the server
│   ├── common/                ← Shared utilities (auth, prisma client, etc.)
│   ├── master-data/           ← CRUD features
│   │   ├── components/        ← Component management
│   │   │   ├── componentRoutes.ts
│   │   │   ├── componentController.ts
│   │   │   ├── componentService.ts
│   │   │   └── componentValidator.ts
│   │   ├── products/          ← Product management (same pattern!)
│   │   ├── suppliers/         ← Supplier management (same pattern!)
│   │   └── ...
│   ├── procurement/           ← Purchase Orders
│   ├── production/            ← Work Orders, Production
│   ├── sales/                 ← Sales Orders
│   └── warehouse-ops/         ← Warehouse operations
```

**KEY INSIGHT**: Every single feature folder has the same 4 files:
- `xxxRoutes.ts` (Layer 1)
- `xxxController.ts` (Layer 2)
- `xxxService.ts` (Layer 3)
- `xxxValidator.ts` (input checking)

Once you understand ONE feature (Components), you understand ALL of them. The pattern repeats.

---

## How Routes Are Connected to the App

In `app.ts`, every feature's routes are "mounted" to a URL:

```typescript
app.use('/api/components', componentRoutes);  // ← Components at /api/components
app.use('/api/products', productRoutes);      // ← Products at /api/products
app.use('/api/suppliers', supplierRoutes);    // ← Suppliers at /api/suppliers
```

So when Postman calls `GET http://localhost:3000/api/components`:
1. Express sees `/api/components` → sends to `componentRoutes`
2. `componentRoutes` sees `GET /` → sends to `getAllComponents` controller
3. Controller calls service → service calls Prisma → Prisma calls PostgreSQL
4. Data flows back up: PostgreSQL → Prisma → Service → Controller → JSON response

---

## What the Reviewer Will Ask You

She will likely say: "Add a field called `weight` to the Component model and make the API return it."

To do this, you need to touch **exactly 4 things**:
1. `schema.prisma` — add the field to the `Component` model
2. Run migration — tell the database about the change
3. `componentValidator.ts` — allow the new field in create/update
4. Done. (The service and controller already return all fields!)

We'll practice exactly this in the exercises file.
