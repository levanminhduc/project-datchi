## 1. Database Migration — Schema & Hook

- [x] 1.1 Create migration: add `auth_user_id UUID UNIQUE` column to `employees` table with FK to `auth.users(id)` ON DELETE SET NULL
- [x] 1.2 Create migration: `custom_access_token_hook(event jsonb)` function that injects `employee_id`, `employee_code`, `roles`, `is_root` into JWT claims, blocks inactive employees
- [x] 1.3 Create migration: GRANT permissions — `supabase_auth_admin` gets EXECUTE on hook + SELECT on `employees`, `employee_roles`, `roles`; REVOKE from `authenticated`, `anon`, `public`
- [x] 1.4 Create migration: enable RLS + FORCE RLS on `thread_inventory`, `thread_movements`, `thread_allocations`, `lots`, `purchase_orders`, `weekly_orders` ← (verify: RLS enabled on all 6 tables, service_role bypass works, existing backend queries unchanged)

## 2. RLS Policies

- [x] 2.1 ~~Create policy: service_role full bypass~~ — SKIPPED: service_role has BYPASSRLS attribute, policies are never evaluated
- [x] 2.2 Create policy: `authenticated` SELECT on all 6 tables (read access for all logged-in users)
- [x] 2.3 Create policy: role-based write on `thread_inventory` and `thread_movements` — only `warehouse_staff`, `warehouse_manager`, `admin`, `is_root`
- [x] 2.4 Create policy: role-based write on `thread_allocations` — only `planning`, `admin`, `is_root`
- [x] 2.5 Create policy: open write on `lots`, `purchase_orders`, `thread_order_weeks` — all `authenticated` users
- [x] 2.6 ~~Create policy: deny all for anon~~ — SKIPPED: RLS default-deny when no policy matches, anon has no policies ← (verify: all RLS policies match spec scenarios, anon blocked, role-based write restrictions correct)

## 3. Supabase Config

- [x] 3.1 ~~Update `supabase/config.toml`~~ — SKIPPED: project uses self-hosted Supabase (no CLI config.toml), hook enabled via Dashboard/Docker env vars
- [x] 3.2 Document production Docker env vars in a deploy note: `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true`, `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI`

## 4. Data Migration Script

- [x] 4.1 Create `scripts/migrate-auth-users.ts`: read active employees with `password_hash`, call `supabase.auth.admin.createUser({ email, password_hash, email_confirm: true })`, store UUID in `employees.auth_user_id`
- [x] 4.2 Implement idempotent re-run: skip employees that already have `auth_user_id` set
- [x] 4.3 Add verification step: query employees where `is_active = true AND password_hash IS NOT NULL AND auth_user_id IS NULL` — should return 0 rows
- [x] 4.4 Add error handling and summary report (success count, skip count, error count) ← (verify: script creates auth.users entries with correct email mapping, bcrypt hashes preserved, auth_user_id populated, idempotent on re-run)

## 5. Backend — Auth Middleware Rewrite

- [x] 5.1 Install `jose` package, add `SUPABASE_JWT_SECRET` to `.env` and `.env.example`
- [x] 5.2 Rewrite `server/middleware/auth.ts`: replace `jsonwebtoken` with `jose` (`jwtVerify` with HS256), read custom claims (`employee_id`, `employee_code`, `roles`, `is_root`) from verified payload
- [x] 5.3 Keep same `AuthContext` interface shape — populate from Supabase JWT claims instead of DB lookup
- [x] 5.4 Keep `requirePermission()` middleware working — permissions still fetched from DB using `employee_id` from JWT claims (not from JWT directly)
- [x] 5.5 Update `server/index.ts` except list: remove `/api/auth/login` and `/api/auth/refresh` from whitelist (those endpoints will be removed) ← (verify: authMiddleware verifies Supabase JWT correctly, AuthContext populated, requirePermission still works, algorithm pinning to HS256)

## 6. Backend — Auth Routes Simplification

- [x] 6.1 Remove `POST /api/auth/login` endpoint (auth handled by Supabase SDK on frontend)
- [x] 6.2 Remove `POST /api/auth/refresh` endpoint (handled by Supabase SDK automatic refresh)
- [x] 6.3 Remove `POST /api/auth/logout` endpoint (handled by `supabase.auth.signOut()` on frontend)
- [x] 6.4 Keep/update admin password reset endpoint: use `supabase.auth.admin.updateUserById(authUserId, { password })` and set `must_change_password = true`
- [x] 6.5 Add `POST /api/auth/change-password` endpoint: verify old password, call `supabase.auth.admin.updateUserById()` with new password, set `must_change_password = false`
- [x] 6.6 Add `GET /api/auth/me` endpoint: return employee info + `must_change_password` flag from DB (used by frontend after login) ← (verify: removed endpoints return 404, password change works via Supabase Admin API, /me returns must_change_password flag)

