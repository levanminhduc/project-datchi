## Context

The application currently depends on a full Supabase platform booted locally via `supabase start` (postgres + kong + gotrue + postgrest + realtime + storage-api + imgproxy + studio + inbucket + analytics + edge-runtime). On the production server this stack consumes nearly all available RAM, while the application only uses PostgreSQL plus a thin slice of Supabase's auth/realtime/storage features. Management mandates removing the Supabase platform dependency.

Current state, measured against the codebase:
- **Data-access**: 1026 `.from()` call-sites across 72 files and 28 `.rpc()` call-sites across 16 files, all routed through `@supabase/supabase-js`'s PostgREST query builder. The backend client lives in `server/db/supabase.ts` (`supabase` anon client + `supabaseAdmin` service-role client).
- **Auth**: `server/middleware/auth.ts` verifies JWTs via Supabase JWKS (RS256/ES256) with an HS256 fallback, then queries `employee_roles → roles → role_permissions → permissions` to build the permission set. Token claims (`employee_id`, `employee_code`, `roles`, `is_root`) are minted by the Postgres `custom_access_token_hook` (migration `20260226000002`). `server/routes/auth.ts` and `server/routes/employees.ts` call GoTrue admin APIs (`signInWithPassword`, `admin.createUser/updateUserById/deleteUser`). A third backend GoTrue call lives in `server/index.ts` — the `POST /api/auth/ensure-auth-user` endpoint lazily creates a GoTrue user for an employee via `supabaseAdmin.auth.admin.createUser`, then stores the resulting id in `employees.auth_user_id` (using the `<id>@internal.datchi.local` email convention). Frontend session handling lives in `src/lib/supabase.ts`, `src/services/api.ts`, `src/services/authService.ts`, `src/composables/useAuth.ts`; additionally `src/services/importService.ts` calls `supabase.auth.getSession()` to attach a bearer token to its streaming-import `fetch`.
- **Realtime**: three consumers (`useInventory`, `useConeSummary`, `useConflicts`) use Supabase Realtime `postgres_changes` over WAL through `src/composables/useRealtime.ts`. They watch **two distinct tables**: `useInventory` and `useConeSummary` both subscribe to `thread_inventory`; `useConflicts` subscribes to `allocation_conflicts`.
- **Storage**: only `server/routes/guides.ts` plus `server/utils/guide-image-linker.ts` and `guide-image-cleanup.ts` use the `guide-images` bucket. Public URLs follow `/storage/v1/object/public/guide-images/<path>`.

Constraints carried into every workstream: no data deletion (soft-delete only), all schema changes via migration files, all user-facing text in Vietnamese, every stock-changing action keeps its audit trail. Authorization is already enforced in application code via `requirePermission`, so RLS is redundant and will be dropped. DB administration moves to pgAdmin4.

## Goals / Non-Goals

**Goals:**
- Remove the Supabase platform runtime dependency so production runs PostgreSQL + the Hono API only.
- Preserve all existing business behavior, JWT claim shape, login UX, refresh-token rotation semantics, image URL compatibility, and audit trails.
- Deliver the migration as four sequential, independently testable milestones in the mandated order **data-access → auth → realtime → storage**.
- Keep the 28 `fn_*` SQL functions and all tables intact; only the call mechanism changes.

**Non-Goals:**
- No business-logic changes, no schema redesign, no data migration beyond dropping RLS policies and adding the refresh-token table.
- No change to the public API response contract (`{ data, error, message? }`) or to route paths.
- No replacement of the `fn_*` functions themselves (they stay as Postgres SQL functions).
- No introduction of a heavyweight ORM — the query layer is thin and SQL-first.

## Decisions

### D1 — Data-access: `pg` Pool + thin query layer (not an ORM)

Replace `@supabase/supabase-js` with `pg` (node-postgres) exposing a single shared `Pool` configured from `DATABASE_URL`. Introduce a `server/db/` query layer that provides:
- `query<T>(text, params)` — parameterized SQL, returns typed rows.
- `queryOne<T>(text, params)` — single-row helper replacing `.single()` / `.maybeSingle()`.
- `tx(fn)` — transaction wrapper using a dedicated client checkout for multi-statement atomicity.

