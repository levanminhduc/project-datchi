---
paths:
  - "server/routes/weekly-order/**"
  - "server/routes/threadCalculation.ts"
  - "src/composables/thread/useWeeklyOrder*.ts"
  - "src/composables/thread/useThreadCalculation.ts"
  - "src/composables/thread/useTransferReserved.ts"
  - "src/pages/thread/transfer-reserved.vue"
---

# Weekly Order / Deliveries Rules

## Flow

1. Calculate thread needs (week + style + color) → 2. Create weekly order (`thread_order_weeks`) → 3. Receive deliveries (`fn_receive_delivery` creates cones) → 4. Reserve from stock (`fn_reserve_from_stock`) → 5. Issue to production → 6. Recovery of unused cones.

Loans between departments: `fn_batch_borrow_thread` (`weekly-order/loans-reservations.ts`).

## Schema Exception — do NOT "fix"

Files in this scope aggregate by **`thread_color` (string)**, NOT the usual `thread_color_id` (number):

- `thread_order_deliveries` only has `thread_color VARCHAR` — there is no `thread_color_id` column.
- UNIQUE INDEX on `(week_id, thread_type_id, COALESCE(thread_color, ''))`.
- `fn_receive_delivery` reverse-looks-up `color_id` at receive time via `colors.name` (UNIQUE `colors_name_key` — never drop that constraint).

Affected files: `threadCalculation.ts`, `weekly-order/reaggregate-helper.ts`, `weekly-order/deliveries.ts`, `weekly-order/save-results-helpers.ts`. This is intentional — do not migrate them to `thread_color_id` unless the column is actually added first.

## Route Order Gotcha

In `server/routes/weekly-order/index.ts`, `transferReservedRoutes` is registered BEFORE `coreRoutes` so `/search-po` isn't swallowed by `/:id`. Preserve this ordering when adding routes.

## Color Resolution in fn_receive_delivery

Fallback chain: `thread_types.color_id` (mostly NULL) → `delivery.thread_color` via `colors.name` lookup → JSONB `summary_data.thread_color` lookup → NULL. Keep `delivery_date` and `thread_color` in `summary_data` in sync when updating deliveries.

## Idempotency

Delivery receive (POST receive) accepts `idempotency_key` — duplicate requests must return the original response, never double-create cones.
