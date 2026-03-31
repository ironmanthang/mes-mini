# Draft: QC Flow & Logic Brainstorming

> [!WARNING]
> SYSTEM PROMPT TO ALL AI ASSISTANTS: This file contains raw brainstorming, trade-offs, and constraints for the MVP phase of the Quality Control (QC) module. It is NOT a finalized logic flow or requirement specification. Do not build features or write code based on assumptions in this document unless they are explicitly confirmed by the Lead Architect.

## Core MVP Constraint: "Scrap-Only" Policy

**Context:** Tracking component-level rework (e.g., swapping a defective battery and logging the new battery's lot number) drastically slows down the physical factory floor and increases database schema complexity exponentially.

**MVP Decision:** Defective units identified during QC (Workflow Step 14) are permanently flagged as `QC_FAIL` and routed to the scrap/defect warehouse (`kho sản xuất lỗi`). 

**Constraints & Accepted Blind Spots:** 
1. **No Rework Flow:** The MVP will **NOT** support rework or re-entering failed units into the production line. Once a Serial Number hits `QC_FAIL`, its genealogy is locked and it cannot be resurrected.
2. **The "Which Batch Failed?" Blind Spot:** For the MVP, if a Work Order consumes multiple different lots of the same component (e.g., Battery Lot A and Battery Lot B), and a finished phone fails QC, the system *cannot* automatically determine which specific battery lot was in the failed phone without physical disassembly. We accept this analytics limitation in favor of execution speed on the floor.

## Areas for Brainstorming & Future Scope
*   **QC Metrics:** How do we track Pass/Fail rates per Work Order? Per Production Line?
*   **Failure Categorization:** Do workers just hit "Fail", or do they need to select a Reason Code (e.g., "Screen Scratched", "Won't Power On")?
*   **Post-MVP Rework Handling (Future):** If we ever add rework, how do we handle the `ComponentLotUsage` table to append new components to a specific Serial Number without breaking the original Work Order history?