**Why `pg` over an ORM (Prisma/Drizzle/Kysely):** The codebase already centralizes data access and relies on hand-tuned PostgREST queries and 28 SQL functions. A SQL-first thin layer is the smallest behavior-preserving change, avoids a schema-introspection/codegen step, and keeps the `fn_*` functions as the source of truth for atomic operations. An ORM would add a large dependency and a parallel schema definition with no benefit here.

**Translating PostgREST idioms to SQL:**
- `.from('t').select('a,b')` → `SELECT a, b FROM t`.
- Nested embeds (e.g. `roles!inner(role_permissions(permissions(code)))`) → explicit `JOIN`s, or `json_agg`/`jsonb_build_object` when the caller expects a nested object/array shape. Each embed site is converted to return the same JSON shape the caller already consumes.
- `.eq/.neq/.gt/.lt/.gte/.lte/.like/.ilike/.in/.is` → SQL `WHERE` predicates with bound parameters.
- `.or('a.eq.1,b.eq.2')` → `WHERE (a = $1 OR b = $2)`.
- `.range(from,to)` → `LIMIT (to-from+1) OFFSET from`.
- `.order('c',{ascending:false})` → `ORDER BY c DESC`.
- `.single()` → expect exactly one row (error if not); `.maybeSingle()` → first row or null.
- `count: 'exact', head: true` → `SELECT count(*) ...`.
- `.rpc('fn_x', args)` → `SELECT * FROM fn_x($1, $2, ...)` (set-returning) or `SELECT fn_x(...)` (scalar), preserving the existing return-shape contract. The 28 functions are unchanged in the DB.

**RLS removal:** a new forward migration drops the policies/enable-RLS introduced by `20260226000004_enable_rls` and `20260226000005_rls_policies`. Since the `pg` connection uses a privileged role and authorization is enforced in `requirePermission`, RLS is redundant. No `DROP TABLE`/data deletion — only `DROP POLICY` / `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.

### D2 — Auth: self-issued JWTs with `jose`, password verify in-app, refresh-token table

The backend becomes the identity authority:
- **Password verification**: verify the submitted password against `employees.password_hash` directly. The hashing scheme (bcrypt vs argon2) is confirmed during W2 task 1 by inspecting an existing hash prefix (`$2a$/$2b$` → bcrypt, `$argon2` → argon2); the matching verify library is added then. No password re-hashing of existing rows.
- **Access tokens**: signed with `jose` using an app-owned key from env. Claims preserve the exact existing shape (`employee_id`, `employee_code`, `roles`, `is_root`, plus standard `sub/iat/exp`). This replaces `custom_access_token_hook`. Algorithm: HS256 with a strong `JWT_SIGNING_SECRET` (symmetric, simplest for a single-issuer backend), keeping the door open to RS256 later.
- **Refresh tokens**: a new `auth_refresh_tokens` table (migration) stores hashed refresh tokens with `employee_id`, `expires_at`, `revoked_at`, `rotated_from`. Rotation on each refresh (issue new, revoke old) preserves the current `enable_refresh_token_rotation` behavior with a reuse-detection guard.
- **Endpoints** (Hono): `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `POST /api/auth/change-password`, `POST /api/auth/reset-password/:id`. Employee create/update endpoints drop the GoTrue admin calls and write `employees` directly (hash password in-app on set/reset). The `POST /api/auth/ensure-auth-user` endpoint in `server/index.ts` is **removed**: with self-hosted auth there is no separate "auth user" to provision — identity is the `employees` row itself, so lazy GoTrue-user creation no longer has meaning.
- **Orphan column**: `employees.auth_user_id` (and the `<id>@internal.datchi.local` email convention) are GoTrue residue. Per the no-data-deletion constraint the column is **kept in place but no longer read or written**; it is retained as inert data so a W2 rollback can restore GoTrue wiring without a schema change.
- **Middleware**: `verifySupabaseToken` is replaced by app-key verification; the permission-building queries are reused unchanged (they ran through the data-access layer migrated in W1).

