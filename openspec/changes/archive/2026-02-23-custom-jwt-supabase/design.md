## Context

The application is a thread inventory management system (Đạt Chi) built with Vue 3 (Quasar) frontend and Hono backend, using self-hosted Supabase as the database layer.

**Current auth architecture:**
- Backend generates custom JWTs using `jsonwebtoken` library with a separate `JWT_SECRET`
- Passwords stored as bcrypt hashes in `employees.password_hash`
- Custom refresh token logic with `employee_refresh_tokens` table
- Frontend stores tokens in `localStorage`, sends via `Authorization: Bearer` header
- Backend `authMiddleware` verifies custom JWT, fetches permissions from DB on every request
- Supabase is used purely as a database — no Supabase Auth, no RLS
- Frontend Supabase client uses anon key only (for Realtime subscriptions)
- All CRUD goes through Hono backend using `supabaseAdmin` (service_role, bypasses RLS)

**Key constraint:** `employees.id` is `SERIAL INTEGER` used as FK across 40+ tables. Cannot change to UUID. Must maintain integer FK while mapping to Supabase Auth's UUID-based `auth.users.id`.

**Current employee count:** Small (< 100 employees). Migration can use Admin API approach.

## Goals / Non-Goals

**Goals:**
- Replace custom JWT issuance with Supabase Auth (GoTrue) — eliminate custom password hashing, token generation, refresh logic
- Inject employee roles and permissions into Supabase JWT via `custom_access_token_hook`
- Enable RLS on critical data tables using JWT custom claims
- Frontend gets authenticated Supabase session (for Realtime + future direct queries)
- Backend verifies Supabase-issued JWT instead of custom JWT
- Single deployment cutover (frontend + backend + migration together)

**Non-Goals:**
- Migrating frontend CRUD from Hono API to direct Supabase queries (keep all CRUD through Hono)
- Adding OAuth/social login providers (only email/password for now)
- Implementing per-row ownership policies (e.g., "user can only see their own allocations") — RLS will be role-based only
- Changing the `employees.id` integer FK system
- Adding MFA/2FA
- Email verification flow (employees are created by admin, no self-registration)

## Decisions

### D1: User Identity Mapping — `auth_user_id` column on `employees`

**Decision:** Add `auth_user_id UUID UNIQUE` column to `employees` table that references `auth.users(id)`.

**Why:** Supabase Auth uses UUID primary keys. The existing `employees.id` (integer) is FK'd across 40+ tables and cannot be changed. The mapping column bridges both worlds:
- `auth.jwt() ->> 'sub'` → UUID → lookup `employees.auth_user_id` → get `employees.id`
- The `custom_access_token_hook` does this lookup to inject `employee_id` (integer) into JWT claims

**Alternative considered:** Store employee_id in `auth.users.raw_user_meta_data` — rejected because user_metadata is user-editable and not trustworthy for authorization.

**Alternative considered:** Store employee_id in `auth.users.raw_app_meta_data` — viable but still requires the hook to read it. Having the column on `employees` keeps the mapping explicit and queryable.

### D2: Custom Access Token Hook — PostgreSQL function

**Decision:** Use `custom_access_token_hook` (pg function) to inject claims into every Supabase JWT.

**Claims to inject:**
```json
{
  "employee_id": 42,           // employees.id (integer) — for backend AuthContext
  "employee_code": "NV001",    // employees.employee_id (varchar) — for display
  "roles": ["admin", "warehouse_manager"],  // role codes
  "is_root": false              // fast ROOT bypass check
}
```

**Why NOT inject permissions into JWT:**
- Permissions list can be large (50+ entries) and changes frequently
- JWT size bloats with large claims → impacts every HTTP request
- Keep permissions fetched on-demand by backend middleware (cached per request)
- ROOT users get `['*']` — this IS in the JWT via `is_root`

**Performance:** Hook executes on every login AND every token refresh (default every 60 min). Must be fast:
- Index on `employees.auth_user_id`
- Index on `employee_roles.employee_id`
- Simple 2-table join, no permission resolution in hook

