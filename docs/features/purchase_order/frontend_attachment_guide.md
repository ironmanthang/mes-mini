# Purchase Order Attachments - Frontend Integration Guide

This guide explains how to implement the **File Upload, List, View/Download, and Delete** features for Purchase Order attachments. 

Because we are dealing with potentially large files (PDFs, Images, Excel sheets up to 20MB) in a manufacturing environment, our backend *does not* handle the raw file data directly. Instead, we use the **"Presigned URL Pattern,"** where the frontend uploads directly to Cloudflare R2. This keeps the Node.js backend fast and lean.

---

## 🚦 Phase 0: The CORS Infrastructure Prerequisite
> [!NOTE]
> The Cloudflare R2 Bucket has already been configured by the Backend/DevOps team to allow `PUT` and `GET` requests from your frontend domains (`http://localhost:5173` and `https://mes-mini.pages.dev`). 
> 
> If you experience a `CORS (Cross-Origin Resource Sharing)` error during the `PUT` step, **stop and contact the backend team**. It means the bucket policy is missing your specific local or production domain, and DevOps needs to update it.

---

## 🔼 1. The Upload Workflow (The 3-Step Dance)

Uploading a file requires exactly three steps. Do not skip any of them or the file will be orphaned.

### Step 1: Request Permission (The Ticket)
When the user clicks "Select File", immediately read its properties (`name`, `size`, `type`) and ask the backend for an upload pass.

**Endpoint:** `POST /api/purchase-orders/{poId}/attachments/request-upload`
**Body:**
```json
{
    "fileName": "contract-v1.pdf",
    "mimeType": "application/pdf",    // Note: Use the exact mime string the browser gives you
    "fileSize": 1048576,              // Must be less than 20MB (20971520 bytes)
    "category": "CONTRACT"            // Valid options: CONTRACT, INVOICE, PACKING_SLIP, INSPECTION, OTHER
}
```

**Success Response (200 OK):**
You will receive an `uploadUrl` (valid for 10 minutes) and a `fileKey`. Store the `fileKey` in memory for Step 3.

### Step 2: The Direct Upload (The Heavy Lift)
This step does *not* go to our backend. You are talking directly to Cloudflare R2's global CDN.

**Action:** Perform a `PUT` request to the `uploadUrl` you received in Step 1.
**Headers MUST include:**
- `Content-Type`: Exactly what you sent in Step 1 (e.g., `application/pdf`). *If this is missing, Cloudflare will reject it with a 403.*
**Body:** The raw binary File object from the browser `<input type="file">`.

> [!TIP]
> **UX Recommendation:** Since this is a direct browser upload, use Axios's `onUploadProgress` to show a smooth progress bar to the user while the file streams to Cloudflare.

**Success Response:** A simple HTTP `200 OK` from Cloudflare (usually no JSON body).

### Step 3: Backend Confirmation
If Step 2 succeeds, tell the backend to record the file in the database.

**Endpoint:** `POST /api/purchase-orders/{poId}/attachments/confirm`
**Body:**
```json
{
    "fileKey": "THE_FILE_KEY_FROM_STEP_1",
    "fileName": "contract-v1.pdf",     // Exact same as Step 1
    "mimeType": "application/pdf",     // Exact same as Step 1
    "fileSize": 1048576,               // Exact same as Step 1
    "category": "CONTRACT"
}
```

**Success Response (201 Created):** The attachment is now fully saved. Refresh your UI list.

---

## 👁️‍🗨️ 2. Listing, Viewing, and Downloading

When a user opens a PO page, fetch the list of attachments.

**Endpoint:** `GET /api/purchase-orders/{poId}/attachments`
**Response:** An array of attachment objects.

Each object contains a crucial property: `downloadUrl`. 
*   **Security Note:** This URL is mathematically signed to expire in **1 hour**. Never cache these URLs permanently in the frontend state or LocalStorage.

**UI Implementation for View/Download:**
Simply create an HTML anchor tag and drop the URL in:
```html
<!-- Opens the file in a new browser tab or prompts a download based on the file type -->
<a href="{attachment.downloadUrl}" target="_blank">
   View {attachment.fileName}
</a>
```

---

## ❌ 3. Deleting an Attachment

**Endpoint:** `DELETE /api/purchase-orders/{poId}/attachments/{attachmentId}`

On success (`200 OK`), remove the item from your frontend array. The backend automatically handles deleting the physical file from Cloudflare R2.

---

## ⚠️ Edge Cases & Backend Rules to Handle in the UI

As the frontend developer, you need to handle `400` and `403` errors gracefully for these scenarios:

1.  **The "Frozen" Status Lock:** If a Purchase Order is in `COMPLETED` or `CANCELLED` status, the backend will block all uploads and deletes. (Returns `400 Bad Request` with an explanation).
2.  **The "Evidence" Delete Lock:** If a PO has reached the `ORDERED` or `RECEIVING` state, users can still upload *new* documents (like packing slips), but they **cannot delete** existing ones, as they are now considered legal evidence. Attempting to delete will return a `400 Bad Request`.
3.  **Role Access:** Warehouse staff can *view* attachments (GET list), but they will receive a `403 Forbidden` if they try to upload or delete (which is reserved for Purchasing and Management). Hide the upload/delete buttons if the user lacks the proper role.
