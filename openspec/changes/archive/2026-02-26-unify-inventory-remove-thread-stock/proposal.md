## Why

The system currently has two parallel inventory tables — `thread_inventory` (individual cone tracking with barcode, FEFO, status lifecycle, audit trail) and `thread_stock` (aggregate quantity tracking). Delivery Receive writes to `thread_stock`, but Issue V2, Weekly Order enrichment, Allocation, and Recovery all read exclusively from `thread_inventory`. This means stock received from supplier deliveries is **invisible to the entire outbound flow** — Issue V2 reports insufficient stock even when `thread_stock` has inventory. Additionally, two independent deduct paths exist (`issuesV2.deductStock` on `thread_inventory` vs `POST /api/stock/deduct` on `thread_stock`), creating risk of double-counting. The fix is to eliminate `thread_stock` entirely and unify all inventory operations on `thread_inventory`.

## What Changes

- **BREAKING**: Remove `thread_stock` table and all code that reads/writes it
- **BREAKING**: Remove `v_stock_summary` view (will be recreated from `thread_inventory`)
- **BREAKING**: `POST /api/stock/deduct` and `POST /api/stock/return` change internal implementation (same API contract, different source table)
- Rewrite `POST /api/weekly-orders/deliveries/:id/receive` to create individual cones in `thread_inventory` + `lots` (instead of 1 aggregate `thread_stock` record)
- Rewrite `GET /api/stock` and `GET /api/stock/summary` to aggregate from `thread_inventory`
- Create data migration function `fn_stock_to_inventory()` to convert existing `thread_stock` records into `thread_inventory` cones + `lots`
- Recreate `v_stock_summary` view reading from `thread_inventory`
- Remove `fn_migrate_inventory_to_stock()` function (reverse direction, no longer needed)
- Update frontend types if response shape changes

## Capabilities

### New Capabilities
- `stock-to-inventory-migration`: One-time data migration converting existing `thread_stock` aggregate records into individual `thread_inventory` cones with proper `lots` linking
- `unified-stock-view`: Recreated `v_stock_summary` view aggregating from `thread_inventory` instead of `thread_stock`, providing consistent stock visibility across all modules

### Modified Capabilities
- `delivery-inventory-receiving`: Delivery receive endpoint now creates individual `thread_inventory` cones + `lots` record instead of `thread_stock` aggregate record. Adds `expiry_date` optional field to receive schema.
- `manual-stock-entry`: Remove all references to `thread_stock` and `thread_type_supplier` junction table. Stock deduct/return operations now use FEFO logic on `thread_inventory` (matching Issue V2 pattern).

## Impact

- **Database**: DROP `thread_stock` table, DROP+RECREATE `v_stock_summary` view, DROP `fn_migrate_inventory_to_stock()`, ADD `fn_stock_to_inventory()` migration function
- **Backend routes**: `server/routes/stock.ts` (all endpoints), `server/routes/weeklyOrder.ts` (delivery receive)
- **Backend validation**: `server/validation/stock.ts` (DeductStockSchema, ReturnStockSchema may need updates)
- **Frontend types**: `src/types/thread/stock.ts` (ThreadStockRow and related types become unnecessary)
- **Frontend services**: `src/services/stockService.ts` (response mapping if shapes change)
- **No impact on**: `issuesV2.ts`, `recovery.ts`, `allocations.ts`, `inventory.ts` cone summary endpoints (already read from `thread_inventory`)
- **Realtime**: Delivery receive will now trigger `thread_inventory` realtime subscriptions (currently not triggered because writes go to `thread_stock`)
