## Context

The weekly-order flow has three places that write warehouse selections to the DB:

1. `handleWarehouseFilterChange` (line 607–620 in `index.vue`) — auto-saves on every checkbox toggle when week is DRAFT
2. `handleSave` existing week branch (line 730) — always writes on save
3. `handleSave` new week branch (line 748–750) — writes on save if selection non-empty

This means `thread_order_week_warehouses` is mutable right up to confirmation. After Phuong An A adds `warehouse_ids` to `thread_order_results`, the snapshot is written at save-time — but if the user toggles checkboxes between save and confirm, the junction (used by `fn_confirm_week_with_reserve`) diverges from the snapshot (used for audit). Additionally, the auto-save path creates a race condition: a PUT request in-flight while the user presses Confirm triggers a `400` because `fn_confirm_week_with_reserve` checks `status = 'DRAFT'` first.

Current state of relevant composable:
- `useWeeklyOrderCalculation.ts` owns `calculateAll(weekId?, warehouseIds?)`, `lastCalculatedAt`, and `isCalculating`
- `isResultsStale` in `index.vue` (line 152–156) is the existing pattern for showing a staleness warning

```
BEFORE (3 write paths):
  checkbox toggle  ──► handleWarehouseFilterChange ──► PUT /warehouses  (auto)
  "Lưu" click      ──► handleSave ──────────────────► PUT /warehouses  (always)
  "Tính toán" click──► handleCalculate ──────────────► calculateAll()  (no write)

AFTER (1 write path):
  checkbox toggle  ──► local state only (no PUT)
  "Lưu" click      ──► handleSave (no PUT /warehouses)
  "Tính toán" click──► handleCalculate ──► PUT /warehouses ──► calculateAll()
```

## Goals / Non-Goals

**Goals:**
- Reduce PUT `/warehouses` call sites to exactly one: inside `handleCalculate`
- Ensure warehouse selection is persisted atomically before every `calculateAll` invocation
- Prevent "Xác nhận" when warehouse selection has drifted since last calculation
- Eliminate race condition between in-flight PUT and Confirm action
- Keep changes surgical: only modify lines directly related to the write-path consolidation

**Non-Goals:**
- Removing the `thread_order_week_warehouses` junction table (5 DB functions depend on it)
- Changing `fn_confirm_week_with_reserve` to read snapshot instead of junction
- Realtime sync between multiple users editing the same week
- Audit logging of warehouse selection history
- Any backend route changes

## Decisions

### Decision 1: Single entry-point in `handleCalculate`, not in a watcher

**Chosen**: Call `saveWarehouseFilter` inside `handleCalculate`, synchronously awaited before `calculateAll`.

**Alternative considered**: `watch(selectedWarehouseIds, ...)` with debounce.

**Rationale**: A watcher fires on every reactive change and reintroduces the auto-save problem with a delay. Tying persistence to the explicit user gesture ("Tính toán") is simpler, predictable, and matches the domain invariant: the warehouse selection matters only when it feeds into a calculation.

### Decision 2: Guard lives in `index.vue` state, not in `useWeeklyOrderCalculation`

**Chosen**: `lastCalculatedWarehouseIds` as a `ref<number[] | null>` in `index.vue`, computed `isWarehouseChangedSinceCalc` derived locally.

**Alternative considered**: Move `lastCalculatedWarehouseIds` into `useWeeklyOrderCalculation` alongside `lastCalculatedAt`.

**Rationale**: The guard is a UI concern (banner visibility, button disable). `useWeeklyOrderCalculation` already exports `lastCalculatedAt`; adding another ref there is possible but couples UI logic into a calculation composable. Keeping it in `index.vue` preserves separation: the composable calculates, the page guards. If `index.vue` grows beyond 200 lines significantly, extract to a `useWeeklyOrderGuard` composable in a follow-up.

### Decision 3: New-week edge case — REVISED during implementation

**Original plan**: `canCalculateWithWarehouse` gate returns `false` when `!selectedWeek.value?.id && selectedWarehouseIds.value.length > 0` — disable "Tính toán" until week is saved when a non-empty warehouse selection exists.

