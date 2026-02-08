## 1. Database & Migrations

- [x] 1.1 Create migration file `supabase/migrations/20260208_create_thread_order_weeks.sql` with `thread_order_weeks` table (id SERIAL PK, week_name VARCHAR(50) NOT NULL, start_date DATE, end_date DATE, status VARCHAR(20) DEFAULT 'draft', notes TEXT, created_by VARCHAR(50), created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
- [x] 1.2 Create `thread_order_items` table in same migration (id SERIAL PK, week_id INTEGER FK -> thread_order_weeks ON DELETE CASCADE, style_id INTEGER FK -> styles ON DELETE RESTRICT, color_id INTEGER FK -> colors ON DELETE RESTRICT, quantity INTEGER NOT NULL CHECK > 0, created_at TIMESTAMPTZ, UNIQUE(week_id, style_id, color_id))
- [x] 1.3 Create `thread_order_results` table in same migration (id SERIAL PK, week_id INTEGER FK -> thread_order_weeks ON DELETE CASCADE UNIQUE, calculation_data JSONB NOT NULL, summary_data JSONB NOT NULL, calculated_at TIMESTAMPTZ)
- [x] 1.4 Add indexes: idx_thread_order_items_week_id, idx_thread_order_items_style_id, idx_thread_order_weeks_status
- [x] 1.5 Apply migration to local database

## 2. Backend Types

- [x] 2.1 Create `server/types/weeklyOrder.ts` with interfaces: ThreadOrderWeek, ThreadOrderItem, CreateWeeklyOrderDTO, UpdateWeeklyOrderDTO, SaveResultsDTO

## 3. Backend API Route

- [x] 3.1 Create `server/routes/weeklyOrder.ts` with Hono router
- [x] 3.2 Implement GET `/` - list weekly orders with pagination and optional status filter, ordered by created_at DESC, include item count per week
- [x] 3.3 Implement GET `/:id` - get single weekly order with joined items (items joined with styles and colors tables)
- [x] 3.4 Implement POST `/` - create weekly order (week info + items array), validate week_name required, insert items via loop, return created week with items
- [x] 3.5 Implement PUT `/:id` - update weekly order info and replace items (delete existing items, insert new ones), only allow when status = 'draft'
- [x] 3.6 Implement DELETE `/:id` - delete weekly order, only allow when status = 'draft' and no saved results exist, return 409 if results exist
- [x] 3.7 Implement PATCH `/:id/status` - update status with valid transitions (draft -> confirmed, confirmed -> cancelled)
- [x] 3.8 Implement POST `/:id/results` - save/replace calculation results (calculation_data JSONB + summary_data JSONB), upsert on week_id UNIQUE
- [x] 3.9 Implement GET `/:id/results` - get saved calculation results for a week
- [x] 3.10 Register route in `server/index.ts`: import weeklyOrderRouter, add `app.route('/api/weekly-orders', weeklyOrderRouter)`, add console.log

## 4. Frontend Types

- [x] 4.1 Create `src/types/thread/weeklyOrder.ts` with interfaces: ThreadOrderWeek, ThreadOrderItem, CreateWeeklyOrderDTO, UpdateWeeklyOrderDTO, WeeklyOrderResults, AggregatedRow, StyleOrderEntry
- [x] 4.2 Export from `src/types/thread/index.ts` - add `export * from './weeklyOrder'`

## 5. Frontend Service

- [x] 5.1 Create `src/services/weeklyOrderService.ts` with fetchApi pattern (matching existing services like allocationService)
- [x] 5.2 Implement `getAll(params?)` - GET /api/weekly-orders with optional status filter
- [x] 5.3 Implement `getById(id)` - GET /api/weekly-orders/:id
- [x] 5.4 Implement `create(dto)` - POST /api/weekly-orders
- [x] 5.5 Implement `update(id, dto)` - PUT /api/weekly-orders/:id
- [x] 5.6 Implement `remove(id)` - DELETE /api/weekly-orders/:id
- [x] 5.7 Implement `updateStatus(id, status)` - PATCH /api/weekly-orders/:id/status
- [x] 5.8 Implement `saveResults(id, data)` - POST /api/weekly-orders/:id/results
- [x] 5.9 Implement `getResults(id)` - GET /api/weekly-orders/:id/results

## 6. Frontend Composables

- [x] 6.1 Create `src/composables/thread/useWeeklyOrder.ts` - manage weekly order CRUD state (weeks list, selectedWeek, loading, error)
- [x] 6.2 Implement `fetchWeeks()` - load all weeks from service
- [x] 6.3 Implement `createWeek(dto)` - create new week, show snackbar success/error
- [x] 6.4 Implement `updateWeek(id, dto)` - update week, show snackbar
- [x] 6.5 Implement `deleteWeek(id)` - delete with useConfirm dialog, show snackbar
- [x] 6.6 Implement `loadWeek(id)` - load single week with items, populate orderEntries from items
- [x] 6.7 Implement `saveResults(weekId, calculationData, summaryData)` - save results via service
- [x] 6.8 Implement `loadResults(weekId)` - load saved results
- [x] 6.9 Create `src/composables/thread/useWeeklyOrderCalculation.ts` - manage multi-style selection and calculation
- [x] 6.10 Implement `addStyle(styleId)` - add style to orderEntries, fetch style info from useStyles
- [x] 6.11 Implement `removeStyle(styleId)` - remove style and its colors from orderEntries
- [x] 6.12 Implement `addColorToStyle(styleId, colorId)` - add color with default quantity 1
- [x] 6.13 Implement `removeColorFromStyle(styleId, colorId)` - remove color from style entry
- [x] 6.14 Implement `updateColorQuantity(styleId, colorId, qty)` - update quantity, mark results as stale
- [x] 6.15 Implement `calculateAll()` - call threadCalculationService.calculate() per style with color_breakdown via Promise.allSettled(), handle partial failures
- [x] 6.16 Implement `aggregateResults(perStyleResults)` - group by thread_type_id, sum total_meters, calculate total_cones (Math.ceil(total_meters / meters_per_cone))
- [x] 6.17 Implement `clearAll()` - reset orderEntries, perStyleResults, aggregatedResults
- [x] 6.18 Expose computed `canCalculate` - true when at least 1 style with at least 1 color with quantity > 0
- [x] 6.19 Expose computed `hasResults` - true when perStyleResults is non-empty
- [x] 6.20 Expose computed `isResultsStale` - true when selections changed after last calculation

## 7. Frontend Components

- [x] 7.1 Create `src/components/thread/weekly-order/WeekInfoCard.vue` - AppCard with AppInput for week_name, date pickers for start_date/end_date, AppInput textarea for notes. Auto-suggest week_name from current date (e.g. "Tuan 06/2026")
- [x] 7.2 Create `src/components/thread/weekly-order/StyleOrderCard.vue` - AppCard per style showing style_code + style_name header, color chips with quantity inputs, remove style button, add color button opening color selector
- [x] 7.3 StyleOrderCard: implement color chip display with hex_code colored dot, color name, inline AppInput for quantity (type number, min 1), remove chip button
- [x] 7.4 StyleOrderCard: implement "Them mau" button that opens color multi-select from available colors (style_color_thread_specs), filter out already-selected colors
- [x] 7.5 StyleOrderCard: show "Ma hang nay chua co dinh muc mau chi" notice when style has no style_color_thread_specs records
- [x] 7.6 Create `src/components/thread/weekly-order/ResultsDetailView.vue` - one AppCard per style with DataTable showing columns: Cong doan, NCC, Tex, Met/SP, Tong met, Tong cuon, Mau chi (colored badge)
- [x] 7.7 ResultsDetailView: implement total_cones tooltip showing formula "X met / Y m/cuon", display "--" when meters_per_cone is null
- [x] 7.8 Create `src/components/thread/weekly-order/ResultsSummaryTable.vue` - single DataTable showing aggregated results with columns: Mau chi, NCC, Tex, Tong met, Tong cuon
- [x] 7.9 ResultsSummaryTable: show total row at bottom summing Tong met and Tong cuon
- [x] 7.10 Create `src/components/thread/weekly-order/WeekHistoryDialog.vue` - AppDialog listing saved weekly orders, click to load a week's items and results

## 8. Main Page

- [x] 8.1 Create `src/pages/thread/weekly-order/index.vue` with definePage meta (requiresAuth: true, permissions: ['thread.view'])
- [x] 8.2 Add PageHeader with title "Dat Hang Chi Theo Tuan" and subtitle
- [x] 8.3 Add WeekInfoCard section at top
- [x] 8.4 Add style selector section: AppSelect with search for styles (filter out already-selected), "Them ma hang" button
- [x] 8.5 Render list of StyleOrderCard components for each entry in orderEntries
- [x] 8.6 Add action bar with buttons: "Tinh toan" (primary, disabled when !canCalculate), "Luu" (secondary), "Lich su" (opens WeekHistoryDialog), "Xuat Excel" (placeholder)
- [x] 8.7 Add tab toggle between "Chi tiet theo ma hang" (ResultsDetailView) and "Tong hop" (ResultsSummaryTable), default to "Tong hop"
- [x] 8.8 Show results section only when hasResults is true
- [x] 8.9 Show "stale results" warning banner when isResultsStale is true (selections changed since last calculation)
- [x] 8.10 Add progress indicator during calculation ("Dang tinh X/Y ma hang...")
- [x] 8.11 Handle partial calculation failure: show error per failed style, display results for succeeded styles

## 9. Navigation & Integration

- [x] 9.1 Add sidebar menu item in `src/composables/useSidebar.ts` under "Ke Hoach" children: `{ label: 'Dat Hang Chi Tuan', icon: 'o_shopping_cart', to: '/thread/weekly-order' }`

## 10. Allocation & Export

- [x] 10.1 Add "Tao phieu phan bo" button in results section, disabled when no color_breakdown data, tooltip "Can co du lieu dinh muc mau chi" when disabled
- [x] 10.2 Implement allocation confirmation dialog: show summary table of allocations to create (order_id = week_name, thread_type_name, requested_meters, color_name)
- [x] 10.3 Implement allocation creation: call allocationService.create() per unique thread_type_id + color row from aggregated results, use Promise.allSettled() for partial success handling
- [x] 10.4 Show result notification: "Da tao N phieu phan bo thanh cong" or "Da tao X thanh cong, Y loi"
- [x] 10.5 Add "Xuat Excel" button (icon: o_file_download), visible only when hasResults, on click show snackbar.info("Tinh nang xuat Excel se som duoc ho tro")

## 11. Save & Load Workflow

- [x] 11.1 Implement "Luu" button flow: save week info + items via createWeek() or updateWeek(), then save results via saveResults() if calculation exists
- [x] 11.2 Show overwrite confirmation dialog when saving results for a week that already has saved results
- [x] 11.3 Implement "Lich su" dialog: load weeks list, click a week to restore its items and results into the form
- [x] 11.4 Implement re-calculation flow: user modifies selections on a loaded week, can click "Tinh toan" to recalculate, then "Luu" to update

## 12. Verification

- [x] 12.1 Run `npm run type-check` - pass with no errors
- [x] 12.2 Test: create new weekly order with 2 styles, 3 colors each, calculate, verify per-style and aggregated results display correctly
- [x] 12.3 Test: save weekly order, reload page, open from history, verify items and results are restored
- [x] 12.4 Test: modify selections after loading, verify stale warning appears, recalculate and save
- [x] 12.5 Test: create allocations from aggregated results, verify allocations created in /thread/allocations
- [x] 12.6 Test: delete draft weekly order, verify cascade deletes items
- [x] 12.7 Test: try delete weekly order with saved results, verify 409 error and warning message
