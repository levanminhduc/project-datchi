## Why

The weekly thread ordering workflow calculates thread requirements per supplier but has no delivery date tracking. Users cannot see when suppliers are expected to deliver, cannot track delivery status over time, and must manually manage delivery timelines outside the system. Adding delivery tracking allows automatic calculation of expected delivery dates based on each supplier's `lead_time_days`, persistent storage of delivery records, and a management page for monitoring and updating delivery status.

## What Changes

- Add `supplier_id` and `delivery_date` fields to the thread calculation API response (`CalculationItem`), computed as `NOW() + supplier.lead_time_days`
- Create a new `thread_order_deliveries` database table to persist delivery tracking records per weekly order
- Auto-generate delivery records when weekly order results are saved (POST `/api/weekly-orders/:id/results`)
- Add a "Ngày giao" (Delivery Date) column to the `ResultsDetailView.vue` detail table (read-only, backend-computed)
- Create API endpoints for listing, updating, and managing delivery records
- Create a delivery management page for tracking deliveries across weekly orders, with editable delivery dates, actual delivery dates, and status

## Capabilities

### New Capabilities
- `delivery-tracking`: Automatic delivery date calculation from supplier lead times, persistent delivery records per weekly order, delivery management page with status tracking and date editing

### Modified Capabilities
- `weekly-order-inventory-columns`: Thread calculation results now include `supplier_id` and `delivery_date` fields; saving results auto-creates delivery records

## Impact

- **Database**: New `thread_order_deliveries` table with FK to `thread_order_weeks`, `thread_types`, `suppliers`
- **Backend**: Modified `server/routes/threadCalculation.ts` (add `supplier_id` + `delivery_date` to response), modified `server/routes/weeklyOrder.ts` (auto-create deliveries on save results), new delivery CRUD endpoints
- **Frontend Types**: Extended `CalculationItem` with `supplier_id`, `delivery_date`, `lead_time_days`; new delivery management types
- **Frontend Components**: Modified `ResultsDetailView.vue` (add column), new delivery management page
- **Frontend Services**: New `deliveryService.ts` for delivery CRUD API calls
