## Why

When weekly orders are saved (POST /:id/results), the backend queries `thread_order_week_warehouses` (junction) to determine which warehouses apply to the calculation. However, this junction is mutable — users can toggle warehouse selections at any time. Once a week is confirmed and cones are reserved (a financial commitment), there is no immutable record of which warehouses were selected at the time of calculation. All 39 existing weeks (4 DRAFT + 35 CONFIRMED) have zero junction rows, making full audit trails impossible today.

## What Changes

- **DB**: Add `warehouse_ids INTEGER[]` column (nullable) to `thread_order_results`. Semantic: `NULL` = pre-migration rows without snapshot; `'{}'` = empty selection (apply all warehouses); `'{3,5}'` = explicit warehouse IDs selected.
- **Backend**: In `save-results.ts`, include `warehouse_ids` in the upsert payload. The value is derived from the junction query already performed on line 91–97 (no new DB query needed). Store `null` when `warehouseIds` is empty to preserve the semantic distinction from `{}`.
- **Frontend types**: Add `warehouse_ids?: number[] | null` to `WeeklyOrderResults` interface.
- **Frontend UI**: Update the warehouse filter label and hint text to clearly communicate that the selection affects the confirmation step, not just display filtering.

## Capabilities

### New Capabilities

- `warehouse-ids-snapshot`: Snapshot of warehouse IDs selected at calculation time, stored as an immutable audit column on `thread_order_results`.

### Modified Capabilities

<!-- No existing spec-level behavior changes. Reserve flow (fn_reserve_for_week, fn_confirm_week_with_reserve) continues to read from the junction table unchanged. -->

## Impact

- **Database**: `thread_order_results` table gains one nullable array column. Safe: no backfill, no existing query broken.
- **API**: `POST /:id/results` response payload gains `warehouse_ids` field. Backwards-compatible.
- **Frontend**: `WeeklyOrderResults` type gains an optional field. No breaking change to existing consumers.
- **DB Functions** (not touched): `fn_reserve_for_week`, `fn_confirm_week_with_reserve`, `fn_reserve_from_stock`, `fn_receive_delivery`, `fn_re_reserve_after_remove_po` all continue to read from `thread_order_week_warehouses` junction — snapshot column is additive only.
- **Files touched**: 4 files total (1 new migration, 1 backend route edit, 1 type file edit, 1 page file edit).
