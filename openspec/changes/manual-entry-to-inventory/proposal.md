## Why

The manual stock entry feature ("Nhập Thủ Công") currently writes to the `thread_stock` table (aggregate quantity tracking), but the entire downstream system — FEFO allocation, Issue V2, Recovery, Transfer — reads exclusively from `thread_inventory` (individual cone tracking). This means manually entered stock is invisible to allocation, cannot be issued, and does not appear on the Inventory page. Redirecting manual entry to write individual cone records into `thread_inventory` unifies the inventory source of truth without requiring the full bin management system.

## What Changes

- Modify `POST /api/stock` backend endpoint to create individual cone records in `thread_inventory` instead of upserting aggregate records in `thread_stock`
- Auto-generate `cone_id` for each cone (format: `MC-{timestamp}-{NNN}`)
- Auto-create a lot record in `lots` table for traceability
- Support `qty_partial_cones`: create separate cone records with `is_partial=true` and reduced `quantity_meters`
- Set cone status to `AVAILABLE` (not `RECEIVED`) so cones are immediately visible to FEFO and Issue V2
- Calculate `quantity_meters` from `thread_types.meters_per_cone`; for partial cones use `meters_per_cone * partial_cone_ratio` (0.3 from `system_settings`)
- Update response to return created cone count and lot number
- Frontend dialog remains unchanged (same cascading NCC → Tex → Color flow, same `stockService.addStock()` call)

## Capabilities

### New Capabilities

- `manual-entry-inventory-bridge`: Backend logic that converts aggregate stock input (qty_full + qty_partial) into individual `thread_inventory` cone records with auto-generated cone_ids, lot creation, and proper FEFO metadata

### Modified Capabilities

(none — no existing spec-level requirements change; this is a new implementation path for the same user-facing feature)

## Impact

- `server/routes/stock.ts` — `POST /` endpoint rewritten to insert into `thread_inventory` + `lots` instead of `thread_stock`
- `server/validation/stock.ts` — No schema changes needed (AddStockDTO fields are sufficient)
- `src/services/stockService.ts` — No changes (same endpoint, compatible response)
- `src/pages/thread/inventory.vue` — No changes (manual entry dialog already calls `stockService.addStock()`)
- Downstream consumers (FEFO, Issue V2, Recovery, Transfer) — no changes needed; they already read `thread_inventory`
- `thread_stock` table — `POST /api/stock/deduct` and `POST /api/stock/return` routes remain unchanged for backward compatibility
