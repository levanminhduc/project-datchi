# CLAUDE.md

## 1. Project Overview

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

When asked about the codebase, project structure, or to find code, always use the context-engine MCP tool (codebase-retrieval) in the root workspace first before reading individual files. Use `codebase-retrieval` instead of the Explore subagent for codebase exploration and search tasks.

When you need to read a specific file but don't know the exact line range, use the file-retrieval MCP tool instead of reading the entire file. Describe what information you need and it returns only the relevant snippets with line numbers. Use the Read tool with the returned line ranges (expanded as needed) to get current content before making edits.

Thread Inventory Management System for Vietnamese garment manufacturing (B2B).
Tracks thread cones from purchase order through delivery, allocation, issue to production, and recovery.
Core invariant: a thread type identity = exact combination of Supplier (NCC) + Tex number + Thread color — never merge inventory across this boundary.

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Vue 3 + Quasar 2 | 3.5.21 + 2.17.10 |
| Language | TypeScript | 5.9.2 |
| Build | Vite | 8.0.11 |
| Backend | Hono on Node.js (tsx) | 4.11.5 + 4.21.0 |
| Database | Supabase PostgreSQL | cloud + local |
| Validation | Zod | 4.3.6 |
| State | Pinia | 3.0.4 |
| Auth | jose (JWT) | 6.1.3 |
| Testing | Playwright | 1.58.2 |

## 3. Dev Commands

```bash
npm install             # Install dependencies
npm run dev             # Frontend only (Vite :5173)
npm run server          # Backend only (Hono :3000)
npm run dev:all         # Both concurrently

npm run type-check      # vue-tsc --build --force
npm run lint            # ESLint --fix
npm run build           # type-check + vite build

npm run e2e             # Playwright headless
npm run e2e:ui          # Playwright UI mode
npm run e2e:headed      # Playwright headed

supabase migration up   # Apply pending DB migrations (SAFE)
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres
npm run db:seed         # Seed master data (local only)
```

## 4. Core Logic Summary

**Thread type identity:** 1 thread type = Supplier + Tex number + Color. Different supplier or different color = different thread type, separate inventory.

**Cone-level inventory:** Every physical cone is a row in `thread_inventory` with a unique ID, status, and full audit trail via `thread_movements`.

**Dual UoM:** Each cone tracks `quantity_meters` AND `weight_grams`. Both must be updated on every movement.

**FEFO allocation:** Cones allocated First-Expired First-Out via RPC `fn_dept_allocate`. AllocationStatus: PENDING → CONFIRMED → ISSUED.

**Issue V2:** Multi-color issue flow. RPC `fn_issue_cones_with_movements`. Idempotency log prevents double-execute on retry.

**Recovery:** Cones returned from production → status transitions back to AVAILABLE. No dedicated RPC — handled in `server/routes/recovery.ts`.

**Weekly order → reservation → loan:** Calculate needs → reserve stock (`fn_reserve_from_stock`) → optional loans between depts (`fn_batch_borrow_thread`) → transfer reserved across POs.

## 5. Key Constraints

- **`supabase db reset` — NEVER run.** Deletes all data. Use `supabase migration up` only.
- **Never delete data rows.** Use soft-delete (`deleted_at` or status enum). No `DELETE`/`TRUNCATE`/`DROP` without explicit user confirmation.
- **Never merge inventory** across supplier + tex + color boundary.
- **`thread_types.color_id` is NULL for all records** — never use it as color source. Use `thread_inventory.color_id` for stock, `style_color_thread_specs.thread_color_id` for PO specs.
- **Frontend CRUD always via Hono API** — never call Supabase directly for data mutations. Use `fetchApi()`, not raw `fetch()`.
- **Use App* wrappers:** `AppSelect` (not `q-select`), `AppEditor` (not `q-editor`), `DatePicker` (not `<input type="date">`), `useConfirm()` (not `$q.dialog()`).
- **Vietnamese for all user-facing text** — messages, labels, toasts, validation, buttons.
- **Stock-changing actions need audit trail** — every inventory mutation must log to `thread_movements` or use an RPC that does so internally.
- **Schema changes via migrations only** — new tables, enums, columns: create a `.sql` file in `supabase/migrations/`.

## 6. Additional Documentation

| File | When to read |
|------|-------------|
| `.claude/docs/architecture.md` | Understanding request flow, layer responsibilities, dir structure |
| `.claude/docs/thread-domain.md` | Thread identity rules, cone lifecycle, FEFO, dual UoM, color ID gotchas |
| `.claude/docs/database-rpcs-migrations.md` | Writing queries, calling RPCs, migration rules, PostgREST limits |
| `.claude/docs/frontend-conventions.md` | Component wrappers, fetchApi, TypeScript rules, pagination |
| `.claude/docs/backend-api.md` | Response format, route order, validation, error handling |
| `.claude/docs/auth-permissions.md` | JWT claims, requirePermission, adding permissions, RLS |
| `.claude/docs/weekly-order-issue-recovery.md` | Weekly order flow, Issue V2, recovery, loans, schema exceptions |
| `.claude/docs/safety-and-workflow.md` | Dangerous commands, surgical changes, pre-commit checklist |
