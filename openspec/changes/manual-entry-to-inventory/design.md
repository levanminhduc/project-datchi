## Context

The manual stock entry feature ("Nhập Thủ Công") on the inventory page calls `POST /api/stock` which upserts aggregate quantity records into `thread_stock`. However, the entire downstream system — FEFO allocation (`fn_allocate_thread`), Issue V2, Recovery, Transfer, and the Inventory page itself — reads exclusively from `thread_inventory` (individual cone tracking). This disconnect means manually entered stock is invisible to allocation and cannot be issued.

The existing `POST /api/inventory/receive` endpoint already creates individual cone records in `thread_inventory` but uses status `RECEIVED` (requires inspection) and doesn't support partial cones or lot auto-creation.

Current state of `POST /api/stock` (stock.ts:216-321): Validates via `AddStockSchema`, checks for existing `thread_stock` record by (thread_type_id, warehouse_id, lot_number), upserts aggregate quantities. Response uses `{ success, data, error, message }` format (legacy pattern — note: project standard is `{ data, error, message }`).

## Goals / Non-Goals

**Goals:**
- Manual stock entry creates individual `thread_inventory` records so cones are immediately visible to FEFO, Issue V2, and the Inventory page
- Auto-generate lot records in `lots` table for traceability
- Support partial cones with reduced `quantity_meters`
- Cones enter at status `AVAILABLE` (skip RECEIVED/INSPECTED since manual entry implies already-checked stock)
- Zero frontend changes — same `stockService.addStock()` call, compatible response shape

**Non-Goals:**
- Migrating existing `thread_stock` data to `thread_inventory` (separate future effort)
- Changing `POST /api/stock/deduct` or `POST /api/stock/return` (they continue to operate on `thread_stock`)
- Modifying delivery receiving flow (`POST /api/weekly-orders/deliveries/:id/receive`) — that has its own separate path
- Adding barcode scanning or bin assignment to manual entry
- Changing the frontend dialog UI or validation

## Decisions

### Decision 1: Rewrite `POST /api/stock` handler to insert into `thread_inventory`

**Choice:** Replace the existing upsert-into-`thread_stock` logic with insert-into-`thread_inventory` logic.

**Rationale:** The frontend (`stockService.addStock()`) already calls `POST /api/stock` with the exact fields needed (thread_type_id, warehouse_id, qty_full_cones, qty_partial_cones, received_date, expiry_date, notes). No validation schema changes needed — `AddStockSchema` already validates all required fields.

**Alternative considered:** Create a new endpoint `POST /api/inventory/manual-entry` and update the frontend service. Rejected because it requires frontend changes and the existing endpoint semantics ("add stock") map perfectly to the new behavior.

### Decision 2: Cone ID format `MC-{timestamp}-{NNN}`

**Choice:** Use prefix `MC` (Manual Cone) to distinguish from `CONE-{timestamp}-{NNN}` (delivery receive).

**Rationale:** Different prefix enables easy identification of stock origin (manual vs delivery). Timestamp in milliseconds + 4-digit sequence ensures uniqueness even for large batches.

### Decision 3: Auto-create lot record in `lots` table

**Choice:** Generate lot_number as `MC-LOT-{YYYYMMDD}-{HHmmss}` and insert into `lots` table with status `ACTIVE`, total_cones = qty_full + qty_partial, available_cones = same.

**Rationale:** The `lots` table exists for traceability. Manual entry should create proper lot records so the batch tracking system works consistently. If the user provides a lot_number in the request, use that instead of auto-generating.

### Decision 4: Status = AVAILABLE (not RECEIVED)

**Choice:** Set all manually entered cones to `AVAILABLE` status.

**Rationale:** Manual entry implies the operator has already verified the stock. Setting to `AVAILABLE` means cones are immediately visible to FEFO allocation (which queries `WHERE status = 'AVAILABLE'`) and the Inventory page. Using `RECEIVED` would require an extra inspection step that doesn't apply to manual entry.

### Decision 5: Partial cone quantity_meters calculation

**Choice:** For partial cones, calculate `quantity_meters = meters_per_cone * partial_cone_ratio`. The `partial_cone_ratio` value (currently 0.3) is retrieved from the database function `fn_get_partial_cone_ratio()`.

**Rationale:** Consistent with how the rest of the system treats partial cones. The ratio is centralized in `system_settings` and accessed via the DB function, avoiding hardcoded values.

### Decision 6: Response format alignment

**Choice:** Change response from legacy `{ success, data, error, message }` to project standard `{ data, error, message }`. Return created cone count and lot number in data.

**Rationale:** Aligns with project convention (`CLAUDE.md`). The frontend `fetchApi()` checks `response.ok` for success, not a `success` field. The data payload changes from a single `StockRow` to `{ cones_created, lot_number, cone_ids }` — but `stockService.addStock()` only uses the response for a success toast, so this is backward-compatible.

### Decision 7: Batch insert limit handling

**Choice:** Use single `supabase.from('thread_inventory').insert(cones)` call. Supabase/PostgREST supports batch inserts up to thousands of rows.

**Rationale:** Typical manual entry is 1-50 cones. Even 500 cones is well within Supabase's batch insert capability. No need for chunking or pagination.

## Risks / Trade-offs

**[Risk] Large batch performance** → For very large manual entries (500+ cones), the single insert may be slow. Mitigation: This is unlikely for manual entry (vs automated batch receive). If needed, chunk inserts into batches of 100.

**[Risk] `thread_stock` GET endpoints return stale data** → `GET /api/stock` and `GET /api/stock/summary` still read from `thread_stock`, so manually entered stock won't appear there. Mitigation: These endpoints are not used by the main Inventory page (which reads `thread_inventory`). They're used by older/internal views. Document this gap.

**[Risk] Lot number collision** → If two users manually enter stock at the exact same second, the auto-generated lot_number could collide. Mitigation: lot_number format includes seconds precision. For true safety, the `lots.lot_number` UNIQUE constraint will reject duplicates, and the handler catches the error.

**[Trade-off] No rollback to `thread_stock`** → Once deployed, manual entries go to `thread_inventory` only. If there's a need to revert, old `thread_stock` entries are still there but new entries won't be. Acceptable because `thread_inventory` is the authoritative source for all downstream systems.
