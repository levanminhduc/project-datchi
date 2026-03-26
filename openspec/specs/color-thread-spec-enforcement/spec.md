## ADDED Requirements

### Requirement: Style color thread spec completeness validation
The system SHALL validate that every `style_thread_spec` has corresponding `style_color_thread_specs` entries for all garment colors of that style before weekly order calculation proceeds without warnings.

#### Scenario: Complete color specs — no warning
- **WHEN** a style has 3 garment colors (Red, Blue, Green) and a thread spec for process "May than"
- **AND** `style_color_thread_specs` has entries mapping each color to a specific thread_type_id (e.g., Red→42, Blue→43, Green→44)
- **THEN** calculation SHALL resolve each color to its color-specific thread_type_id
- **AND** no warning SHALL be generated

#### Scenario: Missing color spec — warning with fallback
- **WHEN** a style has 3 garment colors but `style_color_thread_specs` only has entries for 2 colors
- **AND** the missing color falls back to `style_thread_specs.thread_type_id` (TEX-level base type)
- **THEN** calculation SHALL proceed using the fallback thread_type_id
- **AND** a warning SHALL be included in the response: "Mã hàng {style_code}: màu {color_name} chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định"

#### Scenario: No color specs at all — all fallback with warning
- **WHEN** a style has garment colors but NO `style_color_thread_specs` entries for any of its thread specs
- **THEN** ALL colors SHALL fallback to the base `style_thread_specs.thread_type_id`
- **AND** aggregation SHALL merge them into one row per base thread_type
- **AND** a warning SHALL be generated for each missing mapping

---

### Requirement: Backfill migration for existing gaps
The system SHALL provide a database migration that populates missing `style_color_thread_specs` entries using the parent `style_thread_specs.thread_type_id` as default.

#### Scenario: Backfill creates entries for styles with colors
- **WHEN** migration runs and a `style_thread_spec` (id=5, thread_type_id=42) exists for style_id=10
- **AND** style_id=10 has 3 garment colors via `style_colors` (color_ids: 1, 2, 3)
- **AND** `style_color_thread_specs` has entry for (spec_id=5, color_id=1) but NOT for color_ids 2 and 3
- **THEN** migration SHALL INSERT entries for (spec_id=5, color_id=2, thread_type_id=42) and (spec_id=5, color_id=3, thread_type_id=42)

#### Scenario: No duplicate entries created
- **WHEN** migration runs and `style_color_thread_specs` already has an entry for a (spec_id, color_id) combo
- **THEN** migration SHALL NOT create a duplicate (ON CONFLICT DO NOTHING)

#### Scenario: Specs without active styles skipped
- **WHEN** a `style_thread_spec` belongs to a style with `deleted_at IS NOT NULL`
- **THEN** migration SHALL skip that spec

---

### Requirement: UI enforcement on style spec management
The style thread spec management UI SHALL require users to assign a color-specific thread_type for each garment color when creating or editing thread specs.

#### Scenario: Creating new thread spec for style with colors
- **WHEN** user creates a new `style_thread_spec` for a style that has garment colors defined
- **THEN** the UI SHALL display a color mapping section showing each garment color
- **AND** each color row SHALL have a thread_type selector pre-filled with the selected base thread_type
- **AND** user MUST confirm or change each mapping before saving

#### Scenario: Editing thread spec — missing colors highlighted
- **WHEN** user opens an existing thread spec that has incomplete color mappings
- **THEN** the UI SHALL highlight missing colors with a warning indicator
- **AND** user SHALL be able to fill in the missing mappings

#### Scenario: Style has no garment colors
- **WHEN** user creates a thread spec for a style that has no garment colors (style_colors is empty)
- **THEN** the color mapping section SHALL NOT appear
- **AND** only the base thread_type selection is required
