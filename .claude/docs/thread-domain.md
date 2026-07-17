---
description: Thread type identity, cone lifecycle, dual UoM, FEFO, color ID rules
---

# Thread Domain

## Thread Type Identity (Critical Invariant)

**1 thread type = unique combination of: Supplier (NCC) + Tex number + Thread color**

- Same tex + color, different supplier → different `thread_type_id` → separate inventory
- Same supplier + tex, different color (e.g. C9700 vs C9701) → 2 separate rows, NEVER merge
- Display: `"Coats Epic - TEX 24 - C9700"`

## Color ID Rules — Source Depends on Context

`thread_types.color_id` IS NULL FOR ALL RECORDS. Do NOT use it to determine color.

| Context | Correct column | Table |
|---------|---------------|-------|
| Inventory (cones in stock) | `thread_inventory.color_id` | Each cone has actual color |
| PO/Style spec | `style_color_thread_specs.thread_color_id` | Spec defines color for style+color |
| Aggregation key | `${thread_type_id}_${thread_color_id}` | Use numeric ID, not string name |

Aggregation pattern:
```typescript
const key = `${thread_type_id}_${thread_color_id ?? ''}`  // correct — ID number
const key = `${thread_type_id}_${thread_color ?? ''}`     // wrong — string name
```

## Cone Lifecycle

```
AVAILABLE → ALLOCATED (reserved for dept) → ISSUED (out of warehouse)
         → RETURNED (from dept back to stock) → AVAILABLE
         → DAMAGED / LOST
AVAILABLE → QUARANTINE (quality hold)
```

ConeStatus enum: `AVAILABLE`, `ALLOCATED`, `ISSUED`, `RETURNED`, `DAMAGED`, `LOST`, `QUARANTINE`

## Dual Unit of Measure

Every cone tracks:
- `quantity_meters DECIMAL(12,4)` — length in meters
- `weight_grams DECIMAL(10,2)` — weight in grams
- `quantity_cones INTEGER` — always 1 for a full cone
- `is_partial BOOLEAN` — true when cone is partially used

Both UoM must be updated on any inventory movement.

## FEFO Allocation

First-Expired First-Out — cones allocated in order of expiry/lot date.

RPC: `fn_dept_allocate` handles FEFO logic atomically in PostgreSQL.

AllocationStatus: `PENDING`, `CONFIRMED`, `CANCELLED`, `PARTIAL`

## Issue V2 (Multi-color)

Complex issue flow supporting multiple thread colors per issue request.

RPC: `fn_issue_cones_with_movements` — atomic issue + movement log.

Uses idempotency log (`issue_operations_log`) to prevent double-execute on retry.

Reference: `src/composables/thread/useIssueV2.ts` + `src/pages/thread/issues/v2/index.vue`

## Recovery Flow

Cones returned from production back to stock.

RecoveryStatus: `PENDING`, `CONFIRMED`, `REJECTED`

Recovery does NOT have a dedicated RPC — uses direct status transitions + inventory updates in `server/routes/recovery.ts`.

## Weekly Order → Reservation → Loan

1. Calculate thread needs per week/style/color
2. Reserve cones from stock (`fn_reserve_from_stock`)
3. Loans: temporary borrowing between departments (`fn_batch_borrow_thread`)
4. Transfer reserved: move reserved cones between POs

Reference: `src/composables/thread/useTransferReserved.ts`
