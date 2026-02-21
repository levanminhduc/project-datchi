## Context

The employee edit modal in `src/pages/employees.vue` currently has four fields: employee_id, full_name, department, chuc_vu. There is no way for admins to set or reset an employee's password from this modal.

A backend endpoint already exists at `POST /api/auth/reset-password/:id` that accepts `{ newPassword }`, hashes it with bcrypt (cost 12), updates `password_hash`, and sets `must_change_password = true`. This endpoint requires admin authentication.

## Goals / Non-Goals

**Goals:**
- Allow admins to set/reset an employee's password directly from the edit modal
- Reuse the existing reset-password API endpoint (no backend changes)
- Keep the password field optional — empty means no change

**Non-Goals:**
- Adding password confirmation field (explicitly excluded per user decision)
- Adding password to the create employee flow
- Changing backend password hashing logic or `must_change_password` behavior
- Adding password strength validation (beyond what exists)

## Decisions

**Decision 1: Reuse existing `POST /api/auth/reset-password/:id`**
- Rationale: Endpoint already handles bcrypt hashing, `must_change_password` flag, and admin auth check. No reason to duplicate logic.
- Alternative: Add password to `PUT /api/employees/:id` — rejected because it would mix employee CRUD with auth concerns.

**Decision 2: Separate API call for password (not bundled with employee update)**
- When saving, if password field has a value: call `resetPassword()` AFTER the employee update succeeds.
- Rationale: Keeps the two concerns independent. Employee update and password reset are different operations on different endpoints.

**Decision 3: Password field only visible in edit mode**
- New employees are created without a password. Password can only be set after the employee exists (needs an ID for the reset-password endpoint).

## Risks / Trade-offs

- [Two API calls on save] If employee update succeeds but password reset fails, user sees a partial success. → Mitigation: Show specific error message for password failure while still keeping the employee update.
- [No password confirmation] User might mistype the password. → Accepted trade-off per user decision. The `must_change_password` flag ensures the employee will set their own password on first login.
