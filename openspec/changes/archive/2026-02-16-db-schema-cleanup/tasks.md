## 1. Database Migration

- [ ] 1.1 Create migration file `supabase/migrations/20260216_schema_cleanup.sql` with BEGIN/COMMIT transaction wrapper
- [ ] 1.2 Add Section 1: Rename `style_thread_specs.tex_id` → `thread_type_id` (ALTER TABLE RENAME COLUMN + drop old index + create new index + update COMMENT)
- [ ] 1.3 Add Section 2: Create `conflict_status` enum, drop CHECK constraint, convert `thread_conflicts.status` column to enum with DEFAULT
- [ ] 1.4 Add Section 3: Convert `thread_movements.from_status` and `to_status` from VARCHAR(50) to `cone_status` enum using USING cast
- [ ] 1.5 Add Section 4: Create composite index `idx_thread_issue_lines_issue_thread` on `thread_issue_lines(issue_id, thread_type_id)`
- [ ] 1.6 Add Section 5: Create index `idx_return_logs_line_id` on `thread_issue_return_logs(line_id)`
- [ ] 1.7 Add `NOTIFY pgrst, 'reload schema'` at end of migration ← (verify: migration runs without errors on local DB, all sections execute in correct order)

## 2. RPC Function Updates

- [ ] 2.1 Update `fn_issue_allocation` in migration: remove `::VARCHAR` cast on `from_status` insert, cast `to_status` literal to `cone_status`
- [ ] 2.2 Update `fn_recover_cone` in migration: remove `::VARCHAR` cast on `from_status` insert, change `v_new_status` variable type from VARCHAR to `cone_status` ← (verify: both RPC functions compile, issue and recovery flows still produce correct movement records)

## 3. Backend Code Sync

- [ ] 3.1 Update `server/routes/styleThreadSpecs.ts`: change PostgREST select `thread_types:tex_id(...)` → `thread_types:thread_type_id(...)` and insert/update field `tex_id` → `thread_type_id` (4 occurrences)
- [ ] 3.2 Update `server/routes/styles.ts`: change PostgREST select `thread_types:tex_id(...)` → `thread_types:thread_type_id(...)` (1 occurrence)
- [ ] 3.3 Update `server/routes/threadCalculation.ts`: change type definition `tex_id` → `thread_type_id`, PostgREST select syntax, and fallback assignment `spec.tex_id` → `spec.thread_type_id` (5 occurrences) ← (verify: all 3 route files compile, PostgREST nested selects return data correctly)

## 4. Frontend Code Sync

- [ ] 4.1 Update `src/types/thread/styleThreadSpec.ts`: change `tex_id` → `thread_type_id` in all interface definitions (3 occurrences)
- [ ] 4.2 Update `src/pages/thread/styles/[id].vue`: change inline edit loading key, v-model, save handler, and field type union from `tex_id` → `thread_type_id` (4 occurrences) ← (verify: type-check passes, styles detail page renders with inline editing functional)

## 5. Post-Migration Verification

- [ ] 5.1 Run `supabase gen types typescript --local` to regenerate TypeScript database types
- [ ] 5.2 Run type-check to verify no TypeScript errors remain ← (verify: full type-check passes, no remaining references to `tex_id` in codebase except seed/backup/plan files)
