## ADDED Requirements

### Requirement: Issue detail page displays issue information
The system SHALL display full issue details at route `/thread/issues/v2/:id`.

#### Scenario: View issue header information
- **WHEN** user navigates to `/thread/issues/v2/123`
- **THEN** system displays issue header with: Mã Phiếu, Bộ Phận, Người Tạo, Ngày Tạo, Trạng Thái
- **AND** status is shown using IssueV2StatusBadge component

#### Scenario: Issue not found
- **WHEN** user navigates to `/thread/issues/v2/999` and issue does not exist
- **THEN** system displays "Không tìm thấy phiếu xuất" message
- **AND** shows button to return to history page

### Requirement: Issue detail displays line items
The system SHALL display all line items of the issue in a table.

#### Scenario: View line items table
- **WHEN** user views issue detail
- **THEN** system displays lines table with columns: Loại Chỉ, Đơn Hàng (PO/Style/Color), Định Mức, Đã Xuất (ng + le), Đã Trả (ng + le), Trạng Thái
- **AND** lines are sorted by created_at ascending

#### Scenario: Line over quota indicator
- **WHEN** a line has is_over_quota = true
- **THEN** system displays warning badge "Vượt ĐM"
- **AND** shows over_quota_notes if available

#### Scenario: Line under quota indicator
- **WHEN** a line has remaining quota > 0
- **THEN** system displays info badge "Còn X cuộn"

### Requirement: Issue detail navigation
The system SHALL provide back navigation to history page.

#### Scenario: Navigate back to history
- **WHEN** user clicks back button or "Quay lại danh sách" link
- **THEN** system navigates to `/thread/issues/v2/history`

### Requirement: Issue detail loading state
The system SHALL display loading indicator while fetching issue data.

#### Scenario: Loading state
- **WHEN** issue data is being fetched
- **THEN** system displays loading spinner
- **AND** hides content sections

#### Scenario: Loading complete
- **WHEN** issue data fetch completes successfully
- **THEN** system hides loading spinner
- **AND** displays issue information and lines
