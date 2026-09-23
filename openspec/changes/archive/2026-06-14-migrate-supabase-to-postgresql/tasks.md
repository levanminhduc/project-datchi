## 0. Pre-flight (shared)

- [ ] 0.1 Confirm a plain PostgreSQL instance is reachable via pgAdmin4 and capture the connection string for `DATABASE_URL`
- [ ] 0.2 Inventory the exact `.from()` (1026 sites / 72 files) and `.rpc()` (28 sites / 16 files) call-sites with a grep snapshot committed as a checklist reference
- [ ] 0.3 Confirm the 28 `fn_*` functions exist in the target DB and run unchanged (list from proposal)

## 1. Workstream 1 — Data-access (foundation)

- [x] 1.1 Add `pg` and `@types/pg` to `package.json`; keep `@supabase/supabase-js` for now (removed only after W4)
- [x] 1.2 Add `DATABASE_URL` to env config and `.env` example; wire it in `docker-compose.yml` backend service
- [x] 1.3 Create `server/db/pool.ts` exporting a shared `pg` Pool from `DATABASE_URL` (fail fast if unset)
- [x] 1.4 Create `server/db/query.ts` query layer: `query<T>(text, params)`, `queryOne<T>` (single/maybeSingle semantics), `tx(fn)` transaction wrapper
- [x] 1.5 Add helper utilities mirroring PostgREST idioms (where-builder for eq/in/or/ilike, order, range→limit/offset, exact count) ← (verify: helpers reproduce `.single/.maybeSingle/.range/.order/.or/.ilike/.in` and `count head:true` semantics exactly)
- [x] 1.6 Translate `.from()` reads/writes in `server/middleware/auth.ts` FIRST (permission queries incl. nested embed `roles!inner(role_permissions(permissions(code)))` → JSON-shape-preserving SQL) ← (verify: permission set returned matches prior shape; all guarded routes still authorize)
- [x] 1.7 Translate `.rpc()` sites (28 across 16 files) to `SELECT * FROM fn(...)` / `SELECT fn(...)`, preserving return shape and atomicity (stock-changing fns keep audit writes) ← (verify: `fn_issue_cones_with_movements`, `fn_dept_allocate`, `fn_reserve_from_stock` still write movement/audit rows in-transaction)
- [x] 1.8 Translate remaining `.from()` sites cluster-by-cluster across the 72 files (route handlers, services, utils); run type-check + lint after each cluster
- [x] 1.9 Replace `server/db/supabase.ts` data usage so no table read/write goes through `@supabase/supabase-js` (auth admin client may remain until W2)
- [x] 1.10 Create forward migration to DROP RLS policies and DISABLE RLS (supersedes `20260226000004_enable_rls`, `20260226000005_rls_policies`); no DROP TABLE, no data deletion ← (verify: migration runs clean via `supabase migration up`/psql; no policy remains; data intact)
- [x] 1.11 GATE W1: `npm run type-check` + `npm run lint` clean; `npm run e2e` green against plain Postgres; smoke-test key screens (inventory, allocation, weekly order). Rollback note: revert W1 commits to restore Supabase data client.

## 2. Workstream 2 — Auth

- [x] 2.1 Inspect an existing `employees.password_hash` prefix to confirm scheme (bcrypt `$2a/$2b` vs argon2 `$argon2`); add the matching verify lib
- [x] 2.2 Create migration for `auth_refresh_tokens` table (hashed token, employee_id, expires_at, revoked_at, rotated_from); no data deletion
- [x] 2.3 Add JWT signing env (`JWT_SIGNING_SECRET`); create `server/auth/jwt.ts` issuing tokens with `jose` carrying claims `employee_id`, `employee_code`, `roles`, `is_root`, `sub`, `iat`, `exp` (replaces `custom_access_token_hook`) ← (verify: decoded claims byte-match prior shape)
- [x] 2.4 Rewrite `verifySupabaseToken` in `server/middleware/auth.ts` to verify with the app key; reject foreign issuers; reuse existing permission queries ← (verify: valid app token passes, Supabase-signed token rejected)
- [x] 2.5 Implement `POST /api/auth/login` (verify password → issue access + refresh, persist refresh row)
- [x] 2.6 Implement `POST /api/auth/refresh` (validate refresh, rotate: issue new + revoke old, detect reuse, reject expired)
- [x] 2.7 Implement `POST /api/auth/logout` (revoke refresh row server-side)
- [x] 2.8 Implement `POST /api/auth/change-password` and `POST /api/auth/reset-password/:id` writing in-app hash to `employees` (drop GoTrue admin calls); place `/reset-password/:id` ordering correctly relative to any generic `/:id`
- [x] 2.9 Rewire `server/routes/employees.ts` create/update to write `employees` directly with in-app hashing (no `admin.createUser/updateUserById/deleteUser`)
- [x] 2.9a Remove the `POST /api/auth/ensure-auth-user` endpoint in `server/index.ts` (lazy GoTrue-user provisioning has no meaning under self-hosted auth — the `employees` row IS the identity); ensure nothing else calls it
- [x] 2.9b Stop reading/writing `employees.auth_user_id` and the `<id>@internal.datchi.local` email convention anywhere in auth/employee flows; KEEP the column and its data intact (no migration to drop it) as inert rollback-safe residue ← (verify: grep shows no remaining read/write of `auth_user_id`; column still present in DB with data untouched)
- [x] 2.10 Frontend: remove `supabase.auth.*` from `src/services/authService.ts`, `src/services/api.ts`, `src/composables/useAuth.ts`, `src/lib/supabase.ts`, and `src/services/importService.ts` (streaming import must read the access token from the shared token store, not `supabase.auth.getSession()`); call new endpoints; preserve token storage, refresh-on-401 retry, cross-tab BroadcastChannel single-flight ← (verify: login UX unchanged, 401→refresh→retry works, cross-tab single-flight holds, streaming import still authenticated)
- [x] 2.11 Remove the `supabaseAdmin` auth client from `server/db/supabase.ts`
- [x] 2.12 GATE W2: type-check + lint clean; e2e for login/logout/refresh/change-password/permission-denied green; manual login + navigate test. Rollback note: revert W2 commits + drop `auth_refresh_tokens`; re-enable GoTrue wiring.