### D3: Backend JWT Verification — `jose` library with Supabase JWT secret

**Decision:** Replace `jsonwebtoken` with `jose` library. Verify using `SUPABASE_JWT_SECRET` (HS256).

**Why `jose` over `jsonwebtoken`:**
- `jose` is ESM-native, lighter, actively maintained
- Built-in TypeScript types
- Same HS256 verification capability
- `jsonwebtoken` has known deprecation warnings in Node 20+

**Why HS256 (not JWKS/RS256):**
- Self-hosted Supabase defaults to HS256
- Project already uses HS256 — minimal change
- JWKS requires network call to fetch keys — adds latency for self-hosted setup
- HS256 is acceptable for self-hosted where the JWT secret is tightly controlled

**JWT Secret source:** The `SUPABASE_JWT_SECRET` is the same value as `GOTRUE_JWT_SECRET` in Supabase Docker config. For local dev, it's the default demo secret from Supabase CLI.

### D4: Password Migration — Admin API with `password_hash`

**Decision:** Use `supabase.auth.admin.createUser({ email, password_hash, email_confirm: true })` to migrate existing employees.

**Approach:**
1. Each employee needs an email. Currently employees don't have email — use `{employee_id}@internal.datchi.local` as placeholder email
2. Read `employees.password_hash` (bcrypt) and pass directly to Admin API
3. Admin API creates both `auth.users` and `auth.identities` atomically
4. Store returned UUID in `employees.auth_user_id`
5. Run as a one-time migration script (Node.js)

**Why placeholder email:** Supabase Auth requires email (or phone) as identifier. Employees currently log in with `employee_id` (e.g., "NV001"). Using a deterministic placeholder email allows the existing login UX to work: frontend converts "NV001" → "nv001@internal.datchi.local" before calling `supabase.auth.signInWithPassword()`.

**Alternative considered:** Use phone number as identifier — rejected, employees don't have phone numbers in the system.

**Alternative considered:** Direct SQL INSERT into `auth.users` + `auth.identities` — rejected due to schema drift risk and NULL column gotchas (confirmation_token, etc. must be empty string not NULL).

### D5: Frontend Auth Flow — Supabase SDK

**Decision:** Replace custom `authService` methods with Supabase Auth SDK.

**New flow:**
1. User enters employee_id + password
2. Frontend converts to email: `{employee_id.toLowerCase()}@internal.datchi.local`
3. Call `supabase.auth.signInWithPassword({ email, password })`
4. Supabase returns session with `access_token` (contains custom claims from hook)
5. `onAuthStateChange` syncs auth state to `useAuth` composable
6. `fetchApi` reads token from `supabase.auth.getSession()` instead of `localStorage`
7. Token refresh handled automatically by Supabase SDK

**Login UX unchanged:** User still enters employee_id + password. The email transformation is invisible.

### D6: RLS Policy Strategy — Role-based with service_role bypass

**Decision:** Enable RLS on data tables. Backend continues using `supabaseAdmin` (service_role) for CRUD. RLS acts as defense-in-depth.

**Phases:**
- Phase 1 (this change): Enable RLS, create basic role-based policies, backend uses service_role (no behavior change)
- Phase 2 (future): Selected routes switch to user-context Supabase client for true RLS enforcement

**RLS policy pattern:**
```sql
-- All authenticated users can SELECT
CREATE POLICY "authenticated_read" ON thread_inventory
  FOR SELECT TO authenticated USING (true);

-- Only warehouse roles can INSERT/UPDATE/DELETE
CREATE POLICY "warehouse_write" ON thread_inventory
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'is_root')::boolean = true
    OR auth.jwt() -> 'roles' ?| array['admin', 'warehouse_manager', 'warehouse_staff']
  );
```

**Why defense-in-depth (not full RLS enforcement):**
- Backend already has `requirePermission()` middleware — duplicating all permission logic in RLS is complex
- Gradual migration is safer — enable RLS first, then selectively enforce
- service_role bypass means zero risk of breaking existing functionality

### D7: Supabase Config — Auth Hook Registration

