## Context

The project-datchi database (39 tables, 198 indexes, PostgreSQL via Supabase) has been built incrementally across multiple migration waves. A comprehensive audit of the live schema revealed structural inconsistencies that need cleanup before production data grows:

- 2 orphaned functions referencing dropped V1 tables (runtime error risk)
- 11 duplicate indexes (UNIQUE constraints already create implicit indexes)
- Mixed enum conventions (lowercase vs UPPERCASE)
- VARCHAR columns that should be ENUMs
- Dual-write columns not yet retired
- Inconsistent naming across triggers, indexes, and constraints

Current state: 0 rows in all tables (development phase). This is the ideal time for cleanup — no data migration complexity.

**Hard constraint:** `employees` table and `positions` table are NOT in scope (used by external project).

## Goals / Non-Goals

**Goals:**
- Remove all orphaned/dead-code functions that would cause runtime errors
- Eliminate duplicate indexes to reduce storage overhead and write amplification
- Standardize all enum values to UPPERCASE convention
- Convert VARCHAR status columns to proper ENUM types for type safety
- Retire dual-write columns where FK already exists
- Standardize naming conventions for triggers, indexes, and constraints
- Fix nullable timestamps that should be NOT NULL
- Sync all backend/frontend code with schema changes

**Non-Goals:**
- No changes to `employees` or `positions` tables (external dependency)
- No business logic changes — purely structural cleanup
- No table renames (e.g., `po_items` stays as-is despite `po_` abbreviation)
- No column renames that would require extensive backend refactoring (e.g., `tex_id` rename is tracked but deferred to avoid cascading changes across style_thread_specs queries)
- No RLS policy changes
- No new features or capabilities

## Decisions

### D1: Single migration file vs multiple files
**Decision:** Single migration file with sectioned DDL, wrapped in a transaction.
**Rationale:** All changes are schema-level DDL (no data transforms needed since 0 rows). A single file is easier to review, test, and rollback. Sections are clearly commented for readability.
**Alternative considered:** One migration per category (6+ files). Rejected because it increases migration ordering complexity and the changes are interdependent (e.g., enum conversion affects constraints).

### D2: Enum conversion approach (VARCHAR → ENUM)
**Decision:** Use ALTER COLUMN TYPE with USING cast for `purchase_orders.priority` and `notifications.type`. For `permission_action`, rename values in-place using ALTER TYPE RENAME VALUE.
**Rationale:** With 0 rows, there's no data migration risk. ALTER TYPE RENAME VALUE is the cleanest approach for existing enums. For new enums, CREATE TYPE + ALTER COLUMN TYPE is standard.
**Alternative considered:** Drop and recreate columns. Rejected because it loses column position and requires constraint recreation.

### D3: View rename approach
**Decision:** DROP VIEW + CREATE VIEW with new name `v_issue_reconciliation`.
**Rationale:** PostgreSQL doesn't support ALTER VIEW RENAME. DROP + CREATE is the standard approach. Backend code referencing the old view name must be updated simultaneously.

### D4: Constraint naming for unnamed UNIQUEs
**Decision:** DROP old unnamed constraint, ADD new named constraint.
**Rationale:** PostgreSQL auto-generates names like `color_supplier_color_id_supplier_id_key` for inline UNIQUE constraints. We rename to `uq_<table>_<columns>` pattern for consistency with `uq_thread_stock_type_warehouse_lot`.

### D5: What to do about `tex_id` in `style_thread_specs`
**Decision:** DEFER to a separate change.
**Rationale:** Renaming `tex_id` → `thread_type_id` would cascade to all queries in style_thread_specs routes, composables, and types. This is a high-risk rename that should have its own change with proper testing. Noted in the audit for future cleanup.

### D6: What to do about `styles.style_code`/`style_name` redundant prefix
**Decision:** DEFER to a separate change.
**Rationale:** Column rename cascades to all PO/style queries across backend and frontend. Too high a blast radius for a naming cleanup migration. Noted for future.

## Risks / Trade-offs

- **[Risk] Enum rename breaks hardcoded values in code** → Mitigation: Full codebase grep for lowercase permission values (`'view'`, `'create'`, etc.) and update all references before migration runs. Backend Zod schemas and frontend types must be updated in sync.

- **[Risk] View rename breaks queries** → Mitigation: Grep for `v_issue_reconciliation_v2` across all backend code and update references. The old view name must not be referenced anywhere after migration.

- **[Risk] Dropping `lots.supplier` VARCHAR breaks code** → Mitigation: Verify no backend code reads `lots.supplier` (should all use `lots.supplier_id` after FK normalization). If code exists, update to use FK join.

- **[Risk] Dropping `assigned_at` breaks code** → Mitigation: Grep for `assigned_at` in backend routes and services. Ensure all code uses `created_at` instead.

- **[Risk] Index rename breaks nothing** → No code references index names directly. PostgreSQL handles transparently. Zero risk.

- **[Trade-off] Single migration = all-or-nothing** → Acceptable because all changes are DDL-only with 0 rows. If any section fails, the entire transaction rolls back cleanly.

## Migration Plan

1. **Pre-migration:** Run backend code sync (update types, Zod schemas, route handlers)
2. **Run migration:** `supabase migration up` (NOT `supabase db reset`)
3. **Post-migration:** Verify with `\dt`, `\di`, `\df`, `\dT+` in psql
4. **Rollback:** Reverse migration script provided (recreate dropped objects, rename back)

## Open Questions

None — all decisions are made. The scope is well-defined by the audit data.
