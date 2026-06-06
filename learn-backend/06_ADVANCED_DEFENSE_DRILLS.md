# 6. Advanced Defense Drills — What Else the Reviewer Might Ask

These exercises cover challenges that are **NOT** in file 05.
File 05 already covers: reading code, Postman testing, adding fields, adding filters, adding endpoints, and explaining patterns verbally.

This file covers everything **else** a time-pressed reviewer might throw at you.

**Same rule: Do NOT use AI to write the code. Type it yourself.**

---

## Drill 1: Modify a Validation Rule

**Why the reviewer asks this**: It proves you understand how input validation works — not just the database layer.

**Scenario**: "Make the `componentName` field require at least 3 characters and at most 100 characters."

### What to Change
Only `componentValidator.ts` needs modification.

### Where to Look
Open `backend/src/master-data/components/componentValidator.ts`.
Find the `componentName` line in **both** `createComponentSchema` and `updateComponentSchema`.

Currently it looks like:
```typescript
componentName: Joi.string().trim().required(),   // in create
componentName: Joi.string().trim().optional(),    // in update
```

### Your Task
Add `.min(3).max(100)` to both lines. Also add a custom error message so the user knows what went wrong.

**Hint**: The pattern already exists in your code — look at how `unit` uses `.messages({...})`.

### Test with Postman
1. POST `/api/components` with `"componentName": "AB"` (2 chars) → should get **400 Bad Request**
2. POST `/api/components` with `"componentName": "ABC"` (3 chars) → should **succeed**
3. PUT `/api/components/1` with `"componentName": "X"` (1 char) → should get **400 Bad Request**

### Verbal Explanation Practice
If the reviewer asks "How does validation work in your project?", say:

> "We use Joi for input validation. Each feature has a validator file that defines schemas. The `validate` middleware in `common/middleware/validate.ts` runs the schema against `req.body` before the request reaches the controller. If validation fails, it returns 400 with error messages. It also uses `stripUnknown: true` so any extra fields the client sends are silently removed — they never reach the database."

---

## Drill 2: Change the API Response Shape

**Why the reviewer asks this**: It proves you can modify what the API returns, not just what it accepts.

**Scenario**: "When I GET a single component by ID, I also want to see how many suppliers are linked to it."

### What to Change
Only `componentService.ts` → the `getComponentById` method.

### Where to Look
Open `backend/src/master-data/components/componentService.ts`, find `getComponentById`.

Currently it does:
```typescript
const component = await prisma.component.findUnique({
    where: { componentId }
});
```

### Your Task
Modify it to also count the suppliers. Use Prisma's `_count` feature:

```typescript
const component = await prisma.component.findUnique({
    where: { componentId },
    include: {
        _count: {
            select: { SupplierComponent: true }
        }
    }
});
```

### Test with Postman
- GET `/api/components/1` → Response should now include a `_count` object:
```json
{
    "componentId": 1,
    "componentName": "Steel Sheet 5mm",
    "code": "COM-001",
    "_count": {
        "SupplierComponent": 2
    }
}
```

### Verbal Explanation Practice
> "Prisma's `include` option lets me load related data. Using `_count` with `select` is efficient because it runs a COUNT query at the database level instead of loading all related records into memory."

---

## Drill 3: Explain the Middleware Chain (Verbal — No Code)

**Why the reviewer asks this**: Pointing at a route line and asking "what does each piece do?" is the fastest way to test understanding.

**Scenario**: The reviewer points at this line in `componentRoutes.ts`:
```typescript
router.post('/', authorize(PERM.COMP_CREATE), validate(createComponentSchema), createComponent);
```
And asks: "Walk me through what happens when a POST request hits this endpoint."

### What You Should Say (Practice Out Loud)

**Step 1 — `protect()` middleware** (runs automatically on ALL `/api/components` routes because of `router.use(protect)` at the top of the file):
> "First, the `protect` middleware runs. It extracts the JWT token from the `Authorization: Bearer <token>` header, verifies it with `jwt.verify()`, then does a single database query to load the user's info including their roles and permissions. It also checks if the user account is ACTIVE and if the session version matches (to support force-logout). If any check fails, it returns 401 or 403 and the request stops here."

**Step 2 — `authorize(PERM.COMP_CREATE)`**:
> "Next, `authorize` checks if the user has the `COMP_CREATE` permission. It uses OR logic — if you pass multiple permissions, the user needs at least one. This check is purely in-memory because `protect` already loaded all permissions. If the user doesn't have the permission, it returns 403 Forbidden."

**Step 3 — `validate(createComponentSchema)`**:
> "Then, the Joi validator runs the request body against the schema. It checks required fields, data types, value ranges, and allowed values. If anything is wrong, it returns 400 with all error messages. It also strips unknown fields — so if someone sends `isAdmin: true` in the body, it gets silently removed."

**Step 4 — `createComponent` controller**:
> "Finally, the controller function runs. It calls the service layer which handles business logic (like checking for duplicate codes) and uses Prisma to insert into the database. The controller wraps everything in try/catch to handle errors."