**Decision:** Configure in `supabase/config.toml` for local dev. Document Docker env vars for production.

**Local dev (`config.toml`):**
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

**Production (Docker `.env`):**
```bash
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"
```

### D8: Employee Login Identifier — Email-based with deterministic mapping

**Decision:** Map `employee_id` → email using pattern `{employee_id}@internal.datchi.local`.

**Rules:**
- Lowercase: "NV001" → "nv001@internal.datchi.local"
- "ROOT" → "root@internal.datchi.local"
- Domain is non-routable (`.local` TLD) — no real email delivery possible

**Why this approach:**
- Supabase Auth requires email or phone as login identifier
- Employee IDs are unique — deterministic mapping preserves uniqueness
- No UI change — user still types "NV001", frontend handles the transformation
- If real employee emails are added later, can migrate to those

## Risks / Trade-offs

### [R1: Big Bang Deployment] → Staged rollout impossible
All components (migration script, backend, frontend) must deploy together. Mitigated by:
- Running migration script BEFORE deploying new code (additive — adds `auth_user_id` column, creates `auth.users` entries)
- Old code still works until new code is deployed
- Rollback: revert code to old branch, `auth_user_id` column stays but is unused

### [R2: Hook Performance] → 2-second timeout
If `custom_access_token_hook` exceeds 2 seconds, login fails entirely. Mitigated by:
- Query uses indexed lookups only: `employees.auth_user_id` (unique index) + `employee_roles.employee_id` (existing index)
- No permission resolution in hook — kept lightweight
- Monitor with `pg_stat_statements` after deployment

### [R3: Session Invalidation] → All users must re-login
Switching JWT secret invalidates all existing tokens. Mitigated by:
- Frontend `onAuthStateChange` detects invalid session → redirects to login
- Deploy during low-usage window
- Communicate to users in advance

### [R4: Placeholder Email Exposure] → Internal domain visible in Supabase dashboard
`auth.users` will show emails like "nv001@internal.datchi.local". This is cosmetic only — no real email delivery happens. If real emails are needed later, update via Admin API.

### [R5: `must_change_password` Flow] → Supabase Auth doesn't have this natively
Currently employees can be flagged with `must_change_password`. After migration, this remains in `employees` table as a custom field. Backend checks it post-login and returns it in the response. Frontend handles it same as before. Password change uses `supabase.auth.updateUser({ password })` instead of custom endpoint.

## Migration Plan

### Step 1: Database Migration (additive, safe to run before code deploy)
1. Add `auth_user_id UUID UNIQUE` column to `employees` (nullable initially)
2. Create `custom_access_token_hook` function with grants
3. Enable RLS on target tables with permissive policies (service_role bypass still works)

### Step 2: Data Migration Script (run once)
1. Node.js script reads all active employees with `password_hash`
2. For each: create `auth.users` entry via Admin API with bcrypt hash
3. Update `employees.auth_user_id` with returned UUID
4. Verify all active employees have `auth_user_id` set

### Step 3: Config Update
1. Update `supabase/config.toml` with hook config (local)
2. Restart Supabase (`supabase stop && supabase start`)
3. Update `.env` — add `SUPABASE_JWT_SECRET`, remove old JWT vars

### Step 4: Code Deploy (atomic — frontend + backend together)
1. Deploy backend with new auth middleware
2. Deploy frontend with Supabase Auth integration
3. All existing sessions invalidated — users re-login

### Rollback
1. Revert code to pre-migration branch
2. Old JWT_SECRET still works (keep in env during transition)
3. `auth_user_id` column and `auth.users` entries are harmless — can be cleaned up later

## Open Questions

1. **Production Supabase JWT Secret**: Need to confirm the `GOTRUE_JWT_SECRET` value from the production Docker deployment. This becomes the `SUPABASE_JWT_SECRET` for backend verification.
2. **config.toml location**: Project doesn't have `supabase/config.toml` — is the local Supabase CLI used? Need to verify local dev setup.
3. **Existing sessions during migration**: Should we add a "maintenance mode" banner, or just let 401s redirect to login?
