## 1. BE Types & Validation

- [ ] 1.1 Add new interfaces to `server/types/weeklyOrder.ts`: `WeekHistoryGroup`, `PoGroup`, `StyleProgress`, `ColorEntry`, `HistoryByWeekResponse`
- [ ] 1.2 Add `HistoryByWeekQuerySchema` to `server/validation/weeklyOrder.ts` with params: `po_id`, `style_id`, `from_date`, `to_date`, `status`, `page`, `limit`
- [ ] 1.3 Remove `OrderHistoryQuerySchema` from `server/validation/weeklyOrder.ts` ← (verify: no other imports of OrderHistoryQuerySchema remain)

## 2. BE Route — history-by-week

- [ ] 2.1 Add `GET /history-by-week` route in `server/routes/weeklyOrder.ts` — place BEFORE `/:id` route. Include: query validation, authorization (`thread.allocations.view`)
- [ ] 2.2 Implement Step 1-2: when `po_id` or `style_id` filters present, pre-query `thread_order_items` to find matching `week_id`s, then paginate `thread_order_weeks` filtered to those IDs. When no item filters, paginate weeks directly. Apply `status` filter (default exclude CANCELLED, `ALL` includes all).
- [ ] 2.3 Implement Step 3: batch-load `thread_order_items` for the paginated weeks with joined `style`, `color`, `po` relations. Apply `po_id`/`style_id` filters to items if present.
- [ ] 2.4 Implement Step 4: for each unique `(po_id, style_id)` pair, query total ordered across all non-CANCELLED weeks and `po_items.quantity`. Calculate `remaining` and `progress_pct`.
- [ ] 2.5 Implement Step 5: group items into `po_groups → styles → colors` hierarchy, merge progress data, compute `total_quantity` per week. Return response with pagination.
- [ ] 2.6 Remove old `GET /order-history` route handler and its import of `OrderHistoryQuerySchema` ← (verify: route removed, import cleaned, no TypeScript errors in weeklyOrder.ts)

## 3. FE Types & Service

- [ ] 3.1 Add new types to `src/types/thread/weeklyOrder.ts`: `WeekHistoryGroup`, `PoGroup`, `StyleProgress`, `ColorEntry`, `HistoryByWeekFilter`
- [ ] 3.2 Remove old types `OrderHistoryItem` and `OrderHistoryFilter` from `src/types/thread/weeklyOrder.ts`
- [ ] 3.3 Add `getHistoryByWeek(filters)` method to `src/services/weeklyOrderService.ts`
- [ ] 3.4 Remove old `getOrderHistory()` method and its type imports from `src/services/weeklyOrderService.ts` ← (verify: no TypeScript errors, no unused imports)

## 4. FE Page — Rewrite history.vue

- [ ] 4.1 Replace flat q-table with accordion layout using `q-expansion-item` for each week. Collapsed row shows: week_name, created_by, formatted created_at, status chip (color-coded), total_quantity badge.
- [ ] 4.2 Implement expanded week content: items grouped by PO (section header with po_number), then by style with progress bar (`q-linear-progress`) and text label "X / Y SP (Z%)". Color thresholds: primary <80%, warning 80-99%, positive 100%, negative >100%.
- [ ] 4.3 Implement color breakdown: list each color with dot (hex_code), color name, quantity. Plus three breakdown lines: "Tuần này", "Đã đặt trước đó", "Còn lại".
- [ ] 4.4 Add status filter to filter bar: dropdown with options "Tất cả (trừ đã hủy)" (default, sends no status param), "Nháp" (DRAFT), "Đã xác nhận" (CONFIRMED), "Đã hủy" (CANCELLED), "Tất cả" (ALL).
- [ ] 4.5 Wire up pagination, loading states, empty state, and connect filters to `getHistoryByWeek()`.
- [ ] 4.6 Update Excel export to handle grouped data structure — rows grouped by week with PO progress columns. ← (verify: full page works end-to-end, type-check passes, no console errors)
