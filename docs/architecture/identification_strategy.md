# Identification & Barcode Strategy (SSOT)

> **Role:** Global architectural rules for bridging the physical workshop to the digital database.
> **Audience:** Hardware Engineers, Mobile Developers, and Warehouse Staff.

---

## 1. The Core Philosophy
In a manual electronics assembly environment, **Typing is the Enemy**. 
- **Rule:** Every physical object (Box, Batch, Unit) must have a 1D Barcode.
- **Goal:** Enable "Single Scan" state transitions.
- **Hardware:** Employees use phone cameras for scanning via the web application.

### 🧬 Traceability Granularity (Internal Standard)
To balance shop-floor efficiency and traceability, the system enforces two levels of identification:
1. **Product Serialization (Finished Goods/Expensive Parts):** Every finished product unit receives a unique **Serial Number (SN)** (e.g., `SN-001`, `SN-002`).
2. **Component Batching (Raw Materials):** Standard components (Resistors, Capacitors, **Batteries**, etc.) are NOT tracked individually. They are tracked by **Batch ID (LOT)**.
   - *Example:* "Unit SN-001 used a battery from Batch LOT-BATT-001."

---

## 2. The Four Critical Barcode Types

| Phase | Object Scanned | Strategy |
| :--- | :--- | :--- |
| **1. Receiving** | Component Box | **Internal Lot Label**: If supplier label is non-standard or vague, print an Internal 1D Barcode immediately. This links the box to a `ComponentLot`. |
| **2. Production** | The Batch | **The Traveler**: A paper document (Phiếu theo dõi) containing the Work Order Barcode and checklist. It follows the parts bin. |
| **3. Assembly** | Unique Unit | **Serial Number (SN)**: A 1D Barcode sticker printed at assembly start (e.g., `SN-2026-001`). This initializes a `ProductInstance`. |
| **4. Shipping** | The Package | **SO Label**: Scanned to link specific Serial Numbers to a `SalesOrder`. |

---

## 3. The "Internal Label" Mandate

**Never trust external formats long-term.** 
- **Internal 1D Barcode**: At Incoming QC, relabel key components with our own format.
- **Why?** Ensures all shop-floor stations can parse labels instantly without maintaining hundreds of supplier-specific regex parsers.
- **Note on Dimensions**: Since products and components in this project are large, barcodes can be long enough to accommodate detailed identification strings without requiring 2D/QR densities.

---

## 4. The Traveler (Phiếu theo dõi sản xuất)

A physical traveler is mandatory for every Work Order batch.
- **Contents:**
    - Work Order ID (1D Barcode)
    - Product SKU & Name
    - Batch Quantity
    - Operation Checklist
- **UX Flow:** Workers scan the Traveler to "Start" and "Stop" their timers/actions, ensuring they never have to manually search for a Work Order ID on a terminal.

---

## 5. Technical Implementation
- **Standard:** Code 128 (default for high-density alpha-numeric tracking).
- **API Pattern:** `POST /api/scan`
- **Payload:** `{ code: string, locationId: number, employeeId: number }`
- **Logic:** The backend parses the code prefix (e.g., `SN-`, `WO-`, `LOT-`) to determine the state transition.
