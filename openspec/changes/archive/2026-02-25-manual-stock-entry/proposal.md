## Why

The inventory page (`thread/inventory`) currently only supports barcode-based stock receipt (creating individual `thread_inventory` cone records). Users need a simpler "Manual Entry" option to quickly record incoming stock by quantity (full cones + partial cones) into the `thread_stock` table — without scanning barcodes for each cone. The entry flow must cascade: Supplier → Tex number → Color → Quantities, ensuring data integrity through existing relationships.

## What Changes

- Add a "Nhập Thủ Công" (Manual Entry) button to the inventory page toolbar alongside existing "Nhập Kho" and "Quét tra cứu" buttons
- Create a cascading dialog with 3-step selection: Supplier → Tex (grouped from thread_types via junction table) → Color (from thread_types filtered by supplier + tex)
- Submit data to existing `POST /api/stock` endpoint (upsert into `thread_stock` table)
- No new backend API endpoints needed — leverage existing `/api/suppliers`, `/api/thread-type-suppliers`, and `/api/stock`

## Capabilities

### New Capabilities
- `manual-stock-entry`: Cascading dialog UI for manual stock entry with supplier → tex → color flow, submitting to thread_stock table

### Modified Capabilities

(none)

## Impact

- **Frontend**: `src/pages/thread/inventory.vue` — add button and dialog
- **Frontend**: May need new composable or extend existing ones for cascading supplier → tex → color logic
- **Services**: May need to add/extend `stockService` or `threadTypeSupplierService` for fetching thread types by supplier
- **Backend (minor)**: Update Supabase select in `server/routes/thread-type-supplier.ts` to include `color_id` and `color_data` in thread_type join (no new routes)
- **Backend types**: Update `ThreadTypeSummary` in both `server/types/thread-type-supplier.ts` and `src/types/thread/thread-type-supplier.ts` to include color fields
- **No database changes**: Uses existing `thread_stock` table
