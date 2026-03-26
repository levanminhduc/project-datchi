## Why

The `color_id` column was added to `thread_inventory` (migration `20260318170000`) and summary views (`v_cone_summary`, `fn_cone_summary_filtered`) were updated to join on `ti.color_id` instead of `tt.color_id`. However, multiple SQL functions that INSERT into `thread_inventory` were never updated to include `color_id`, causing inventory summaries to show no color for those cones.

This is critical because the entire business model revolves around thread color identity (supplier + tex + color = unique thread type).

## What Changes

- **Fix `fn_receive_delivery`** to fetch `color_id` from `thread_types` and include it in INSERT (already done in migration `20260321165300`, needs verification)
- **Fix `fn_return_cones_with_movements`** to copy `color_id` from the original cone when creating partial return cones
- **Backfill existing data** — set `color_id` on all existing `thread_inventory` rows where it's NULL but `thread_types.color_id` is not NULL
- **Verify migration `20260321165300`** has been applied to the database

## Capabilities

### New Capabilities
- `inventory-color-propagation`: Ensure all code paths that create `thread_inventory` rows properly set `color_id`

### Modified Capabilities
(none — no requirement-level changes, only bug fixes in existing functions)

## Impact

- **Database functions**: `fn_receive_delivery` (already fixed), `fn_return_cones_with_movements` (needs fix)
- **Views/RPCs**: `v_cone_summary`, `fn_cone_summary_filtered` — already correct (join on `ti.color_id`), will work once data is populated
- **Frontend**: No changes needed — inventory page already renders `color_data` from PostgREST joins
- **Existing data**: Backfill UPDATE will correct historical cones with missing `color_id`
