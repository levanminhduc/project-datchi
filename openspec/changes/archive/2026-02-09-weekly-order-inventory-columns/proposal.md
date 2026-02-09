## Why

The weekly order summary table ("Tong hop dat hang") currently shows calculated thread requirements (total meters, cones) but lacks inventory context. Users must mentally cross-reference warehouse stock to determine actual ordering needs. Adding inventory-aware columns with backend enrichment enables users to see available stock (server-side snapshot), calculate the deficit, add buffer quantities, and finalize the total order — all in one view with historical auditability.

## What Changes

- Add new backend endpoint `POST /api/weekly-orders/enrich-inventory` that receives summary rows, queries actual inventory from DB (status=AVAILABLE), calculates deficit, and returns enriched rows
- Add Zod validation schema `EnrichInventorySchema` for the new endpoint
- Add `enrichInventory()` method to frontend `weeklyOrderService`
- Extend `AggregatedRow` type with: `inventory_cones`, `sl_can_dat`, `additional_order`, `total_final`
- Auto-call enrich endpoint after `calculateAll()` completes in composable
- Add `updateAdditionalOrder()` method to composable for frontend recalc of `total_final`
- Add 4 new columns to `ResultsSummaryTable.vue`: Ton kho KD, SL can dat, Dat them (editable via q-popup-edit), Tong chot
- Include new columns in Excel export
- On load from history (Option A): display saved snapshot data as-is, do NOT re-enrich. User can press "Tinh lai" to refresh with current inventory.

## Capabilities

### New Capabilities
- `weekly-order-inventory-columns`: Backend inventory enrichment endpoint and frontend inventory-aware columns in weekly order summary table with auto-calculated deficit, manual buffer input, final order totals, and historical snapshot persistence

### Modified Capabilities

## Impact

- **Backend route**: `server/routes/weeklyOrder.ts` — new POST endpoint for inventory enrichment
- **Backend validation**: `server/validation/weeklyOrder.ts` — new `EnrichInventorySchema`
- **Frontend types**: `src/types/thread/weeklyOrder.ts` — extend `AggregatedRow` interface
- **Frontend service**: `src/services/weeklyOrderService.ts` — add `enrichInventory()` method
- **Frontend composable**: `src/composables/thread/useWeeklyOrderCalculation.ts` — call enrich after aggregation, add `updateAdditionalOrder()`
- **Frontend component**: `src/components/thread/weekly-order/ResultsSummaryTable.vue` — 4 new columns, editable cell
- **Frontend page**: `src/pages/thread/weekly-order/index.vue` — wire update event, update Excel export
- **Database**: No schema changes — uses existing `thread_inventory` table (read-only) and `summary_data` JSONB field for persistence
