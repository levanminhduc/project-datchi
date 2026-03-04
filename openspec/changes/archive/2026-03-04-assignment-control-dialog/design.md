## Context

Weekly Orders reserve inventory cones via `thread_inventory.reserved_week_id` and create allocations via `thread_allocations.week_id`. Currently no single view shows assignment status across weeks. Data is scattered across:
- `thread_order_results.summary_data` (planned cones per thread type)
- `thread_inventory` with `reserved_week_id` (reserved cones)
- `thread_allocations` with `week_id` (allocated cones)

## Goals / Non-Goals

**Goals:**
- Provide centralized read-only view of assignment status per week per thread type
- Show gap between planned and reserved cones
- Filter by week status (DRAFT, CONFIRMED, COMPLETED, CANCELLED)
- Accessible via button on Weekly Order index page

**Non-Goals:**
- Editing/transferring reservations (out of scope - use existing Loan dialog)
- Drill-down to individual cones (summary only)
- Export functionality
- Real-time updates (manual refresh)

## Decisions

### 1. Data Aggregation Strategy
**Decision**: Single backend endpoint aggregates all data sources
**Rationale**: Frontend receives pre-computed summary, avoiding multiple API calls and complex client-side joins
**Alternatives considered**:
- Frontend fetch 3 endpoints separately → rejected due to complexity and performance

### 2. Query Approach
**Decision**: Use raw SQL aggregation in backend
**Rationale**: `thread_order_results.summary_data` is JSONB requiring parsing; joining with inventory/allocations needs efficient grouping
**Implementation**:
```sql
-- Planned: parse summary_data JSONB, aggregate by thread_type_id
-- Reserved: COUNT(*) FROM thread_inventory WHERE reserved_week_id = ? GROUP BY thread_type_id
-- Allocated: SUM(allocated_meters/meters_per_cone) FROM thread_allocations WHERE week_id = ?
```

### 3. Dialog vs Page
**Decision**: Quasar `q-dialog` component, 800px desktop / full-width mobile
**Rationale**: Quick monitoring view, doesn't need URL routing. Follows existing pattern (LoanDialog, ReserveFromStockDialog).

### 4. Gap Calculation
**Decision**: Gap = Reserved - Planned (negative when under-reserved)
**Display**: Red text for negative values, green for positive/zero

## Risks / Trade-offs

**[Performance]** Large dataset with many weeks/thread types
→ Mitigation: Add week status filter defaulting to CONFIRMED only; backend uses indexed queries

**[JSONB Parsing]** `summary_data` structure may vary
→ Mitigation: Use COALESCE and null-safe access; handle missing fields gracefully

**[Stale Data]** Manual refresh only
→ Acceptable for monitoring use case; not real-time critical
