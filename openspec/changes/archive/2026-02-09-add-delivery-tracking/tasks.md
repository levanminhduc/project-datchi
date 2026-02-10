## 1. Database

- [x] 1.1 Create migration for `thread_order_deliveries` table with columns: id, week_id (FK CASCADE), thread_type_id (FK), supplier_id (FK), delivery_date (DATE NOT NULL), actual_delivery_date (DATE), status (VARCHAR DEFAULT 'pending'), notes (TEXT), created_at, updated_at. Add UNIQUE(week_id, thread_type_id) and updated_at trigger.

## 2. Backend — Thread Calculation API

- [x] 2.1 Modify `SPEC_SELECT` in `server/routes/threadCalculation.ts` to join `suppliers:supplier_id (id, name, lead_time_days)` instead of `suppliers:supplier_id (id, name)`
- [x] 2.2 Update `buildCalculation()` to add `supplier_id`, `lead_time_days`, and `delivery_date` (computed as current date + lead_time_days, default 7 if null/0) to each calculation item
- [x] 2.3 Update backend `CalculationResult` interface in `server/routes/threadCalculation.ts` to include the new fields

## 3. Backend — Weekly Order Delivery Endpoints

- [x] 3.1 Add delivery auto-creation logic to `POST /api/weekly-orders/:id/results`: after saving results, upsert `thread_order_deliveries` records for each aggregated row with valid supplier_id. Preserve manually edited delivery_date on re-save (only set delivery_date if record is new).
- [x] 3.2 Create `GET /api/weekly-orders/:id/deliveries` endpoint: list deliveries for a week with joined supplier_name, thread_type_name, computed days_remaining and is_overdue
- [x] 3.3 Create `PATCH /api/weekly-orders/deliveries/:deliveryId` endpoint: update delivery_date, actual_delivery_date, status, notes
- [x] 3.4 Create `GET /api/weekly-orders/deliveries/overview` endpoint: list all deliveries across weeks with optional status and date_range filters
- [x] 3.5 Add Zod validation schemas for delivery endpoints in `server/validation/weeklyOrder.ts`

## 4. Frontend — Types

- [x] 4.1 Update `CalculationItem` in `src/types/thread/threadCalculation.ts` to add optional `supplier_id: number | null`, `delivery_date: string | null`, `lead_time_days: number | null`
- [x] 4.2 Add delivery types in `src/types/thread/weeklyOrder.ts`: `DeliveryRecord`, `UpdateDeliveryDTO`, `DeliveryFilter`

## 5. Frontend — Detail Table Column

- [x] 5.1 Add "Ngày giao" column to `columns` array in `ResultsDetailView.vue` with DD/MM/YYYY formatting, displaying "—" when null

## 6. Frontend — Delivery Management

- [x] 6.1 Create `src/services/deliveryService.ts` with methods: getByWeek(weekId), update(deliveryId, dto), getOverview(filters)
- [x] 6.2 Create delivery management page at `src/pages/thread/weekly-order/deliveries.vue` with DataTable showing deliveries, status filter, inline date editing, and "Đã giao" action button
