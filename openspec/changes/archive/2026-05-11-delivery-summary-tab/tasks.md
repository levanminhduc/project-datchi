## 1. Types

- [x] 1.1 Add `DeliverySummary` interface to `src/types/thread/weeklyOrder.ts`
- [x] 1.2 Add `DeliverySupplierBreakdown` interface to `src/types/thread/weeklyOrder.ts` ← (verify: interfaces match API response structure in design.md)

## 2. Backend API

- [x] 2.1 Add route `GET /:weekId/delivery-summary` in `server/routes/weekly-order/deliveries.ts` — place BEFORE generic `/:id` routes
- [x] 2.2 Query `thread_order_deliveries` with joins to `suppliers`, `thread_types` for the given week
- [x] 2.3 Aggregate totals: total_ordered, total_delivered, total_received, percent_received
- [x] 2.4 Build by_supplier breakdown array with pending calculations
- [x] 2.5 Return response in `{ data: DeliverySummary, error: null }` format ← (verify: API returns correct aggregated data, route order is correct)

## 3. Service Layer

- [x] 3.1 Add `getDeliverySummary(weekId: number)` method to `src/services/weeklyOrderService.ts` ← (verify: method calls correct endpoint and handles errors)

## 4. Component

- [x] 4.1 Create `src/components/thread/weekly-order/DeliverySummarySection.vue`
- [x] 4.2 Add props: `summary: DeliverySummary | null`, `loading: boolean`
- [x] 4.3 Add emit: `refresh`
- [x] 4.4 Implement 3 KPI cards (Đặt NCC, NCC đã giao, Đã nhập kho)
- [x] 4.5 Implement progress bar with percent_received
- [x] 4.6 Implement breakdown table with columns: NCC, Tex, Màu, Đặt, Đã giao, Đã nhập, Chờ giao, Chờ nhập
- [x] 4.7 Add loading state with spinner
- [x] 4.8 Add empty state message "Chưa có dữ liệu giao hàng"
- [x] 4.9 Add refresh button
- [x] 4.10 Add link "Xem chi tiết giao hàng" to `/thread/weekly-order/deliveries` ← (verify: component renders all states correctly, follows ProgressSummarySection pattern)

## 5. Page Integration

- [x] 5.1 Import DeliverySummarySection in `src/pages/thread/weekly-order/[id].vue`
- [x] 5.2 Add state: `deliverySummary`, `deliverySummaryLoading`
- [x] 5.3 Add `loadDeliverySummary()` function calling weeklyOrderService
- [x] 5.4 Update deliveries tab panel to use DeliverySummarySection component
- [x] 5.5 Add watch for tab activation to load data on first visit ← (verify: tab displays summary data, refresh works, link navigation works)

## 6. Verification

- [x] 6.1 Run `npm run type-check` — no TypeScript errors
- [x] 6.2 Run `npm run lint` — no ESLint errors ← (verify: all checks pass)
