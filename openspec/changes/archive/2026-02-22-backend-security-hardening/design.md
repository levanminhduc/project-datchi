## Context

The application is a Hono.js backend (Node.js) for a thread/fabric inventory management system used by a Vietnamese garment factory. It uses Supabase (PostgreSQL) via `supabaseAdmin` (service_role key, bypasses RLS) for all database operations.

**Current state:**
- 25 route files registered via `app.route('/api/<name>', router)` in `server/index.ts`
- 22 route files have ZERO authentication — all endpoints are publicly accessible
- 3 route files have partial auth: `auth.ts` (per-route `authMiddleware`), `settings.ts` (per-route), `notifications.ts` (global `use('*', authMiddleware)`)
- A complete RBAC system exists in the database (tables: `permissions`, `roles`, `role_permissions`, `employee_roles`, `employee_permissions`) with 39 seeded permissions and 7 roles
- Middleware functions exist but are mostly unused: `requirePermission()`, `requireAllPermissions()`, `requireAdmin`, `requireRoot`
- JWT tokens are issued at login and the frontend already sends them via `Authorization: Bearer <token>` header
- PostgREST `.or()` filter strings accept unsanitized user input in 9 locations across 6 route files

## Goals / Non-Goals

**Goals:**
- Deny-by-default authentication: every `/api/*` route requires a valid JWT unless explicitly whitelisted
- Per-route authorization: each endpoint checks the user has the appropriate permission from the 39 existing permission codes
- Harden JWT verification (algorithm pinning to HS256)
- Add security headers via `hono/secure-headers`
- Sanitize PostgREST `.or()` filter inputs to prevent filter injection
- Remove hardcoded default password fallback

**Non-Goals:**
- Frontend changes (already sends JWT correctly)
- New database migrations (permission tables and seeds already exist)
- Rate limiting (separate concern, future change)
- CSRF protection (API is token-based, not cookie-based)
- Changing the RBAC model or adding new permissions/roles
- Audit logging for permission denials (future enhancement)

## Decisions

### 1. Global `except()` whitelist over per-route auth registration

**Choice**: Use `app.use('/api/*', except(PUBLIC_PATHS, authMiddleware))` in `server/index.ts`

**Alternatives considered:**
- *Per-route `authMiddleware` in each of 22 files* — Rejected. Requires 22 file changes for auth alone, and any new route file added in the future would be unprotected by default. Violates OWASP deny-by-default principle.
- *Sub-router level `router.use('*', authMiddleware)` in each file* — Same problem as per-route, plus Hono issue #1240 means `use('*', ...)` on sub-routers doesn't match the exact mount path.

**Rationale**: Global middleware with `except()` from `hono/combine` is the pattern used by NestJS (APP_GUARD), Django 5.1 (LoginRequiredMiddleware), and Rails (ApplicationController before_action). The whitelist is only 2 endpoints (`/api/auth/login`, `/api/auth/refresh`), making it trivial to maintain. Failure mode is safe: missing a public route from the whitelist causes a visible 401, not a silent security hole.

**Critical constraint**: The `app.use()` call MUST be placed BEFORE all `app.route()` calls in `server/index.ts`. Hono evaluates middleware registration order.

### 2. Keep `requirePermission()` as per-endpoint authorization (Layer 2)

**Choice**: Add `requirePermission('thread.inventory.view')` etc. to individual route handlers, not as global middleware.

**Rationale**: Authorization is inherently per-endpoint — a user may have `thread.inventory.view` but not `thread.inventory.edit`. This cannot be done globally. The existing `requirePermission()` middleware already supports OR logic (any of the listed permissions grants access) and ROOT bypass.

### 3. Public route whitelist — minimal set

**Choice**: Only 2 public paths:
- `/api/auth/login` — POST login
- `/api/auth/refresh` — POST refresh token

**Rationale**: `/health` is not under `/api/*` so it's already outside the middleware scope. All other auth endpoints (`/logout`, `/me`, `/change-password`, `/permissions`) require authentication. The admin auth endpoints already have `requireAdmin` — global auth just adds the authentication layer they were manually applying.

### 4. Remove redundant per-route `authMiddleware` after global is active