### Self-Test
Can you explain this without reading the notes? Try it with a timer — you should be able to explain it in under 60 seconds.

---

## Drill 4: "What If" Scenarios (Verbal — No Code)

**Why the reviewer asks this**: To see if you understand failure modes, not just the happy path.

Practice answering these questions out loud:

### Q1: "What happens if two users create a component with the same code at the exact same time?"

**Your Answer:**
> "The service has a duplicate check — it does `findUnique` by code before creating. But if two requests arrive at the exact same millisecond, both might pass the check. However, the database itself has a unique constraint on the `code` column (defined in `schema.prisma` with `@unique`). So even if the code-level check doesn't catch it, the database will reject the second insert and Prisma will throw an error, which gets caught by the try/catch and returns 400."

### Q2: "What happens if I send a request without a token?"

**Your Answer:**
> "The `protect` middleware checks `req.headers.authorization`. If there's no Authorization header, it returns 401 with 'Not authorized, no token'. The request never reaches the controller or database."

### Q3: "What happens if I send a token from a deleted user?"

**Your Answer:**
> "The `protect` middleware decodes the JWT and then queries the database for the user. If the user was deleted, `findByIdWithPermissions` returns null, and protect returns 401 'User not found'."

### Q4: "What does `stripUnknown: true` do in your validator? Why is it important?"

**Your Answer:**
> "It's a Joi option in `validate.ts`. It automatically removes any fields from the request body that aren't defined in the schema. This is a security measure — it prevents someone from injecting unexpected fields like `isAdmin` or `createdAt` into the database. Only the fields we explicitly define in the schema can pass through."

### Q5: "What happens if the database goes down while a user is making a request?"

**Your Answer:**
> "The Prisma query will throw a connection error. The try/catch in the controller catches it and returns a 500 Internal Server Error. The application itself stays running — it doesn't crash — because each request handles its own errors."

---

## Drill 5: Live Prisma Studio Demo

**Why the reviewer asks this**: To verify you can inspect your actual data, not just send API requests.

### Practice This Flow (Time Yourself — Should Take Under 2 Minutes)

1. Open a terminal
2. Run `npx prisma studio` (from the `backend/` folder)
3. Browser opens at `http://localhost:5555`
4. Navigate to the **Component** table
5. Show the reviewer:
   - How many records exist
   - Find a specific component by scrolling or filtering
   - Point out the columns and explain which ones are required vs optional
   - Show the relationship — click on a component that has suppliers linked
6. Navigate to the **Employee** table
7. Show the roles and explain: "Each employee has a role, and each role has a list of permissions."

### Verbal Explanation
> "Prisma Studio is a visual database browser that comes built-in with Prisma. I use it to verify data during development — for example, after running a migration to add a new field, I can check here that the column was created correctly. It connects directly to the same PostgreSQL database that my API uses."

---

## Drill 6: Add a Custom Error Message to Delete

**Why the reviewer asks this**: It tests if you understand the service layer's business logic and can modify it.

**Scenario**: "When someone tries to delete a component that has stock, I want the error message to also tell me HOW MUCH stock remains."

### Where to Look
Open `backend/src/master-data/components/componentService.ts`, find the `deleteComponent` method.

Currently the stock check looks like:
```typescript
const hasStock = await prisma.componentStock.findFirst({
    where: { componentId, quantity: { gt: 0 } }
});
if (hasStock) throw new Error('Cannot delete: Physical stock still exists in warehouse.');
```

### Your Task
Change `findFirst` to a query that also tells you the quantity. Then include the quantity in the error message.

**Hint**: You could use `findMany` to get all stock records and sum the quantities, or use `aggregate` with `_sum`.

### Expected Result
Instead of: `"Cannot delete: Physical stock still exists in warehouse."`
Show: `"Cannot delete: 150 pcs still in stock across warehouses."`

### Test with Postman
- Try to DELETE a component that has stock → should see the quantity in the error message

---

## Summary: Your Defense Preparation Checklist

After completing files 05 and 06, check off everything:

| Skill | File | Status |
|---|---|---|
| Navigate and read codebase | 05 - Exercise 1 | ☐ |
| Test APIs with Postman | 05 - Exercise 2 | ☐ |
| Add a database field (Prisma) | 05 - Exercise 3 | ☐ |
| Add a query filter | 05 - Exercise 4 | ☐ |
| Add a new endpoint | 05 - Exercise 5 | ☐ |
| Recognize the pattern repeats | 05 - Exercise 6 | ☐ |
| Modify validation rules (Joi) | **06 - Drill 1** | ☐ |
| Change API response shape | **06 - Drill 2** | ☐ |
| Explain middleware chain verbally | **06 - Drill 3** | ☐ |
| Answer "what if" failure scenarios | **06 - Drill 4** | ☐ |
| Live Prisma Studio walkthrough | **06 - Drill 5** | ☐ |
| Modify business logic error messages | **06 - Drill 6** | ☐ |

**If you can do all 12 items without AI help, you are ready for the defense. 💪**
