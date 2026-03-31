# ComponentLot Quantity Strategy: Decision Note

> [!NOTE]
> **Status:** DEFERRED — Not needed until we build the Material Request / Work Order outbound flow.
> **Context:** This decision was raised by a plan review. It doesn't affect the PO inbound feature.

## The Problem

When a `ComponentLot` (physical box) is received via a Purchase Order, it has a `quantity` (e.g., 100 batteries).

Later, when the warehouse issues components to a Work Order (Material Request), units are **picked from specific boxes**. The question is: **how do we track what's left in each box?**

## Option A: Split into `initialQuantity` + `currentQuantity`

```prisma
model ComponentLot {
  initialQuantity  Int   // What the supplier delivered (immutable)
  currentQuantity  Int   // What's physically still in the box (decremented on pick)
}
```

**Pros:**
- Fast lookup: "How many are left in this box?" → just read `currentQuantity`
- Simple FIFO: pick from the lot with the oldest `receivedAt` that still has `currentQuantity > 0`
- Easy for warehouse UI: show a progress bar (current/initial)

**Cons:**
- Mutable state on the lot — must be updated inside the same transaction as every pick (Reconciliation Skill applies)
- If `currentQuantity` drifts from reality (bug, missed transaction), the lot is permanently incorrect
- Two fields to maintain instead of one

---

## Option B: Keep `quantity` Immutable, Derive Remaining from Transactions

```prisma
model ComponentLot {
  quantity  Int   // What the supplier delivered (NEVER changes)
}
// Remaining = quantity - SUM(InventoryTransaction.quantity WHERE componentLotId = this AND type = EXPORT)
```

**Pros:**
- Lot record is immutable — no drift risk, no reconciliation nightmare
- Follows the "Immutable Log" principle from the Reconciliation Skill
- Single source of truth: `InventoryTransaction` table tells the complete story

**Cons:**
- Slow lookup: need to aggregate transactions to find remaining (O(n) per lot, where n = number of picks)
- Can be mitigated with a materialized view or periodic cache, but adds complexity
- FIFO query becomes a JOIN + GROUP BY + HAVING instead of a simple WHERE

---

## Recommendation

**For MVP: Option A** (`initialQuantity` + `currentQuantity`)

*Why:* The warehouse UI needs to show "what's left in this box" instantly. The MVP won't have enough transaction volume to make the aggregate query in Option B a problem, but it WILL have warehouse workers who need fast feedback. The Reconciliation Skill's "Tri-Update" pattern already mandates that every pick updates both the lot AND the transaction log atomically, so drift is prevented by design.

**For scale (future):** If transaction volume grows and auditors want provable immutability, migrate to Option B with a materialized view.

---

## When to Implement

This decision becomes relevant when building:
- **Material Request** (Flow 4.2) — issuing components from warehouse to production floor
- **Component Return** (Flow 4, Step 12) — returning unused components from floor to warehouse

Both features create outbound `InventoryTransaction` records that need to reference a `componentLotId`.

## Schema Change Needed (Future)

When we get here, we need:
1. Rename `ComponentLot.quantity` → `initialQuantity`, add `currentQuantity`
2. Add `componentLotId Int?` to `InventoryTransaction` (optional FK — only filled for lot-tracked transactions)
