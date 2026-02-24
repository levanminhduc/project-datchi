## Context

The weekly order system calculates thread requirements per style. Each style has thread specs (`style_thread_specs`) defining process, supplier, tex, and a default thread type. Optionally, per-garment-color overrides exist in `style_color_thread_specs` mapping (spec + garment_color) → specific thread_type.

Current state:
- Backend `COLOR_SPEC_SELECT` fetches `thread_types:thread_type_id (id, name, tex_number)` — missing `color_data` and `meters_per_cone`
- `buildCalculation` returns `color_breakdown[]` with `thread_color`/`thread_color_code` but falls back to default spec values because the color spec query lacks color_data
- `ResultsDetailView` renders `result.calculations` as one flat table per style, ignoring `color_breakdown` entirely

## Goals / Non-Goals

**Goals:**
- Fix `COLOR_SPEC_SELECT` to include `color_data` (thread color name + hex_code) and `meters_per_cone` from thread_types
- Enrich `color_breakdown` items with display fields needed for per-color tables (process_name, supplier_name, tex_number, meters_per_cone)
- Restructure `ResultsDetailView` to show per-garment-color sections instead of flat calculations table
- Match the visual pattern of `StyleColorSpecsTab` (color badge header + table per color)

**Non-Goals:**
- Changing `aggregateResults` logic or `ResultsSummaryTable`
- Modifying Excel export
- Changing how saved weekly orders store data
- Adding editable color specs from the results view

## Decisions

### 1. Enrich `color_breakdown` at backend level vs frontend transformation

**Decision**: Enrich at backend in `buildCalculation`. Each `color_breakdown` item will carry `process_name`, `supplier_name`, `tex_number`, `meters_per_cone` from its parent spec plus its own `thread_color`/`thread_color_code` from the resolved color spec.

**Rationale**: The backend already has all joined data in scope. Frontend would need to cross-reference `calculations` with `color_breakdown` which is fragile.

**Alternative**: Frontend-only transformation — rejected because it duplicates join logic.

### 2. COLOR_SPEC_SELECT fix approach

**Decision**: Add `meters_per_cone` and `color_data:colors!color_id(name, hex_code)` to the `COLOR_SPEC_SELECT` query string, matching the pattern in `SPEC_SELECT`.

Update `ColorThreadTypeJoin` interface to include:
```typescript
interface ColorThreadTypeJoin {
  id: number
  name: string
  tex_number: string
  meters_per_cone: number | null
  color_data: { name: string; hex_code: string | null } | null
}
```

### 3. ResultsDetailView layout

**Decision**: When `color_breakdown` exists on a calculation, group by `color_id` across all calculations. Render per-color sub-sections with:
- Color badge header (hex swatch + name + quantity)
- Table rows = one per spec/calculation for that color

When no `color_breakdown` exists (legacy/no color specs configured), fall back to current flat table.

### 4. Per-color table data structure

Transform `CalculationResult` in the frontend component:

```
result.calculations[].color_breakdown[]
  → group by color_id
  → per-color array of { process_name, supplier_name, tex_number, meters_per_unit,
                          total_meters, meters_per_cone, thread_color, thread_color_code }
```

Each row in the per-color table is derived from one calculation's color_breakdown entry for that color.

## Risks / Trade-offs

- **[Backward compatibility]** Adding fields to `color_breakdown` increases response size slightly → Acceptable, these are small string/number fields.
- **[No color specs configured]** If a style has no `style_color_thread_specs` rows, `color_breakdown` items fall back to default spec thread type → This is correct behavior, same as current. The UI will still show per-color sections but with the default thread color.
- **[Performance]** `COLOR_SPEC_SELECT` adding `color_data` subquery adds one join → Negligible impact, already done in `SPEC_SELECT`.
