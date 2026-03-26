## Why

After a comprehensive DB schema audit (3 phases: audit → challenge → external research), 5 high-confidence, low-risk items were identified that improve data integrity, query safety, and schema consistency. These are defensive changes — they don't add features but make the system harder to break. Acting now prevents data quality issues from accumulating as the system grows.

## What Changes

- **Rename FK column** `style_thread_specs.tex_id` → `thread_type_id` to follow the project's `{table}_id` FK naming convention. All backend PostgREST joins and frontend references updated accordingly.
- **Convert varchar to enum** `thread_conflicts.status` (varchar) → `conflict_status` enum (`PENDING`, `RESOLVED`, `ESCALATED`). Database enforces valid values instead of relying on CHECK constraints.
- **Convert varchar to enum** `thread_movements.from_status` and `to_status` (varchar) → `cone_status` enum. Aligns audit trail columns with the existing `cone_status` enum used in `thread_inventory.status`. RPC functions updated to remove unnecessary `::VARCHAR` casts.
- **Add composite index** on `thread_issue_lines(issue_id, thread_type_id)` for common query pattern optimization.
- **Add missing FK index** on `thread_issue_return_logs(line_id)` to support CASCADE DELETE performance and FK lookups.

## Capabilities

### New Capabilities
- `schema-cleanup-migration`: Database migration file containing all 5 schema changes (column rename, enum conversions, index additions) with proper ordering and schema cache reload.
- `schema-cleanup-code-sync`: Backend and frontend code updates to sync with the renamed `tex_id` → `thread_type_id` column across route files, type definitions, and Vue components.

### Modified Capabilities
_(No existing spec-level behavior changes. These are schema-level improvements that preserve all existing functionality.)_

## Impact

- **Database**: 1 new migration file. Tables affected: `style_thread_specs`, `thread_conflicts`, `thread_movements`, `thread_issue_lines`, `thread_issue_return_logs`. 2 RPC functions recreated (`fn_issue_allocation`, `fn_recover_cone`).
- **Backend**: 3 route files updated (`styleThreadSpecs.ts`, `styles.ts`, `threadCalculation.ts`) — PostgREST join syntax and field references change from `tex_id` to `thread_type_id`.
- **Frontend**: 2 files updated (`src/types/thread/styleThreadSpec.ts`, `src/pages/thread/styles/[id].vue`) — type definitions and inline edit references.
- **PostgREST**: Schema cache reload required after migration (`NOTIFY pgrst, 'reload schema'`).
- **TypeScript types**: Must regenerate after migration (`supabase gen types typescript`).
- **No breaking API changes**: All endpoints maintain the same response structure. Only internal field names change in style_thread_specs queries.
