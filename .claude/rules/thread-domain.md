---
paths:
  - "src/pages/thread/**"
  - "src/composables/thread/**"
  - "src/components/thread/**"
  - "src/types/thread/**"
  - "server/routes/**"
---

# Thread Domain Rules

## Identity (critical invariant)

**1 thread type = Supplier (NCC) + Tex + Color.** Same tex+color from a different supplier, or same supplier+tex in a different color (C9700 vs C9701) → separate `thread_type_id`, separate inventory. NEVER merge across this boundary. Display: `"Coats Epic - TEX 24 - C9700"`.

## Color ID — source depends on context

`thread_types.color_id` IS NULL for all records — never read it.

| Context | Correct source |
|---------|---------------|
| Cones in stock | `thread_inventory.color_id` |
| PO / style spec | `style_color_thread_specs.thread_color_id` |
| Aggregation key | `${thread_type_id}_${thread_color_id ?? ''}` — numeric ID, never the string name |

Exception: `server/routes/weekly-order/**` and `threadCalculation.ts` intentionally key on `thread_color` (string) — see `weekly-order.md` rule before "fixing" it.

## Cone Lifecycle

```
AVAILABLE → ALLOCATED → ISSUED → RETURNED → AVAILABLE
AVAILABLE → QUARANTINE | DAMAGED | LOST
```

`ConeStatus`: AVAILABLE, ALLOCATED, ISSUED, RETURNED, DAMAGED, LOST, QUARANTINE.
Status transitions must follow this graph — no jumping ISSUED → AVAILABLE directly (goes through recovery/RETURNED).

## Dual UoM

Every cone tracks `quantity_meters DECIMAL(12,4)` AND `weight_grams DECIMAL(10,2)` (+ `quantity_cones`, `is_partial`). Any movement must update BOTH units.

## Key Flows & Entry Points

| Flow | Mechanism | Reference |
|------|-----------|-----------|
| FEFO allocation | RPC `fn_dept_allocate` (atomic) | AllocationStatus: PENDING → CONFIRMED → ISSUED |
| Issue V2 (multi-color) | RPC `fn_issue_cones_with_movements` + `Idempotency-Key` | `server/routes/issuesV2.ts`, `useIssueV2.ts` |
| Recovery | Direct status transitions (no RPC) | `server/routes/recovery.ts`; PENDING → CONFIRMED/REJECTED |
| Reserve from stock | RPC `fn_reserve_from_stock` | weekly order flow |
| Loans between depts | RPC `fn_batch_borrow_thread` | `weekly-order/loans-reservations.ts` |

Every one of these changes stock → must produce `thread_movements` records (directly or inside the RPC).
