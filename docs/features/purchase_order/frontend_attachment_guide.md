# Purchase Order Attachments - Frontend Integration Guide

This guide explains how to implement **File Upload, List, View/Download, and Delete** for Purchase Order attachments.

Our backend uses the **"Presigned URL Pattern"** — files travel directly from the browser to the storage server, bypassing our Node.js backend entirely. This keeps the server fast and lean.

---

## 🛠️ Part 1: Local Development Setup

In local development, we use **MinIO** as a drop-in replacement for Cloudflare R2. It runs inside your Docker stack and provides an identical S3-compatible API. No cloud credentials needed.

### Infrastructure (Already Configured)

| Service | URL | Purpose |
| :--- | :--- | :--- |
| Backend API | `http://localhost:5000` | Swagger, login, all CRUD endpoints |
| MinIO S3 API | `http://localhost:9000` | Receives raw file bytes (the `PUT` target) |
| MinIO Web Console | `http://localhost:9001` | Visual file browser to verify uploads |

**MinIO Console Login:** `minioadmin` / `minioadmin`  
**Bucket Name:** `lite-mes` (auto-created on `docker compose up`)

---

## 🚀 Part 2: The 3-Step Upload Flow (With Postman Walkthrough)

Uploading a file requires exactly **three steps**. Do not skip any of them or the file will be orphaned in storage with no database record.

### Step 0: Login (Get your Token)
- **URL:** `POST http://localhost:5000/api/employees/login`
- **Body (JSON):** `{"username": "purchaser", "password": "123456"}`
- **Action:** Copy the `token` from the response. Set it as a **Bearer Token** in Postman's Auth tab for all subsequent requests (except Step 2).

### Step 1: Request Permission (The Ticket)

When the user clicks "Select File", immediately read its properties from the browser's `File` object and ask the backend for an upload pass.

**How to get the file properties in code:**
```javascript
const file = event.target.files[0];
// file.name → "contract-v1.pdf"
// file.size → 216680  (exact byte count — this MUST be accurate)
// file.type → "application/pdf"
```

**How to get the file size in Postman:**
Right-click the file → Properties → look for **"Size"** (NOT "Size on disk") → use the number in bytes (remove commas).

**Endpoint:** `POST http://localhost:5000/api/purchase-orders/{poId}/attachments/request-upload`  
**Auth:** Bearer Token  
**Body (JSON):**
```json
{
    "fileName": "contract-v1.pdf",
    "mimeType": "application/pdf",
    "fileSize": 216680,
    "category": "OTHER"
}
```
**Valid categories:** `CONTRACT`, `INVOICE`, `PACKING_SLIP`, `INSPECTION`, `OTHER`

**Success Response (200 OK):**
```json
{
    "message": "Presigned upload URL generated...",
    "uploadUrl": "http://localhost:9000/lite-mes/purchase-order/1/...",
    "fileKey": "purchase-order/1/1775119127219-contract-v1.pdf",
    "expiresIn": "10 minutes"
}
```
**Action:** Copy the `uploadUrl` and `fileKey`. You need both.

---

### Step 2: The Direct Upload (The Heavy Lift)

> [!CAUTION]
> This step talks directly to MinIO (port 9000), NOT to your backend (port 5000). You MUST follow these rules exactly or the upload will fail.

Open a **NEW tab** in Postman:

- **Method:** `PUT`
- **URL:** Paste the `uploadUrl` from Step 1.
- **Body:** Select **binary** → choose your file.
- **Headers:** Manually set `Content-Type` to exactly what you sent in Step 1 (e.g. `application/pdf`).

> [!WARNING]
> **⚠️ Authorization Tab: Set to "No Auth".**  
> If you leave your Bearer Token on, MinIO will reject the request with:  
> `"Invalid Request: request has multiple authentication types, please use one"`  
> The presigned URL already contains all the auth signatures in its query parameters.

**Success Response:** `200 OK` (usually no JSON body, possibly some XML).

**In your React code**, use `axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })`.

> [!TIP]
> **UX Recommendation:** Use Axios's `onUploadProgress` to show a smooth progress bar while the file streams to storage.

---

### Step 3: Backend Confirmation (The Final Handshake)

