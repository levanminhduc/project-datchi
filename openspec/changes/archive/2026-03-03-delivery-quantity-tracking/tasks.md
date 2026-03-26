## 1. Database Migration

- [x] 1.1 Create migration file `20260303_delivery_quantity_tracking.sql`
- [x] 1.2 Add `quantity_cones INTEGER NOT NULL DEFAULT 0` column to `thread_order_deliveries`
- [x] 1.3 Add `received_quantity INTEGER NOT NULL DEFAULT 0` column to `thread_order_deliveries` (if not exists)
- [x] 1.4 Make `thread_order_loans.from_week_id` nullable
- [x] 1.5 Update constraint `chk_loan_self_borrow` to allow `from_week_id = NULL` ← (verify: constraints allow NULL, existing data unaffected)

## 2. RPC Functions

- [x] 2.1 Modify `fn_borrow_thread` to UPDATE source week delivery `quantity_cones += v_moved`
- [x] 2.2 Modify `fn_borrow_thread` to UPDATE target week delivery `quantity_cones = GREATEST(0, quantity_cones - v_moved)`
- [x] 2.3 Add delivery record creation in `fn_borrow_thread` if not exists:
  - Get `supplier_id` from same week's `thread_order_results.summary_data` matching `thread_type_id`
  - Get `delivery_date` from same summary_data or default to week end date
  - Use `INSERT ... ON CONFLICT DO UPDATE` for conflict safety
- [x] 2.4 Create `fn_reserve_from_stock` function with FEFO logic
- [x] 2.5 `fn_reserve_from_stock`: validate week is CONFIRMED
- [x] 2.6 `fn_reserve_from_stock`: reserve AVAILABLE cones and set `reserved_week_id`
- [x] 2.7 `fn_reserve_from_stock`: create loan record with `from_week_id = NULL`, include both `quantity_cones` and `quantity_meters` (sum from reserved cones)
- [x] 2.8 `fn_reserve_from_stock`: adjust delivery `quantity_cones -= reserved_count` ← (verify: both borrow and reserve adjust delivery correctly)
- [x] 2.9 Update `fn_receive_delivery` to use `quantity_cones` instead of `total_cones`:
  - Change status line `WHEN received_quantity + p_received_qty >= total_cones` to use `quantity_cones`
  - Rewrite `v_current_shortage` calculation to derive from delivery `quantity_cones` (NOT from `calculation_data.total_cones - reserved`)
  - Auto-reserve amount during receive should align with `quantity_cones`-based shortage
  - Ensure all references to ordered quantity use `quantity_cones` column

## 3. Backend - Save Results Update

- [x] 3.1 Read `total_final` from each summary_data row in saveResults route
- [x] 3.2 Filter: only process rows with valid `supplier_id` and `delivery_date` (skip aggregated rows without supplier)
- [x] 3.3 Update/create delivery record with `quantity_cones = total_final` using UPSERT:
  - Match by `(week_id, thread_type_id)` composite key
  - Preserve existing `delivery_date` if row exists (don't overwrite manual edits)
  - Update `quantity_cones` AND `supplier_id` on conflict (supplier may change between calculations)
  - Only preserve `delivery_date` for unreceived rows
- [x] 3.4 Handle unmatched summary rows: keep existing delivery records unchanged (no delete)
- [x] 3.5 Log delivery quantity changes for audit trail ← (verify: saveResults handles all scenarios correctly)

## 4. Backend - Reserve from Stock Endpoint

- [x] 4.1 Add Zod schema `ReserveFromStockSchema` with `thread_type_id`, `quantity`, `reason` (optional)
- [x] 4.2 Create `POST /api/weekly-orders/:id/reserve-from-stock` route
- [x] 4.3 Validate week exists and is CONFIRMED
- [x] 4.4 Call `fn_reserve_from_stock` RPC
- [x] 4.5 Return result with loan_id for audit ← (verify: endpoint returns correct response, handles errors)

## 4B. Backend - Reservation Summary Endpoint

- [x] 4B.1 Create `GET /api/weekly-orders/:id/reservation-summary` route (or extend existing)
- [x] 4B.2 Return per-thread summary with fields: `thread_type_id`, `needed`, `reserved`, `shortage`, `available_stock`, `can_reserve`
- [x] 4B.3 `needed` = `thread_order_deliveries.quantity_cones` per thread type (or `summary_data.total_final` if delivery missing) ← this already reflects reserve deductions from save-results calculation
- [x] 4B.4 `reserved` = COUNT of cones in inventory with `reserved_week_id = this_week_id` (informational only, for display purposes)
- [x] 4B.5 `shortage` = `GREATEST(0, needed)` ← use `needed` directly because it already represents remaining supplier expectation after reservations. The reserve-from-stock action should reduce `needed` to 0 if enough stock available.
  - Example: `total_cones=100`, inventory already reserved=20 → `total_final=80` → `quantity_cones=80` → `shortage=80`
  - After reserve-from-stock(80): `quantity_cones=0` → `shortage=0`
- [x] 4B.6 `available_stock` = count of AVAILABLE cones in inventory for that thread_type
- [x] 4B.7 `can_reserve` = true only if delivery row exists for this thread_type. If no delivery row → `can_reserve=false` with reason "Không có dữ liệu giao hàng cho loại chỉ này"
- [x] 4B.8 UI dialog max quantity = `min(shortage, available_stock)` ← (verify: summary data correct for UI button logic)

## 5. Frontend - Types Update

- [x] 5.1 Add `quantity_cones: number` to `DeliveryRecord` interface in `weeklyOrder.ts`
- [x] 5.2 Update `ThreadOrderLoan` interface: `from_week_id: number | null`
- [x] 5.3 Add `ReserveFromStockDTO` interface
- [x] 5.4 Add `ReserveFromStockResult` interface
- [x] 5.5 Add `ReservationSummary` interface with `thread_type_id`, `needed`, `reserved`, `shortage`, `available_stock`, `can_reserve: boolean`, `cannot_reserve_reason?: string`

## 6. Frontend - Service Update

- [x] 6.1 Add `reserveFromStock(weekId, dto)` function to weekly order service
- [x] 6.2 Add `getReservationSummary(weekId)` function to fetch reservation summary
- [x] 6.3 Add `getAvailableStockCount(threadTypeId)` function (or reuse existing inventory query)

## 7. Frontend - Delivery UI Update

- [x] 7.1 Update delivery tracking table to show `quantity_cones` column
- [x] 7.2 Show pending quantity as `quantity_cones - received_quantity`
- [x] 7.3 Update receive tab to use `quantity_cones` for ordered quantity display ← (verify: delivery UI shows correct quantity_cones and pending calculation)

## 8. Frontend - Reserve from Stock UI

- [x] 8.1 Use reservation summary to determine when to show "Lấy từ tồn kho" button:
  - Only show when `shortage > 0` AND `available_stock > 0` AND `can_reserve = true`
  - If `can_reserve = false`, do NOT show button (thread type has no delivery row)
- [x] 8.2 Add "Lấy từ tồn kho" button in reservation summary for CONFIRMED weeks
- [x] 8.3 Create ReserveFromStockDialog component
- [x] 8.4 Dialog shows thread type, shortage, available stock, quantity input
- [x] 8.5 Implement dialog confirm action calling `reserveFromStock` API
- [x] 8.6 Refresh reservation summary after successful reserve
- [x] 8.7 Show success notification with reserved count
- [x] 8.8 Handle loan records with `from_week_id = NULL` in UI: display "Tồn kho" as source instead of week name ← (verify: reserve from stock flow works end-to-end, loan record created with from_week_id=NULL)
