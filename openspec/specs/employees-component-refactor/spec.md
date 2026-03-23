## ADDED Requirements

### Requirement: Page header uses PageHeader component
The page header SHALL use `PageHeader` component with title="Quản Lý Nhân Viên" and actions slot containing `SearchInput` and `AppButton`.

#### Scenario: Page header renders correctly
- **WHEN** the employees page loads
- **THEN** PageHeader displays with title "Quản Lý Nhân Viên" and search input + add button in actions slot

### Requirement: Search input uses SearchInput component
The search input SHALL use `SearchInput` component with v-model binding, placeholder "Tìm kiếm nhân viên...", and debounce 300ms.

#### Scenario: Search filters employees
- **WHEN** user types in the SearchInput
- **THEN** the employee table filters by name, ID, department, or position (same behavior as before)

### Requirement: Add button uses AppButton component
The add employee button SHALL use `AppButton` with icon="add", label="Thêm Nhân Viên", and variant="filled".

#### Scenario: Add button opens form dialog
- **WHEN** user clicks the AppButton
- **THEN** the create employee FormDialog opens (unchanged behavior)

### Requirement: Table loading uses InnerLoading component
The table loading state SHALL use `InnerLoading` component with showing prop bound to loading state.

#### Scenario: Loading spinner shows during data fetch
- **WHEN** employees are being fetched
- **THEN** InnerLoading displays with spinner overlay on the table

### Requirement: Table empty state uses EmptyState component
The table empty state SHALL use `EmptyState` component with appropriate icon, title, and subtitle.

#### Scenario: Empty state with no employees
- **WHEN** there are no employees and no search query
- **THEN** EmptyState shows icon="people", title="Chưa có nhân viên nào", subtitle="Nhấn \"Thêm Nhân Viên\" để bắt đầu"

#### Scenario: Empty state with search query
- **WHEN** search returns no results
- **THEN** EmptyState shows icon="people", title="Không tìm thấy nhân viên phù hợp", no subtitle

### Requirement: Text column inline edit uses PopupEdit component
The `full_name` and `department` inline edit popups SHALL use `PopupEdit` component instead of raw `q-popup-edit` + `q-input`.

#### Scenario: Inline edit full_name
- **WHEN** user clicks on a full_name cell and edits the value
- **THEN** PopupEdit shows with save/cancel buttons, saves on confirm, reverts on error

#### Scenario: Inline edit department
- **WHEN** user clicks on a department cell and edits the value
- **THEN** PopupEdit shows with save/cancel buttons, saves on confirm

### Requirement: Chuc vu inline edit keeps raw q-popup-edit with q-select
The `chuc_vu` inline edit SHALL continue using raw `q-popup-edit` + `q-select` since PopupEdit does not support select input type.

#### Scenario: Chuc vu inline edit works unchanged
- **WHEN** user clicks on a chuc_vu cell
- **THEN** popup shows select dropdown with existing positions

### Requirement: Table action buttons use IconButton and AppTooltip
The view, edit, and delete action buttons SHALL use `IconButton` with `AppTooltip` instead of raw `q-btn` + `q-tooltip`.

#### Scenario: View button opens detail dialog
- **WHEN** user clicks the visibility IconButton
- **THEN** the detail dialog opens for that employee

#### Scenario: Edit button opens form dialog
- **WHEN** user clicks the edit IconButton
- **THEN** the edit FormDialog opens for that employee

#### Scenario: Delete button opens delete confirmation
- **WHEN** user clicks the delete IconButton
- **THEN** the delete confirmation dialog opens for that employee

### Requirement: Delete confirmation uses DeleteDialog component
The delete confirmation SHALL use `DeleteDialog` component with item-name showing employee name and ID.

#### Scenario: Delete dialog shows employee info
- **WHEN** user clicks delete on an employee
- **THEN** DeleteDialog shows with item-name="Full Name (EMP_ID)" and loading state bound

#### Scenario: Confirm delete removes employee
- **WHEN** user confirms deletion in DeleteDialog
- **THEN** employee is deleted via API (unchanged behavior)

### Requirement: Detail dialog uses AppDialog with App components
The employee detail dialog SHALL use `AppDialog` with header slot, default slot for info list, and actions slot. Internal list SHALL use `AppList` + `ListItem`. Status badge SHALL use `AppBadge`. Action buttons SHALL use `AppButton`.

#### Scenario: Detail dialog displays all employee information
- **WHEN** user opens the detail dialog for an employee
- **THEN** AppDialog shows with employee ID in header, 7 info items (ID, name, department, position, status, created, updated), and edit/close buttons

#### Scenario: Status badge shows correct state
- **WHEN** employee is active
- **THEN** AppBadge shows color="positive" label="Đang hoạt động"

#### Scenario: Status badge shows inactive
- **WHEN** employee is inactive
- **THEN** AppBadge shows color="negative" label="Ngừng hoạt động"

#### Scenario: Edit from detail opens form dialog
- **WHEN** user clicks "Chỉnh sửa" AppButton in detail dialog
- **THEN** detail dialog closes and edit FormDialog opens

### Requirement: Inline edit loading uses AppSpinner
The inline edit loading indicators SHALL use `AppSpinner` instead of raw `q-spinner-dots`.

#### Scenario: Spinner shows during inline save
- **WHEN** an inline edit is being saved
- **THEN** AppSpinner shows in the cell with size="sm" and color="primary"