## 7. Backend — Employee Management Updates

- [x] 7.1 Update employee creation route: when creating a new employee, also call `supabase.auth.admin.createUser()` to create auth.users entry, store `auth_user_id`
- [x] 7.2 Update employee deactivation: when setting `is_active = false`, optionally ban the auth user via Admin API
- [x] 7.3 Update admin password reset: use `supabase.auth.admin.updateUserById()` instead of bcrypt hash update ← (verify: new employee gets auth.users entry, deactivated employee blocked from login via hook, admin password reset updates auth.users)

## 8. Backend — Cleanup

- [x] 8.1 Remove `jsonwebtoken` and `bcrypt` package dependencies
- [x] 8.2 Remove old JWT-related env vars from code: `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
- [x] 8.3 Create migration: drop `employee_refresh_tokens` table
- [x] 8.4 Create migration: drop `employees.refresh_token` and `employees.refresh_token_expires_at` columns ← (verify: no remaining references to jsonwebtoken, bcrypt, or old JWT env vars in backend code)

## 9. Frontend — Supabase Auth Integration

- [x] 9.1 Update `src/services/authService.ts`: replace custom login with `supabase.auth.signInWithPassword({ email: employeeId.toLowerCase() + '@internal.datchi.local', password })`
- [x] 9.2 Update `src/services/authService.ts`: replace custom logout with `supabase.auth.signOut()`
- [x] 9.3 Remove manual token refresh logic from authService (Supabase SDK handles automatically)
- [x] 9.4 Update `src/services/api.ts` `fetchApi()`: read token from `supabase.auth.getSession()` instead of `localStorage('auth_access_token')` ← (verify: login converts employee_id to email correctly, signIn/signOut work, fetchApi sends Supabase session token)

## 10. Frontend — Auth State Management

- [x] 10.1 Update `src/composables/useAuth.ts`: sync with `supabase.auth.onAuthStateChange()` for `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED` events
- [x] 10.2 Extract employee info from Supabase JWT claims (`employee_id`, `employee_code`, `roles`, `is_root`) instead of custom JWT payload
- [x] 10.3 Handle session expiry: `SIGNED_OUT` event → redirect to login with "Phien dang nhap da het han"
- [x] 10.4 After successful login, call `GET /api/auth/me` to check `must_change_password` flag → show password change modal if true
- [x] 10.5 Update `src/types/auth/index.ts`: update JWT payload types to match Supabase claims structure ← (verify: auth state syncs on page refresh, token refresh updates state, expired session redirects to login, must_change_password flow works end-to-end)

## 11. Frontend — Password Change Flow

- [x] 11.1 Update password change modal: call `POST /api/auth/change-password` instead of old custom endpoint
- [x] 11.2 After successful password change, `must_change_password` is set to false on backend — verify frontend state updates ← (verify: first-login password change modal appears and completes successfully)

## 12. Frontend — Cleanup

- [x] 12.1 Remove manual token storage/retrieval from `localStorage` (auth_access_token, auth_refresh_token)
- [x] 12.2 Remove any remaining custom refresh token logic
- [x] 12.3 Update `.env` and `.env.example`: deprecate old JWT vars, ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present ← (verify: no remaining references to localStorage auth tokens in frontend code, no custom refresh logic)

## 13. Integration Testing

- [ ] 13.1 Restart Supabase (`supabase stop && supabase start`) to load hook config
- [ ] 13.2 Run data migration script on local Supabase
- [ ] 13.3 Test login flow: employee_id + password → Supabase session → JWT with custom claims
- [ ] 13.4 Test protected API calls: fetchApi sends Supabase JWT, backend verifies and authorizes
- [ ] 13.5 Test token refresh: wait for auto-refresh, verify new token has fresh claims
- [ ] 13.6 Test must_change_password flow: login → modal → change → normal access
- [ ] 13.7 Test RLS: direct Supabase query with anon key should be blocked ← (verify: full login → API call → logout flow works, RLS blocks anon, existing backend CRUD unchanged via service_role)
