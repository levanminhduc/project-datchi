## Why

When a delivery is partially received over multiple sessions, `fn_receive_delivery` overwrites `received_by` and `received_at` on `thread_order_deliveries`, losing all prior receive history. Warehouse staff need an audit trail showing who received what quantity, when, and into which warehouse — especially for partial receives that span days or involve different operators.

## What Changes

- New `delivery_receive_logs` table to persist every receive event (delivery_id, quantity, warehouse_id, received_by, notes, created_at)
- Update `fn_receive_delivery` RPC to INSERT a log row inside the same transaction that updates the delivery
- New API endpoint `GET /api/weekly-orders/deliveries/receive-logs` with optional filters (delivery_id, week_id) and pagination
- New 3rd tab "Lich su nhap kho" on `thread/weekly-order/deliveries.vue` showing chronological receive history
- New `DeliveryReceiveLog` TypeScript type and `getReceiveLogs()` service method

## Capabilities

### New Capabilities
- `delivery-receive-logs`: Database table, RPC update, API endpoint, frontend tab, and type definitions for tracking every delivery receive event with full audit trail

### Modified Capabilities
- `delivery-inventory-receiving`: The `fn_receive_delivery` function gains a side-effect (INSERT into `delivery_receive_logs`) that changes the behavioral contract of the receive operation

## Impact

- **Database**: New table `delivery_receive_logs` + indexes; migration alters `fn_receive_delivery`
- **Backend**: New route in `server/routes/weekly-order/deliveries.ts` (before `/:deliveryId` routes), new Zod schema for query params
- **Frontend**: Modified `src/pages/thread/weekly-order/deliveries.vue` (3rd tab), new composable or inline logic for fetching logs, extended `deliveryService.ts`, new type in `src/types/thread/weeklyOrder.ts`
- **No breaking changes**: Existing receive flow unchanged; log insertion is additive