**Deviation discovered during testing**: UX deadlock (Row A4 in state matrix) — the banner instructed the user to "click Tính toán", but the button was simultaneously disabled by `canCalculateWithWarehouse`. Result: no recovery path for the user.

**Implemented solution (Phương án A revised)**:
- Removed `canCalculateWithWarehouse` gate entirely — "Tính toán" is no longer disabled due to missing week ID.
- Did NOT add auto-save of week on "Tính toán" (user requirement: "không cần lưu nháp").
- Instead: re-added `saveWarehouseFilter` into BOTH branches of `handleSave` (create branch and update branch), so the junction is always synced (including empty array) immediately before results are saved.

**Final flow**:
- `handleCalculate`: persists warehouse only when `selectedWeek.value?.id` exists (existing saved week); skips PUT for new unsaved weeks.
- `handleSave`: always calls `saveWarehouseFilter` in both create and update branches before writing results, ensuring junction is consistent at save time regardless of whether "Tính toán" already persisted it.

**Alternative considered (b)**: Auto-create week inside `handleCalculate` if no ID exists.

**Rationale for dropping gate**: A disabled button with a banner demanding the same action is a UX deadlock with no escape. The revised approach resolves the deadlock by keeping the calculate path open and delegating final warehouse persistence to `handleSave`, which already owns the atomic save operation.

### Decision 4: Array comparison uses sorted numeric arrays

**Chosen**: `[...a].sort((x, y) => x - y).join(',') !== [...b].sort((x, y) => x - y).join(',')`.

**Rationale**: Order of IDs in `selectedWarehouseIds` depends on user click sequence; the DB returns them in insertion order. Sorting before comparison prevents false positives from reordering.

## Risks / Trade-offs

**Risk: User confusion — "I changed the checkboxes but nothing saved"**
Mitigation: The banner ("Bạn đã thay đổi lọc kho...") immediately explains the required action. Tooltip on disabled "Xác nhận" button reinforces it. Include in user changelog.

**Risk: `handleCalculate` called with no `selectedWeek.value?.id` (new week, empty warehouse selection)**
Mitigation: Guard with `if (selectedWeek.value?.id && selectedWarehouseIds.value.length > 0)` before calling `saveWarehouseFilter`. Empty selection with no week ID skips the PUT; `calculateAll` still runs with `warehouseIds = undefined`.

**Risk: `saveWarehouseFilter` fails → calculation runs with stale DB state**
Mitigation: Await the call and re-throw. The existing `try/catch` in `handleCalculate` will surface an error snackbar and abort the calculation. Do not swallow the error silently.

**Risk: Regression in existing CONFIRMED weeks loaded in read-only mode**
Mitigation: The guard condition checks `selectedWeek.value?.status !== 'CONFIRMED'` before showing the banner. Read-only mode is unaffected.

**Risk: `isResultsStale` and `isWarehouseChangedSinceCalc` both show simultaneously, confusing the user**
Mitigation: The banner for `isWarehouseChangedSinceCalc` includes the recalculate instruction. `isResultsStale` (existing) covers PO/quantity changes; the new banner covers warehouse changes. They are additive and both correct.

## Migration Plan

1. **Pre-condition**: `audit-trail-warehouse-ids-snapshot` deployed and verified stable in production.
2. **Deploy**: Frontend-only change — no migration script, no downtime.
3. **Verify post-deploy**:
   - Open Network tab → toggle warehouse checkbox → confirm no PUT `/warehouses` fires
   - Press "Tính toán" → confirm PUT `/warehouses` fires before enrich-inventory call
   - Toggle checkbox after calculate → confirm "Xác nhận" disables + banner appears
4. **Rollback**: Revert the two frontend files; no DB state to undo.

## Open Questions

- Should `isWarehouseChangedSinceCalc` also block the "Lưu" action, or only "Xác nhận"?
  Current decision: block only "Xác nhận". "Lưu" no longer writes warehouse selection, so it is safe to allow.
- If the user loads a DRAFT week that already has results (loaded from DB), should `lastCalculatedWarehouseIds` be pre-populated from the junction?
  Current decision: initialize to `null` on load — the guard is dormant until the user performs at least one calculation in the current session. This is safe because the user cannot Confirm without first recalculating (if they change warehouses) due to the disabled button.