## 3. Workstream 3 — Realtime

- [x] 3.1 Create migration adding triggers on the **two watched tables** (`thread_inventory`, `allocation_conflicts`) that `pg_notify` a compact JSON payload (`{ table, eventType, id }`) within the NOTIFY size limit ← (verify: triggers exist on exactly these two tables; INSERT/UPDATE/DELETE each emit a payload under the 8000-byte limit)
- [x] 3.2 Create `server/realtime/listener.ts`: a long-lived `pg` client issuing `LISTEN`, parsing payloads, fanning out to subscribers
- [x] 3.3 Implement authenticated Hono SSE endpoint `GET /api/realtime/stream` (text/event-stream) behind JWT middleware, forwarding matching events ← (verify: unauthenticated rejected; authenticated receives events)
- [x] 3.4 Swap `src/composables/useRealtime.ts` internals from `supabase.channel(...).on('postgres_changes')` to `EventSource` against the SSE endpoint; keep public interface (`subscribe/unsubscribe/unsubscribeAll/status`), client-side table/event/filter matching, exponential-backoff reconnect ← (verify: `useInventory`/`useConeSummary` (table `thread_inventory`) and `useConflicts` (table `allocation_conflicts`) unchanged and still update live)
- [x] 3.5 GATE W3: type-check + lint clean; manual test that the three live screens update on data change; reconnect after drop restores subscriptions. Rollback note: revert W3 commits + drop NOTIFY triggers; restore Supabase channel internals.

## 4. Workstream 4 — Storage

- [x] 4.1 Add `STORAGE_DIR` env; mount a durable volume for it in `docker-compose.yml`; fail fast if unusable
- [x] 4.2 Implement Hono static serving at `/storage/v1/object/public/guide-images/<path>` from `STORAGE_DIR` (URL shape preserved exactly) ← (verify: a previously stored image URL still resolves)
- [x] 4.3 Switch `server/routes/guides.ts` upload/download/remove from bucket calls to filesystem ops; remove deletes served file only, DB refs follow soft-delete
- [x] 4.4 Update `server/utils/guide-image-linker.ts` and `guide-image-cleanup.ts` to compute/compare the preserved URL shape; cleanup never removes referenced files ← (verify: linker produces same URL shape; referenced files retained)
- [x] 4.5 GATE W4: type-check + lint clean; upload + view + remove a guide image; confirm old image references resolve. Rollback note: revert W4 commits; restore Supabase Storage calls.

## 5. Decommission & finalize

- [x] 5.1 Remove `@supabase/supabase-js` from `package.json` and delete `src/lib/supabase.ts` / `server/db/supabase.ts` once all four workstreams are green
- [x] 5.1a Delete the obsolete Supabase-only scripts: `scripts/migrate-auth-users.ts` (GoTrue user provisioning, dead after W2) and `scripts/backfill-guide-images.ts` (reads Supabase `storage.objects`, dead after W4) ← (verify: no remaining file imports `@supabase/supabase-js`; both scripts removed)
- [x] 5.2 Strip Supabase URL/anon/service-role/JWT-secret wiring from all env and infra files: `.env.example`, `.env.docker.example`, `docker-compose.yml`, `docker-compose.ghcr.yml`, `docker/volumes/kong/kong.yml`, `.github/workflows/docker-publish.yml`; ensure the new vars (`DATABASE_URL`, `JWT_SIGNING_SECRET`, `STORAGE_DIR`) are present in the env examples; document pgAdmin4 administration ← (verify: grep for `SUPABASE_`/`VITE_SUPABASE`/`NEXT_PUBLIC_SUPABASE` returns nothing in these files; new vars documented)
- [x] 5.3 FINAL GATE: full `npm run build` + `npm run e2e` green; full manual smoke across auth, inventory, realtime screens, and guide images ← (verify: no remaining Supabase import anywhere; app runs against plain Postgres only)
