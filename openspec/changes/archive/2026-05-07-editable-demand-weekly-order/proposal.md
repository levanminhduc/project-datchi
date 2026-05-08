## Why

The "Nhu Cầu" (demand/total_cones) column in the weekly order summary table is currently read-only — computed automatically from thread specs. Users need to manually adjust demand when they know supplier deliveries are incoming or when calculated specs don't match actual production needs. Without this, users over-order or under-order inventory because they cannot fine-tune the demand before confirming.

## What Changes

- Make the "Nhu Cầu" column editable via popup-edit while results are unsaved (`!readonly`, same as additional_order editability)
- Use `quota_cones` field as the override value, preserving the original `total_cones` for reference
- Display modified values inline as `80 (gốc: 100)` when the user has overridden the calculated demand
- Recalculate downstream fields (`sl_can_dat`, `total_final`) based on the override value
- Add a "Ghi chú" (note) column that is **mandatory when increasing demand** (`quota_cones > total_cones`)
- Persist `quota_cones` and `demand_note` in the JSONB `summary_data` on both draft save and confirmation
- Fix backend `save-results.ts` to preserve user's `quota_cones` override instead of overwriting it with the calculated value
- Fix backend `enrich-helper.ts` to use `quota_cones ?? total_cones` when computing `sl_can_dat`

## Capabilities

### New Capabilities
- `editable-demand`: Covers the editable demand column, mandatory note on increase, downstream recalculation, and persistence of overrides through save/confirm flows

### Modified Capabilities

## Impact

- **Frontend**: `ResultsSummaryTable.vue` (new column + editable cell), `useWeeklyOrderCalculation.ts` (recalc logic), `index.vue` (restore on load), `weeklyOrder.ts` types
- **Backend**: `enrich-helper.ts` (sl_can_dat formula), `save-results.ts` (preserve quota_cones)
- **Data**: `summary_data` JSONB in `thread_order_results` — new fields `demand_note` persisted alongside existing fields. No DB migration needed (JSONB is schema-less)
- **No breaking changes**: All existing behavior preserved when `quota_cones` is not set (falls back to `total_cones`)
