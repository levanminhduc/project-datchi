## Context

The app uses `must_change_password` flag on the `employees` table. When an admin resets a password, this flag is set to `true`. On login, the backend returns `mustChangePassword` in the response. Currently, `useAuth.signIn()` attempts `router.push('/change-password')` but:
1. The page doesn't exist (404)
2. `login.vue`'s `handleLogin()` immediately overwrites with `router.push('/')`, creating a race condition

Existing infrastructure:
- `FormDialog.vue` — reusable dialog wrapper with `persistent` prop, submit/cancel actions
- `useAuth().changePassword()` — calls `POST /api/auth/change-password`, clears the flag
- `ChangePasswordData` type — `{ currentPassword, newPassword, confirmPassword }`
- `App.vue` — single layout entry point, mounts sidebar/header conditionally

## Goals / Non-Goals

**Goals:**
- Force employees to change password when `mustChangePassword` is true via a persistent modal
- Modal cannot be dismissed — user must complete the form
- Use existing `FormDialog` pattern and `useAuth().changePassword()` API
- Fix the redirect race condition in login flow

**Non-Goals:**
- Password strength meter or complexity validation beyond backend's min 8 chars
- "Forgot password" self-service flow (stays admin-reset only)
- Changing the backend API or database schema
- Router guard enforcement for `mustChangePassword` (modal approach makes this unnecessary)

## Decisions

### 1. Modal in App.vue vs. Dedicated Page

**Choice: Modal in App.vue**

Rationale: A persistent modal at App.vue level is simpler — no new route needed, no router guard needed, works on any page the user lands on. The modal watches `employee.mustChangePassword` and shows automatically. Since it's persistent (no close button, no backdrop dismiss), the user cannot interact with the app until they change the password.

Alternative considered: Dedicated `/change-password` page with router guard. Rejected because it requires creating a new page, adding a router guard, handling edge cases (direct navigation, back button), and the user specifically requested a modal approach.

### 2. Mount Point: App.vue

**Choice: Add `ChangePasswordModal` directly in App.vue template**

The modal's visibility is driven by a computed: `employee?.mustChangePassword === true && isAuthenticated`. This ensures:
- Shows immediately after login when flag is true
- Shows on page refresh if flag is still true (via `useAuth().init()`)
- Hides automatically when `changePassword()` succeeds and clears the flag

### 3. Form Fields: 3 fields (current + new + confirm)

**Choice: Keep all 3 fields**

The existing `POST /api/auth/change-password` API requires `currentPassword`. Since the user just logged in with their temporary password, they know it. Keeping current password field is simpler (no API change) and more secure (confirms the user is who they say they are).

### 4. After Successful Change: Stay on current page

**Choice: Close modal, show success snackbar, continue using app**

`useAuth().changePassword()` already sets `mustChangePassword = false` in state and shows a snackbar. The modal's computed will reactively hide it. No redirect needed.

Note: The backend revokes all refresh tokens on password change, but the current session's access token remains valid until expiry. This is acceptable behavior.

## Risks / Trade-offs

- [Race condition on login] → Fix by checking `mustChangePassword` in `login.vue` before calling `router.push`. If true, don't push — let the modal in App.vue handle it.
- [Modal shows briefly on page load if flag is true] → The `isLoading` check in the computed prevents this — modal only shows after auth init completes.
- [User refreshes mid-modal] → Auth reinitializes, flag is still true in DB, modal shows again. Correct behavior.
