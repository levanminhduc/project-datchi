## ADDED Requirements

### Requirement: Assignment control dialog component
The system SHALL provide `AssignmentControlDialog.vue` component that displays assignment summary in a QDialog.

#### Scenario: Dialog opens from index page
- **WHEN** user clicks "Kiểm soát chỉ đã gán" button on Weekly Order index page
- **THEN** dialog opens with assignment summary table

#### Scenario: Dialog closes
- **WHEN** user clicks X button or presses Escape
- **THEN** dialog closes

### Requirement: Dialog layout
The dialog SHALL display:
- Header: "Kiểm Soát Chỉ Đã Gán Theo Tuần" with close button
- Filter: Week status dropdown (DRAFT, CONFIRMED, COMPLETED, CANCELLED)
- Table: QTable with columns (Tuần, Loại chỉ, Planned, Reserved, Allocated, Gap)
- Footer: Total count summary

#### Scenario: Responsive sizing
- **WHEN** viewport width >= 800px
- **THEN** dialog width is 800px

- **WHEN** viewport width < 800px
- **THEN** dialog is full-width

### Requirement: Data display
The table SHALL show one row per week-threadType combination.

#### Scenario: Gap display with negative value
- **WHEN** gap value is negative (reserved < planned)
- **THEN** gap cell displays red text with negative number (e.g., "-5")

#### Scenario: Gap display with zero or positive value
- **WHEN** gap value is >= 0
- **THEN** gap cell displays normal text

### Requirement: Loading state
The component SHALL show QTable built-in loading spinner while fetching data.

#### Scenario: Loading indicator
- **WHEN** API request is in progress
- **THEN** QTable shows loading spinner below header row

### Requirement: Empty state
The component SHALL show empty message when no data is available.

#### Scenario: No data
- **WHEN** API returns empty array
- **THEN** table shows "Chưa có tuần đặt hàng nào được xác nhận"

### Requirement: Week status filter
The component SHALL allow filtering by week status.

#### Scenario: Filter change triggers refresh
- **WHEN** user selects different status from dropdown
- **THEN** component fetches data with new status filter
- **THEN** table updates to show filtered results

### Requirement: Refresh capability
The component SHALL provide manual refresh.

#### Scenario: Refresh button
- **WHEN** user clicks refresh button
- **THEN** component re-fetches current data with existing filter
