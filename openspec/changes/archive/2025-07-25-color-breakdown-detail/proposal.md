## Why

The weekly order calculation's ResultsDetailView currently shows one flat table per style with thread color taken from the default spec-level `thread_types`. When a style has multiple garment colors configured with different thread colors via `style_color_thread_specs`, the detail view displays the wrong thread color (always the default) and merges all colors into a single row. Users cannot see which garment color uses which thread type — information that IS correctly configured in the "Định mức theo màu hàng" settings page.

Additionally, the backend `COLOR_SPEC_SELECT` query omits `color_data` and `meters_per_cone` from the joined `thread_types`, causing `buildCalculation` to fall back to the default spec thread color instead of the per-color override.

## What Changes

- **Fix backend `COLOR_SPEC_SELECT`** to include `color_data` (thread color name + hex) and `meters_per_cone` from `thread_types`, matching the structure already used in `SPEC_SELECT`.
- **Update `ColorThreadTypeJoin` and `ColorSpecRow` interfaces** to reflect the enriched query fields.
- **Enrich `ColorCalculationResult`** with per-color fields: `meters_per_cone`, `thread_color`, `thread_color_code`, `process_name`, `supplier_name`, `tex_number` so each color sub-row has full display data.
- **Restructure `ResultsDetailView`** to display per-garment-color sections (similar to `StyleColorSpecsTab` layout) instead of one flat calculations table. Each section shows the garment color badge + quantity, followed by a table of specs with the correct thread color for that color.
- When only 1 garment color exists, display the same per-color layout (single section) for consistency.

## Capabilities

### New Capabilities
- `color-breakdown-display`: Per-garment-color detail display in ResultsDetailView showing correct thread colors from style_color_thread_specs configuration

### Modified Capabilities

## Impact

- **Backend**: `server/routes/threadCalculation.ts` — `COLOR_SPEC_SELECT` query, `ColorThreadTypeJoin` interface, `buildCalculation` output enrichment
- **Types**: `src/types/thread/threadCalculation.ts` — `ColorCalculationResult` interface additions
- **Frontend**: `src/components/thread/weekly-order/ResultsDetailView.vue` — restructure from flat table to per-color sections
- **No breaking changes**: `aggregateResults`, `ResultsSummaryTable`, Excel export, and saved weekly order data remain unchanged
