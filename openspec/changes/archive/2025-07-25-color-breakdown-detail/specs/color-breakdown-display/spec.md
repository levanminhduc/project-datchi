## ADDED Requirements

### Requirement: Backend COLOR_SPEC_SELECT includes color_data and meters_per_cone
The backend `COLOR_SPEC_SELECT` query string in `server/routes/threadCalculation.ts` SHALL include `meters_per_cone` and `color_data:colors!color_id(name, hex_code)` in the `thread_types` join, matching the structure of `SPEC_SELECT`.

#### Scenario: Color spec query returns thread color data
- **WHEN** a batch calculation is executed for a style with color_breakdown
- **THEN** the `style_color_thread_specs` query SHALL return `thread_types` with `meters_per_cone`, and `color_data` containing `name` and `hex_code`

### Requirement: ColorCalculationResult carries per-color display fields
Each item in `CalculationItem.color_breakdown` SHALL include `process_name`, `supplier_name`, `tex_number`, `meters_per_unit`, and `meters_per_cone` from the parent spec, plus `thread_color` and `thread_color_code` resolved from the color-specific thread type (falling back to default spec thread type if no color override exists).

#### Scenario: Color breakdown with color-specific thread type
- **WHEN** a style has a `style_color_thread_specs` entry mapping (spec_id=1, color_id=5) to thread_type_id=8 which has color_data "Red"
- **THEN** the color_breakdown item for color_id=5 SHALL have `thread_color="Red"` and the matching `thread_color_code` hex value

#### Scenario: Color breakdown without color-specific override
- **WHEN** a style has no `style_color_thread_specs` entry for (spec_id=1, color_id=5)
- **THEN** the color_breakdown item for color_id=5 SHALL use the default spec thread type's `thread_color` and `thread_color_code`

### Requirement: ResultsDetailView displays per-garment-color sections
When a calculation result contains `color_breakdown` data, `ResultsDetailView` SHALL group the data by garment color and display separate sections per color. Each section SHALL show:
1. A color badge header with the garment color swatch, name, and quantity
2. A table with one row per spec (process) showing: process_name, supplier_name, tex_number, meters_per_unit, total_cones (calculated), thread_color badge, and total_meters

#### Scenario: Style with 2 garment colors
- **WHEN** calculation result has color_breakdown with 2 colors (Red: 100 qty, Blue: 200 qty) and 2 specs (May 1 kim, Vat so)
- **THEN** ResultsDetailView SHALL render 2 sub-sections, each with a 2-row table showing the per-color metrics and correct thread color

#### Scenario: Style with 1 garment color
- **WHEN** calculation result has color_breakdown with only 1 color
- **THEN** ResultsDetailView SHALL still render the per-color section layout (single section) for consistency

#### Scenario: Style without color_breakdown (legacy)
- **WHEN** calculation result has no color_breakdown on any calculation item
- **THEN** ResultsDetailView SHALL fall back to the current flat table display (no per-color sections)
