---
description: JWT claims, auth middleware, permission naming, adding new permissions
---

# Auth & Permissions

## Auth Flow

```
Frontend login → POST /api/auth/login (username + password)
→ bcrypt verify against employees.password_hash
→ server signs JWT (jose HS256, JWT_SIGNING_SECRET)
→ { accessToken, refreshToken, expiresAt } returned
→ fetchApi() attaches Bearer header on every request
→ authMiddleware (server/middleware/auth.ts) verifies JWT
→ requirePermission() checks claims
→ handler uses pg pool for DB access
```

## JWT Claims

Signed by `server/auth/jwt.ts` using HS256:

| Claim | Type | Notes |
|-------|------|-------|
| `employee_id` | number | FK to `employees.id` |
| `employee_code` | string | Human-readable code |
| `is_root` | boolean | Bypasses all permission checks |
| `roles` | string[] | Role names assigned to employee |

Access in handlers: `c.get('auth')`. `isAdmin = isRoot || roles.includes('admin')`

## Token Lifecycle

| Token | TTL | Env var |
|-------|-----|---------|
| Access | 1h (default) | `JWT_ACCESS_TTL_SECONDS` |
| Refresh | 7d (default) | `JWT_REFRESH_TTL_SECONDS` |

Refresh tokens stored in `refresh_tokens` table with device fingerprint.

## Permission Naming

Pattern: `module.resource.action`

Examples:
- `thread.inventory.view`, `thread.inventory.edit`
- `thread.allocations.create`, `thread.allocations.delete`
- `admin.users.manage`, `admin.settings.edit`
- `dashboard.view`

## Permission Tables

| Table | Purpose |
|-------|---------|
| `permissions` | Master list (id, code, description) |
| `roles` | Role definitions (code, level) |
| `role_permissions` | Role ↔ permission mapping |
| `employee_roles` | Employee ↔ role assignment |
| `employee_permissions` | Direct permission grant/revoke per employee |

## Adding a New Permission

1. Create migration: `INSERT INTO permissions (code, description) VALUES ('module.resource.action', '...')`
2. Assign to roles: `INSERT INTO role_permissions (role_id, permission_id) SELECT ...`
3. Use in route: `requirePermission('module.resource.action')`

ROOT employees bypass all permission checks automatically.

## Account Lockout

Failed login attempts tracked in `employees.failed_login_attempts`. After 5 consecutive failures, account locks (`locked_until` set). Unlock via admin or wait for expiry.

## Changing Auth Middleware — Critical Warning

When modifying `server/middleware/auth.ts`:

**MUST verify** `src/services/api.ts` `fetchApi()` still sends `Authorization` header correctly.

Past incident: adding global `authMiddleware` with `except()` caused all pages to 401 because `fetchApi()` wasn't sending token. Symptom looked like 403 ("Bạn không có quyền") but was actually 401.

After any auth middleware change: test login flow + navigate protected routes + check browser Network tab for 401s.
