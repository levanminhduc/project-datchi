## ADDED Requirements

### Requirement: Persistent display order column
The system SHALL store a `display_order` INTEGER column in `style_thread_specs` table to control row display order.

#### Scenario: Column exists with correct properties
- **WHEN** querying table schema for style_thread_specs
- **THEN** column `display_order` exists with type INTEGER NOT NULL DEFAULT 0

#### Scenario: Index exists for efficient ordering
- **WHEN** querying indexes on style_thread_specs
- **THEN** index `idx_style_thread_specs_display_order` exists on (style_id, display_order)

### Requirement: API returns specs ordered by display_order
The system SHALL return style_thread_specs ordered by `display_order ASC` (lower value = higher in list).

#### Scenario: GET specs returns ordered by display_order
- **WHEN** client calls `GET /api/style-thread-specs?style_id=123`
- **THEN** response data is ordered by display_order ascending
- **AND** row with display_order=0 appears first

### Requirement: Create spec with position preference
The system SHALL support `add_to_top` parameter when creating new spec to control insertion position.

#### Scenario: Add new spec to top (add_to_top=true)
- **WHEN** client POSTs to `/api/style-thread-specs` with `add_to_top: true`
- **THEN** new row is created with `display_order = 0`
- **AND** all existing rows for same style_id have their display_order incremented by 1

#### Scenario: Add new spec to bottom (add_to_top=false or omitted)
- **WHEN** client POSTs to `/api/style-thread-specs` without `add_to_top` or with `add_to_top: false`
- **THEN** new row is created with `display_order = MAX(existing display_order) + 1`
- **AND** existing rows are not modified

#### Scenario: First spec for a style
- **WHEN** client POSTs to `/api/style-thread-specs` for a style with no existing specs
- **THEN** new row is created with `display_order = 0` regardless of add_to_top value

### Requirement: Frontend sends position preference
The system SHALL send `add_to_top` flag based on user's toggle preference stored in localStorage.

#### Scenario: Toggle OFF sends add_to_top=false
- **WHEN** user has toggle "Thêm đầu bảng" set to OFF
- **AND** user clicks "Thêm định mức"
- **THEN** POST request includes `add_to_top: false`
- **AND** new row appears at bottom of table after refetch

#### Scenario: Toggle ON sends add_to_top=true
- **WHEN** user has toggle "Thêm đầu bảng" set to ON
- **AND** user clicks "Thêm định mức"
- **THEN** POST request includes `add_to_top: true`
- **AND** new row appears at top of table after refetch

#### Scenario: Order persists after page refresh
- **WHEN** user adds a row with toggle OFF (bottom)
- **AND** user refreshes the page
- **THEN** row remains at bottom position (order unchanged)

### Requirement: Migration preserves existing order
The system SHALL assign display_order to existing rows preserving their current visual order.

#### Scenario: Existing rows get sequential display_order
- **WHEN** migration runs on table with existing data
- **THEN** rows are assigned display_order based on created_at DESC order
- **AND** newest row (currently at top) gets display_order=0
- **AND** oldest row gets highest display_order value
