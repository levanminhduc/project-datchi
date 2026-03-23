## Context

The weekly order system has two phases: calculation (frontend calls batch API, aggregates by thread_type_id) and persistence (frontend sends aggregated results to backend as JSONB). Currently there is no inventory awareness in the summary table.

The existing `GET /api/inventory/available/summary` endpoint returns available inventory grouped by thread_type_id but is a general-purpose endpoint. A new dedicated endpoint under the weekly-orders namespace will handle enrichment with proper validation, keeping concerns separated.

Key existing structures:
- `AggregatedRow`: `{ thread_type_id, thread_type_name, supplier_name, tex_number, total_meters, total_cones, meters_per_cone, thread_color, thread_color_code }`
- `thread_inventory` table: `{ id, thread_type_id, status (cone_status ENUM), is_partial, ... }` with index on status=AVAILABLE
- Save flow: `POST /api/weekly-orders/:id/results` stores `{ calculation_data, summary_data }` as JSONB
- Load flow: `GET /api/weekly-orders/:id/results` returns saved JSONB as-is

## Goals / Non-Goals

**Goals:**
- Backend endpoint that enriches summary rows with real-time inventory data (server-side query, single source of truth)
- Snapshot inventory at calculation time so history shows what stock was available when the order was created
- Display 4 new columns: inventory cones, deficit, manual buffer, final total
- Allow manual "Dat them" (additional order) input per row with frontend recalc
- Include all new columns in Excel export
- Option A for history: show saved snapshot, "Tinh lai" refreshes with current inventory

**Non-Goals:**
- No new database tables or columns — use existing JSONB storage
- No inventory reservation or allocation from this view
- No real-time inventory subscription
- No backend calculation of thread requirements (stays in frontend)

## Decisions

### 1. Dedicated enrich endpoint vs reusing existing inventory API

**Decision**: New `POST /api/weekly-orders/enrich-inventory` endpoint.

**Rationale**: The existing `/api/inventory/available/summary` returns raw inventory data requiring client-side mapping. A dedicated endpoint accepts summary rows, does the join server-side, and returns enriched rows ready for display. This keeps the calculation logic (deficit, defaults) on the backend as single source of truth. The endpoint is stateless — no weekId required.

**Alternative considered**: Frontend calls existing inventory summary API and maps client-side — rejected because inventory calculations should be server-authoritative for auditability.

### 2. Inventory aggregation: SQL GROUP BY vs application-level

**Decision**: Use Supabase query with `.eq('status', 'AVAILABLE')` and `.in('thread_type_id', ids)`, then aggregate in application code.

**Rationale**: Supabase JS client doesn't support raw SQL GROUP BY with COUNT FILTER. Fetching filtered rows and aggregating in JS is simpler and matches existing patterns in the codebase (see `/api/inventory/available/summary` which does the same approach).

### 3. History display: Option A (snapshot)

**Decision**: When loading saved results, display the `summary_data` JSONB as-is, including the `inventory_cones`, `sl_can_dat`, `additional_order`, and `total_final` values from when it was saved. Do NOT re-enrich.

**Rationale**: This preserves the historical record of what inventory was available at order time. Users can always press "Tinh lai" (recalculate) to get fresh data. This is the simplest approach and provides auditability.

### 4. Editable cell: q-popup-edit

**Decision**: Use `q-popup-edit` with number input for "Dat them" column, consistent with existing codebase patterns.

**Rationale**: Clean table display — value shows as text, tap to edit in popup. Emit event to parent for state update. Frontend-only recalc of `total_final`.

### 5. additional_order state management

**Decision**: Add `updateAdditionalOrder(threadTypeId, value)` method to `useWeeklyOrderCalculation` composable. This mutates the `aggregatedResults` ref directly, recalculating `total_final`.

**Rationale**: The composable already owns `aggregatedResults`. Adding a mutation method keeps state management centralized. The save flow already serializes `aggregatedResults` to JSONB, so `additional_order` persists automatically.

## Risks / Trade-offs

- **Stale inventory**: Inventory is fetched once at calculation time. Stock changes between calculation and actual ordering won't be reflected. → Mitigation: User can press "Tinh lai" to refresh. This is acceptable for weekly ordering workflow.
- **Missing thread_type_id**: If a thread_type_id in summary has no inventory records, it means zero stock. → Mitigation: Default `inventory_cones` to 0.
- **Supabase `.in()` limit**: Large arrays of thread_type_ids could hit query limits. → Mitigation: Weekly orders typically have <100 thread types. Not a practical concern.
- **JSONB backward compatibility**: Old saved results won't have the new fields. → Mitigation: Frontend displays `undefined` as "—" (dash). No migration needed.
