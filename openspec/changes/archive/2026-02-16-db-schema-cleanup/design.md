## Context

The Thread Inventory Management System (Vue 3 + Hono + Supabase) has accumulated schema inconsistencies over iterative development. A 3-phase audit identified 26 potential improvements, which were filtered through internal code impact analysis (researcher agent scanning all file references) and external research (PostgreSQL docs, Supabase conventions, ERP industry patterns), then challenged by a senior review.

The result: 5 items with high confidence, low risk, and clear benefit. The remaining 21 were explicitly rejected (cost > benefit, audit errors, or deferred for future work).

Current state of the 5 items:
- `style_thread_specs.tex_id` — FK to `thread_types` but named inconsistently with all other FKs to that table (which use `thread_type_id`)
- `thread_conflicts.status` — VARCHAR(20) with CHECK constraint instead of proper enum
- `thread_movements.from_status/to_status` — VARCHAR(50) storing cone status values, while `thread_inventory.status` uses `cone_status` enum
- `thread_issue_lines` — missing composite index for common query pattern
- `thread_issue_return_logs` — missing FK index on `line_id`

## Goals / Non-Goals

**Goals:**
- Rename `tex_id` → `thread_type_id` for FK naming consistency
- Convert 3 varchar columns to enum types for data integrity enforcement
- Add 2 indexes for query performance
- Update all backend/frontend code references to match schema changes
- Zero data loss, zero downtime (single-backend deployment)

**Non-Goals:**
- Rename `employee_id`, `cone_id`, `lot_number` (cost >> benefit, validated by research)
- Change enum case convention (UPPERCASE status enums stay; lowercase category enums stay)
- Add `deleted_at` to more tables (already done in prior migration 20260215100400)
- Refactor `performed_by`/`created_by` to FK (ERPNext validates VARCHAR for audit fields)
- Redesign `thread_stock` vs `thread_inventory` (architecture concern, separate effort)

## Decisions

### 1. Single migration file for all 5 items

**Decision**: All 5 changes in one migration within a single transaction.

**Rationale**: All items are independent at the DB level. If any fails, the entire transaction rolls back cleanly. One migration = one review, one deploy, one rollback point. The alternative (5 separate migrations) adds deployment complexity with no benefit for changes this small.

### 2. Direct rename instead of Expand-Contract pattern

**Decision**: Use `ALTER TABLE RENAME COLUMN` directly, not the Expand-Contract pattern.

**Rationale**: Research confirmed `ALTER TABLE RENAME COLUMN` is instant in PostgreSQL (metadata-only, no table rewrite). The project has a single backend (Hono) and single frontend — we can coordinate code deployment with migration. Expand-Contract is for multi-service, zero-downtime environments (Stripe, GitHub scale). Overkill here.

### 3. Column type conversion via USING clause

**Decision**: Convert varchar → enum with `ALTER COLUMN TYPE ... USING column::enum_type`.

**Rationale**: PostgreSQL supports direct casting from varchar to enum when values match. `thread_conflicts` table has zero data (verified from backup). `thread_movements` data uses standard cone_status values inserted by RPC functions. A pre-migration verification query is included as safety check.

### 4. RPC function recreation for from_status/to_status

**Decision**: Recreate `fn_issue_allocation` and `fn_recover_cone` to remove `::VARCHAR` casts when inserting into `from_status`/`to_status`.

**Rationale**: Current RPC functions cast `cone_status` → VARCHAR before inserting (e.g., `v_cone.status::VARCHAR`). After converting columns to `cone_status` enum, these casts become unnecessary and should be removed for type safety. PostgreSQL allows implicit `cone_status` → `cone_status` assignment.

### 5. PostgREST join syntax update

**Decision**: Update PostgREST nested select syntax from `thread_types:tex_id(...)` to `thread_types:thread_type_id(...)` in all affected route files.

**Rationale**: PostgREST uses FK constraints (not column names) for auto-detection, so `thread_types(*)` would still work. However, the explicit `thread_types:column_name(...)` syntax used in the codebase references the column name directly. After rename, these must match the new column name. `NOTIFY pgrst, 'reload schema'` is required after FK changes.

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `from_status`/`to_status` data contains values outside `cone_status` enum | Low | Migration fails (rolls back safely) | Pre-migration query to verify: `SELECT DISTINCT from_status FROM thread_movements WHERE from_status NOT IN (enum values)` |
| PostgREST cache stale after FK rename | Medium | Nested select queries fail | `NOTIFY pgrst, 'reload schema'` at end of migration |
| Missed `tex_id` reference in code | Low | Runtime error on style_thread_specs queries | Grep-verified: only 5 code files reference `tex_id`. Seed files and plan docs don't need updating. |
| RPC function recreation breaks behavior | Low | Issue/recovery flow fails | Functions are `CREATE OR REPLACE` — only the `::VARCHAR` casts change. Logic is identical. |

## Migration Plan

### Deploy steps
1. Backup database: `pg_dump`
2. Run pre-migration data verification queries
3. Apply migration: `supabase migration up`
4. Deploy updated backend code (3 route files)
5. Deploy updated frontend code (2 files)
6. Regenerate TypeScript types: `supabase gen types typescript`
7. Verify nested select queries work (PostgREST schema reloaded by migration)

### Rollback
- If migration fails: automatic rollback (transaction)
- If code issues post-deploy: revert code + run reverse migration (`RENAME COLUMN thread_type_id TO tex_id`, drop enums, etc.)

## Open Questions

None — all questions resolved during the 3-phase audit process.
