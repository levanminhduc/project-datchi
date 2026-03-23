## ADDED Requirements

### Requirement: Check week name existence
The system SHALL provide an API endpoint to check if a week name already exists in the database.

#### Scenario: Week name does not exist
- **WHEN** client calls `GET /api/weekly-orders/check-name?name=Week%2010` with a name that does not exist
- **THEN** system returns `{ data: { exists: false }, error: null }`

#### Scenario: Week name exists
- **WHEN** client calls `GET /api/weekly-orders/check-name?name=Week%2010` with a name that already exists
- **THEN** system returns `{ data: { exists: true, week: { id: number, week_name: string, status: string } }, error: null }`

#### Scenario: Empty name parameter
- **WHEN** client calls `GET /api/weekly-orders/check-name` without name parameter
- **THEN** system returns `400` with `{ data: null, error: "Thiếu tên tuần" }`

### Requirement: Frontend duplicate name check on blur
The system SHALL check for duplicate week names when user blurs the week name input field.

#### Scenario: Name is unique
- **WHEN** user enters a new week name and blurs the input
- **AND** the name does not exist in database
- **THEN** no dialog is shown, user can proceed normally

#### Scenario: Name already exists - user chooses to load
- **WHEN** user enters a week name that already exists and blurs the input
- **THEN** system shows a confirmation dialog with message "Tuần [name] đã tồn tại"
- **AND** dialog has two options: "Tải và cập nhật" and "Đổi tên mới"
- **WHEN** user clicks "Tải và cập nhật"
- **THEN** system loads the existing week data into the UI (replacing current data)
- **AND** selectedWeek is set to the loaded week

#### Scenario: Name already exists - user chooses to rename
- **WHEN** user enters a week name that already exists and blurs the input
- **AND** dialog is shown
- **WHEN** user clicks "Đổi tên mới"
- **THEN** dialog closes
- **AND** focus returns to the week name input

#### Scenario: Self-match bypass (editing current week)
- **WHEN** user is editing an existing week (selectedWeek is set)
- **AND** user blurs the week name input without changing the name
- **AND** the check returns the same week id as selectedWeek.id
- **THEN** no dialog is shown, user proceeds normally

#### Scenario: Blur check API failure (graceful degradation)
- **WHEN** user blurs the week name input
- **AND** the check-name API call fails (network error, timeout, 5xx)
- **THEN** no error toast is shown
- **AND** user proceeds normally (save-time validation will catch duplicates)

### Requirement: Save button in Result Actions
The system SHALL display the "Lưu tuần" button in the Result Actions area, positioned before the "Xác nhận tuần" button.

#### Scenario: Button position and visibility
- **WHEN** user has calculation results displayed
- **THEN** Result Actions area shows buttons in order: [Lưu tuần] [Xác nhận tuần] [Xuất Excel]

#### Scenario: Save button disabled without results
- **WHEN** user has not run calculation (hasResults = false)
- **THEN** "Lưu tuần" button is disabled

#### Scenario: Save button enabled with results
- **WHEN** user has run calculation (hasResults = true)
- **THEN** "Lưu tuần" button is enabled

### Requirement: Enable confirm after save
The system SHALL enable the "Xác nhận tuần" button immediately after saving a new week, without requiring a reload.

#### Scenario: Confirm enabled after creating new week
- **WHEN** user creates a new week by clicking "Lưu tuần"
- **AND** save is successful
- **THEN** selectedWeek is set to the newly created week
- **AND** resultsSaved is set to true
- **AND** "Xác nhận tuần" button is enabled

#### Scenario: Confirm enabled after updating existing week
- **WHEN** user updates an existing week by clicking "Lưu tuần"
- **AND** save is successful
- **THEN** selectedWeek remains set to the updated week
- **AND** resultsSaved is set to true
- **AND** "Xác nhận tuần" button is enabled (unless status is already CONFIRMED)

#### Scenario: Confirm button on CONFIRMED week
- **WHEN** selectedWeek has status = CONFIRMED
- **THEN** "Xác nhận tuần" button is disabled
- **AND** user can still edit and save
- **AND** after saving, status remains CONFIRMED, confirm button stays disabled
- **NOTE**: Re-confirmation requires separate status change action (future enhancement)
