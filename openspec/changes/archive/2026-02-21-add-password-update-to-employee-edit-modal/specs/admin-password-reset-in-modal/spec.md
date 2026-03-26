## ADDED Requirements

### Requirement: Password field in employee edit modal
The employee edit modal SHALL display an optional "Mật khẩu mới" password input field when in edit mode. The field SHALL NOT appear in create mode. The field SHALL use `type="password"` to mask input.

#### Scenario: Edit mode shows password field
- **WHEN** admin opens the employee edit modal in edit mode
- **THEN** a "Mật khẩu mới" password field is visible below the existing form fields

#### Scenario: Create mode hides password field
- **WHEN** admin opens the employee modal in create mode
- **THEN** no password field is displayed

### Requirement: Password update on save
When the password field contains a value and the admin saves the form, the system SHALL call `POST /api/auth/reset-password/:id` with the entered password. The password update SHALL occur after the employee data update succeeds.

#### Scenario: Save with password value
- **WHEN** admin enters a password in the "Mật khẩu mới" field and clicks save
- **THEN** system first updates employee data via `PUT /api/employees/:id`
- **THEN** system calls `POST /api/auth/reset-password/:id` with `{ newPassword }`
- **THEN** system shows success message "Cập nhật nhân viên thành công"

#### Scenario: Save without password value
- **WHEN** admin leaves the password field empty and clicks save
- **THEN** system only updates employee data via `PUT /api/employees/:id`
- **THEN** no password reset API call is made

#### Scenario: Employee update succeeds but password reset fails
- **WHEN** employee data update succeeds but password reset API returns an error
- **THEN** system shows error message for the password failure
- **THEN** employee data changes are preserved (not rolled back)

### Requirement: Password field clears on modal open
The password field SHALL be cleared every time the edit modal is opened, regardless of previous state.

#### Scenario: Reopen modal clears password
- **WHEN** admin previously entered a password, closed the modal, and reopens it for the same or different employee
- **THEN** the password field is empty
