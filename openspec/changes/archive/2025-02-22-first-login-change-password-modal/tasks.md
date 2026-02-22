## 1. Create ChangePasswordModal Component

- [x] 1.1 Create `src/components/auth/ChangePasswordModal.vue` using `FormDialog` with `persistent` prop, hide close button (`v-close-popup` removed), no cancel button — user MUST change password
- [x] 1.2 Add 3 password fields using `q-input` with `type="password"` and toggle visibility icon (same pattern as `login.vue` line 37-55): current password, new password, confirm password. Note: `q-input` is acceptable here because `AppInput` lacks password toggle slot pattern
- [x] 1.3 Add validation rules: required (`Trường này là bắt buộc`), min 8 chars (`Mật khẩu phải có ít nhất 8 ký tự`), confirm match (`Mật khẩu xác nhận không khớp`) — all messages in Vietnamese per project conventions
- [x] 1.4 Wire form submit to `useAuth().changePassword()` with loading state via ref (not `useLoading` since auth composable handles its own loading). On success: emit `changed` event. On error: show API error via `useSnackbar().error()` ← (verify: form validation works for all spec scenarios, API error displays correctly, modal stays open on error)

## 2. Mount Modal in App.vue

- [x] 2.1 Import `useAuth` in `App.vue`, add computed `showChangePasswordModal`: `employee?.mustChangePassword === true && isAuthenticated` (no isLoading check needed — modal should show whenever flag is true after auth init)
- [x] 2.2 Add `<ChangePasswordModal v-model="showChangePasswordModal" @changed="onPasswordChanged" />` to template. `onPasswordChanged` navigates to `/` if on login page ← (verify: modal reactivity — shows on login, hides on success, shows on page refresh if flag still true)

## 3. Fix Login Redirect Race Condition

- [x] 3.1 In `useAuth.ts` line 131-133: remove `router.push('/change-password')` block — modal in App.vue handles it now. Keep the `if` check but just return true without redirect
- [x] 3.2 In `login.vue` line 123-133: check `employee.mustChangePassword` after `signIn()` returns — if true, do NOT call `router.push(redirect || '/')`. Access employee from `useAuth()` composable ← (verify: login with mustChangePassword=true does NOT redirect and shows modal, login with mustChangePassword=false redirects normally to `/`)
