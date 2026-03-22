## Context

Migration `20260318170000` added `color_id` column to `thread_inventory` and changed summary views/functions (`v_cone_summary`, `fn_cone_summary_filtered`) to join colors via `ti.color_id` instead of `tt.color_id`. This enables per-cone color tracking (important when cones get re-dyed or color differs from thread type default).

However, multiple SQL functions that INSERT into `thread_inventory` were never updated to set `color_id`:
- `fn_receive_delivery` — creates cones from weekly order delivery receipt (fixed in `20260321165300`, needs apply verification)
- `fn_return_cones_with_movements` — creates partial return cones (UNFIXED, latest in `20260309000001`)

Manual stock entry (`server/routes/stock.ts`) already sets `color_id` correctly.

## Goals / Non-Goals

**Goals:**
- Every INSERT into `thread_inventory` MUST set `color_id`
- Backfill all existing rows where `color_id IS NULL` from `thread_types.color_id`
- Verify migration `20260321165300` (fn_receive_delivery fix) is applied

**Non-Goals:**
- Changing the summary views/functions (already correct — join on `ti.color_id`)
- Frontend changes (already renders color from PostgREST joins)
- Changing thread type identity rules (supplier + tex + color)

## Decisions

### 1. Color source for new cones

**Decision**: Fetch `color_id` from `thread_types` for `fn_receive_delivery`; copy `color_id` from original cone for `fn_return_cones_with_movements`.

**Rationale**: `fn_receive_delivery` creates brand new cones from a delivery — the color comes from the thread type definition. `fn_return_cones_with_movements` splits an existing cone — the partial cone inherits the same color as the original.

**Alternative considered**: Always look up from `thread_types` → rejected because partial return cones should preserve the original cone's color even if the thread type default changes later.

### 2. Single migration for all fixes

**Decision**: Create one new migration that fixes `fn_return_cones_with_movements` and does a backfill. The `fn_receive_delivery` fix already exists in `20260321165300`.

**Rationale**: Simpler migration history. Backfill is idempotent (only updates WHERE `color_id IS NULL`).

### 3. Backfill strategy

**Decision**: `UPDATE thread_inventory ti SET color_id = tt.color_id FROM thread_types tt WHERE tt.id = ti.thread_type_id AND ti.color_id IS NULL AND tt.color_id IS NOT NULL`

**Rationale**: Safe — only touches NULL rows, uses thread_types as source of truth. Already present in `20260321165300` but adding again is idempotent.

## Risks / Trade-offs

- **[Risk] `fn_return_cones_with_movements` references `v_cone`** — need to verify `v_cone` record includes `color_id` field from the SELECT query → **Mitigation**: Read the SELECT INTO for `v_cone` and confirm it selects `*` or explicitly includes `color_id`
- **[Risk] Migration `20260321165300` may not have been applied** → **Mitigation**: Check with `supabase migration list` or test by calling `fn_receive_delivery` and verifying `color_id` is set
- **[Risk] Future functions may forget `color_id`** → **Mitigation**: Add a comment to the `thread_inventory` table or a CHECK constraint / trigger as a safety net (out of scope for this fix, consider later)
