## Context

The thread inventory system tracks cones at individual level (`thread_inventory`) and aggregates them into lots (`lots`). Two data integrity issues were discovered:

1. **`lots.available_cones` desync**: When cones are issued/returned via `issuesV2.ts`, the code updates `thread_inventory.status` but does NOT update `lots.available_cones`. This causes the lot summary to show incorrect counts.

2. **Missing movement history**: The `thread_movements` table exists to track all inventory movements but `issuesV2.ts` never inserts records into it. This breaks audit trail and makes it impossible to trace inventory changes.

**Current state:**
- `batch.ts` correctly updates `lots.available_cones` when manipulating inventory
- `issuesV2.ts` does NOT update `lots` or insert `thread_movements`
- RPC function `issue_cone()` in allocations flow correctly logs movements, but Issue V2 bypasses this

## Goals / Non-Goals

**Goals:**
- Automatically keep `lots.available_cones` in sync with actual inventory counts
- Record all inventory movements in `thread_movements` for audit trail
- Fix existing data inconsistencies

**Non-Goals:**
- Changing the Issue V2 business logic or UI
- Modifying the allocations workflow (already working correctly)
- Adding new movement types to the enum

## Decisions

### Decision 1: DB Trigger for lots sync (vs Application Layer)

**Choice**: Database trigger on `thread_inventory`

**Rationale**:
- Centralized — all code paths automatically handled
- Cannot be missed when new features added
- Simpler than adding sync logic to every route

**Alternatives considered**:
- Application layer sync in each route — error-prone, easy to miss
- Computed field (no storage) — performance concern for list views

**Implementation**:
- Trigger fires on INSERT/UPDATE/DELETE of `thread_inventory`
- Recalculates `available_cones` for affected `lot_id`
- Updates `lots.status` to DEPLETED when `available_cones = 0`

### Decision 2: Available status definition

**Choice**: Cone counts as "available" when status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')

**Rationale**:
- These are the only statuses where cone can still be issued
- SOFT_ALLOCATED is excluded — cone is reserved
- HARD_ALLOCATED, IN_PRODUCTION etc. — cone is in use

### Decision 3: Application layer for movement logging (vs Trigger)

**Choice**: Insert movements in `issuesV2.ts` application code

**Rationale**:
- Movements need context: `reference_type`, `reference_id`, `performed_by`
- Trigger cannot know which Issue or who performed the action
- Existing pattern in `issue_cone()` RPC does this at application level

**Implementation**:
- Add helper function `insertMovement()` in issuesV2.ts
- Call in `deductStock()` for ISSUE movements
- Call in return routes for RETURN movements

### Decision 4: Movement reference tracking

**Choice**: Use `reference_type = 'ISSUE_LINE'` and `reference_id = line_id`

**Rationale**:
- Issue line is the most granular level that links to specific thread type
- Can trace back: movement → issue_line → issue → department
- Consistent with existing `thread_issue_lines` structure

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Trigger adds overhead on every inventory change | Trigger only fires when lot_id is set; recalculation is simple COUNT |
| Movement logging increases write load | Minimal — one INSERT per cone status change |
| Data fix migration could be slow for large datasets | Run during off-hours; use batch UPDATE |

## Migration Plan

1. **Deploy trigger first** — new changes will be synced automatically
2. **Run data fix** — one-time UPDATE to sync existing `lots.available_cones`
3. **Deploy backend changes** — movements will start being logged
4. **Verify** — spot check lots and movements tables

**Rollback**: Drop trigger, revert backend code. Data remains consistent (just stops auto-syncing).
