## Why

The current weekly order flow creates delivery records when orders are calculated, but there is no mechanism to track when deliveries are actually received into inventory. When a supplier delivers thread cones, users can only mark them as "delivered" but cannot sync this to the inventory system. This creates a data gap where the inventory doesn't reflect actual received stock, leading to inaccurate stock levels and potential ordering mistakes.

## What Changes

- **Add inventory receiving fields to deliveries table**: New columns `received_quantity`, `inventory_status`, `warehouse_id`, `received_by`, `received_at` to track the receive-to-inventory process
- **New API endpoint for receiving deliveries into inventory**: `POST /api/weekly-orders/deliveries/:id/receive` that creates thread_inventory records and updates delivery status
- **Auto-generate lot numbers**: Pattern `LOT-{YYYYMMDD}-{seq}` for each receive batch
- **Two-tab UI in deliveries page**: Tab 1 for delivery tracking (existing), Tab 2 for inventory receiving with pending items list
- **Partial delivery tracking**: Support receiving fewer cones than ordered, tracking pending quantities for follow-up deliveries
- **Inventory records created with AVAILABLE status**: Cones are immediately available for allocation after receiving

## Capabilities

### New Capabilities
- `delivery-inventory-receiving`: Receiving delivered thread cones into inventory from the weekly order deliveries page, including warehouse selection, quantity validation, partial delivery handling, and automatic inventory record creation

### Modified Capabilities
<!-- No existing spec-level requirements are changing, only implementation additions -->

## Impact

- **Database**: Migration to add columns to `thread_order_deliveries` table
- **Backend**: New route in `server/routes/weeklyOrder.ts` for receive endpoint
- **Frontend**:
  - Modified `src/pages/thread/weekly-order/deliveries.vue` with tabs UI
  - New composable or extended service for receive functionality
- **Types**: Extended `DeliveryRecord` interface with new fields
- **Data flow**: Deliveries page now connects to inventory system, creating `thread_inventory` records
