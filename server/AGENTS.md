# server/ - Hono Backend API

Backend API layer using Hono framework with PostgreSQL (node-postgres, direct SQL).

## STRUCTURE

```
server/
├── index.ts          # Entry point, route mounting, CORS, public-route allowlist, app.onError
├── routes/           # API route handlers (Hono sub-routers)
├── db/               # pool.ts (pg.Pool), query.ts (query/queryOne/queryCount/tx), sql-builder.ts
├── middleware/       # auth.ts (JWT verify, requirePermission/requireAdmin/requireRoot)
├── auth/             # jwt.ts (jose HS256 sign/verify)
├── realtime/         # listener.ts (LISTEN/NOTIFY), stream.ts (SSE)
├── validation/       # Zod schemas for request bodies
├── storage/          # Filesystem uploads (STORAGE_DIR)
├── utils/            # errorHelper, telegram-service, notification dispatchers
├── types/            # Backend-specific type definitions
└── scripts/          # Utility scripts (seed, ...)
```

## CONVENTIONS

### Route Pattern
```typescript
import { Hono } from 'hono'
import { query } from '../db/query'
import { requirePermission } from '../middleware/auth'

const router = new Hono()
router.get('/', requirePermission('module.resource.view'), async (c) => {
  try {
    const rows = await query<T>('SELECT * FROM table WHERE id = $1', [id])
    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('[route-name] action failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})
export default router
```

### Response Structure
```typescript
{ data: T | null, error: string | null, message?: string }
```
- Vietnamese error messages always
- HTTP status codes: 200 success, 400 validation, 401 auth, 403 permission, 404 not found, 500 server

### Database Access
- `query<T>()`, `queryOne<T>()`, `querySingle<T>()`, `queryCount()` from `db/query.ts`
- `tx(async (client) => { ... })` for transactions
- `SqlBuilder` (`db/sql-builder.ts`) for dynamic filtering — always parameterized
- Multi-step atomic writes → PostgreSQL RPC (`SELECT * FROM fn_xxx($1, $2)`)
- Batch fetch: `WHERE id = ANY($1::int[])` — no N+1

### Route Order
Specific before generic — Hono matches by registration order: `/:id/action` must be registered before `/:id`.

### Environment
`dotenv.config()` MUST be called at top of index.ts BEFORE any `process.env` access. DB connection via `DATABASE_URL`.

## WHERE TO LOOK

| Task | File |
|------|------|
| Add new API | `routes/{domain}.ts`, mount in `index.ts` |
| Auth middleware | `middleware/auth.ts` |
| JWT sign/verify | `auth/jwt.ts` |
| DB pool & query helpers | `db/pool.ts`, `db/query.ts` |
| Dynamic SQL | `db/sql-builder.ts` |
| Request validation | `validation/` (Zod) |
| Realtime (SSE) | `realtime/listener.ts`, `realtime/stream.ts` |
| Idempotency pattern | `routes/issuesV2.ts` |

## ANTI-PATTERNS

- Don't string-interpolate values into SQL → parameterized `$1, $2` only
- Don't run multi-step stock mutations as sequential queries → use an RPC or `tx()`
- Don't mutate inventory without a `thread_movements` log
- Don't add public (no-auth) routes without discussing security — allowlist in `index.ts`
- Don't copy the legacy `{ error: boolean, message }` shape from `index.ts` inline handlers
