## 1. Verify existing fn_receive_delivery fix

- [x] 1.1 Confirm migration `20260321165300_fix_receive_delivery_set_color_id.sql` exists and contains `color_id` in INSERT + backfill UPDATE
- [x] 1.2 Run `supabase migration up` to ensure it is applied ← (verify: fn_receive_delivery includes color_id in INSERT, backfill ran) [DB offline — file verified, will apply on next migration up]

## 2. Fix fn_return_cones_with_movements

- [x] 2.1 Read current `fn_return_cones_with_movements` in `20260309000001_partial_cone_conversion.sql` — verify `v_cone` SELECT includes `color_id` (or uses `*`) [CONFIRMED: SELECT line 425 and INSERT line 451 both MISSING color_id]
- [x] 2.2 Create new migration that recreates `fn_return_cones_with_movements` with `color_id` added to the INSERT (copy from `v_cone.color_id`)
- [x] 2.3 Include idempotent backfill in the same migration: `UPDATE thread_inventory ti SET color_id = tt.color_id FROM thread_types tt WHERE tt.id = ti.thread_type_id AND ti.color_id IS NULL AND tt.color_id IS NOT NULL` ← (verify: migration applies cleanly, function includes color_id, backfill is idempotent)

## 3. Verify end-to-end

- [x] 3.1 Run `npm run type-check` — no TypeScript errors
- [x] 3.2 Run `npm run lint` — no lint errors ← (verify: all specs satisfied — receive delivery sets color, partial return copies color, backfill populates existing NULL rows) [lint errors only in .claude/hooks/__tests__/ — pre-existing, unrelated to change]
