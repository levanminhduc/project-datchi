## ADDED Requirements

### Requirement: Issue list page displays all issues
The system SHALL display a paginated table of all Issue V2 tickets at route `/thread/issues/v2/history`.

#### Scenario: User views issue history
- **WHEN** user navigates to `/thread/issues/v2/history`
- **THEN** system displays a table with columns: Mã Phiếu, Bộ Phận, Số Dòng, Trạng Thái, Ngày Tạo, Người Tạo
- **AND** issues are sorted by created_at descending (newest first)
- **AND** pagination shows 20 items per page by default

#### Scenario: Empty state when no issues
- **WHEN** user views issue history and no issues exist
- **THEN** system displays EmptyState with message "Chưa có phiếu xuất nào"

### Requirement: Issue list supports filtering
The system SHALL allow users to filter issues by status, date range, and department.

#### Scenario: Filter by status
- **WHEN** user selects status "CONFIRMED" from status filter
- **THEN** system displays only issues with status CONFIRMED
- **AND** table updates immediately

#### Scenario: Filter by date range
- **WHEN** user selects "Từ ngày" as 01/02/2026 and "Đến ngày" as 28/02/2026
- **THEN** system displays only issues created within that date range

#### Scenario: Clear filters
- **WHEN** user clicks "Xóa" filter button
- **THEN** all filters are reset to default (show all)
- **AND** table shows all issues

### Requirement: Issue list row navigation
The system SHALL navigate to issue detail page when user clicks a row.

#### Scenario: Navigate to detail
- **WHEN** user clicks on a row in the issues table
- **THEN** system navigates to `/thread/issues/v2/{issue.id}`

### Requirement: Status badge displays correct state
The system SHALL display issue status using IssueV2StatusBadge component with appropriate colors.

#### Scenario: Draft status display
- **WHEN** issue has status DRAFT
- **THEN** badge displays "Nháp" with grey color

#### Scenario: Confirmed status display
- **WHEN** issue has status CONFIRMED
- **THEN** badge displays "Đã xác nhận" with positive (green) color

#### Scenario: Returned status display
- **WHEN** issue has status RETURNED
- **THEN** badge displays "Đã nhập lại" with info (blue) color

### Requirement: Quick navigation to create page
The system SHALL provide a button to navigate to the create issue page.

#### Scenario: Navigate to create
- **WHEN** user clicks "Tạo Phiếu Xuất" button
- **THEN** system navigates to `/thread/issues/v2`
