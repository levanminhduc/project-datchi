## Context

The weekly-order feature allows users to select warehouses before running a calculation. These selections are stored in `thread_order_week_warehouses` (a junction table). The junction is the **runtime contract** — it drives which warehouses `fn_reserve_for_week` and `fn_confirm_week_with_reserve` pull inventory from.

The problem: the junction is mutable. Users can toggle warehouse checkboxes at any time. After a week is confirmed and cones are financially reserved, there is no record of which warehouses were selected at the exact moment the calculation was saved. The `thread_order_results` table captures `calculation_data` and `summary_data` but not the warehouse context.

Current state of junction: all 39 existing weeks (4 DRAFT + 35 CONFIRMED) have 0 junction rows (verified via Docker DB). The SQL logic treats empty junction as "all warehouses." This means no audit trail exists for any historical week.

The `save-results.ts` route (line 91–97) already queries the junction immediately before the upsert. The warehouse IDs are available in-memory (`warehouseIds` array) at the exact moment the upsert happens.

## Goals / Non-Goals

**Goals:**

- Add `warehouse_ids INTEGER[]` to `thread_order_results` as a nullable snapshot column.
- Populate the snapshot on every future `POST /:id/results` call with the junction state at that moment.
- Preserve semantic distinction: `NULL` = pre-migration row (no snapshot); `'{}'` = explicitly empty selection (apply all warehouses); `'{3,5}'` = specific warehouse IDs.
- Update the UI label to communicate that warehouse selection affects confirmation behavior, not just display.
- No change to reserve flow: DB functions continue to read from the junction table, not the snapshot.

**Non-Goals:**

- Backfilling `warehouse_ids` for the 39 existing weeks (too risky without known state).
- Changing `fn_reserve_for_week`, `fn_confirm_week_with_reserve`, `fn_reserve_from_stock`, `fn_receive_delivery`, or `fn_re_reserve_after_remove_po` to use the snapshot instead of the junction.
- Adding UX guards (e.g., disabling the Confirm button when warehouse selection changes after calculation). This is Sprint 2 / Phương án B.
- Resolving the race condition between junction PUT in-flight and Confirm. Sprint 2 scope.
- Consolidating the three warehouse-selection entry-points into one. Sprint 2 scope.

## Decisions

### Decision 1: Snapshot column on `thread_order_results` vs. separate audit table

**Chosen:** Nullable array column `warehouse_ids INTEGER[]` on `thread_order_results`.

**Alternatives considered:**
- Separate audit table (`thread_order_result_audit`): Adds join complexity, overkill for a single scalar array.
- JSONB column: Unnecessarily flexible; `INTEGER[]` is typed and directly queryable with `= ANY(warehouse_ids)`.

**Rationale:** The snapshot is a direct attribute of a calculation result — one result, one snapshot. A column co-located with `calculation_data` and `summary_data` is the simplest and most coherent model.

### Decision 2: `NULL` vs `{}` semantic for "no warehouses selected"

**Chosen:** `NULL` for pre-migration rows; `{}` (empty array) when `warehouseIds.length === 0` in new saves.

**Rationale:**
- Pre-migration rows have `NULL` because the column did not exist — this is factually different from "user selected no warehouses."
- Distinguishing `NULL` (no snapshot) from `{}` (snapshot taken, but empty) is critical for future analytics and for Sprint 2 guard logic.
- Backend logic: store `warehouseIds.length > 0 ? warehouseIds : []` (not `null`) so every post-migration save has a non-null snapshot.

Wait — re-examining the plan: the plan says "store `null` when `warehouseIds` is empty to preserve semantic distinction from `{}`". The plan intent was `NULL` = old rows, not-null (including `{}`) = new rows. However, to distinguish "user chose empty = all warehouses" vs "no snapshot taken", we should store `[]` (empty array) for new saves with no selection, not `null`. This avoids ambiguity in sprint 2 queries.

**Final semantic:**
- `NULL` → pre-migration, column did not exist at save time
- `'{}'::INTEGER[]` → post-migration save, user selected no specific warehouses (means "all warehouses apply")
- `'{3,5}'::INTEGER[]` → post-migration save, user explicitly selected warehouse IDs 3 and 5

**Backend implementation:** `warehouse_ids: warehouseIds` (pass the array as-is; Supabase serializes `[]` as `'{}'`). Do NOT coerce to `null`.

### Decision 3: Where to source `warehouseIds` in the backend

**Chosen:** Reuse the array already fetched on line 97 (`warehouseIds`). No new DB query needed.

**Rationale:** The junction query on lines 91–97 runs unconditionally before the upsert. The `warehouseIds` variable is in scope. Adding the snapshot is a one-line addition to the upsert payload — zero extra latency.

### Decision 4: UI label change scope

**Chosen:** Change label text and hint text in `index.vue` lines 162 and 180. No functional change.

**Rationale:** The current label "Lọc kho tồn" (filter stock warehouses) implies display-only filtering. The actual behavior is that this selection is saved and used during reserve. The new label "Kho rút tồn (áp dụng khi xác nhận)" is accurate. Hint text updated to "Trống = sẽ rút từ tất cả kho khi xác nhận đơn hàng".

## Risks / Trade-offs

**[Risk] Snapshot diverges from junction at confirm time** → Mitigation: Documented as known limitation; Sprint 2 will add UX guard. The snapshot records "state at last save," which may differ from "state at confirm" if user edits warehouse selection after saving but before confirming.

**[Risk] `{}` vs `NULL` semantics misunderstood by future developers** → Mitigation: SQL `COMMENT ON COLUMN` clearly documents the three states. Design doc (this file) also documents it.

**[Risk] PostgREST does not accept `INTEGER[]` via upsert** → Mitigation: Supabase PostgREST handles PostgreSQL arrays natively when passed as a JSON array from the TypeScript client. No special serialization needed.

**[Risk] Migration fails on production** → Mitigation: `ADD COLUMN ... DEFAULT NULL` is a metadata-only operation in PostgreSQL 11+; it does not rewrite the table. Zero downtime.

## Migration Plan

1. Apply migration: `supabase migration up` (adds nullable column, COMMENT, NOTIFY).
2. Deploy backend: new `save-results.ts` with `warehouse_ids` in upsert payload.
3. Deploy frontend: updated `WeeklyOrderResults` type + UI label change.
4. Verify: query `SELECT warehouse_ids FROM thread_order_results` for a newly saved week; confirm array value stored correctly.

**Rollback:** Remove `warehouse_ids` from the upsert payload in `save-results.ts` + revert type change. Column can remain in DB (nullable, no impact). If column must be dropped: `ALTER TABLE thread_order_results DROP COLUMN warehouse_ids;` — safe since column is new and no existing code depends on it.

## Open Questions

- None. All decisions are resolved. Sprint 2 scope (race condition, UX guard, entry-point consolidation) is explicitly deferred.
