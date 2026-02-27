# Tasks: Auth Token Refresh Fix

## 1. Supabase Client Config

- [x] 1.1 Update `src/lib/supabase.ts`: Add explicit auth config with `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`

## 2. Auth Initialization Flow

- [x] 2.1 Update `src/composables/useAuth.ts` `init()`: Move `setupAuthListener()` call to the BEGINNING of init (before any other logic)
- [x] 2.2 Update `src/composables/useAuth.ts` `init()`: Replace `supabase.auth.getSession()` with `supabase.auth.getUser()` to validate and trigger refresh
- [x] 2.3 Update `src/composables/useAuth.ts` `init()`: Handle `getUser()` error - only logout if error is auth-related (invalid_grant, session_not_found, etc.), NOT on network errors. If auth error, call `supabase.auth.signOut({ scope: 'local' })` then `resetState()` and return early. On network error, just `resetState()` without signOut.

## 3. API Retry Logic with Single-Flight Refresh (Centralized Logout)

- [x] 3.1 Update `src/services/api.ts`: Create module-level variables:
  - `let refreshPromise: Promise<Session | null> | null = null`
  - `let isLoggingOut = false` (prevent duplicate signOut)
- [x] 3.2 Update `src/services/api.ts`: Create `async function getRefreshedSession()` that:
  - If `refreshPromise` exists, await and return it (single-flight)
  - Otherwise, create new promise calling `supabase.auth.refreshSession()`
  - On success: store session, set `refreshPromise = null`, return session
  - On UNRECOVERABLE auth error (invalid_grant, refresh_token_revoked):
    - If `!isLoggingOut`: set `isLoggingOut = true`, call `supabase.auth.signOut({ scope: 'local' })`
    - Throw error with message "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
  - On RECOVERABLE error (network): set `refreshPromise = null`, throw with message "Lỗi kết nối, vui lòng thử lại" (DON'T signOut)
- [x] 3.3 Update `src/services/api.ts` `fetchApi()`: When receiving 401, call `getRefreshedSession()` and retry ONCE. Let errors from `getRefreshedSession()` propagate (don't call signOut here - it's centralized in 3.2)
- [x] 3.4 Export `getRefreshedSession()` from `api.ts` for use by other auth fetch helpers
- [x] 3.5 Add `export function resetLogoutFlag() { isLoggingOut = false }` - call this in useAuth after successful login

## 4. Auth Service - Unify Auth Request Path

- [x] 4.1 Update `src/services/authService.ts` `fetchCurrentEmployee()`: Keep using `getSession()` for token retrieval, rely on 401 retry with `getRefreshedSession()` for validation (calling `getUser()` before every fetch is redundant when retry handles stale tokens)
- [x] 4.2 Update `src/services/authService.ts` `authenticatedFetch()`: Add same retry logic - on 401, call `getRefreshedSession()` from api.ts and retry ONCE
- [x] 4.3 Update `src/services/authService.ts` `authenticatedFetch()`: Let errors from `getRefreshedSession()` propagate (centralized handling already done). Errors will have appropriate Vietnamese messages based on error type.

## 5. Token Refresh Handler

- [x] 5.1 Update `src/composables/useAuth.ts` `setupAuthListener()`: In TOKEN_REFRESHED handler, also refresh permissions (call `authService.fetchPermissions()`)
- [x] 5.2 Update `src/composables/useAuth.ts` `setupAuthListener()`: Update `state.value.permissions` and `state.value.isRoot` after refreshing permissions

## 6. Login Flow Integration

- [x] 6.1 Update `src/composables/useAuth.ts` `signIn()`: After successful login, call `resetLogoutFlag()` from api.ts to allow future logout handling

## 7. Documentation

- [x] 7.1 Update `CLAUDE.md`: Remove outdated mention of `localStorage('auth_access_token')` - now using Supabase session
- [x] 7.2 Update `CLAUDE.md`: Remove mention of `except()` whitelist (không còn dùng)
- [x] 7.3 Update `CLAUDE.md`: Add note about Supabase Auth handling token refresh automatically with single-flight pattern and centralized logout

## 8. Verification

- [ ] 8.1 Manual test: Login → wait for token to expire (or manually clear) → navigate → should auto-refresh
- [ ] 8.2 Manual test: Close tab → wait 2+ hours → reopen → should work without re-login
- [ ] 8.3 Manual test: Login → logout → login again → should work without "Không tìm thấy nhân viên" error
- [ ] 8.4 Manual test: Open DevTools Network → trigger 5-10 API calls simultaneously after token expiry → verify only 1 refresh request is made AND only 1 toast/redirect if fails
- [ ] 8.5 Manual test: After TOKEN_REFRESHED event, verify permissions and isRoot are updated correctly
- [ ] 8.6 Manual test: If refresh fails completely, verify user is redirected to login with Vietnamese message "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
- [ ] 8.7 Manual test: Simulate network disconnect → trigger API call → should NOT logout, just show network error
