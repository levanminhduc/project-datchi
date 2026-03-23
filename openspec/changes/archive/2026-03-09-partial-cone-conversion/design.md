## Context

The weekly order system enriches aggregated results with inventory data via `POST /api/weekly-orders/enrich-inventory`. Currently it counts all AVAILABLE cones equally (1 cone = 1 unit) regardless of `is_partial` flag. Partial cones contain ~30% thread (stored as `partial_cone_ratio` in `system_settings`). This under-counts needed order quantities.

Reserve functions (`fn_reserve_for_week`) hardcode `ORDER BY is_partial DESC` (partial first). Return function (`fn_return_cones_with_movements`) does not clear `reserved_week_id`/`original_week_id` when cones return to AVAILABLE.

## Goals / Non-Goals

**Goals:**
- Accurate order quantity calculation using partial cone ratio conversion
- Transparent UI showing full/partial/equivalent breakdown
- Configurable reserve priority via system_settings
- Clean week assignment on cone return

**Non-Goals:**
- Changing allocation logic (`fn_allocate_thread`) — out of scope
- Re-assigning returned cones to their original week — explicitly decided against
- Changing `partial_cone_ratio` value itself — already exists in system_settings

## Decisions

### D1: Enrich endpoint computes equivalent in backend
**Rationale**: Single source of truth. Frontend receives pre-computed values. Avoids frontend needing to fetch `partial_cone_ratio` separately.

**Alternative**: Frontend computes — rejected because it requires extra API call for ratio and duplicates logic.

### D2: Keep raw `inventory_cones` + add `equivalent_cones`
**Rationale**: User chose to keep raw count visible. `sl_can_dat` uses equivalent for accuracy. Both values returned from enrich endpoint.

### D3: Separate full/partial aggregation in enrich
**Current**: `inventoryMap[thread_type_id] += 1` (no distinction)
**New**: Two maps — `fullMap` and `partialMap`. Enrich returns `full_cones`, `partial_cones`, `equivalent_cones = full + partial * ratio`.

### D4: Reserve priority setting
**Key**: `reserve_priority` in `system_settings`
**Values**: `partial_first` (default, current behavior) | `full_first`
**Implementation**: `fn_reserve_for_week` reads setting via `SELECT value FROM system_settings WHERE key = 'reserve_priority'`. Maps to `ORDER BY is_partial DESC` or `ASC`.

**Alternative**: Parameter on RPC call — rejected because it's a warehouse-wide policy, not per-call.

### D5: Return clears week fields
**Change**: `fn_return_cones_with_movements` UPDATE adds `reserved_week_id = NULL, original_week_id = NULL`.
**Rationale**: Returned cones should be fully free for any future week to reserve. User explicitly chose not to re-assign to original week.

### D6: fn_borrow_thread and fn_reserve_from_stock also read reserve_priority
**Rationale**: Consistency. All reserve-related functions should respect the same priority setting. Both currently use `is_partial DESC`.

## Risks / Trade-offs

- **[Perf] Setting query in RPC** → Low risk: `system_settings` is tiny table, query cached by PG. Alternative: pass as parameter — adds complexity for negligible gain.
- **[Data] Existing reserved cones with stale original_week_id** → No migration needed. D5 only affects future returns. Existing data stays as-is until those cones are returned.
- **[UX] More columns in summary table** → Trade-off: more info vs table width. Mitigated by using short column headers (CN, CL, TK QĐ).
