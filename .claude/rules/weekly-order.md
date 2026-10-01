---
paths:
  - "server/routes/weekly-order/**"
  - "server/routes/threadCalculation.ts"
  - "src/composables/thread/useWeeklyOrder*.ts"
  - "src/composables/thread/useThreadCalculation.ts"
  - "src/composables/thread/useTransferReserved.ts"
  - "src/pages/thread/transfer-reserved.vue"
  - "server/routes/issuesV2.ts"
  - "server/utils/issue-v2-batch-quota.ts"
  - "server/routes/issue-activity.ts"
  - "server/routes/thread/cone-summary.ts"
  - "supabase/migrations/*parse_calculation_cones*.sql"
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

## Cone Quota Rounding (định mức cuộn)

Quota source: `/thread/styles` — `meters = meters_per_unit × product quantity`, no waste factor. `meters_per_cone` from `thread_type_supplier`, fallback `thread_types`.

**Single rounding rule:** sum meters of ALL processes (công đoạn) per **PO + style_color + thread_type + thread_color**, then `Math.ceil(meters / meters_per_cone)` once, then sum upward. Never ceil per process, per spec, or per order-item line, and never ceil once over the whole week.

| Place | Implementation |
|-------|----------------|
| Weekly summary (`summary_data.total_cones`) | `useWeeklyOrderCalculation.ts` `buildAggregatedRows`, `reaggregate-helper.ts`, `fn_parse_calculation_cones` |
| Transfer-reserved quota per PO | `transfer-by-calculation.ts` `buildPoQuotaMap` |
| Progress / issue-activity / cone-summary | `progress-helpers.ts` `buildPoStyleQuotaMap`, `buildPoStyleColorQuotaMap` |
| Issue V2 quota | `issue-v2-batch-quota.ts` `computeQuotaPerItem`, `issuesV2.ts` `getQuotaCones` |

- Group meters with `addQuotaMeters` + `applyQuotaMeterGroups` (`progress-helpers.ts`) — reuse them, don't hand-roll a new ceil.
- Week demand shown to users = `quota_cones ?? total_cones` from `summary_data`; recompute from `total_meters` only when both are missing.
- Invariant: sum of per-PO quotas in transfer/progress == `fn_parse_calculation_cones(week)`. After changing any of the places above, verify it on real weeks.

Known and intentionally kept:
- Weeks saved before 2026-07-30 (commit `8e2c1e2`) keep their old `summary_data` (one ceil over the whole week) — they were under-ordered and the last PO transferred shows a real shortage. Do not rewrite their summary.
- Weekly order/transfer/progress read the `calculation_data` snapshot; Issue V2 reads live `/thread/styles` specs and sums quantity across all CONFIRMED weeks before its ceil. Editing specs after a week is confirmed makes them diverge.

## Route Order Gotcha

In `server/routes/weekly-order/index.ts`, `transferReservedRoutes` is registered BEFORE `coreRoutes` so `/search-po` isn't swallowed by `/:id`. Preserve this ordering when adding routes.

## Color Resolution in fn_receive_delivery

Fallback chain: `thread_types.color_id` (mostly NULL) → `delivery.thread_color` via `colors.name` lookup → JSONB `summary_data.thread_color` lookup → NULL. Keep `delivery_date` and `thread_color` in `summary_data` in sync when updating deliveries.

## Idempotency

Delivery receive (POST receive) accepts `idempotency_key` — duplicate requests must return the original response, never double-create cones.