**Why HS256/jose over keeping JWKS:** the app is a single backend issuer/verifier; a symmetric secret is the least-moving-parts option and removes the JWKS/GoTrue dependency entirely. `jose` is already a dependency.

**Frontend**: remove all `supabase.auth.*` calls. `src/services/authService.ts` calls the new endpoints; `src/services/api.ts` stores tokens (localStorage, preserving the protected-storage abstraction), attaches `Authorization`, and runs the refresh flow against `POST /api/auth/refresh`. `src/services/importService.ts` currently reads the access token via `supabase.auth.getSession()` for its streaming-import `fetch`; it switches to the shared token store (the same source `api.ts` uses) so the streaming request still carries a valid bearer token. The employee-id login UX (`<id>@internal.datchi.local` convention can be dropped since GoTrue is gone — login is by employee_id + password), cross-tab `BroadcastChannel` sync, and refresh-on-401 behavior are preserved.

### D3 — Realtime: Postgres `LISTEN/NOTIFY` → Hono SSE behind the existing composable

Replace Supabase Realtime with a server-push channel:
- DB triggers on the **two watched tables** (`thread_inventory`, `allocation_conflicts`) `pg_notify` a channel with a **minimal** JSON payload (`{ table, eventType, id }`) — added via migration. The payload is intentionally minimal (no full `new`/`old` row) to stay within the NOTIFY 8000-byte limit; consumers refetch the full row if they need more than the changed id.
- A dedicated long-lived `pg` client in the backend issues `LISTEN` and fans notifications out to connected SSE clients through a Hono `GET /api/realtime/stream` endpoint (text/event-stream). The endpoint is authenticated with the same JWT middleware.
- `src/composables/useRealtime.ts` keeps its public interface (`subscribe(options, callback)`, `unsubscribe`, `unsubscribeAll`, `status`, reconnect/backoff) but its internals switch from `supabase.channel(...)` to an `EventSource` against the SSE endpoint, with client-side filtering by `table`/`event`/`filter`. The **three consumers map onto the two tables**: `useInventory` and `useConeSummary` both watch `thread_inventory`; `useConflicts` watches `allocation_conflicts`. All three consumers are unchanged.

**Why LISTEN/NOTIFY + SSE over polling or WebSocket:** NOTIFY reuses Postgres' existing change-detection without WAL/Realtime, SSE is a one-directional server-push that maps cleanly onto the read-only consumers and survives proxies, and keeping the composable interface means zero consumer churn. Polling was rejected as higher-latency and higher-load; a bespoke WebSocket server is more moving parts than these read-only feeds need.

### D4 — Storage: filesystem volume + Hono static serving, URL-compatible

Replace Supabase Storage for `guide-images`:
- Files are written to a configured directory (env `STORAGE_DIR`, mounted as a Docker volume) under a `guide-images/` subpath.
- `server/routes/guides.ts` upload/download/remove switch from bucket calls to filesystem operations (write/read/soft-handling). Remove is a delete of the served file only; DB references follow existing soft-delete rules.
- Hono serves the existing public path **`/storage/v1/object/public/guide-images/<path>`** so previously stored image references keep resolving. The path is preserved exactly; only the server backing it changes.
- `guide-image-linker.ts` / `guide-image-cleanup.ts` are updated to compute/compare the same URL shape.

**Why filesystem over re-introducing an S3/MinIO service:** the only bucket is `guide-images` with modest volume; a directory on a mounted volume is the lightest option that meets the RAM-reduction goal. Preserving the URL path avoids a data-rewrite of stored references.

## Risks / Trade-offs

