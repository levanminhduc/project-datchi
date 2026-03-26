## Why

Two bugs discovered during inventory workflow audit:
1. **Bug 1**: `lots.available_cones` is not synchronized when cone status changes via `issuesV2.ts`. The lot reports 20 available cones but only 9 are actually AVAILABLE (11 are HARD_ALLOCATED).
2. **Bug 3**: `thread_movements` table is empty — no movement history is recorded when issuing/returning cones through the Issue V2 workflow, making it impossible to trace inventory changes.

These bugs affect inventory accuracy and audit trail completeness.

## What Changes

- Add DB trigger to automatically sync `lots.available_cones` when `thread_inventory.status` changes
- Add movement logging in `issuesV2.ts` when deducting stock (issue) and returning stock (return)
- Run one-time data fix to sync existing lots with actual inventory counts

## Capabilities

### New Capabilities
- `lot-sync-trigger`: Database trigger that automatically updates `lots.available_cones` and `lots.status` when cone inventory status changes (INSERT/UPDATE/DELETE on `thread_inventory`)
- `issue-movement-logging`: Record movements in `thread_movements` table when issuing/returning cones via Issue V2 workflow

### Modified Capabilities
<!-- No existing spec requirement changes -->

## Impact

- **Database**: New trigger function and trigger on `thread_inventory` table
- **Backend**: `server/routes/issuesV2.ts` — add movement insertion in `deductStock()` and return routes
- **Data**: One-time migration to fix existing `lots.available_cones` values
