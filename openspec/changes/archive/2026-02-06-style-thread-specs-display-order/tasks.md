## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/20260206215302_add_display_order_to_style_thread_specs.sql`
- [x] 1.2 Add column: `ALTER TABLE style_thread_specs ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0`
- [x] 1.3 Populate existing rows with sequential display_order per style_id (based on created_at DESC)
- [x] 1.4 Add index: `CREATE INDEX idx_style_thread_specs_display_order ON style_thread_specs(style_id, display_order)`
- [x] 1.5 Apply migration to local database (UPDATE 3 rows)

## 2. Backend API Updates

- [x] 2.1 Update GET `/api/style-thread-specs` to order by `display_order ASC` instead of `created_at DESC`
- [x] 2.2 Update POST `/api/style-thread-specs` to accept `add_to_top` boolean parameter
- [x] 2.3 Implement add_to_top=true logic: shift existing rows +1, insert with display_order=0
- [x] 2.4 Implement add_to_top=false logic: get MAX display_order +1 for new row
- [x] 2.5 Handle edge case: first row for a style (no existing rows)

## 3. Type Updates

- [x] 3.1 Update `StyleThreadSpec` interface in `src/types/thread/styleThreadSpec.ts` to include `display_order: number`
- [x] 3.2 Update `CreateStyleThreadSpecDTO` to include `add_to_top?: boolean`

## 4. Frontend Updates

- [x] 4.1 Update `addEmptyRow()` in `src/pages/thread/styles/[id].vue` to send `add_to_top` parameter
- [x] 4.2 Remove client-side array manipulation (no more splice/push/unshift after create)
- [x] 4.3 Verify toggle state is correctly sent to API (via DTO)

## 5. Testing & Verification

- [ ] 5.1 Test: Add row with toggle OFF → row appears at bottom, persists after refresh
- [ ] 5.2 Test: Add row with toggle ON → row appears at top, persists after refresh
- [ ] 5.3 Test: Add multiple rows → order is consistent
- [x] 5.4 Test: Existing data migration → order preserved from before (UPDATE 3 rows)
- [x] 5.5 Run `npm run type-check` → pass
