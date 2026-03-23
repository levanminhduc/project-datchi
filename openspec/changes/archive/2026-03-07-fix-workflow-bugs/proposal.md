## Why

Three bugs in the Weekly Order → Issues V2 workflow produce incorrect data:
1. **BLOCKER**: `fn_confirm_week_with_reserve` and `fn_receive_delivery` RPCs read `calculation_data` expecting a flat array `[{thread_type_id, total_cones}]`, but the actual stored shape is nested `[{style_id, calculations: [{color_breakdown: [{thread_type_id, ...}]}]}]`. Result: confirming a week reserves zero cones.
2. **MEDIUM**: Frontend aggregation in `useWeeklyOrderCalculation` uses base spec `meters_per_cone` instead of color-level `meters_per_cone`, producing incorrect `total_cones` when color thread types differ from base spec.
3. **LOW**: PO import rejects rows when style_code doesn't exist in `styles` table. Desired behavior: auto-create the style.

## What Changes

- Fix `fn_confirm_week_with_reserve` RPC to parse nested `calculation_data` structure (3-level: style → calculations → color_breakdown)
- Fix `fn_receive_delivery` RPC with the same nested parsing fix
- Handle edge case: specs without `color_breakdown` (use base spec `total_meters` and `meters_per_cone`)
- Fix frontend aggregate to use `cb.meters_per_cone` (color-level) with fallback to `calc.meters_per_cone` (base spec)
- Modify PO import parse/execute to auto-create styles when `style_code` not found (using `style_code` as `style_name`, preview shows "Mới" tag)

## Capabilities

### New Capabilities
- `po-import-auto-create-style`: Auto-create styles during PO import when style_code doesn't exist in database

### Modified Capabilities
- (none — the RPC and frontend fixes are bug corrections, not requirement changes)

## Impact

- **Database**: New migration to replace `fn_confirm_week_with_reserve` and `fn_receive_delivery` functions
- **Backend**: `server/routes/import.ts` — parse phase marks unknown styles as `new_style`, execute phase creates styles before inserting `po_items`
- **Frontend**: `src/composables/thread/useWeeklyOrderCalculation.ts` — 1-line fix in aggregate logic
- **Frontend**: `src/pages/thread/purchase-orders/import.vue` — display "Mới" tag for new styles in preview
