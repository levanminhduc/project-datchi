## Context

The Weekly Order page (`/thread/weekly-order`) allows users to select PO/Style/Color combinations and calculate thread requirements. Currently:

- **Calculation flow**: Frontend calls `/api/thread-calculation` with style + color data, backend returns `CalculationResult[]` with thread requirements per process
- **Results display**: `ResultsDetailView.vue` shows per-style tables; `ResultsSummaryTable.vue` shows aggregated totals
- **Inventory awareness**: Summary table has `inventory_cones` via `enrichInventory()` endpoint, but Detail table has no inventory visibility
- **Allocation system**: Existing FEFO allocation via `allocate_thread()` RPC creates real allocations with cone locking

The gap: Detail table shows what's needed but not what's available. Users cannot make informed ordering decisions.

## Goals / Non-Goals

**Goals:**
- Show inventory availability per calculation row in Detail view
- Indicate "Sẵn Kho" when stock sufficient, "Thiếu X" with delivery date when not
- Allow priority ordering via drag-and-drop (first = allocated first)
- Preview allocation without locking cones (read-only simulation)
- Create real soft allocations on save (only for shortage quantities)

**Non-Goals:**
- Modifying the existing FEFO RPC logic
- Real-time WebSocket updates for inventory changes
- Allocation conflict resolution UI (existing conflict system handles this)
- Per-row allocation override (uses automatic FEFO order)

## Decisions

### 1. Preview Allocation as Backend Logic

**Decision**: Backend calculates preview allocation, returns enriched data to frontend.

**Rationale**:
- Keeps allocation logic centralized (single source of truth)
- Frontend stays simple (display only)
- Can reuse existing inventory queries

**Alternatives considered**:
- Frontend calculates: Rejected - would duplicate business logic, require exposing raw inventory data

### 2. Position Tracking via Array Index

**Decision**: Position = index in `perStyleResults[]` array. No database column.

**Rationale**:
- Simple, no migration needed
- Position only matters during calculation session
- Drag-and-drop reorders the array, triggers recalculation

**Alternatives considered**:
- DB column `display_order`: Overkill for session-scoped ordering

### 3. Extend Existing Calculation Endpoint

**Decision**: Enhance `/api/thread-calculation` response with inventory preview fields rather than new endpoint.

**Rationale**:
- Single API call (no extra round-trip)
- Data cohesion (inventory info attached to calculation item)
- Backward compatible (new fields are optional)

**Alternatives considered**:
- Separate `/preview-allocation` endpoint: Would require frontend to join data

### 4. vuedraggable for Drag-and-Drop

**Decision**: Use `vuedraggable` (Vue 3 compatible wrapper for SortableJS).

**Rationale**:
- Mature, well-maintained library
- Works with Vue 3 reactivity
- Handles touch devices

### 5. Allocation on Save (Not Preview)

**Decision**: Preview = read-only query. Real allocation created only when user saves results.

**Rationale**:
- No cone locking during planning phase
- Users can reorder and recalculate freely
- Commit allocation only when satisfied

**Alternatives considered**:
- Soft-allocate on calculate: Would lock cones prematurely

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                           │
│    orderEntries[] with position (array index)                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. CALCULATE (Enhanced)                                                 │
│                                                                         │
│    POST /api/thread-calculation                                         │
│    Request: { items: [...], include_inventory_preview: true }           │
│                                                                         │
│    Backend:                                                             │
│    a) Calculate thread requirements (existing logic)                    │
│    b) Flatten all CalculationItems across styles (maintain order)       │
│    c) Group by thread_type_id                                           │
│    d) Query available inventory: SELECT COUNT(*) FROM thread_inventory  │
│       WHERE thread_type_id = ? AND status = 'AVAILABLE'                 │
│    e) Simulate FEFO allocation:                                         │
│       - Process items in position order                                 │
│       - Track running_available per thread_type_id                      │
│       - allocated = MIN(needed, running_available)                      │
│       - shortage = needed - allocated                                   │
│       - running_available -= allocated                                  │
│    f) Return enriched CalculationItem[]                                 │
│                                                                         │
│    Response additions per CalculationItem:                              │
│    - inventory_available: number (cones allocated from stock)           │
│    - shortage_cones: number (cones that need ordering)                  │
│    - is_fully_stocked: boolean                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. DISPLAY (Enhanced ResultsDetailView)                                 │
│                                                                         │
│    New column: "Tồn Kho"                                                │
│    - Shows inventory_available count                                    │
│                                                                         │
│    Enhanced "Ngày Giao" column:                                         │
│    - IF is_fully_stocked: Display "Sẵn Kho" (green badge)               │
│    - ELSE: Display "Thiếu {shortage_cones}" + delivery_date             │
│                                                                         │
│    Drag handle on Style cards for reordering                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. REORDER (New)                                                        │
│                                                                         │
│    User drags Style card to new position                                │
│    → Reorder perStyleResults[] array                                    │
│    → Debounce 300ms                                                     │
│    → Re-call calculateAll() with new order                              │
│    → UI updates with new allocation preview                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. SAVE (Enhanced)                                                      │
│                                                                         │
│    POST /api/weekly-orders/:id/results                                  │
│                                                                         │
│    Backend (new logic):                                                 │
│    - For each CalculationItem with shortage_cones > 0:                  │
│      - Create allocation record (status: PENDING)                       │
│      - requested_meters = shortage_cones * meters_per_cone              │
│      - Execute FEFO allocation (existing RPC)                           │
│    - Allocations for fully_stocked items: skip (use existing stock)     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Type Changes

```typescript
// Extended CalculationItem (src/types/thread/threadCalculation.ts)
interface CalculationItem {
  // ... existing fields ...

  // NEW: Inventory preview fields
  inventory_available?: number    // Cones available from stock for this item
  shortage_cones?: number         // Cones that need to be ordered
  is_fully_stocked?: boolean      // True if inventory covers full requirement
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Preview allocation becomes stale if inventory changes | Re-calculate when user interacts. Accept that preview is point-in-time snapshot. |
| Drag-and-drop adds complexity to UI | Use established library (vuedraggable). Keep interaction simple (card-level only). |
| Save creates many allocation records | Batch insert. Only create for shortages (not fully stocked items). |
| Concurrent users may see different previews | Acceptable - soft allocation at save time handles conflicts via existing system. |
