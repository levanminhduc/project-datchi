## 1. Backend — search-po endpoint

- [x] 1.1 Trong `server/routes/weekly-order/transfer-reserved.ts`, thêm route `GET /search-po` **trước** route `GET /:weekId/reserved-by-po` (Hono match theo thứ tự — specific trước generic)
- [x] 1.2 Implement handler: validate `q` query param (required, non-empty) → trả 400 nếu thiếu
- [x] 1.3 Query `purchase_orders` với `po_number ILIKE '%q%'` → lấy danh sách `{id, po_number}` (limit 20)
- [x] 1.4 Nếu không có PO match → return `{ data: [], error: null }`
- [x] 1.5 Query `thread_order_items` với `po_id IN (...)` → group by `(po_id, week_id)`
- [x] 1.6 Query `thread_order_weeks` để lấy `week_name` cho các `week_id` tìm được
- [x] 1.7 Count `thread_inventory` rows: `reserved_week_id IN (weekIds) AND status = 'RESERVED_FOR_ORDER'` → group by `reserved_week_id`
- [x] 1.8 Assemble response: `[{ po_id, po_number, weeks: [{ week_id, week_name, total_cones }] }]` sorted by `po_number`
- [x] 1.9 Apply `requirePermission('thread.batch.transfer')` middleware lên route mới ← (verify: route order OK — `search-po` không bị `/:weekId` bắt nhầm; response format đúng spec; missing `q` → 400)

## 2. Backend — summary fields trong reserved-by-po

- [x] 2.1 Trong handler `GET /:weekId/reserved-by-po` (`server/routes/weekly-order/transfer-reserved.ts`): đọc thêm optional param `to_warehouse_id` từ query string
- [x] 2.2 Query thêm `thread_inventory` với `reserved_week_id = weekId AND status = 'RESERVED_FOR_ORDER'` (không filter warehouse) → build `totalReservedMap: Map<key, count>` theo key `${thread_type_id}-${color_id}`
- [x] 2.3 Nếu `to_warehouse_id` hợp lệ: query thêm `thread_inventory` với `reserved_week_id = weekId AND warehouse_id = toWarehouseId AND status = 'RESERVED_FOR_ORDER'` → build `atDestMap: Map<key, count>`
- [x] 2.4 Khi push vào `bucket.thread_lines`, thêm 2 fields: `total_reserved_for_week: totalReservedMap.get(key) ?? 0` và `already_at_destination: atDestMap.get(key) ?? 0`
- [x] 2.5 Làm tương tự cho `unassignedLines` ← (verify: `total_reserved_for_week` đúng = sum ở mọi kho; `already_at_destination` = 0 khi không truyền `to_warehouse_id`; không truyền `to_warehouse_id` vẫn hoạt động bình thường)

## 3. Frontend — Types và Service

- [x] 3.1 Trong `src/types/transferReserved.ts`, thêm 2 fields vào `ReservedThreadLine`: `total_reserved_for_week: number` và `already_at_destination: number`
- [x] 3.2 Thêm interface `PoSearchResult`: `{ po_id: number; po_number: string; weeks: Array<{ week_id: number; week_name: string; total_cones: number }> }`
- [x] 3.3 Trong `src/services/transferReservedService.ts` (hoặc `weeklyOrderService.ts` nếu phù hợp hơn), thêm method `searchPo(q: string): Promise<ApiResponse<PoSearchResult[]>>` gọi `fetchApi('/api/weekly-order/search-po?q=...')`
- [x] 3.4 Update call `getReservedByPo` trong service để truyền thêm `to_warehouse_id` query param (optional) ← (verify: TypeScript compile OK; types export đầy đủ)

## 4. Frontend — PoSearchPopup component

- [x] 4.1 Tạo `src/components/thread/transfer-reserved/PoSearchPopup.vue`
- [x] 4.2 Render `q-input` (label "Tìm PO", clearable) với debounce 300ms khi `v-model` thay đổi → gọi service `searchPo()`
- [x] 4.3 Dùng `q-menu` gắn vào input để hiển thị kết quả — mỗi tuần là `q-item` format: `<po_number> — <week_name> (<total_cones> cuộn)`
- [x] 4.4 Khi click vào `q-item`: emit `select-week` với `{ weekId: number, poNumber: string }` → đóng menu → clear input
- [x] 4.5 Hiển thị loading indicator (spinning icon hoặc `q-inner-loading`) trong menu khi đang fetch
- [x] 4.6 Khi kết quả rỗng và input non-empty: hiển thị `q-item` disabled với text "Không tìm thấy PO"
- [x] 4.7 Khi input bị clear hoặc empty: close menu, không gọi API ← (verify: debounce 300ms hoạt động đúng; emit format đúng `{ weekId, poNumber }`; popup đóng sau khi chọn; "Không tìm thấy PO" hiện khi empty results)

## 5. Frontend — Transfer-reserved page integration

- [x] 5.1 Trong `src/pages/thread/transfer-reserved.vue`, import và đặt `PoSearchPopup` trong filter card, cùng row với `AppSelect` "Tuần đặt hàng" (thêm `col-12 col-md-3` hoặc tương tự)
- [x] 5.2 Xử lý event `select-week`: set `weekId.value = event.weekId`, lưu `searchedPoNumber` (ref string)
- [x] 5.3 Sau khi `weekId` update → gọi `fetchData()` (dùng `watch` hoặc gọi trực tiếp)
- [x] 5.4 Thêm `ref` array cho `PoSection` components: `const poSectionRefs = ref<InstanceType<typeof PoSection>[]>([])`; gắn `:ref` vào `v-for` PoSection
- [x] 5.5 Sau khi `fetchData()` resolve và có `searchedPoNumber`: dùng `nextTick` → tìm section có `po_number === searchedPoNumber` → gọi `$el.scrollIntoView({ behavior: 'smooth', block: 'start' })` → clear `searchedPoNumber`
- [x] 5.6 Truyền `toWarehouseId` xuống `PoSection` qua prop mới để enable summary display ← (verify: auto-fill tuần hoạt động; scroll đến đúng PO section; `toWarehouseId` được truyền xuống PoSection)

## 6. Frontend — PoSection summary display

- [x] 6.1 Trong `src/components/thread/transfer-reserved/PoSection.vue`, thêm prop `toWarehouseId: number | null` vào `defineProps`
- [x] 6.2 Thêm cột summary vào `columns` array: `{ name: 'summary', label: 'Tóm tắt', field: 'summary', align: 'left' }`
- [x] 6.3 Thêm `<template #body-cell-summary>` slot: khi `toWarehouseId` null → hiển thị "—"; khi có `toWarehouseId` → hiển thị `Gán: <total_reserved_for_week> | Đã chuyển: <already_at_destination> | Còn: <reserved_cones_at_source>` (dùng computed hoặc inline expression)
- [x] 6.4 Verify `ReservedThreadLine` type đã có `total_reserved_for_week` và `already_at_destination` (task 3.1) trước khi dùng trong template ← (verify: summary hiển thị đúng giá trị; "—" khi chưa chọn kho đích; không lỗi TypeScript)

## 7. Type-check và lint

- [x] 7.1 Chạy `npm run type-check` — fix tất cả TypeScript errors
- [x] 7.2 Chạy `npm run lint` — fix tất cả ESLint errors ← (verify: không còn lỗi type-check và lint)
