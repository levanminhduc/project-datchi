## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/YYYYMMDD_add_delivery_receiving_columns.sql` adding columns to `thread_order_deliveries`: `received_quantity INT DEFAULT 0`, `inventory_status VARCHAR(20) DEFAULT 'pending'`, `warehouse_id INT REFERENCES warehouses(id)`, `received_by VARCHAR(100)`, `received_at TIMESTAMPTZ`
- [x] 1.2 Add check constraint for `inventory_status` values: `pending`, `partial`, `received`

## 2. Backend Types

- [x] 2.1 Update `src/types/thread/weeklyOrder.ts` - extend `DeliveryRecord` interface with new fields: `received_quantity`, `inventory_status`, `warehouse_id`, `received_by`, `received_at`
- [x] 2.2 Add `ReceiveDeliveryDTO` interface: `{ warehouse_id: number, quantity: number, received_by: string }`
- [x] 2.3 Add Zod schema `ReceiveDeliverySchema` in `server/validation/weeklyOrder.ts` for validation

## 3. Backend API

- [x] 3.1 Add `POST /api/weekly-orders/deliveries/:id/receive` endpoint in `server/routes/weeklyOrder.ts`
- [x] 3.2 Implement validation: delivery exists, status is 'delivered', quantity > 0, warehouse exists
- [x] 3.3 Implement lot number generation: `LOT-{YYYYMMDD}-{HHmmss}` format
- [x] 3.4 Implement cone creation loop: generate `CONE-{timestamp}-{seq}` IDs, get `meters_per_cone` from thread_types, insert into `thread_inventory` with status `AVAILABLE`
- [x] 3.5 Implement delivery update: increment `received_quantity`, set `warehouse_id`, `received_by`, `received_at`, calculate `inventory_status` (pending/partial/received)
- [x] 3.6 Return response with created cone count and updated delivery record

## 4. Frontend Service

- [x] 4.1 Add `receiveDelivery(deliveryId: number, dto: ReceiveDeliveryDTO)` method to `src/services/deliveryService.ts`

## 5. Frontend UI - Tab Structure

- [x] 5.1 Refactor `src/pages/thread/weekly-order/deliveries.vue` to use `q-tabs` with two tabs: "Theo dõi giao hàng" and "Nhập kho"
- [x] 5.2 Move existing table to first tab panel
- [x] 5.3 Create second tab panel for receive items view

## 6. Frontend UI - Receive Tab

- [x] 6.1 Create data fetching for receive tab: filter deliveries where `status='delivered'` AND `inventory_status!='received'`
- [x] 6.2 Create table columns: Tuần, Loại chỉ, NCC, Số đặt (total_final), Đã nhập (received_quantity), Còn thiếu, Actions
- [x] 6.3 Add "Nhập kho" button for each row with pending quantity > 0

## 7. Frontend UI - Receive Dialog

- [x] 7.1 Create receive dialog component with fields: warehouse selector (AppSelect), quantity input (default = pending), display current user
- [x] 7.2 Add warehouse options fetching (use existing warehouse service/composable)
- [x] 7.3 Implement form validation: warehouse required, quantity > 0
- [x] 7.4 Implement submit handler: call `deliveryService.receiveDelivery()`, show success notification, refresh table data

## 8. Testing & Verification

- [x] 8.1 Run `npm run type-check` to verify TypeScript types
- [x] 8.2 Run `npm run lint` to verify code style
- [ ] 8.3 Manual test: complete flow from weekly order → delivery → receive into inventory
- [ ] 8.4 Verify created cones appear in inventory page with correct attributes
