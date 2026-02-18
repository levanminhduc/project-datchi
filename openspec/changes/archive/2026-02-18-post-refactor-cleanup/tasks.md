## 1. Database Migration

- [x] 1.1 Create migration `20260219100000_post_refactor_cleanup.sql` with: DROP FUNCTION fn_calculate_quota(integer,integer,integer,integer), DROP FUNCTION fn_check_quota(integer,integer,integer,integer), ALTER TYPE thread_material RENAME VALUE for all 6 values (lowercase → UPPERCASE)
- [x] 1.2 Update `supabase/schema/01_enums.sql` to reflect UPPERCASE thread_material values
- [x] 1.3 Update `supabase/schema/00_full_schema.sql` if it references thread_material lowercase values

## 2. Backend Type Sync

- [x] 2.1 Update `server/types/thread.ts` — change ThreadMaterial type values from lowercase to UPPERCASE (`'polyester'` → `'POLYESTER'`, etc.)

## 3. Frontend Type & UI Sync

- [x] 3.1 Update `src/types/thread/enums.ts` — change ThreadMaterial enum values from lowercase to UPPERCASE (`POLYESTER = 'POLYESTER'`, etc.)
- [x] 3.2 Update `src/pages/thread/index.vue` — change `materialOptions` to use `ThreadMaterial.*` enum constants instead of hardcoded lowercase strings (`{ label: 'Polyester', value: ThreadMaterial.POLYESTER }`)
- [x] 3.3 Verify `src/components/thread/ThreadTypeFormDialog.vue` already uses `ThreadMaterial.*` — no changes needed (auto-picks up new values)

## 4. Seed Data

- [x] 4.1 Update `server/scripts/seed-test-data.ts` — change all `material: 'polyester'` etc. to UPPERCASE: `material: 'POLYESTER'`, `material: 'COTTON'`, `material: 'NYLON'`, `material: 'SILK'`, `material: 'RAYON'`, `material: 'MIXED'`

## 5. Documentation Updates

- [x] 5.1 Update `README.md` with current counts — Routes: 25, Services: 28, Composables: 23, Pages: 41, Migrations: 54 (after new one), UI Components: 67, Agents: 8
- [x] 5.2 Update `CLAUDE.md` — add DB enum convention (all enums UPPERCASE), add current schema overview section
- [x] 5.3 Update `.claude/agents/*.md` — add project-datchi specific context and conventions to each agent file
