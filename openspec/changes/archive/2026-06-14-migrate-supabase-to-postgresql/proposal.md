## Why

The application runs against a local Supabase stack started via `supabase start`, which boots the full platform (postgres + kong + gotrue + postgrest + realtime + storage-api + imgproxy + studio + inbucket + analytics + edge-runtime). On the production server this consumes nearly all available RAM, yet the application only needs PostgreSQL plus a small, well-defined slice of Supabase's data/auth/realtime/storage features. Management mandates removing the Supabase platform dependency. The app already routes all CRUD through the Hono API and enforces authorization in application code (`requirePermission`), so the database-side Row Level Security layer is redundant and will be dropped.

## What Changes

This is a behavior-preserving re-platform from the Supabase platform to plain PostgreSQL + the existing Hono API. It is split into four sequential workstreams, each an independently testable milestone. The mandated order is **data-access → auth → realtime → storage**, because the auth middleware itself queries the database, so the data-access layer must be stable before auth is rewritten.

- **Workstream 1 — Data-access (foundation)**: Replace the `@supabase/supabase-js` PostgREST query builder used across the backend (1026 `.from()` call-sites in 72 files) with a direct PostgreSQL client (`pg`) and a query layer. Translate all 28 `.rpc()` call-sites (16 files) from PostgREST RPC calls to direct SQL invocation (`SELECT ... FROM fn(...)`). The 28 `fn_*` SQL functions themselves remain unchanged in the database. **BREAKING** (internal): the backend Supabase data client is removed. Configure a plain `DATABASE_URL` connection. Drop the RLS migrations (`20260226000004_enable_rls`, `20260226000005_rls_policies`) via a new migration.
- **Workstream 2 — Auth**: Replace Supabase Auth (GoTrue). Backend verifies passwords directly (against the existing `employees.password_hash`), signs its own JWTs with `jose` (replacing `custom_access_token_hook`), and manages refresh tokens in a new table. New/updated endpoints: login, logout, refresh, change-password, reset-password, plus employee create/update wired off GoTrue admin APIs. Frontend drops all `supabase.auth.*` calls and talks to the Hono API instead, preserving the existing employee-id login UX, JWT claims (`employee_id`, `employee_code`, `roles`, `is_root`), refresh-token rotation, and cross-tab sync. **BREAKING** (internal): JWT issuer/verification moves from Supabase JWKS to the app's own signing key.
- **Workstream 3 — Realtime**: Replace Supabase Realtime (`postgres_changes` over WAL) for the three consumers (`useInventory`, `useConeSummary`, `useConflicts`). Introduce a server-pushed change feed (Postgres `LISTEN/NOTIFY` surfaced through a Hono SSE endpoint) behind the existing `useRealtime` composable interface so consumers are unaffected.
- **Workstream 4 — Storage**: Replace Supabase Storage for the `guide-images` bucket (used only in `guides.ts` + two utils) with server-managed file storage served by Hono. Preserve the existing public URL path so previously stored image references keep resolving.

Constraints carried into every workstream: no data deletion (soft-delete only; no `DELETE`/`TRUNCATE`/`DROP` of data), all schema changes via migration files, all user-facing text in Vietnamese, every stock-changing action keeps its audit trail.

## Capabilities

### New Capabilities
- `postgres-data-access`: Backend connects to plain PostgreSQL via a `pg`-based query layer; all table reads/writes and `fn_*` function calls run as direct SQL rather than through PostgREST; RLS is removed and authorization is enforced solely in the application layer.
- `self-hosted-auth`: Authentication is owned by the Hono backend — password verification, JWT issuance/verification with the app's own signing key, refresh-token storage and rotation, and the login/logout/refresh/password endpoints — with no dependency on Supabase GoTrue.
- `server-push-realtime`: Live table-change notifications are delivered to the frontend through a backend channel (Postgres `LISTEN/NOTIFY` → Hono SSE) behind the existing `useRealtime` composable interface, replacing Supabase Realtime.
- `app-managed-storage`: Guide images are stored and served by the application (filesystem/volume + Hono static serving) with URL compatibility for existing references, replacing Supabase Storage.

### Modified Capabilities
<!-- Existing specs (global-auth-middleware, route-authorization, token-refresh-behavior, transient-db-error-handling, guides, guide-image-tracking) describe behavior that must be PRESERVED through this re-platform. Their spec-level requirements (who is authorized, when tokens refresh, error semantics, image tracking) are unchanged — only the underlying provider changes, which is captured by the new capabilities above. No requirement-level deltas are introduced. -->

## Impact

- **Dependencies**: Add `pg` (+ `@types/pg`); add a password-hashing lib compatible with existing `employees.password_hash` (verify bcrypt vs argon2 during design); keep `jose`. Remove `@supabase/supabase-js` once all four workstreams land.
- **Backend**: `server/db/supabase.ts` (replaced by a `pg` pool + query layer); `server/middleware/auth.ts` (JWT verification + permission queries); `server/routes/auth.ts`, `server/routes/employees.ts` (GoTrue admin calls); all 72 files using `.from()` and 16 files using `.rpc()`; `server/routes/guides.ts` + `server/utils/guide-image-linker.ts` + `guide-image-cleanup.ts` (storage).
- **Frontend**: `src/lib/supabase.ts`, `src/services/api.ts`, `src/services/authService.ts`, `src/composables/useAuth.ts` (auth/session/refresh); `src/composables/useRealtime.ts` + `useInventory`/`useConeSummary`/`useConflicts` (realtime).
- **Database**: New migrations to drop RLS, add a refresh-token table, and (if needed) configure `LISTEN/NOTIFY` triggers. The 28 `fn_*` functions and all tables are preserved.
- **Infra/config**: New `DATABASE_URL` and JWT signing-key env vars; `docker-compose.yml` and deployment env drop Supabase URL/anon/service-role/JWT-secret wiring; DB now administered via pgAdmin4.
- **Out of scope**: No business-logic changes, no schema redesign, no data migration beyond dropping RLS policies and adding the refresh-token table.
