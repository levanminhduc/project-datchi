## ADDED Requirements

### Requirement: Week accordion layout
The history page SHALL display weeks as expandable accordion rows. Each collapsed row shows week name, creator, date, status badge, and total SP.

#### Scenario: Page loads with collapsed weeks
- **WHEN** user navigates to history page
- **THEN** all weeks are displayed collapsed showing summary info (week name, created_by, created_at, status chip, total_quantity)

#### Scenario: User expands a week
- **WHEN** user clicks on a week row
- **THEN** the row expands to show items grouped by PO → Style → Color with progress bars

#### Scenario: User collapses a week
- **WHEN** user clicks on an expanded week row
- **THEN** the row collapses back to summary view

### Requirement: PO progress bar display
Each style within an expanded week SHALL show a visual progress bar indicating PO fulfillment.

#### Scenario: Normal progress (0-79%)
- **WHEN** `progress_pct` is between 0 and 79
- **THEN** progress bar uses primary color (blue)

#### Scenario: Warning progress (80-99%)
- **WHEN** `progress_pct` is between 80 and 99
- **THEN** progress bar uses warning color (orange/amber)

#### Scenario: Complete progress (100%)
- **WHEN** `progress_pct` equals 100
- **THEN** progress bar uses positive color (green)

#### Scenario: Over-ordered (>100%)
- **WHEN** `progress_pct` exceeds 100
- **THEN** progress bar uses negative color (red) and bar is capped at 100% width

#### Scenario: Progress text display
- **WHEN** a style has `total_ordered: 3000`, `po_quantity: 5000`, `progress_pct: 60`
- **THEN** text shows "3.000 / 5.000 SP (60%)" formatted with Vietnamese locale

### Requirement: Color breakdown within style
Each style SHALL list its individual color entries with quantity.

#### Scenario: Style with multiple colors
- **WHEN** style ST-001 has Đỏ (500 SP) and Xanh (300 SP)
- **THEN** each color is displayed with a color dot (using hex_code), color name, and quantity

### Requirement: Quantity breakdown labels
Each style SHALL show three breakdown lines: this week quantity, previously ordered quantity, and remaining quantity.

#### Scenario: Breakdown display
- **WHEN** `this_week_quantity: 1000`, `total_ordered: 3000`, `po_quantity: 5000`
- **THEN** display shows "Tuần này: 1.000 SP", "Đã đặt trước đó: 2.000 SP", "Còn lại: 2.000 SP"

### Requirement: Status filter
The filter bar SHALL include a status dropdown defaulting to hide CANCELLED weeks.

#### Scenario: Default filter state
- **WHEN** page loads
- **THEN** status filter shows "Tất cả (trừ đã hủy)" as default, CANCELLED weeks are excluded

#### Scenario: User selects specific status
- **WHEN** user selects "Đã xác nhận" from status dropdown
- **THEN** only CONFIRMED weeks are shown

#### Scenario: User selects "Tất cả"
- **WHEN** user selects "Tất cả" option
- **THEN** all weeks including CANCELLED are shown (status param = ALL)

### Requirement: Pagination
The page SHALL use server-side pagination for weeks.

#### Scenario: Navigate pages
- **WHEN** user clicks page 2
- **THEN** system fetches `?page=2` and displays the next set of weeks

### Requirement: Excel export
The page SHALL support exporting visible data to Excel, preserving the grouped structure.

#### Scenario: Export with data
- **WHEN** user clicks "Xuất Excel" with data loaded
- **THEN** system exports an .xlsx file with rows grouped by week, including PO progress info

### Requirement: Loading states
The page SHALL show appropriate loading indicators.

#### Scenario: Initial load
- **WHEN** page is loading data
- **THEN** a loading spinner/skeleton is shown

#### Scenario: Empty state
- **WHEN** no weeks match the current filters
- **THEN** an empty state message is shown
