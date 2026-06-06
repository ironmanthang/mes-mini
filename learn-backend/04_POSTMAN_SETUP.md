# 4. Postman Setup — How to Test Your APIs

## Why Postman (Not Swagger)?

Your project has Swagger at `http://localhost:3000/api-docs`, but:
- Swagger requires knowing its YAML syntax to read
- Postman is point-and-click — much easier to learn fast
- The reviewer doesn't care which tool you use, only that you can test APIs

---

## Step 1: Import All Your APIs Into Postman

Your backend has a built-in endpoint that exports ALL API documentation as JSON.

1. Open Postman
2. Click **Import** (top-left)
3. Select **Link** tab
4. Paste: `http://localhost:3000/api-docs-json`
5. Click **Import**

This creates a collection with ALL your APIs organized by tag (Components, Products, etc.)

> **If Import by Link doesn't work**: 
> Open `http://localhost:3000/api-docs-json` in your browser, 
> Save the page as a `.json` file, then import that file in Postman.

---

## Step 2: Login to Get a JWT Token

Every API (except login) requires authentication. You need to login first to get a token.

### Manual Login Request

1. Create a new request in Postman:
   - Method: **POST**
   - URL: `http://localhost:3000/api/auth/login`
   - Go to **Body** tab → select **raw** → select **JSON**
   - Paste:
   ```json
   {
       "username": "admin",
       "password": "Admin@123"
   }
   ```
   (Use whatever credentials you seeded into the database)

2. Click **Send**

3. You'll get a response like:
   ```json
   {
       "message": "Login: successful",
       "token": "eyJhbGciOiJIUzI1NiIs...(very long string)...",
       "user": { ... }
   }
   ```

4. **Copy the token value** (the long string starting with "eyJ...")

---

## Step 3: Use the Token for All Other Requests

For every API call, you need to include the token:

1. Go to the **Authorization** tab (or **Auth** tab in newer Postman)
2. Type: **Bearer Token**
3. Paste your token in the **Token** field

### Pro Tip: Set It Once for the Whole Collection

Instead of adding the token to every request:

1. Click on your imported **Collection name** (left sidebar)
2. Go to **Authorization** tab
3. Type: **Bearer Token**
4. Paste the token
5. Click **Save**

Now ALL requests in this collection will use this token automatically.
Individual requests should have Auth type set to **Inherit from parent**.

---

## Step 4: Test Your First API Call

### Test: Get All Components

- Method: **GET**
- URL: `http://localhost:3000/api/components`
- Auth: Bearer Token (set in collection)
- Click **Send**

Expected response (200 OK):
```json
{
    "data": [
        {
            "componentId": 1,
            "componentName": "Steel Sheet 5mm",
            "code": "COM-001",
            "unit": "pcs",
            ...
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalItems": 45
    }
}
```

### Test: Get One Component

- Method: **GET**
- URL: `http://localhost:3000/api/components/1`
- Click **Send**

### Test: Create a Component

- Method: **POST**
- URL: `http://localhost:3000/api/components`
- Body (raw JSON):
```json
{
    "code": "COM-TEST-001",
    "componentName": "Test Material",
    "unit": "pcs",
    "minStockLevel": 5,
    "standardCost": 10.50
}
```
- Click **Send**
- Expected: 201 Created

### Test: Update a Component

- Method: **PUT**
- URL: `http://localhost:3000/api/components/1`  (use an actual ID)
- Body (raw JSON):
```json
{
    "componentName": "Updated Name Here"
}
```
- Click **Send**
- Expected: 200 OK with updated data

### Test: Search Components

- Method: **GET**
- URL: `http://localhost:3000/api/components?search=steel`
- Click **Send**
- Should only return components with "steel" in name or code

---

## Common HTTP Status Codes (What the Numbers Mean)

| Code | Meaning | When you see it |
|---|---|---|
| 200 | OK | Request succeeded |
| 201 | Created | New record created |
| 400 | Bad Request | Your input data is wrong (validation failed) |
| 401 | Unauthorized | Token is missing or expired |
| 403 | Forbidden | Token is valid but you lack permission |
| 404 | Not Found | The record doesn't exist |
| 500 | Server Error | Something crashed in the backend code |

---

## Troubleshooting

**"Cannot connect"** → Make sure your backend server is running (`npm run dev`)

**401 Unauthorized** → Your token expired. Login again to get a new one.

**403 Forbidden** → Your user account doesn't have the required permission. 
Login with an admin account that has all permissions.

**400 Bad Request** → Check the error message. Usually it tells you which field is wrong:
```json
{ "message": "\"unit\" must be one of [pcs, kg, m, l, set]" }
```

**Empty response `[]`** → The database has no data. Check Prisma Studio to see if records exist.
