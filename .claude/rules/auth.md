---
paths:
  - "server/middleware/**"
  - "server/auth/**"
  - "server/routes/auth*"
  - "src/services/**"
---

# Auth & Permissions Rules

## Flow

login → bcrypt verify → JWT (jose HS256, `JWT_SIGNING_SECRET`) → `fetchApi()` attaches Bearer → `authMiddleware` verifies → `requirePermission()` checks claims.

Claims: `employee_id`, `employee_code`, `is_root`, `roles`. Access via `c.get('auth')`. ROOT bypasses all permission checks. Access token TTL 1h, refresh 7d (`refresh_tokens` table, device fingerprint).

## Permission Naming

`module.resource.action` — e.g. `thread.inventory.view`, `admin.users.manage`.

New permission checklist:
1. Migration: `INSERT INTO permissions (code, description)`
2. Assign: `INSERT INTO role_permissions`
3. Backend route: `requirePermission('...')` (OR logic) / `requireAllPermissions` / `requireAdmin` / `requireRoot`
4. Frontend page: `definePage({ meta: { permissions: ['...'] } })` in the SFC
5. Frontend elements: `v-permission` directive if buttons/sections need gating

## Frontend Route Guard

`src/router/guards.ts` — all routes require auth by default; check order: `meta.public` → authenticated → ROOT bypass → `requiresRoot` → `requiresAdmin` → `meta.permissions` (OR) → `meta.allPermissions` (AND) → redirect `/forbidden`. Backend must enforce the same permission independently — never rely on the frontend guard alone.

## Changing `server/middleware/auth.ts` — CRITICAL

After ANY change to auth middleware:

1. Verify `src/services/api.ts` `fetchApi()` still sends the `Authorization` header.
2. Test: login → navigate protected pages → check browser Network tab for 401s.
3. Test with a limited-permission (non-root) user.

Past incident: global `authMiddleware` via `except()` broke every page because `fetchApi()` didn't send the token. Symptom showed as "Bạn không có quyền" (looks like 403) but was actually 401 — always check the Network tab, not the toast.

## Public Routes

Allowlist lives in `server/index.ts` (`/api/auth/login`, `/api/auth/refresh`, `/api/public/*`, `/api/guides/images/*`, `/health`). Do NOT add public routes without discussing security implications.

## Lockout

5 consecutive failed logins → `locked_until` set on `employees`. Unlock via admin or expiry.