**Choice**: Remove `authMiddleware` imports and `use('*', authMiddleware)` from `auth.ts`, `settings.ts`, and `notifications.ts` after global auth is in place.

**Rationale**: Double-applying `authMiddleware` would verify the JWT twice per request — wasteful and confusing. The per-route `requireAdmin` and `requireRoot` guards remain since those are authorization (Layer 2), not authentication.

### 5. PostgREST `.or()` sanitization via regex allowlist

**Choice**: Create a shared helper `sanitizeFilterValue(input: string): string` that strips any character not matching `[a-zA-Z0-9À-ỹ\s._%-]` before interpolation into `.or()` filter strings.

**Alternatives considered:**
- *Parameterized queries* — PostgREST JS client doesn't support parameterized `.or()` filters; string interpolation is the only option.
- *Per-location inline sanitization* — Would duplicate logic across 9 call sites.

**Rationale**: PostgREST filter injection allows an attacker to manipulate query logic by injecting operators like `,status.eq.deleted` into search strings. A shared allowlist-based sanitizer applied at all 9 `.or()` locations prevents this while maintaining the existing query patterns.

### 6. JWT algorithm pinning

**Choice**: Pass `{ algorithms: ['HS256'] }` to `jwt.verify()` in `authMiddleware`.

**Rationale**: Without algorithm pinning, an attacker could theoretically craft a token using `alg: 'none'` or RSA/HMAC confusion attacks. Explicit algorithm specification is a JWT security best practice (OWASP JWT Cheat Sheet).

## Risks / Trade-offs

- **[Risk] Existing integrations break on 401** → Mitigation: The frontend already sends JWT on every request via `fetchApi()`. No external integrations exist. Verify with a full smoke test after deployment.

- **[Risk] `except()` path matching is trailing-slash sensitive** → Mitigation: Hono's default `strict: true` mode means `/api/auth/login` and `/api/auth/login/` are different. The frontend uses paths without trailing slashes. Add both variants to the whitelist if needed, or set `strict: false` on the Hono app.

- **[Risk] `.or()` sanitizer is too aggressive** → Mitigation: The allowlist `[a-zA-Z0-9À-ỹ\s._%-]` covers Vietnamese characters, alphanumerics, and common search patterns. If legitimate searches are blocked, the regex can be widened. Failures are visible (search returns fewer results, not security errors).

- **[Risk] Performance impact of permission check per request** → Mitigation: `authMiddleware` already fetches permissions from DB on every request. Adding `requirePermission()` only does an in-memory array `.includes()` check — negligible overhead. Future optimization: cache permissions in JWT claims.

- **[Risk] Rollback complexity** → Mitigation: Global auth is a single `app.use()` line in `server/index.ts`. Revert one commit to remove it. Per-route `requirePermission()` changes are independent and can remain even if global auth is reverted (they just become no-ops since `c.get('auth')` would be undefined, returning 401 from `requirePermission` itself).

## Migration Plan

1. **Phase 1 — Global auth + security headers** (server/index.ts, server/middleware/auth.ts)
   - Add `secureHeaders()` as first middleware
   - Add `except(PUBLIC_PATHS, authMiddleware)` before all `app.route()` calls
   - Pin JWT to HS256
   - Smoke test: verify login works, protected routes return 401 without token, 200 with token

2. **Phase 2 — Per-route authorization** (22 route files)
   - Add `requirePermission()` to each endpoint
   - Remove redundant `authMiddleware` from auth.ts, settings.ts, notifications.ts
   - Test: verify admin-only routes return 403 for non-admin users

3. **Phase 3 — Input sanitization** (6 route files, 1 new helper)
   - Create `sanitizeFilterValue()` helper
   - Apply to all 9 `.or()` locations
   - Remove default password fallback from auth.ts
   - Test: verify search still works, filter injection is blocked

**Rollback strategy**: Each phase is an independent commit. Revert any phase without affecting others. Phase 1 revert removes global auth. Phase 2 revert removes authorization checks. Phase 3 revert removes sanitization.

## Open Questions

None — all technical decisions are resolved. The permission-to-route mapping uses the 39 existing permission codes without modification.
