# 3. API Flow Dissected — Tracing Component CRUD Line by Line

This file walks through ONE complete feature (Components) to show exactly how a request travels through your code.

---

## Scenario: "GET all components"

**What happens when Postman calls**: `GET http://localhost:3000/api/components`

### Stop 1 → `app.ts` (line 50)

```typescript
app.use('/api/components', componentRoutes);
```

Express sees the URL starts with `/api/components` and sends the request to `componentRoutes`.

### Stop 2 → `componentRoutes.ts` (line 21)

```typescript
router.use(protect);  // line 19: ALL routes need login first

router.get('/', authorize(PERM.COMP_READ), getAllComponents);
```

Three things happen in order (called "middleware chain"):
1. `protect` — checks if the JWT token is valid (are you logged in?)
2. `authorize(PERM.COMP_READ)` — checks if your role has the "COMP_READ" permission
3. `getAllComponents` — if both pass, call the controller function

If the token is missing → returns 401 Unauthorized (never reaches the controller)
If the permission is missing → returns 403 Forbidden (never reaches the controller)

### Stop 3 → `componentController.ts` (lines 4-11)

```typescript
export const getAllComponents = async (req: Request, res: Response) => {
    try {
        const components = await ComponentService.getAllComponents(req.query as any);
        res.status(200).json(components);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
```

What this does:
1. `req.query` — grabs URL query parameters (e.g., `?search=steel&page=1`)
2. Passes them to the service
3. If service succeeds → send status 200 with data as JSON
4. If service throws error → send status 500 with error message

**Key concept**: The controller does NOT contain business logic. It's just a middleman.

### Stop 4 → `componentService.ts` (lines 36-59)

```typescript
async getAllComponents(query: { search?: string; page?: number; limit?: number }) {
    // Import pagination utility
    const { getPaginationParams, createPaginatedResponse } = 
        await import('../../common/utils/pagination.js');
    const { page, limit, skip } = getPaginationParams(query);

    // Build the WHERE clause dynamically
    const where: any = {};
    if (query.search) {
        where.OR = [
            { componentName: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } }
        ];
    }

    // Execute TWO queries in parallel
    const [data, total] = await Promise.all([
        prisma.component.findMany({
            where,
            skip,           // skip first N results (for pagination)
            take: limit,    // return only 'limit' results
            orderBy: { createdAt: 'desc' }
        }),
        prisma.component.count({ where })
    ]);

    return createPaginatedResponse(data, total, page, limit);
}
```

**Line by line:**
1. Get pagination params (page 1, limit 20 by default)
2. Build a filter object — if `?search=steel`, find components where name OR code contains "steel"
3. `Promise.all` runs TWO database queries at the SAME TIME:
   - `findMany` — gets the actual data
   - `count` — gets total count (for pagination, e.g., "showing 1-20 of 150")
4. Returns a paginated response object

### Stop 5 → PostgreSQL Database

Prisma translates the `findMany` into SQL like:
```sql
SELECT * FROM components 
WHERE component_name ILIKE '%steel%' OR code ILIKE '%steel%'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### The Return Trip

Data flows back up:
```
PostgreSQL → Prisma (converts rows to objects) → Service (wraps in pagination) 
→ Controller (sends as JSON) → Express (sends HTTP response) → Postman sees the result
```

---

## Scenario: "CREATE a new component"

**Postman calls**: `POST http://localhost:3000/api/components`
**With body**:
```json
{
    "code": "COM-TEST",
    "componentName": "Test Component",
    "unit": "pcs",
    "minStockLevel": 10
}
```

### Stop 1 → Routes (line 24-28)

```typescript
router.post('/',
    authorize(PERM.COMP_CREATE),      // Need CREATE permission
    validate(createComponentSchema),   // Validate input first!
    createComponent                    // Then create
);
```

Notice there's an extra step: `validate(createComponentSchema)`.
This calls the validator BEFORE the controller.

### Stop 2 → Validator (`componentValidator.ts`)

```typescript
export const createComponentSchema = Joi.object({
    code: Joi.string().uppercase().trim().required(),
    componentName: Joi.string().trim().required(),
    description: Joi.string().optional().allow(null, ''),
    unit: Joi.string().required().valid('pcs', 'kg', 'm', 'l', 'set'),
    minStockLevel: Joi.number().integer().min(0).default(0),
    standardCost: Joi.number().min(0).default(0)
});
```

