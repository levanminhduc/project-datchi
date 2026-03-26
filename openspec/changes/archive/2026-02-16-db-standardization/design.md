## Context

The project-datchi database (42 tables, 25 functions, 41 triggers, 14 enums) has grown organically with several inconsistencies discovered via live database analysis:

**Current state:**
- `thread_types` has FK columns (`color_id`, `supplier_id`) that are 100% NULL — legacy text columns (`color`, `supplier`) are still the only data source
- v1 and v2 issue systems run in parallel: v1 has 1 request + 0 items, v2 has 6 issues + 8 lines (active)
- 12/25 functions lack `fn_` prefix, 8/41 triggers use outdated `update_*` naming
- Status fields mix UPPERCASE enums and lowercase varchar across domains
- 15 tables missing `updated_at`, only 1 table has `deleted_at` for soft delete
- `employees` table has deprecated `refresh_token` columns (replaced by `employee_refresh_tokens` table)

**Architecture:** Hono backend → Supabase PostgreSQL, Vue 3 frontend. Frontend never calls Supabase directly. All data access via backend `supabaseAdmin`.

## Goals / Non-Goals

**Goals:**
- Normalize FK relationships (backfill data, enforce constraints, remove legacy text columns)
- Consolidate to v2 issue system (migrate data, drop v1 tables/routes/views)
- Standardize naming conventions (functions, triggers, status values)
- Add missing timestamp columns and soft delete support
- Clean up deprecated columns and document naming decisions

**Non-Goals:**
- Adding RLS policies (architecture relies on backend-only access)
- Changing PK strategy (integer serial is fine)
- Refactoring actor tracking fields (varchar `*_by` columns stay as-is)
- Removing unused enum values (INSPECTED, SOFT_ALLOCATED, etc. — keep for future use)
- Changing `cone_id` column naming to `inventory_id` — document instead

## Decisions

### D1: FK Backfill Strategy
**Decision:** Use fuzzy matching (LOWER/TRIM) to backfill `color_id` and `supplier_id` from legacy text columns, then manual review of unmatched rows before enforcing NOT NULL.

**Rationale:** Legacy text data may have whitespace/casing differences vs normalized table names. Fuzzy match handles 90%+ automatically, manual review catches edge cases. Alternative of strict matching would leave too many NULLs.

### D2: v1 Issue Migration Approach
**Decision:** Create a SQL migration that copies v1 data into v2 format, with verification counts, before dropping v1 tables in a separate migration.

**Rationale:** Two-step approach (migrate then drop) allows verification between steps. Alternative of dropping without migration would lose the 1 existing v1 request record. The `thread_issue_return_logs` table belongs to v2 (uses `line_id` FK), not v1.

### D3: Function Rename Deployment
**Decision:** Single migration renames all 12 functions + 3 trigger functions. Backend RPC calls updated in same deployment.

**Rationale:** Function rename and backend update must be atomic — partial deployment would cause 500 errors. Alternative of gradual rename (wrapper functions) adds unnecessary complexity for a development-stage system.

### D4: Status Standardization
**Decision:** Create PostgreSQL enums for `purchase_orders.status`, `thread_order_weeks.status`, `thread_order_deliveries.status`, `thread_order_deliveries.inventory_status` with UPPERCASE values. Migrate existing lowercase data.

**Rationale:** Enums provide type safety and prevent invalid values. UPPERCASE aligns with existing core domain convention. Alternative of keeping varchar is less safe.

### D5: Soft Delete Scope
**Decision:** Add `deleted_at` to master data tables (colors, suppliers, styles, warehouses, thread_types, purchase_orders, employees) but NOT to transactional/log tables.

**Rationale:** Master data needs soft delete (referenced by many FKs, cannot hard delete). Transactional tables (audit_log, movements, allocations) represent historical facts and should never be "deleted". Alternative of adding to all tables is unnecessary overhead.

### D6: Migration File Organization
**Decision:** Create migrations in numbered order with clear naming. Each migration is independent and can be rolled back individually.

**Rationale:** Supabase migrations apply in filename order. Grouping related changes in single files reduces migration count while keeping logical separation.

## Risks / Trade-offs

- **[FK backfill data quality]** → Fuzzy matching may not resolve all legacy text values. Mitigation: Migration logs unmatched rows; manual review step before enforcing NOT NULL.
- **[Function rename breaks RPC]** → Backend must update all `.rpc()` calls in same deploy. Mitigation: Search all RPC references before migration, update in lockstep.
- **[v1 data loss]** → Dropping v1 tables is irreversible. Mitigation: Two-step migration with count verification. Only 1 record in v1.
- **[Status enum migration]** → Existing queries may hardcode lowercase values. Mitigation: Backend search for all status references, update before migration.
- **[PostgREST cache]** → Renamed tables/functions may not be immediately visible to PostgREST. Mitigation: Run `NOTIFY pgrst, 'reload schema'` after each migration.

## Migration Plan

1. **Pre-flight:** Verify all FK reference data exists (colors, suppliers tables are populated)
2. **Phase 1 - Backfill:** Backfill FK columns with fuzzy matching, verify, enforce NOT NULL
3. **Phase 2 - Renames:** Rename functions, triggers in single migration
4. **Phase 3 - v1 Deprecation:** Migrate v1 issue data to v2, verify counts, drop v1 tables
5. **Phase 4 - Standardization:** Add timestamps, soft delete, status enums
6. **Phase 5 - Backend:** Update all routes, types, validation for schema changes
7. **Phase 6 - Frontend:** Update types, components for removed fields
8. **Rollback:** Each migration has DOWN section. Backend changes can revert via git.

## Open Questions

- None — all decisions made during exploration phase.
