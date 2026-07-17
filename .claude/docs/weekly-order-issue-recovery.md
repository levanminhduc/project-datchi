---
description: Weekly order flow, Issue V2, recovery, loans, transfer reserved, known schema exceptions
---

# Weekly Order, Issue & Recovery

## Weekly Order Flow

```
1. Calculate thread needs (by week + style + color)
2. Create weekly order (thread_order_weeks)
3. Deliveries: receive thread against order → fn_receive_delivery creates cones
4. Reserve cones from stock for each PO/dept
5. Issue reserved cones to production dept
6. Return unused cones → recovery flow
```

## Issue V2 (Multi-color Issue)

Supports issuing multiple thread colors in one transaction.

Key files:
- `src/composables/thread/useIssueV2.ts`
- `src/pages/thread/issues/v2/index.vue`
- `server/routes/issuesV2.ts`

RPC: `fn_issue_cones_with_movements` — atomic issue + movement log insert

Idempotency: every confirm request sends `Idempotency-Key` header → checked against `issue_operations_log` before processing. Prevents double-issue on network retry.

## Recovery Flow

Cones returned from production back to warehouse.

No dedicated RPC — uses direct status transitions + inventory updates.
Reference: `server/routes/recovery.ts`

RecoveryStatus: `PENDING` → `CONFIRMED` (cone returns to AVAILABLE) or `REJECTED`

## Loans (Borrowing Between Departments)

Temporary loan of cones from one dept to another.

RPC: `fn_batch_borrow_thread` — creates multiple loan records atomically.
Reference: `server/routes/weekly-order/loans-reservations.ts`

## Transfer Reserved

Move reserved cones from one PO/dept to another.

Reference:
- `src/pages/thread/transfer-reserved.vue`
- `src/composables/thread/useTransferReserved.ts`
- `server/routes/weekly-order/` — `transferReservedRoutes` registered BEFORE `coreRoutes` (prevents `/search-po` being matched as `/:id`)

## Known Schema Exception: Weekly Order Aggregation

Files in `server/routes/weekly-order/` use `thread_color` (string) as aggregation key — NOT the usual `thread_color_id` (number) pattern used elsewhere.

**Why this is intentional (NOT a bug):**
- `thread_order_deliveries` has only `thread_color VARCHAR`, no `thread_color_id` column
- UNIQUE INDEX on `(week_id, thread_type_id, COALESCE(thread_color, ''))`
- `fn_receive_delivery` reverse-looks up `color_id` at receive time via `colors.name` (UNIQUE constraint)

Files with this exception:
- `server/routes/threadCalculation.ts`
- `server/routes/weekly-order/reaggregate-helper.ts`
- `server/routes/weekly-order/deliveries.ts`
- `server/routes/weekly-order/save-results-helpers.ts`

Do NOT "fix" these files to use `thread_color_id` — the column does not exist in that table yet.

Risk: if `colors.name` unique constraint (`colors_name_key`) is ever dropped → reverse lookup picks wrong `color_id`. Do NOT drop that constraint.

## Delivery Receipt (fn_receive_delivery)

Color resolution fallback chain:
1. `thread_types.color_id` (mostly NULL)
2. `delivery.thread_color` string → reverse lookup via `colors.name`
3. JSONB `summary_data.thread_color` → reverse lookup
4. NULL — cone created with `color_id = NULL` (rare edge case)