This checks:
- `code` must be a non-empty string (auto-converted to UPPERCASE)
- `componentName` must be provided
- `unit` must be one of: pcs, kg, m, l, set (nothing else allowed)
- `minStockLevel` must be a positive integer (defaults to 0)

If validation fails → returns 400 Bad Request (never reaches controller/service)

### Stop 3 → Controller (lines 22-29)

```typescript
export const createComponent = async (req: Request, res: Response) => {
    try {
        const component = await ComponentService.createComponent(req.body);
        res.status(201).json(component);  // 201 = Created (not 200)
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
```

`req.body` contains the JSON data from the POST request.
Status 201 means "created" — different from 200 "ok".

### Stop 4 → Service (lines 70-76)

```typescript
async createComponent(data: ComponentCreateData) {
    // Check if code already exists (must be unique)
    const existing = await prisma.component.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Component code "${data.code}" already exists.`);

    return prisma.component.create({ data: data as any });
}
```

**Logic:**
1. Check if the code is already taken (business rule: codes must be unique)
2. If duplicate → throw error (caught by controller, returns 400)
3. If unique → create the record in database

---

## Scenario: "GET component by ID"

**Postman calls**: `GET http://localhost:3000/api/components/5`

### Route (line 22)
```typescript
router.get('/:id', authorize(PERM.COMP_READ), getComponentById);
```
The `:id` is a **URL parameter**. When URL is `/components/5`, `req.params.id` = `"5"`.

### Controller (lines 13-20)
```typescript
export const getComponentById = async (req: Request, res: Response) => {
    try {
        const component = await ComponentService.getComponentById(req.params.id);
        res.status(200).json(component);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
        //           ↑ 404 = Not Found
    }
};
```

### Service (lines 61-68)
```typescript
async getComponentById(id: string | number) {
    const componentId = typeof id === 'string' ? parseInt(id) : id;
    //                  ↑ URL params are always strings, so convert to number

    const component = await prisma.component.findUnique({
        where: { componentId }
    });

    if (!component) throw new Error('Component not found');
    //              ↑ If no record found, throw error (controller returns 404)

    return component;
}
```

---

## Scenario: "UPDATE a component"

**Postman calls**: `PUT http://localhost:3000/api/components/5`
**With body**: `{ "componentName": "New Name" }`

### Service (lines 78-92)
```typescript
async updateComponent(id: string | number, data: Partial<ComponentCreateData>) {
    const componentId = typeof id === 'string' ? parseInt(id) : id;
    
    // First check if it exists
    const component = await prisma.component.findUnique({ where: { componentId } });
    if (!component) throw new Error('Component not found');

    // If they're changing the code, check it's not already taken
    if (data.code && data.code !== component.code) {
        const exists = await prisma.component.findUnique({ where: { code: data.code } });
        if (exists) throw new Error(`Component code "${data.code}" already exists.`);
    }

    // Update only the fields that were provided
    return prisma.component.update({
        where: { componentId },
        data: data as any   // Only provided fields get updated
    });
}
```

**Key insight**: `Partial<ComponentCreateData>` means all fields are optional. You only need to send the fields you want to change, not all of them.

---

## Scenario: "DELETE a component"

### Service (lines 94-112)
```typescript
async deleteComponent(id: string | number) {
    const componentId = typeof id === 'string' ? parseInt(id) : id;

    // Safety checks (can't delete if it's being used elsewhere)
    const inBOM = await prisma.billOfMaterial.findFirst({ where: { componentId } });
    if (inBOM) throw new Error('Cannot delete: This component is part of a Product BOM.');

    const inPO = await prisma.purchaseOrderDetail.findFirst({ where: { componentId } });
    if (inPO) throw new Error('Cannot delete: This component exists in Purchase Orders.');

    const hasStock = await prisma.componentStock.findFirst({
        where: { componentId, quantity: { gt: 0 } }
    });
    if (hasStock) throw new Error('Cannot delete: Physical stock still exists in warehouse.');

    return prisma.component.delete({ where: { componentId } });
}
```

**Business logic**: You can't just delete anything. The service checks:
1. Is this component used in a product recipe (BOM)?
2. Is it referenced in any purchase orders?
3. Does it have physical stock in a warehouse?

If any of these are true → refuse to delete. This prevents data corruption.

---

## Summary — The Pattern

For EVERY feature in your app, the flow is always:

```
Request → Route (URL matching + auth) → Validator (input check) 
→ Controller (try/catch wrapper) → Service (business logic + Prisma query) 
→ Database → Response
```

Once you understand this for Components, you understand Products, Suppliers, Purchase Orders — they ALL follow the same pattern.
