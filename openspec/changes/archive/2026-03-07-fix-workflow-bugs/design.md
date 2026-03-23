## Context

Three confirmed bugs in the Weekly Order → Reserve → Delivery → Issues V2 pipeline:

1. PostgreSQL RPCs (`fn_confirm_week_with_reserve`, `fn_receive_delivery`) expect `calculation_data` as flat `[{thread_type_id, total_cones}]` but it's stored as nested `[{style_id, calculations: [{color_breakdown: [{thread_type_id, ...}]}]}]`. Both functions iterate zero rows, reserving nothing.

2. Frontend composable `useWeeklyOrderCalculation.ts` L218 uses `calc.meters_per_cone` (base spec level) instead of `cb.meters_per_cone` (color level) when aggregating results. When color thread types have different `meters_per_cone`, `total_cones` is wrong.

3. PO import (`server/routes/import.ts`) rejects rows with unknown `style_code`. Business wants auto-creation.

Current state: Weekly Order confirm appears successful (status changes to CONFIRMED) but zero cones are reserved. Delivery receiving creates AVAILABLE cones instead of RESERVED_FOR_ORDER because shortage calculation returns 0.

## Goals / Non-Goals

**Goals:**
- Fix RPCs to correctly parse nested `calculation_data` and reserve the right number of cones
- Fix frontend aggregate to use color-level `meters_per_cone`
- Enable auto-creation of styles during PO import

**Non-Goals:**
- Changing `calculation_data` storage format (too many downstream consumers)
- Adding QC step for batch/simple receive (separate concern)
- Modifying Issues V2 quota calculation (Issue 2 was ruled out — no duplicate PO/style/color across weeks)
- Adding style_name column to import Excel template

## Decisions

### D1: Parse nested `calculation_data` in RPC (not switch to `summary_data`)

**Chosen**: Rewrite SQL to traverse 3 levels: `style_result → calculations → color_breakdown`

**Alternative considered**: Read `summary_data` instead (already flat). Rejected because:
- `summary_data` is written by frontend aggregate which itself has the `meters_per_cone` bug (Issue 5)
- Fixing Issue 5 first then using `summary_data` creates a dependency chain
- `calculation_data` is the source of truth from `threadCalculation` backend
- Reading `calculation_data` directly is more robust long-term

**Edge case**: When a spec has no `color_breakdown` (no color specs configured), use the base calculation's `total_meters` and `meters_per_cone` directly.

### D2: Auto-create style with `style_name = style_code`

**Chosen**: In parse phase, mark unknown styles as status `new_style`. In execute phase, INSERT into `styles` before creating `po_items`. Use `style_code` as `style_name`.

**Rationale**: Simplest approach. Style name can be edited later on Styles page. No additional Excel columns needed.

### D3: Preview tag for new styles

**Chosen**: Show info-colored "Mới" q-badge in import preview table. No warning, no post-import redirect.

**Rationale**: User knows they need to setup specs. Keeping it lightweight.

## Risks / Trade-offs

- **[Risk]** Nested SQL parsing is more complex than flat → **Mitigation**: Use `jsonb_array_elements` with COALESCE for null `color_breakdown`. Test with real data shapes.
- **[Risk]** Auto-created styles have no specs → **Mitigation**: This is expected. Weekly Order calculation will return 0 meters/0 cones until specs are configured. No data corruption.
- **[Risk]** Existing CONFIRMED weeks have 0 reservations due to bug → **Mitigation**: Out of scope for this change. Can be addressed by re-confirming affected weeks after fix is deployed.