If Step 2 succeeds, tell the backend to create the database record.

**Endpoint:** `POST http://localhost:5000/api/purchase-orders/{poId}/attachments/confirm`  
**Auth:** Bearer Token  
**Body (JSON):**
```json
{
    "fileKey": "purchase-order/1/1775119127219-contract-v1.pdf",
    "fileName": "contract-v1.pdf",
    "mimeType": "application/pdf",
    "fileSize": 216680,
    "category": "OTHER"
}
```
> [!IMPORTANT]
> The `fileName`, `mimeType`, `fileSize`, and `category` **MUST be identical** to what you sent in Step 1. The `fileKey` is what you received back from Step 1.

**Success Response (201 Created):** The attachment is now saved. Refresh your UI list.

**Visual Verification:** Open [http://localhost:9001](http://localhost:9001), navigate to `lite-mes` → `purchase-order` → `{poId}`, and you'll see your file sitting there.

---

## 👁️‍🗨️ Part 3: Listing, Viewing, and Downloading

**Endpoint:** `GET http://localhost:5000/api/purchase-orders/{poId}/attachments`  
**Auth:** Bearer Token  
**Response:** An array of attachment objects, each containing a `downloadUrl`.

The `downloadUrl` is a presigned `GET` URL that expires in **1 hour**. Never cache these URLs permanently.

**In Postman:** Copy the `downloadUrl` from the response, paste it into a new browser tab, and the file will open/download.

**In React:**
```html
<a href="{attachment.downloadUrl}" target="_blank">
   View {attachment.fileName}
</a>
```

---

## ❌ Part 4: Deleting an Attachment

**Endpoint:** `DELETE http://localhost:5000/api/purchase-orders/{poId}/attachments/{attachmentId}`  
**Auth:** Bearer Token

On success (`200 OK`), remove the item from your frontend array. The backend automatically deletes the physical file from storage.

---

## 🆘 Part 5: Troubleshooting

### 1. `400 Bad Request` — "Multiple Authentication Types"
You left a Bearer Token on the `PUT` request. Go to the Auth tab and select **"No Auth"**.

### 2. `403 SignatureDoesNotMatch`
The `fileSize` or `mimeType` you declared in Step 1 doesn't match the actual file you uploaded in Step 2. Even one byte of difference will break the signature. Re-check the exact byte size.

### 3. `411 Length Required`
In Step 2, ensure the `Content-Length` header is present. Postman does this automatically when you select "binary", but custom code might not.

### 4. `GET /attachments` returns `[]` after uploading
You forgot Step 3 (Confirmation). The file is in MinIO but the database doesn't know about it yet. Send the `confirm` request.

### 5. `ENOTFOUND` or DNS error on the `uploadUrl`
The URL might contain a Docker-internal hostname (e.g. `minio:9000`). Contact the backend team — the `R2_PUBLIC_ENDPOINT` environment variable is not configured.

---

## 🌐 Part 6: Production Notes (For Deployment Only)

> [!NOTE]
> You do NOT need to read this section for local development. Everything above works with the Docker MinIO setup.

### CORS
The Cloudflare R2 Bucket has been configured by the Backend/DevOps team to allow `PUT` and `GET` requests from your frontend domains (`http://localhost:5173` and `https://mes-mini.pages.dev`). If you experience a CORS error during the `PUT` step, **stop and contact the backend team**.

### How it differs from local
In production, the `uploadUrl` will point to `https://<id>.r2.cloudflarestorage.com/...` instead of `http://localhost:9000/...`. Your code does NOT need to change — the backend handles the switch automatically based on its environment.

---

## ⚠️ Part 7: Edge Cases & Backend Rules

As the frontend developer, handle `400` and `403` errors gracefully:

1.  **The "Frozen" Status Lock:** If a PO is `COMPLETED` or `CANCELLED`, the backend blocks all uploads and deletes (`400 Bad Request`).
2.  **The "Evidence" Delete Lock:** If a PO has reached `ORDERED` or `RECEIVING`, users can upload *new* documents but **cannot delete** existing ones (`400 Bad Request`).
3.  **Role Access:** Warehouse staff can *view* attachments but will receive `403 Forbidden` if they try to upload or delete. Hide the upload/delete buttons based on user role.
