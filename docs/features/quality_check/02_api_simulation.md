# Quality Check API — Frontend Integration Guide

**Scope**: Phase A (`POST /api/quality`). Phase B (Product Induction) is covered in the Product Induction documentation.

---

## Integration Overview

The frontend cannot hardcode inspection point IDs. These IDs are dynamic and linked to specific product checklists. The frontend must resolve them at runtime by chaining three API calls before it can submit a quality check.

---

## The Three-Call Chain (Discovery Phase)

### Call A — Resolve the Instance

The QC Inspector scans a barcode. The scanner emits a serial number string (the serialNumber can be view on api GET /api/product-instances)

```http
GET /api/product-instances?serialNumber={scanned_serial}
Authorization: Bearer <token>
```

**Extraction & Guards:**
- Extract `data[0].productInstanceId` (for audit logging if needed).
- Extract `data[0].status`. **Guard**: Must be `PENDING_QC`. If not, halt and display: "This unit has already been inspected or is not ready for QC."
- Extract `data[0].product.productId` for the next call.

---

### Call B — Resolve the Checklist ID

Using the `productId` extracted from Call A:

```http
GET /api/products/{productId}
Authorization: Bearer <token>
```

**Extraction & Guards:**
- Extract `checklist.checklistId` for the next call.
- Extract `checklist.checklistName` to display as the form title.
- **Guard**: If `checklist` is `null`, block submission and display: "This product has no QC checklist assigned. Contact your supervisor."

---

### Call C — Fetch Inspection Points (The Questions)

Using the `checklistId` extracted from Call B:

```http
GET /api/master-data/quality-checklists/{checklistId}
Authorization: Bearer <token>
```

**Extraction & UI Rendering:**
- Extract `inspectionPoints[]`, sorted by `sortOrder`.
- For each point: `inspectionPointId`, `pointName`, `pointType`, `minValue`, `maxValue`, `unit`.
- **Rendering rules based on `pointType`:**
  - `BINARY` → Render a Pass / Fail toggle switch.
  - `MEASUREMENT` → Render a numeric input field; display `minValue`, `maxValue`, `unit` as hints.

---

## Submitting the Inspection

After the inspector answers all points and clicks Submit, map the UI answers back to the `inspectionPointId`s (from Call C) and submit the payload.

```http
POST /api/quality
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "serialNumber": "SN-12345",
  "notes": "Optional overall notes from the inspector.",
  "inspectionResults": [
    { "inspectionPointId": 1, "passed": true },
    { "inspectionPointId": 2, "passed": false, "notes": "Scratch on screen" },
    { "inspectionPointId": 3, "passed": true, "measuredValue": 4.0 }
  ]
}
```

**Critical Contract Rules:**
- Do **NOT** send a `result` field. The backend computes the final `PASSED`/`FAILED` result server-side using the "One Fail = Total Fail" rule.
- The `inspectionResults` array **MUST** contain an entry for EVERY inspection point returned by Call C. A partial list returns `400 Bad Request`.
- `measuredValue` is optional for `BINARY` points but required for `MEASUREMENT` points.

---

## Response Handling

**Success (`201 Created`):**
- Extract `result` (`PASSED` or `FAILED`) and `instanceStatus` (`PASSED_QC` or `FAILED_QC`).
- Display a success message indicating the result.

**Errors (`400 Bad Request`):**
- Handle validation errors, such as missing points or duplicate submissions (e.g., "This product instance has already been inspected. Duplicate QC is not allowed."). Display the backend `message` directly to the user.

---

## Summary: Who Owns What

- **The User (Inspector)**: Knows only the barcode on the physical unit and the visual test results.
- **The Frontend**: Chains three read APIs to discover the `inspectionPointId` values dynamically. Maps UI inputs to those IDs to construct the final payload.
- **The Backend**: Validates that all required points are answered, derives the pass/fail result server-side, updates the instance status, and triggers batch cost absorption.
