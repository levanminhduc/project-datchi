## Why

The backend security review (2026-02-21) confirmed that 22 out of 25 route files have zero authentication — all CRUD endpoints are publicly accessible. Despite a full RBAC permission system existing in the database (39 permissions, 7 roles, hierarchy levels) and middleware layer (`requirePermission()`, `requireAdmin`, `requireRoot`), these controls are not connected to route handlers. All 25 route files use `supabaseAdmin` (service_role, bypasses RLS), meaning any unauthenticated request gets unrestricted database access. Additionally, JWT verification lacks algorithm pinning, there are no security headers, and PostgREST filter strings accept unsanitized user input.

## What Changes

- **BREAKING**: Add global authentication middleware to `server/index.ts` using Hono's `except()` pattern — all `/api/*` routes require valid JWT by default, with explicit whitelist for public endpoints (`/api/auth/login`, `/api/auth/refresh`)
- Add `secureHeaders()` middleware (built-in `hono/secure-headers`) as first global middleware
- Pin JWT verification to `HS256` algorithm with explicit options
- Add `requirePermission()` authorization to all 22 unprotected route files, mapping endpoints to the 39 existing permission codes
- Remove redundant per-route `authMiddleware` imports from `auth.ts`, `settings.ts`, `notifications.ts` (global middleware handles authentication)
- Sanitize user input in `.or()` PostgREST filter strings (3 locations)
- Remove hardcoded default password fallback (`Password123!`) from password reset

## Capabilities

### New Capabilities
- `global-auth-middleware`: Global deny-by-default authentication on all `/api/*` routes with explicit public route whitelist, secure headers, and JWT hardening
- `route-authorization`: Per-route `requirePermission()` guards mapping each endpoint to existing permission codes from the `permissions` table

### Modified Capabilities
- `permission-crud-api`: Password reset endpoint removes default password fallback — `newPassword` becomes required
- `skill-security`: PostgREST `.or()` filter sanitization and JWT algorithm pinning

## Impact

- **Server entry point**: `server/index.ts` — new middleware registration (secureHeaders, global auth)
- **Auth middleware**: `server/middleware/auth.ts` — JWT verify options update
- **22 route files**: All files in `server/routes/` that currently lack auth — add `requirePermission()` per endpoint
- **3 route files with existing auth**: `auth.ts`, `settings.ts`, `notifications.ts` — remove redundant `authMiddleware` imports, keep `requireAdmin`/`requireRoot`
- **Auth routes**: `server/routes/auth.ts` — remove default password fallback, sanitize `.or()` filter
- **Employee routes**: `server/routes/employees.ts` — sanitize `.or()` filter (2 locations)
- **Frontend**: No changes — frontend already sends JWT via `fetchApi()` Authorization header
- **Dependencies**: None new — `hono/secure-headers` and `hono/combine` are built-in Hono modules
