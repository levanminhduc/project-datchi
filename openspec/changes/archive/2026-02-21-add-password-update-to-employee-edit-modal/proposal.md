## Why

Admin users need to set/reset passwords for employees directly from the employee edit modal. Currently, there is no password field in the edit dialog — admins must use a separate workflow or the employee cannot log in until a password is set via the auth API. Adding an inline password field simplifies the admin workflow.

## What Changes

- Add an optional "Mật khẩu mới" (new password) field to the employee edit modal (edit mode only, not create mode)
- If the field is left empty, no password change occurs
- If a value is provided, call the existing `POST /api/auth/reset-password/:id` endpoint which hashes with bcrypt and sets `must_change_password = true`
- Add a `resetPassword` method to `employeeService.ts`
- No backend changes required — the API already exists

## Capabilities

### New Capabilities
- `admin-password-reset-in-modal`: Add inline password update field to the employee edit modal, leveraging the existing reset-password API

### Modified Capabilities

## Impact

- `src/pages/employees.vue` — add password field to FormDialog, add save logic
- `src/services/employeeService.ts` — add `resetPassword(id, password)` method
- No backend, database, or type changes needed
- Existing `POST /api/auth/reset-password/:id` endpoint is reused as-is
