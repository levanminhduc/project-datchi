## 1. Database: Create log table and update RPC

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_add_delivery_receive_logs.sql` with: CREATE TABLE `delivery_receive_logs` (id SERIAL PK, delivery_id INTEGER NOT NULL FK, quantity INTEGER NOT NULL, warehouse_id INTEGER NOT NULL FK, received_by VARCHAR(100) NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()), CHECK constraint `chk_receive_log_qty_positive`, and indexes on `delivery_id` and `created_at DESC`
- [x] 1.2 In the same migration, CREATE OR REPLACE `fn_receive_delivery` to add INSERT INTO `delivery_receive_logs` (delivery_id, quantity, warehouse_id, received_by) after the existing UPDATE on `thread_order_deliveries`. Read current function body from `supabase/migrations/20260405223300_fix_receive_delivery_use_delivery_color.sql` first
- [x] 1.3 Run `supabase migration up` to apply the migration <- (verify: table exists with correct schema via `\d delivery_receive_logs`, fn_receive_delivery body contains INSERT into delivery_receive_logs, a test receive creates both the delivery update AND a log row)

## 2. Backend: API endpoint for receive logs

- [x] 2.1 Add Zod validation schema for receive-logs query params (delivery_id optional integer, week_id optional integer, limit optional integer default 50 max 100) in `server/validation/weeklyOrder.ts`
- [x] 2.2 Add `GET /receive-logs` route in `server/routes/weekly-order/deliveries.ts` BEFORE any `/:deliveryId` routes. Permission: `thread.allocations.view`. Query `delivery_receive_logs` joined with `thread_order_deliveries`, `thread_types`, `suppliers`, `weekly_orders`, `warehouses` to return enriched log entries. Support optional filters `delivery_id` and `week_id`, order by `created_at DESC`, respect `limit` param
- [x] 2.3 Test the endpoint manually: verify response format `{ data: [...], error: null }`, verify filtering by delivery_id and week_id, verify limit cap at 100, verify 403 without permission <- (verify: route registered before /:deliveryId, joined data includes thread_type_name/supplier_name/week_name/warehouse_name, empty result returns `{ data: [], error: null }`)

## 3. Frontend: Types and service

- [x] 3.1 Add `DeliveryReceiveLog` interface to `src/types/thread/weeklyOrder.ts` with fields: id, delivery_id, quantity, warehouse_id, received_by, notes (string | null), created_at, thread_type_name, supplier_name, week_name, warehouse_name
- [x] 3.2 Add `getReceiveLogs(params: { delivery_id?: number; week_id?: number; limit?: number })` method to `src/services/deliveryService.ts` calling `fetchApi('/api/weekly-orders/deliveries/receive-logs', { params })` <- (verify: type matches API response shape, service method builds query string correctly)

## 4. Frontend: History tab on deliveries page

- [x] 4.1 Add third tab "Lich su nhap kho" (name="history") to `src/pages/thread/weekly-order/deliveries.vue` after the existing two tabs
- [x] 4.2 Implement history tab content with DataTable showing columns: Thoi gian (DD/MM/YYYY HH:mm), Tuan, Loai chi, NCC, Kho nhap, So luong (cuon), Nguoi nhap. Sort by created_at DESC. Include week filter dropdown (AppSelect) above the table
- [x] 4.3 Wire up data fetching: call `getReceiveLogs` on tab activation and when week filter changes. Handle loading state and empty state ("Chua co lich su nhap kho") <- (verify: tab renders correctly, week filter reloads data, empty state shows Vietnamese message, newest logs appear first, all columns display joined data correctly)

## 5. Validation and cleanup

- [x] 5.1 Run `npm run type-check` to verify no TypeScript errors
- [x] 5.2 Run `npm run lint` to verify no ESLint errors <- (verify: both checks pass cleanly, no regressions in existing delivery/receive functionality)
