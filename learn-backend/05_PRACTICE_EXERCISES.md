# 5. Practice Exercises — Do These Yourself

These exercises simulate what the reviewer might ask you to do during defense.
Start from Exercise 1 and go in order. Each one builds on the previous.

**Rule: Do NOT use AI to write the code. Type it yourself. That's the whole point.**

If you get stuck, re-read the guide files. If still stuck, ask the AI to EXPLAIN (not write for you).

---

## Exercise 1: Read and Understand (No Code Changes)

**Goal**: Prove you can navigate the codebase.

### Task 1.1
Open `backend/prisma/schema.prisma` and answer these questions:
1. How many fields does the `Component` model have? List them.
2. Which fields are required vs optional?
3. What is the primary key field called?
4. What does `@map("component_name")` do?

### Task 1.2
Open `backend/src/master-data/components/componentService.ts` and answer:
1. What Prisma query does `getAllComponents` use? (`findMany`, `findUnique`, etc.)
2. When you search for a component, what fields does it search? (name? code? both?)
3. In `deleteComponent`, what 3 checks are done before allowing deletion?

### Task 1.3
Open `backend/src/app.ts` and find the line where components are mounted. What URL prefix does it use?

**Check**: If you can answer all these by reading the code, you already understand more than you think.

---

## Exercise 2: Test Existing APIs with Postman

**Goal**: Verify you can use Postman and understand request/response.

Follow the Postman Setup guide (file 04) to:
1. Login and get a token
2. GET all components
3. GET a specific component by ID
4. CREATE a new component with code "MY-TEST-001"
5. UPDATE that component's name
6. Search components with `?search=` parameter

**Check**: Take a screenshot of each successful Postman response. During defense, you can show these to demonstrate you know how to test APIs.

---

## Exercise 3: Add a Simple Field to Component ⭐

**This is THE exercise. This is exactly what the reviewer will ask.**

**Scenario**: "Add a `weight` field to the Component model."

### Step 1: Edit Schema
Open `backend/prisma/schema.prisma`, find the `Component` model.
Add this line (inside the model, after `unit`):

```prisma
weight  Decimal?  @map("weight") @db.Decimal(10, 2)
```

### Step 2: Run Migration
Open your terminal and run the migration command.
(Hint: Check `02_PRISMA_BASICS.md` for the exact command.)

### Step 3: Update Validators
Open `backend/src/master-data/components/componentValidator.ts`.
Add `weight` to BOTH the create and update schemas.
(Hint: It should be an optional number field, minimum 0.)

### Step 4: Test with Postman
1. CREATE a new component WITH weight:
```json
{
    "code": "HEAVY-001",
    "componentName": "Heavy Part",
    "unit": "kg",
    "weight": 15.5
}
```
2. GET that component — verify weight is in the response.
3. UPDATE just the weight: `{ "weight": 20.0 }`
4. CREATE a component WITHOUT weight — verify it still works (should be null).

### Step 5: Check in Prisma Studio
Open `http://localhost:5555`, go to the `Component` table.
You should see the new `weight` column.

**If this exercise works, you can handle the reviewer's question.**

---

## Exercise 4: Add a New Query Filter

**Scenario**: "I want to filter components by unit type. For example, show only components measured in 'kg'."

### What to change
Only `componentService.ts` needs modification.

In the `getAllComponents` method, add a `unit` filter:

```typescript
// After the search filter, before the findMany call, add:
if (query.unit) {
    where.unit = query.unit;
}
```

You'll also need to add `unit` to the query interface near the top of the file.

### Test with Postman
- `GET /api/components?unit=kg` → should only return kg components
- `GET /api/components?unit=pcs` → should only return pcs components
- `GET /api/components` (no filter) → should return all

---

## Exercise 5: Add a New Endpoint

**Scenario**: "Add an endpoint to get the total count of components."

**URL**: `GET /api/components/count`

### Step 1: Add Service Method
In `componentService.ts`, add a new method:
```typescript
async getComponentCount(): Promise<number> {
    return prisma.component.count();
}
```

### Step 2: Add Controller Function
In `componentController.ts`, add:
```typescript
export const getComponentCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const count = await ComponentService.getComponentCount();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
```

### Step 3: Add Route
In `componentRoutes.ts`, import the new controller and add the route.

**IMPORTANT**: Add it BEFORE the `/:id` route!
```typescript
router.get('/count', authorize(PERM.COMP_READ), getComponentCount);
// Must be before /:id, otherwise Express thinks "count" is an ID
```

### Step 4: Test
- `GET /api/components/count` → should return `{ "count": 42 }` (some number)

---

## Exercise 6: Understand the Supplier Feature (Read-Only)

**Goal**: Prove to yourself that the pattern repeats.

Open `backend/src/master-data/suppliers/` and answer:
1. What files are in this folder?
2. Compare `supplierService.ts` with `componentService.ts`. What's similar?
3. What fields does the Supplier model have in `schema.prisma`?
4. What URL is it mounted at in `app.ts`?

---

## Defense Cheat Sheet — How to Explain to the Reviewer

When the reviewer asks you to explain something, use this structure:

**"What does this API do?"**
→ "This endpoint accepts a [GET/POST/PUT] request at [URL]. It goes through authentication, then validation, then the service layer queries the database using Prisma's [findMany/create/update] and returns the result."

**"How do you add a field?"**
→ "I add the field in schema.prisma, run a migration to update the database, then update the validator to accept the new field in requests. The service already returns all fields by default."

**"What happens if I send invalid data?"**
→ "The Joi validator catches it before it reaches the service layer and returns a 400 Bad Request with a specific error message telling you what's wrong."

**"How does authentication work?"**
→ "The user logs in at /api/auth/login with username and password. The backend returns a JWT token. For every subsequent request, the frontend sends this token in the Authorization header. The `protect` middleware validates it, and `authorize` checks if the user's role has the required permission."

**"Why can't you delete this component?"**
→ "The service has safety checks. Before deletion, it checks if the component is used in a product recipe (BOM), exists in purchase orders, or has physical stock in a warehouse. If any of these are true, deletion is blocked to prevent data corruption."
