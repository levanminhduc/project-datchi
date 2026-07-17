---
paths:
  - "server/**"
---

# Backend Rules (Hono API)

## Response Format

```typescript
return c.json({ data: T | null, error: string | null, message?: string })
```

Legacy inline handlers in `server/index.ts` use `{ error: boolean, message }` — do NOT copy that shape for new routes. Error messages user-facing → Vietnamese.

## Route Registration Order

Specific before generic — Hono matches by registration order, not specificity:

```typescript
app.get('/:id/return-logs', getReturnLogs)  // must come first
app.get('/:id', getById)
```

## Validation

Zod schemas in `server/validation/`. `schema.parse(await c.req.json())` before any processing.

## Database Access

Use `query()`, `queryOne()`, `querySingle()`, `queryCount()`, `tx()` from `server/db/query.ts`, or `SqlBuilder` for dynamic filters. Always parameterized (`$1, $2`) — never string-interpolate values into SQL.

- Batch fetch: `WHERE id = ANY($1::int[])` — no N+1 loops.
- Multi-step atomic writes (lock + update + insert + log) → use an RPC (`fn_*`), not sequential queries.
- Check real schema (`\d table_name`) before writing any query — never guess column names.

## Auth

```typescript
app.get('/', requirePermission('module.resource.action'), async (c) => {
  const auth = c.get('auth')  // { employeeId, employeeCode, isRoot, isAdmin, roles, permissions }
})
```

ROOT bypasses all permission checks. Do NOT add new public (no-auth) routes without discussing security implications — the allowlist lives in `server/index.ts`.

## Error Handling & Logs

```typescript
} catch (error) {
  console.error('[route-name] action failed:', error)
  return c.json({ data: null, error: getErrorMessage(error) }, 500)
}
```

Dev log format: `[feature-name] message key=value`, in English.

## Idempotency

Endpoints with side effects on inventory/movements must accept an `Idempotency-Key` header and check `issue_operations_log` before processing (see `server/routes/issuesV2.ts`).

## File Uploads

`formData` → validate size (max 10MB, Vietnamese error) → Sharp → save under `STORAGE_DIR` as `{guide_id}/{uuid}.webp`.
