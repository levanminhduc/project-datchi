## Why

When an admin resets an employee's password, `must_change_password` is set to `true`. On next login, `useAuth.signIn()` calls `router.push('/change-password')` — but the page doesn't exist (404). Additionally, `login.vue`'s `handleLogin()` immediately overwrites this redirect with `router.push('/')`, so even if the page existed, the user would never reach it. Employees can skip password change entirely and use the app with a temporary password — a security gap.

The user wants a **persistent modal** instead of a separate page, so the password change is unavoidable and doesn't require a dedicated route.

## What Changes

- Remove `router.push('/change-password')` from `useAuth.signIn()` — no longer redirect to a non-existent page
- Create `ChangePasswordModal.vue` component using existing `FormDialog` pattern — persistent modal with new password + confirm password fields
- Mount the modal in `App.vue` — watches `employee.mustChangePassword` flag, shows modal immediately when true
- Fix `login.vue` redirect race condition — skip `router.push('/')` when `mustChangePassword` is true (let the modal handle it)

## Capabilities

### New Capabilities
- `force-change-password-modal`: Persistent modal that forces employees to change their password when `mustChangePassword` flag is true. Cannot be dismissed. Calls existing `POST /api/auth/change-password` API.

### Modified Capabilities

## Impact

- `src/composables/useAuth.ts` — remove `/change-password` redirect logic
- `src/App.vue` — add ChangePasswordModal component
- `src/pages/login.vue` — fix redirect to not override when mustChangePassword is true
- `src/components/` — new ChangePasswordModal.vue component
- No backend changes needed — existing API and DB schema fully support this