- **[Largest blast radius is W1: 1026 + 28 call-sites]** → Migrate file-by-file behind the stable query-layer API; run `npm run type-check` + `lint` + targeted Playwright e2e after each cluster of files; the query layer's `.single/.maybeSingle/range/order` helpers mirror PostgREST semantics to reduce per-site divergence.
- **[Nested-embed shape drift]** → Each embed site is the highest-risk translation. Mitigation: convert to `json_agg`/`jsonb_build_object` returning the identical shape and assert the consumer's TypeScript type still compiles; smoke-test the affected screen.
- **[Auth rewrite can lock everyone out]** → W2 lands only after W1 is stable (auth middleware depends on DB queries). Mitigation: keep claim shape byte-compatible, add login/refresh e2e before cutover, and verify password-hash scheme against a real row before choosing the verify lib.
- **[Refresh-token rotation race / reuse]** → Mitigation: store rotation lineage (`rotated_from`) and revoke-on-reuse; preserve the existing cross-tab single-flight refresh guard in `api.ts`.
- **[NOTIFY payload 8000-byte limit]** → Send only `{ table, eventType, id }` (or minimal new/old keys) and let consumers refetch if they need full rows; avoid large row payloads in NOTIFY.
- **[SSE connection limits / reconnect storms]** → Reuse the composable's existing exponential-backoff reconnect; cap concurrent streams; authenticate the endpoint.
- **[Lost image files on volume]** → Document the volume mount as the durable store; cleanup never hard-deletes referenced files; preserve URL path so no reference rewrite is needed.
- **[Dropping RLS removes defense-in-depth]** → Accepted per management decision; authorization remains enforced by `requirePermission` on every route. Mitigation: verify no route relied implicitly on RLS (all CRUD already flows through guarded Hono endpoints).
- **[Obsolete Supabase scripts left behind]** → `scripts/migrate-auth-users.ts` (GoTrue user creation) becomes obsolete after W2 and `scripts/backfill-guide-images.ts` (reads Supabase `storage.objects`) after W4. Mitigation: remove both during decommission so no dead code reaches for a removed Supabase client.
- **[Stale Supabase env/infra wiring]** → `.env.example`, `.env.docker.example`, `docker-compose.yml`, `docker-compose.ghcr.yml`, `docker/volumes/kong/kong.yml`, and `.github/workflows/docker-publish.yml` all carry Supabase URL/anon/service-role/JWT-secret wiring. Mitigation: W1 adds `DATABASE_URL`, W2 adds `JWT_SIGNING_SECRET`, W4 adds `STORAGE_DIR`; decommission strips the Supabase variables from all of these files so the new deployment has a single source of truth.

## Migration Plan

Sequential, each workstream a deployable/testable milestone:

1. **W1 Data-access** — add `pg` + query layer, configure `DATABASE_URL`, translate all `.from()`/`.rpc()` sites, add RLS-drop migration. Gate: type-check + lint + full e2e green against plain Postgres.
2. **W2 Auth** — add `auth_refresh_tokens` migration, confirm hash scheme, build login/logout/refresh/change/reset endpoints + middleware verify, rewire employee create/update, switch frontend off `supabase.auth.*`. Gate: login/refresh/logout/permission e2e green.
3. **W3 Realtime** — add NOTIFY triggers migration on the two watched tables (`thread_inventory`, `allocation_conflicts`), build LISTEN→SSE endpoint, swap composable internals. Gate: the three live screens (inventory, cone-summary, conflicts) update on data change.
4. **W4 Storage** — add `STORAGE_DIR`, switch guides storage + URL serving. Gate: existing image URLs resolve, upload/remove work.
5. **Decommission** — after all four workstreams are green: remove `@supabase/supabase-js`, delete the obsolete scripts (`migrate-auth-users.ts`, `backfill-guide-images.ts`), and strip Supabase wiring from every env/infra file (`.env.example`, `.env.docker.example`, `docker-compose.yml`, `docker-compose.ghcr.yml`, `docker/volumes/kong/kong.yml`, `.github/workflows/docker-publish.yml`).

**Rollback strategy:** each workstream is a separate set of commits on the branch. Because Supabase config remains until W4 completes, any workstream can be reverted independently by reverting its commits and restoring the prior client wiring; `@supabase/supabase-js` is only removed after all four land. No forward migration deletes data, so DB rollback is limited to re-enabling RLS (kept as a down-migration note) and dropping the new tables/triggers if reverting.

## Open Questions

- Password hash scheme (bcrypt vs argon2) — resolved empirically in W2 task 1 by inspecting an existing `employees.password_hash` prefix.
- Exact `DATABASE_URL` role/privileges in production (single app role assumed) — confirm with the pgAdmin4-managed instance during W1 setup.
