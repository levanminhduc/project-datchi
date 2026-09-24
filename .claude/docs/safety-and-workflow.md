---
description: Dangerous commands, data safety rules, pre-code checklist, debug workflow, commit rules
---

# Safety & Workflow

## Dangerous Commands — NEVER Run

| Command | Consequence |
|---------|-------------|
| `DROP TABLE` | Data loss — ask user first |
| `TRUNCATE` | Data loss — ask user first |
| `DELETE FROM` (any table) | Data loss — use soft-delete only |
| `git push -f` | Lost commit history — ask user first |

**Absolute rule:** NEVER delete data rows. Only `UPDATE`/`INSERT`. Soft-delete via `deleted_at` or status enum.

## Safe DB Operations

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d datchi
\d table_name                # Check schema before writing queries
```

## Pre-Code Checklist

Before writing any code:

1. **Read the file you'll modify** — understand current patterns, route order, imports
2. **Check DB schema** — `\d table_name` or read migration files; never guess column names
3. **Check route order** for Hono — specific routes before generic (`/:id/action` before `/:id`)
4. **Confirm when unclear** — ask first if the request is ambiguous or touches data/schema/auth/stock flows; otherwise state understanding in one line and proceed

## Surgical Changes Rule

Only modify the exact lines requested. Every changed line must trace directly to the request.

Do NOT:
- Reformat adjacent code (quotes, indentation, trailing commas)
- Add type annotations to unrelated functions
- Refactor components not mentioned in the request
- "Improve" imports or variable names while fixing something else

Self-test: "If my diff contains lines unrelated to the request → Surgical Changes violation."

## Pre-Commit Checklist

```bash
npm run lint          # ESLint --fix
npm run type-check    # vue-tsc --build --force
```

Commit message format: `feat:`, `fix:`, `refactor:`, `chore:`

Never commit: `.env`, API keys, credentials, `JWT_SIGNING_SECRET`.

## Debug Workflow

1. Gather: logs, error messages, reproduction steps
2. Root cause: trace back from error to source, not symptoms
3. Fix at root
4. Verify: test complete flow end-to-end

For auth issues: always check browser Network tab — "Bạn không có quyền" (403 display) can actually be a 401 from missing Authorization header.

## Audit Trail Rule

Any action that changes stock (issue, receive, return, transfer, allocate) MUST:
- Log a movement record (`thread_movements`), OR
- Use an RPC that logs internally

Never update inventory without a corresponding movement log.

## New Permission Checklist

1. Migration: `INSERT INTO permissions (code, description)`
2. Assign to roles: `INSERT INTO role_permissions`
3. Route: `requirePermission('module.resource.action')`
4. Frontend: update permission checks if UI needs to gate on it

## Changing Auth Middleware

After any change to `server/middleware/auth.ts`:
1. Verify `fetchApi()` in `src/services/api.ts` still sends `Authorization` header
2. Test: login → navigate protected page → Network tab for 401s
3. Test with limited-permission user (not root)
