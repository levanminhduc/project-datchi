## Why

The application currently uses a custom JWT authentication system (jsonwebtoken + bcrypt) that is completely disconnected from Supabase Auth. This means:

1. **No RLS protection** — All backend routes use `supabaseAdmin` (service_role key) which bypasses Row Level Security entirely. An API compromise exposes all data.
2. **Duplicate auth infrastructure** — Custom token generation, refresh logic, password hashing, and session management that Supabase Auth already provides out of the box.
3. **No authenticated Supabase context** — Frontend Realtime subscriptions use the anon key with no user identity, making it impossible to enforce per-user channel filtering.
4. **Maintenance burden** — Custom refresh token table, token rotation logic, and password security all need manual maintenance vs. Supabase's battle-tested GoTrue implementation.

Migrating to Supabase Auth with custom JWT claims will enable database-level security (RLS), reduce code complexity, and allow the frontend to have an authenticated Supabase session.

## What Changes

- **BREAKING**: Replace custom JWT (jsonwebtoken) with Supabase Auth JWT across the entire auth flow
- **BREAKING**: Backend auth middleware switches from `jwt.verify()` with app JWT_SECRET to verifying Supabase-issued JWTs (same HS256 algorithm, different secret — `SUPABASE_JWT_SECRET`)
- **BREAKING**: Frontend `authService.ts` switches from custom `fetch('/api/auth/login')` to `supabase.auth.signInWithPassword()`
- Add `auth_user_id` (UUID) column to `employees` table to map Supabase Auth users to employees
- Create `custom_access_token_hook` PostgreSQL function that injects `employee_id`, `roles`, `isRoot`, and `permissions` into Supabase JWT claims
- Migrate existing employee bcrypt password hashes into `auth.users` via Admin API (`supabase.auth.admin.createUser` with `password_hash`)
- Enable RLS on critical data tables with policies that read custom JWT claims via `auth.jwt()`
- Remove custom `employee_refresh_tokens` table and refresh token logic (Supabase handles this)
- Update `useAuth` composable to sync with `supabase.auth.onAuthStateChange()`
- Update `fetchApi` to use Supabase session access token instead of custom token
- Configure Supabase Auth Hook in `config.toml` (local dev) and Docker env vars (production)

## Capabilities

### New Capabilities

- `supabase-auth-migration`: Database migration to create `auth.users` entries from existing employees, add `auth_user_id` FK column, create the `custom_access_token_hook` function, and configure necessary grants/permissions
- `supabase-auth-integration`: Backend middleware and frontend service changes to use Supabase Auth (signIn, signOut, token refresh, session management) instead of custom JWT
- `rls-policies`: Row Level Security policies on critical tables using custom JWT claims (`roles`, `isRoot`) from the access token hook

### Modified Capabilities

- `global-auth-middleware`: Middleware switches from custom `jwt.verify()` to Supabase JWT verification. Same `AuthContext` interface but populated from Supabase JWT claims.
- `route-authorization`: `requirePermission()` middleware reads permissions from Supabase JWT custom claims instead of fetching from database on every request.

## Impact

### Database
- New migration: `auth_user_id` column on `employees`, `custom_access_token_hook` function, grants to `supabase_auth_admin`
- RLS policies on: `thread_inventory`, `thread_movements`, `thread_allocations`, `lots`, `purchase_orders`, `weekly_orders`
- Drop: `employee_refresh_tokens` table (after migration)

### Backend (`server/`)
- `middleware/auth.ts` — Complete rewrite of JWT verification logic
- `routes/auth.ts` — Simplify login/logout/refresh (delegate to Supabase Auth), keep admin routes (reset password, manage permissions)
- `db/supabase.ts` — Add user-context Supabase client creation for RLS-aware queries
- `index.ts` — Update auth middleware except list

### Frontend (`src/`)
- `services/authService.ts` — Replace with Supabase Auth SDK calls
- `services/api.ts` — Use `supabase.auth.getSession()` for token
- `composables/useAuth.ts` — Sync with `onAuthStateChange`, remove manual token management
- `lib/supabase.ts` — Already exists, will be used for auth operations
- `types/auth/index.ts` — Update JWT payload types

### Dependencies
- Remove: `jsonwebtoken` (backend), `bcrypt` (backend — Supabase handles hashing)
- Add: `jose` (backend — for Supabase JWT verification, lighter than jsonwebtoken)
- Keep: `@supabase/supabase-js` (already installed)

### Environment
- New env var: `SUPABASE_JWT_SECRET` (from Supabase config, used by backend to verify tokens)
- Deprecate: `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` (Supabase manages these)
- Config: `supabase/config.toml` — enable `auth.hook.custom_access_token`

### Risk
- **Data migration**: Bcrypt hashes must be migrated correctly. Admin API approach is safe but slower. Rollback = keep old auth code on a branch.
- **Session invalidation**: All existing sessions become invalid after switch. Users must re-login.
- **Hook timeout**: Custom access token hook has 2-second timeout. Query must be fast (indexed lookups only).
- **Breaking change**: Frontend and backend must be deployed together. No gradual rollout possible.
