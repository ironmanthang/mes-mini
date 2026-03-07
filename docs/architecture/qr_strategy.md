# QR Code & Identification Strategy (SSOT)

> **Role:** Global architectural rules for bridging the physical workshop to the digital database.
> **Audience:** Hardware Engineers, Mobile Developers, and Warehouse Staff.

---

## 1. The Core Philosophy
In a manual electronics assembly environment, **Typing is the Enemy**. 
- **Rule:** Every physical object (Box, Batch, Unit) must have a QR Code.
- **Goal:** Enable "Single Scan" state transitions.

---

## 2. The Four Critical QR Types

| Phase | Object Scanned | Strategy |
| :--- | :--- | :--- |
| **1. Receiving** | Component Box | **Internal Lot Label**: If supplier QR is non-standard or vague, print an Internal UUID QR immediately. This links the box to a `ComponentLot`. |
| **2. Production** | The Batch | **The Traveler**: A paper document (Phiếu theo dõi) containing the Work Order QR and checklist. It follows the parts bin. |
| **3. Assembly** | Unique Unit | **Serial Number (SN)**: A tiny sticker (e.g., 5mm x 5mm) printed at assembly start (e.g., `SN-2026-001`). This initializes a `ProductInstance`. |
| **4. Shipping** | The Package | **SO Label**: Scanned to link specific Serial Numbers to a `SalesOrder`. |

---

## 3. The "Internal Label" Mandate

**Never trust external formats long-term.** 
- **Internal UUID QR**: At Incoming QC, relabel key components with our own format.
- **Why?** Ensures all shop-floor stations can parse labels instantly without maintaining hundreds of supplier-specific regex parsers.

---

## 4. The Traveler (Phiếu theo dõi sản xuất)

A physical traveler is mandatory for every Work Order batch.
- **Contents:**
    - Work Order ID (QR Code)
    - Product SKU & Name
    - Batch Quantity
    - Operation Checklist
- **UX Flow:** Workers scan the Traveler to "Start" and "Stop" their timers/actions, ensuring they never have to manually search for a Work Order ID on a terminal.

---

## 5. Technical Implementation
- **API Pattern:** `POST /api/scan`
- **Payload:** `{ code: string, locationId: number, employeeId: number }`
- **Logic:** The backend parses the code prefix (e.g., `SN-`, `WO-`, `LOT-`) to determine the state transition.
