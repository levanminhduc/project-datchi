## Why

After the `db-cleanup` refactor (2026-02-18), two issues remain unresolved plus project documentation is stale:
1. **Zombie functions**: `fn_calculate_quota` and `fn_check_quota` were not dropped because the migration used `DROP FUNCTION ... ()` (no params) but the actual signatures have 4 integer params.
2. **Inconsistent enum**: `thread_material` is the only enum still using lowercase values while all others are UPPERCASE.
3. **Stale docs**: README.md, CLAUDE.md, and `.claude/agents/` contain outdated numbers and missing conventions.

## What Changes

- **DB Migration**: Drop `fn_calculate_quota(int,int,int,int)` and `fn_check_quota(int,int,int,int)` with correct signatures
- **DB Migration**: Convert `thread_material` enum values from lowercase to UPPERCASE (`polyester` → `POLYESTER`, etc.)
- **Backend types**: Update `ThreadMaterial` type to UPPERCASE values
- **Frontend types**: Update `ThreadMaterial` enum to UPPERCASE values
- **Seed data**: Update seed script material values to UPPERCASE
- **Frontend components**: Update material options/labels to UPPERCASE
- **README.md**: Update all stale numbers (routes: 25, services: 28, composables: 45, pages: 41, migrations: 53+, UI components: 67, agents: 8)
- **CLAUDE.md**: Add DB enum convention (UPPERCASE), update multi-agent threshold, add agent reference table, add current schema overview
- **Agent files**: Customize `.claude/agents/*.md` with project-datchi context and conventions

## Capabilities

### New Capabilities
- `db-final-cleanup`: Migration to drop zombie functions and UPPERCASE thread_material enum
- `material-enum-sync`: Sync UPPERCASE thread_material across backend types, frontend types, seed data, and UI components
- `docs-update`: Update README.md, CLAUDE.md, and agent definition files with current project state

### Modified Capabilities

## Impact

- **Database**: 2 functions dropped, 6 enum values renamed (thread_material)
- **Backend**: `server/types/thread.ts` — ThreadMaterial type values
- **Frontend**: `src/types/thread/enums.ts`, `src/types/thread/thread-type.ts`, `src/pages/thread/index.vue`, `src/components/thread/ThreadTypeFormDialog.vue`
- **Seed data**: `server/scripts/seed-test-data.ts` — 50+ material value references
- **Docs**: `README.md`, `CLAUDE.md`, `.claude/agents/*.md` (8 files)
- **Risk**: Low — enum rename is backwards-compatible via `ALTER TYPE RENAME VALUE`, functions are orphaned (no callers)
