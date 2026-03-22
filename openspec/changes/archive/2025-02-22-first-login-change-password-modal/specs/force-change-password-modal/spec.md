## ADDED Requirements

### Requirement: Persistent change password modal
The system SHALL display a persistent modal dialog forcing the employee to change their password when `mustChangePassword` flag is true. The modal MUST NOT be dismissible — no close button, no backdrop click, no Escape key.

#### Scenario: Modal appears after first login with temporary password
- **WHEN** employee logs in and `mustChangePassword` is `true` in the auth response
- **THEN** system displays a persistent modal with title "Đổi mật khẩu", containing fields for current password, new password, and confirm password

#### Scenario: Modal appears on page refresh with flag still true
- **WHEN** employee refreshes the page while `mustChangePassword` is still `true`
- **THEN** system re-displays the persistent modal after auth initialization completes

#### Scenario: Modal does not appear for normal users
- **WHEN** employee logs in and `mustChangePassword` is `false`
- **THEN** system does NOT display the change password modal

### Requirement: Password change form validation
The system SHALL validate the change password form before submission.

#### Scenario: All fields required
- **WHEN** employee submits the form with any empty field
- **THEN** system shows validation error "Trường này là bắt buộc" on the empty field(s)

#### Scenario: Password minimum length
- **WHEN** employee enters a new password shorter than 8 characters
- **THEN** system shows validation error "Mật khẩu phải có ít nhất 8 ký tự"

#### Scenario: Password confirmation mismatch
- **WHEN** employee enters different values in new password and confirm password fields
- **THEN** system shows validation error "Mật khẩu xác nhận không khớp"

### Requirement: Successful password change dismisses modal
The system SHALL close the modal and allow normal app usage after a successful password change.

#### Scenario: Successful change
- **WHEN** employee submits valid current password, new password, and matching confirmation
- **THEN** system calls `POST /api/auth/change-password`, sets `mustChangePassword` to `false`, closes the modal, and shows success snackbar "Đổi mật khẩu thành công"

#### Scenario: API error on change
- **WHEN** the change password API returns an error (e.g., wrong current password)
- **THEN** system displays the error message from the API and keeps the modal open

### Requirement: Login redirect fix
The system SHALL NOT redirect to `router.push('/')` when `mustChangePassword` is `true` after login.

#### Scenario: Login with mustChangePassword true
- **WHEN** employee logs in and `mustChangePassword` is `true`
- **THEN** `login.vue` does NOT call `router.push('/')` — the modal in App.vue handles the password change flow

#### Scenario: Login with mustChangePassword false
- **WHEN** employee logs in and `mustChangePassword` is `false`
- **THEN** `login.vue` redirects to the intended page or `/` as normal
