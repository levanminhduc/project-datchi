## Why

The Weekly Order system requires Purchase Order (PO) data with style quantities to validate ordering limits. Currently, there's no way to manage `po_items` (style + quantity per PO) — the data must be created directly in the database. Production planning users need both Excel import (primary) and manual UI entry (secondary) to manage PO items efficiently.

## What Changes

- Add `deleted_at` column to `po_items` table for soft delete support
- Create `po_item_history` table for business-level change tracking (who changed quantity, when, old/new values)
- Attach audit trigger to `po_items` for full CDC logging
- Add API endpoints for PO items CRUD and history retrieval
- Add API endpoints for Excel import (parse preview + execute)
- Create PO management pages: list, detail (with items management), import
- Add import mapping configuration to Settings page (following import-tex pattern)
- Add "Đơn Hàng (PO)" menu item under "Kế Hoạch"

## Capabilities

### New Capabilities

- `po-items-crud`: CRUD operations for PO items with soft delete and history tracking
- `po-items-import`: Excel import with configurable column mapping, preview, and ADDITIVE merge strategy
- `po-management-ui`: UI pages for PO list, detail view with items management, and import workflow

### Modified Capabilities

- None (existing `purchase_orders` API remains unchanged, only adding new item-level routes)

## Impact

- **Database**: New migration for `deleted_at` column, `po_item_history` table, audit trigger
- **Backend**: Extend `server/routes/purchaseOrders.ts` for items CRUD, add import routes to `server/routes/import.ts`
- **Frontend**: New pages in `src/pages/thread/purchase-orders/`, new components, extend Settings page
- **Services**: Extend `purchaseOrderService.ts`, extend `importService.ts`
- **Navigation**: Update `useSidebar.ts` to add menu item
- **Weekly Order**: No changes needed — existing `validatePOQuantityLimits()` will work with modified quantities
