---
description: Hono API conventions, response format, route order, validation, error handling
---

# Backend API

## Standard Response Format

```typescript
return c.json({ data: T | null, error: string | null, message?: string })
```

Legacy exception: root `server/index.ts` inline handlers use `{ error: boolean, message }`. Do NOT copy for new routes. All `server/routes/` files must use `error: string | null`.

## Route Registration Order

**Specific routes BEFORE generic routes.** Hono matches by registration order, not specificity.

```typescript
// Correct
app.get('/:id/return-logs', getReturnLogs)
app.get('/:id', getById)

// Wrong — /:id matches everything, return-logs never reached
app.get('/:id', getById)
app.get('/:id/return-logs', getReturnLogs)
```

## Request Validation

Zod schemas in `server/validation/`. Validate before processing:

```typescript
import { z } from 'zod'
const schema = z.object({
  thread_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  name: z.string().min(1),
})
const body = schema.parse(await c.req.json())
```

## Database Access

Use `query()`, `queryOne()`, `querySingle()` from `server/db/query.ts`, or `SqlBuilder` for dynamic queries:

```typescript
import { query, queryOne } from '../db/query'
import { SqlBuilder } from '../db/sql-builder'

// Simple query
const rows = await query<ThreadType>('SELECT * FROM thread_types WHERE supplier_id = $1 LIMIT 50', [supplierId])

// Single record
const row = await queryOne<Employee>('SELECT * FROM employees WHERE id = $1', [id])

// SqlBuilder for dynamic filtering
const builder = new SqlBuilder('thread_inventory')
  .select('id, thread_type_id, color_id, quantity_meters')
  .eq('status', 'AVAILABLE')
if (supplierId) builder.eq('supplier_id', supplierId)
const { sql, params } = builder.limit(100).build()
const rows = await query(sql, params)

// Transaction
import { tx } from '../db/query'
await tx(async (client) => {
  await client.query('UPDATE ...', [...])
  await client.query('INSERT ...', [...])
})
```

## Auth in Routes

```typescript
import { requirePermission } from '../middleware/auth'

app.get('/', requirePermission('thread.inventory.view'), async (c) => {
  const auth = c.get('auth')   // { employeeId, employeeCode, isRoot, isAdmin, roles, permissions }
})
```

ROOT (`isRoot = true`) bypasses all permission checks.

## Error Handling

```typescript
try {
  // ...
} catch (error) {
  console.error('[route-name] action failed:', error)
  return c.json({ data: null, error: getErrorMessage(error) }, 500)
}
```

Log format: `[feature-name] message key=value`. English for dev logs.
Global catch-all: `app.onError` in `server/index.ts`.

## Public Routes (No Auth)

Configured in `server/index.ts`:
- `GET /api/guides/images/*`
- `POST|GET /api/public/*`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /health`

Do NOT add new public routes without discussing security implications.

## File Upload Pattern

```typescript
const formData = await c.req.formData()
const file = formData.get('image') as File
if (!file || file.size > 10 * 1024 * 1024) {
  return c.json({ data: null, error: 'File quá lớn (max 10MB)' }, 400)
}
// Process with Sharp → save to STORAGE_DIR (filesystem)
// Path convention: {guide_id}/{uuid}.webp
```

## Idempotency

For endpoints with side effects (inventory changes, movements): require `Idempotency-Key` header.
See `database-rpcs-migrations.md` for full pattern.
