## Why

The weekly order enrich endpoint counts all cones equally (1 cone = 1 unit), regardless of whether they are full or partial. Partial cones contain only ~30% of thread (configurable via `partial_cone_ratio` in `system_settings`). This causes the ordering plan to underestimate required quantities — e.g., 10 full + 20 partial shows as 30 available, but the real equivalent is only 16 (10 + 20×0.3). Users order too few cones as a result.

Additionally, `fn_return_cones_with_movements` does not clear `reserved_week_id` / `original_week_id` when returning cones, and there is no configurable setting for reserve priority (full-first vs partial-first).

## What Changes

- Enrich endpoint (`POST /api/weekly-orders/enrich-inventory`) applies `partial_cone_ratio` conversion and returns separate full/partial counts + equivalent total
- Weekly order summary table adds columns: "Cuon nguyen" (full), "Cuon le" (partial), "Ton kho QD" (equivalent). Keeps existing "Ton kho KD" (raw count). `sl_can_dat` calculated from equivalent, not raw
- New `reserve_priority` setting in `system_settings` with values `partial_first` (default) or `full_first`
- `fn_reserve_for_week` reads `reserve_priority` setting to determine ORDER BY direction for `is_partial`
- `fn_return_cones_with_movements` clears `reserved_week_id` and `original_week_id` when returning cones to AVAILABLE
- Settings page UI adds reserve priority selector

## Capabilities

### New Capabilities
- `enrich-partial-conversion`: Enrich endpoint applies partial_cone_ratio to compute equivalent inventory, returns full_cones/partial_cones/equivalent breakdown
- `reserve-priority-setting`: Configurable reserve priority (partial_first/full_first) stored in system_settings, read by fn_reserve_for_week
- `return-clear-week-assignment`: fn_return_cones_with_movements clears reserved_week_id and original_week_id on return

### Modified Capabilities
(none — no existing spec-level requirements change)

## Impact

- **Database**: New seed row in `system_settings` for `reserve_priority`. Migration to update `fn_reserve_for_week` and `fn_return_cones_with_movements` RPC functions
- **Backend**: `server/routes/weeklyOrder.ts` enrich endpoint logic change
- **Frontend**: `src/pages/thread/weekly-order/index.vue` (summary table columns), `src/composables/thread/useWeeklyOrderCalculation.ts` (aggregate types), `src/pages/settings.vue` (reserve priority UI)
- **Types**: `AggregatedRow` type needs new fields: `full_cones`, `partial_cones`, `equivalent_cones`
