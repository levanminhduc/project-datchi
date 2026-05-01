## Why

After Phuong An A (`audit-trail-warehouse-ids-snapshot`) adds the `warehouse_ids` snapshot column, three separate code paths still write to `thread_order_week_warehouses` independently — meaning a user can toggle warehouse checkboxes after calculation and before confirmation, causing the snapshot stored at save-time to diverge from the actual selection used at confirm-time. In addition, rapid toggling while a PUT request is in-flight triggers a `400` race condition when the user simultaneously hits Confirm (which checks `status === 'DRAFT'`).

## What Changes

- **Frontend — single entry-point**: Remove `saveWarehouseFilter` calls from `handleWarehouseFilterChange` (auto-save on checkbox toggle) and from `handleSave`. Add a single `saveWarehouseFilter` call inside `handleCalculate`, executed immediately before `calculateAll`. Toggling checkboxes now only updates local reactive state; the selection is persisted to the DB only when the user explicitly runs a calculation.
- **Frontend — new week edge case**: When no `selectedWeek.value?.id` exists at calculation time, disable the "Tính toán" button until the user first saves the week (creates the week record). This enforces the order: Save → Calculate → Confirm.
- **Frontend — UX staleness guard**: Track `lastCalculatedWarehouseIds` (a `ref<number[] | null>`) populated at the moment `calculateAll` is called. Compute `isWarehouseChangedSinceCalc` by comparing sorted arrays. When `true` and the week is DRAFT: show a warning banner ("Bạn đã thay đổi lọc kho. Vui lòng nhấn Tính toán lại trước khi xác nhận.") and disable the "Xác nhận" button. Reset when the user recalculates. Guard is invisible in CONFIRMED read-only mode.
- **Backend**: No changes — `PUT /:id/warehouses` endpoint remains as-is; only the call site changes.
- **Database**: No changes — `thread_order_week_warehouses` junction and all five dependent DB functions (`fn_reserve_for_week`, `fn_confirm_week_with_reserve`, `fn_reserve_from_stock`, `fn_receive_delivery`, `fn_re_reserve_after_remove_po`) remain untouched.

## Capabilities

### New Capabilities

- `warehouse-single-entry-point`: Warehouse selection is persisted to the database exactly once per calculation cycle — inside `handleCalculate` — eliminating race conditions and stale-snapshot divergence.
- `warehouse-changed-guard`: A reactive staleness guard that detects when the warehouse selection has been modified since the last calculation and prevents confirmation until the user recalculates.

### Modified Capabilities

<!-- No existing spec-level requirement changes. -->

## Impact

- **Files touched**: 2 files (`src/pages/thread/weekly-order/index.vue`, `src/composables/thread/useWeeklyOrderCalculation.ts`).
- **UX behavior change**: Users must press "Tính toán" for any warehouse selection change to take effect — checkbox toggle alone no longer persists. Changelog/training note required.
- **"Tính toán" button**: Gains an additional disable condition when `selectedWeek.value` is null (new week not yet saved).
- **"Xác nhận" button**: Gains an additional disable condition when `isWarehouseChangedSinceCalc` is true.
- **Dependency**: This change must be deployed AFTER `audit-trail-warehouse-ids-snapshot` (Phuong An A) is stable in production. The `warehouse_ids` snapshot column must exist before this change goes live, as `handleCalculate` will call `saveWarehouseFilter` and then `calculateAll` which writes the snapshot.
- **No API contract changes**: Same endpoints, same response shapes.
- **No DB schema changes**: No migrations required.

## Rollout Strategy

1. Deploy and validate `audit-trail-warehouse-ids-snapshot` (Phuong An A) in production first.
2. Verify that new CONFIRMED weeks carry a non-null `warehouse_ids` snapshot in `thread_order_results`.
3. Deploy this change (Phuong An B) in the next sprint window.
4. Communicate UX behavior change to warehouse team: "Thay đổi kho chỉ có hiệu lực sau khi bấm Tính toán."
5. Monitor for any 400 errors on `PUT /:id/warehouses` in logs — expected to drop to zero after deploy.
