## Why

The current inventory system has two parallel stock tracking mechanisms (`thread_inventory` for individual cones and `thread_stock` for aggregate quantities) that can drift out of sync. Neither tracks physical location in the warehouse. In practice, returned thread cones of the same color (possibly different tex) are grouped into physical bins/containers, but the system has no concept of this — making it hard to locate stock and manage warehouse operations efficiently.

Since `thread_stock` was recently created (migration `20260211`) with minimal production data, now is the ideal time to replace it with a bin-based system before more data accumulates.

## What Changes

- **New `bins` table** replacing `thread_stock` as the single source of truth for stock quantities
- **New `bin_items` table** tracking thread quantities per bin (aggregated — one row per thread_type per bin)
- **New `bin_transactions` table** logging all bin operations (IN, OUT, MOVE) for audit trail
- **QR codes on bins** — each bin gets a unique code (e.g., `BIN-00001`) for QR label printing and scanning
- **Bin-aware receiving** — when receiving delivery from supplier, user must assign stock to bins (split across multiple bins allowed)
- **Bin-aware issuing** — Issue V2 deducts from `bin_items` instead of `thread_inventory`; user can scan a bin QR to pick stock
- **Bin-aware returns** — returned cones from production go into a selected bin
- **Bin relocation** — bins can be moved between warehouse locations with history tracking
- **Equivalent cone estimation** — partial cones in a bin are converted to full-cone equivalents using `partial_cone_ratio` from `system_settings`
- **BREAKING**: `thread_stock` table and `server/routes/stock.ts` will be deprecated and removed
- **BREAKING**: `deductStock()` in `issuesV2.ts` will change from updating `thread_inventory` cone status to decrementing `bin_items.qty_cones`
- **BREAKING**: `getStockAvailability()` in `issuesV2.ts` will query `bin_items` instead of `thread_inventory`

## Capabilities

### New Capabilities
- `bin-management`: CRUD operations for bins (create, read, update, relocate, retire), QR code generation, bin content viewing via QR scan
- `bin-stock-operations`: Stock IN (from delivery receiving + production returns), stock OUT (for issue deduction), MOVE (bin relocation), with full transaction audit log
- `bin-stock-integration`: Replace `thread_stock` and modify Issue V2 + delivery receiving to use bins as the single source of truth for stock availability

### Modified Capabilities

## Impact

- **Database**: New tables `bins`, `bin_items`, `bin_transactions`; deprecate `thread_stock`; replace `v_stock_summary` view
- **Backend routes**: New `server/routes/bins.ts`; modify `server/routes/issuesV2.ts` (stock check + deduct logic); modify `server/routes/weeklyOrder.ts` (delivery receive flow); deprecate `server/routes/stock.ts`
- **Frontend**: New bin management page, bin detail page, bin QR labels; modify delivery receiving UI (bin selection); modify issue UI (bin-aware stock picking)
- **Services**: New `binService.ts`; modify `stockService.ts` → redirect to bins; modify `issueV2Service.ts` form data
- **Existing data**: `thread_stock` records need migration to `bin_items` (low volume — table is new)
