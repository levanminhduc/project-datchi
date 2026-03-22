## 1. Backend: Fix COLOR_SPEC_SELECT and interfaces

- [x] 1.1 Update `COLOR_SPEC_SELECT` in `server/routes/threadCalculation.ts` to include `meters_per_cone` and `color_data:colors!color_id(name, hex_code)` in the thread_types join
- [x] 1.2 Update `ColorThreadTypeJoin` interface to add `meters_per_cone: number | null` and `color_data: { name: string; hex_code: string | null } | null`
- [x] 1.3 Enrich `buildCalculation` color_breakdown items with parent spec fields: `process_name`, `supplier_name`, `tex_number`, `meters_per_unit`, `meters_per_cone` ← (verify: color_breakdown items carry all display fields, thread_color resolves from color spec color_data not default spec)

## 2. Types: Update ColorCalculationResult

- [x] 2.1 Add fields to `ColorCalculationResult` in `src/types/thread/threadCalculation.ts`: `process_name`, `supplier_name`, `tex_number`, `meters_per_unit`, `meters_per_cone` ← (verify: frontend type matches backend response shape)

## 3. Frontend: Restructure ResultsDetailView

- [x] 3.1 Add helper function to detect if a result has color_breakdown and group calculations by color_id
- [x] 3.2 Implement per-color section layout: color badge header (swatch + name + quantity) followed by per-color specs table
- [x] 3.3 Keep fallback to current flat table when no color_breakdown exists
- [x] 3.4 Ensure thread_color badge in per-color table uses color_breakdown's thread_color/thread_color_code (not parent spec default) ← (verify: per-color sections render correctly with correct thread colors matching StyleColorSpecsTab settings, fallback flat table still works for styles without color specs)
