## ADDED Requirements

### Requirement: Auto-display all active style colors in grid
The system SHALL automatically display ALL active style_colors for the current style in the color specs grid when at least one style_thread_spec exists. No manual "add color" step SHALL be required.

#### Scenario: Style with 9 active colors and 2 specs
- **WHEN** user navigates to "Định Mức Màu" tab for a style with 9 active colors and 2 thread specs
- **THEN** the grid MUST display 9 color groups, each containing 2 spec rows (one per thread spec)

#### Scenario: Style with no specs
- **WHEN** user navigates to "Định Mức Màu" tab for a style with 0 thread specs
- **THEN** the system MUST show empty state message directing user to create specs in "Định mức chỉ" tab first

#### Scenario: Style with specs but no colors
- **WHEN** user navigates to "Định Mức Màu" tab for a style with specs but 0 active style_colors
- **THEN** the system MUST show empty state with option to create a new color

#### Scenario: Color has no DB record yet
- **WHEN** a style_color has no corresponding `style_color_thread_specs` record in the DB
- **THEN** the color group MUST still display with empty thread color cells (showing "Chọn màu chỉ" placeholder)

#### Scenario: Inactive colors excluded
- **WHEN** a style_color has `is_active = false`
- **THEN** it MUST NOT appear in the color specs grid

### Requirement: Remove manual color-adding workflow
The system SHALL NOT require a "Thêm màu hàng" dialog to add existing style_colors to the view. The only color creation action SHALL be "Tạo màu hàng mới" which creates a new `style_color` record in the database.

#### Scenario: User wants to assign thread color to existing style color
- **WHEN** user opens "Định Mức Màu" tab
- **THEN** all active colors are already visible and user can directly select thread colors without any add step

#### Scenario: User needs a new color not yet in the system
- **WHEN** user clicks "Tạo màu hàng mới"
- **THEN** a form appears to create a new style_color (with sub-art prefix if applicable)
- **AND** after creation the new color automatically appears in the grid

### Requirement: Persist thread_type_id when selecting thread color
When user selects a thread color for a color spec row, the system SHALL resolve and persist the `thread_type_id` along with `thread_color_id`. The `thread_type_id` SHALL default to the parent spec's `thread_type_id` (TEX-level type).

#### Scenario: User selects thread color for a new color spec (no DB record)
- **WHEN** user selects a thread color for a color/spec combination that has no existing DB record
- **THEN** the system MUST call POST with both `thread_color_id` and `thread_type_id` (from parent spec)
- **AND** the DB record MUST have non-null `thread_type_id`

#### Scenario: User changes thread color for existing color spec
- **WHEN** user changes the thread color for a color/spec combination that already has a DB record
- **THEN** the system MUST call PUT with both `thread_color_id` and `thread_type_id`
- **AND** the DB record MUST retain non-null `thread_type_id`

#### Scenario: User clears thread color
- **WHEN** user clears (sets to null) the thread color for an existing color spec
- **THEN** the system MUST call PUT with `thread_color_id: null`
- **AND** `thread_type_id` SHALL remain as-is (keep the parent spec's type)

### Requirement: Remove unmapped colors warning
The system SHALL NOT display an "unmapped colors" warning banner. Since all active colors auto-display, the concept of unmapped colors is obsolete.

#### Scenario: Colors without DB records
- **WHEN** some active style_colors have no `style_color_thread_specs` records
- **THEN** no warning banner MUST be displayed
- **AND** the colors MUST appear in the grid with empty thread color cells
