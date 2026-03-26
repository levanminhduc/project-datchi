## Why

The current `thread_order_deliveries` table tracks delivery dates but lacks a `quantity_cones` column to indicate how many cones are expected. This makes it impossible to calculate "still pending" (`quantity_cones - received_quantity`) accurately. Additionally, when thread loans occur between weeks or inventory becomes available after confirm (e.g., from returns, recovery, or quota overestimation), there's no mechanism to adjust the expected delivery quantity or reserve additional stock from inventory.

## What Changes

- Add `quantity_cones` column to `thread_order_deliveries` to track expected delivery quantity
- Populate `quantity_cones` from `total_final` (shortage) when saving weekly order results
- Add `fn_reserve_from_stock` RPC to manually reserve available inventory cones for a confirmed week
- Modify `fn_borrow_thread` RPC to adjust `quantity_cones` on both source and target week deliveries
- Support loan records with `from_week_id = NULL` to indicate "borrowed from stock" (audit trail)
- Update delivery tracking UI to show pending quantity (`quantity_cones - received_quantity`)
- Add "Reserve from Stock" action in weekly order UI for confirmed weeks with shortage

## Capabilities

### New Capabilities
- `delivery-quantity-column`: Schema and logic for tracking expected delivery quantity in thread_order_deliveries
- `reserve-from-stock`: RPC and API to reserve available inventory cones for a confirmed weekly order, reducing shortage

### Modified Capabilities
- `delivery-tracking`: Add quantity_cones column, update save logic to populate from shortage
- `delivery-inventory-receiving`: Display pending quantity based on quantity_cones - received_quantity

## Impact

- **Database**: ALTER TABLE thread_order_deliveries ADD COLUMN quantity_cones
- **RPC Functions**: New fn_reserve_from_stock, modify fn_borrow_thread to adjust deliveries
- **Backend**: Update saveResults route to populate quantity_cones, add reserve-from-stock endpoint
- **Frontend**: Update DeliveryRecord type, delivery tracking UI, add reserve action in weekly order detail
- **Audit Trail**: thread_order_loans with from_week_id=NULL indicates stock reservation
