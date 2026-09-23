---
description: System architecture, request flow, layer responsibilities, key directories
---

# Architecture

## Request Flow

```
Browser → Vite dev proxy (:5173) → Hono API (:3000)
                                  → authMiddleware (JWT verify via jose)
                                  → requirePermission()
                                  → pg pool (node-postgres, direct SQL)
                                  → PostgreSQL
```

Production: Vite static assets served separately; Hono runs as Node.js process.

## Database Client

| Module | File | Usage |
|--------|------|-------|
| `pool` | `server/db/pool.ts` | Connection pool (`pg.Pool`) configured via `DATABASE_URL` |
| `query` | `server/db/query.ts` | `query<T>()`, `queryOne<T>()`, `querySingle<T>()`, `queryCount()`, `tx()` |
| `SqlBuilder` | `server/db/sql-builder.ts` | Fluent query builder with parameterized placeholders |

Frontend NEVER calls database directly for CRUD. Always via Hono API → `fetchApi()`.

## Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Pages | `src/pages/` | UI, routing, compose composables |
| Composables | `src/composables/` | Business logic, state, API calls |
| Services | `src/services/` | `fetchApi()` wrappers — thin HTTP layer |
| UI Components | `src/components/ui/` | Reusable App* wrappers |
| Domain Components | `src/components/thread/` | Domain-specific UI |
| API Routes | `server/routes/` | Hono handlers, validation, DB calls |
| Middleware | `server/middleware/` | Auth, permission guards |
| Auth | `server/auth/` | JWT signing/verify (jose), bcrypt password |
| Realtime | `server/realtime/` | LISTEN/NOTIFY + SSE streaming |
| Validation | `server/validation/` | Zod schemas for request bodies |
| Migrations | `supabase/migrations/` | SQL schema, RPCs, views |
| Storage | `server/storage/` | Filesystem-backed file uploads |

## Key Directories

```
src/
  pages/          file-based routing (unplugin-vue-router)
  composables/    business logic (max 200 lines each)
  services/       fetchApi() wrappers
  components/
    ui/           App* wrappers (AppInput, AppSelect, DatePicker, ...)
    thread/       domain components
  stores/         Pinia stores
  types/          TypeScript types + enums

server/
  routes/         Hono route handlers
  middleware/     auth.ts, requirePermission
  auth/           jwt.ts (jose HS256 sign/verify)
  realtime/       listener.ts (LISTEN/NOTIFY), stream.ts (SSE)
  validation/     Zod schemas
  db/             pool.ts, query.ts, sql-builder.ts
  storage/        filesystem uploads (guide images)
  utils/          telegram-service, notification dispatchers

supabase/
  migrations/     100+ SQL migration files
```

## Dev Ports

| Service | Port |
|---------|------|
| Vite frontend | 5173 |
| Hono backend | 3000 |
| PostgreSQL | 5432 |

## Pattern References

| Pattern | Reference file |
|---------|---------------|
| Server-side pagination | `src/pages/thread/inventory.vue` + `src/composables/thread/useInventory.ts` |
| Excel export | `src/composables/useReports.ts` |
| Realtime (SSE) | `src/composables/useRealtime.ts` + `server/realtime/` |
| Auth middleware | `server/middleware/auth.ts` |
| JWT sign/verify | `server/auth/jwt.ts` |
| Idempotency log | `server/routes/issuesV2.ts` |
| Offline queue | `src/composables/useOfflineSync.ts` |
