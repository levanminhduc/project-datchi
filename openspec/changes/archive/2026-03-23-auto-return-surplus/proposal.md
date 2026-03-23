## Why

When a Weekly Order's thread issuance is complete (all PO-Style-Color items have been issued via Issue V2), leftover cones that were reserved for the order (`RESERVED_FOR_ORDER` status) remain locked indefinitely. There is no mechanism to release them back to `AVAILABLE` stock. This ties up inventory, reduces allocation flexibility, and creates inaccurate stock availability reporting.

## What Changes

- **New `COMPLETED` status** for `thread_order_weeks` — represents a fully issued week that is locked from further operations
- **Per-item completion tracking** via new `thread_order_item_completions` table — users mark each PO-Style-Color as "done" individually
- **"Trả dư" (Return Surplus) button** on Weekly Order detail page — releases all remaining `RESERVED_FOR_ORDER` cones to `AVAILABLE` when all items are marked complete
- **Auto-settle loans** — borrowed cones return to their original week; own cones go to `AVAILABLE`
- **Block Issue V2** for PO-Style-Color combinations belonging to `COMPLETED` weeks — prevents new issuance after declaring done
- **Movement logging** with new `WEEK_COMPLETED` movement type for audit trail
- **Preview dialog** before release — shows count of cones to be returned

## Capabilities

### New Capabilities
- `week-completion`: Track per-item completion status within weekly orders, release surplus reserved cones, and lock completed weeks
- `surplus-release`: Database function to auto-settle loans, return borrowed cones to original weeks, release own cones to AVAILABLE, and log WEEK_COMPLETED movements

### Modified Capabilities
- None (Issue V2 blocking is a guard check addition, not a spec-level requirement change)

## Impact

- **Database**: New table `thread_order_item_completions`, new enum value `COMPLETED` on `thread_order_weeks.status`, new movement type `WEEK_COMPLETED`, new RPC function `fn_complete_week_and_release`
- **Backend**: New API endpoints on `server/routes/weeklyOrder.ts` (mark complete, undo, release surplus). Modify `server/routes/issuesV2.ts` (block issuance for COMPLETED week combos)
- **Frontend**: Modify `src/pages/thread/weekly-order/[id].vue` (completion checkboxes, Trả dư button, preview dialog). Update status transition map, validation schemas, types
- **Existing behavior**: `findConfirmedWeekIds()` naturally excludes COMPLETED weeks. `fn_release_week_reservations` pattern reused with loan-aware logic
