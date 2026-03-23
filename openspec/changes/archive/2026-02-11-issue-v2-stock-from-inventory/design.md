## Context

Currently two inventory tracking systems exist:
- `thread_inventory`: Individual cone tracking with status workflow (AVAILABLE, ALLOCATED, etc.)
- `thread_stock`: Aggregate quantity tracking (qty_full_cones, qty_partial_cones)

Weekly Order uses `thread_inventory` to show stock. Issue V2 uses `thread_stock` which is empty, causing stock = 0.

## Goals / Non-Goals

**Goals:**
- Issue V2 shows same stock values as Weekly Order
- Query `thread_inventory` with `status = 'AVAILABLE'`
- Count full cones (`is_partial = false`) and partial cones (`is_partial = true`) separately

**Non-Goals:**
- Deprecate `thread_stock` table (may have other uses)
- Change Weekly Order implementation
- Modify `thread_inventory` schema

## Decisions

### D1: Query thread_inventory instead of thread_stock

**Decision**: Replace the query in `getStockAvailability()` to use `thread_inventory`.

**Rationale**:
- `thread_inventory` has actual data with proper status tracking
- Consistent with Weekly Order's approach
- Filter by `status = 'AVAILABLE'` ensures only issuable cones are counted

**Current implementation**:
```typescript
// Old - queries thread_stock (empty)
const { data } = await supabase
  .from('thread_stock')
  .select('qty_full_cones, qty_partial_cones')
  .eq('thread_type_id', threadTypeId)
```

**New implementation**:
```typescript
// New - queries thread_inventory (has data)
const { data } = await supabase
  .from('thread_inventory')
  .select('is_partial')
  .eq('thread_type_id', threadTypeId)
  .eq('status', 'AVAILABLE')

// Count: full = is_partial=false, partial = is_partial=true
```

### D2: Count rows instead of sum quantities

**Decision**: Count individual rows since each row in `thread_inventory` represents one cone.

**Rationale**: `thread_inventory` uses individual cone tracking where `quantity_cones` is always 1.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Performance: COUNT(*) on large table | Add index on `(thread_type_id, status, is_partial)` if needed |
| Data inconsistency if both tables used | Document which table is source of truth |
