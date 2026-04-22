## 1. Backend — Endpoint mới `by-warehouse-week`

- [x] 1.1 Thêm Zod schema `byWarehouseWeekQuerySchema` trong `server/validation/` (hoặc file validation cone-summary hiện có): `thread_type_id: z.coerce.number().int().positive()`, `color_id: z.coerce.number().int().positive().nullable().optional()`, `warehouse_id: z.coerce.number().int().positive().optional()` (IDs là integer SERIAL, không phải UUID)
- [x] 1.2 Mở route cone-summary hiện tại (`server/routes/thread/cone-summary.ts` hoặc tương đương) — đọc file trước để xác định thứ tự route, đặt `GET /by-warehouse-week` TRƯỚC route generic `/:threadTypeId/...` nếu có conflict
- [x] 1.3 Implement handler: query `thread_inventory` filter `thread_type_id`, `status IN ('AVAILABLE','RESERVED_FOR_ORDER')`, join `thread_types` để lọc `color_id`, optional filter `warehouse_id`; group theo `warehouse_id × status × reserved_week_id × is_partial`. Cone `RESERVED_FOR_ORDER` group theo `warehouse_id` HIỆN TẠI tại fetch time (không track historical).
- [x] 1.4 Fetch warehouses (`id, code, name`) bằng `.in('id', warehouseIds)` — TUYỆT ĐỐI không N+1
- [x] 1.5 Fetch weeks (`id, week_name, status`) bằng `.in('id', weekIds).eq('status','CONFIRMED')` (bảng `thread_order_weeks` KHÔNG có cột `deleted_at` — bỏ `.is('deleted_at', null)`). Cone có `reserved_week_id` NULL / trỏ về week không tồn tại / status ≠ CONFIRMED → KHÔNG vào `weeks`, gom vào `other_reserved` per warehouse (`{ full_cones, partial_cones, partial_meters }`).
- [x] 1.6 Build response shape `{ data: { warehouses: [{ warehouse_id, warehouse_code, warehouse_name, available, weeks: [...], other_reserved: {...} }] }, error: null }`. Warehouse được giữ nếu `available > 0` OR `weeks.length > 0` OR `other_reserved` có giá trị > 0.
- [x] 1.7 Bảo vệ bằng `requirePermission('thread.allocations.view')`, response format chuẩn `{ data, error, message? }`
- [x] 1.8 **Verify trước FE integration** — manual test bằng curl/Postman cho 7 case: (a) không filter warehouse, có reserve CONFIRMED; (b) filter warehouse có data; (c) filter warehouse không có data → `warehouses: []`; (d) thread type không có reserve → chỉ available; (e) cone `RESERVED_FOR_ORDER` với `reserved_week_id` trỏ về week DRAFT → vào `other_reserved`; (f) cone `RESERVED_FOR_ORDER` với `reserved_week_id` trỏ về week không tồn tại → vào `other_reserved`; (g) zero `AVAILABLE` nhưng có `RESERVED_FOR_ORDER` → warehouse vẫn xuất hiện. Permission 403 + Zod 400 cho ID invalid.

## 2. Backend — Sửa endpoint breakdown cũ thêm `warehouse_id`

- [x] 2.1 Tìm route `/api/inventory/summary/by-cone/:threadTypeId/warehouses` (qua `mcp__auggie__codebase-retrieval`), đọc handler hiện tại
- [x] 2.2 Thêm optional `warehouse_id` vào Zod query schema (reuse hoặc tạo mới gần đó)
- [x] 2.3 **Path không có `warehouse_id`:** giữ flow cũ (Promise.all `fn_warehouse_breakdown` + `fn_supplier_breakdown`) — backward compatible.
- [x] 2.4 **Path có `warehouse_id`:** filter `data` (warehouse breakdown) giữ row khớp (lossless vì mỗi row 1 warehouse). KHÔNG dùng output cũ của `fn_supplier_breakdown` (cross-warehouse → sai số). Thay vào đó query trực tiếp `thread_inventory` với supplier re-derivation MIRROR semantics của `fn_supplier_breakdown`:
  - Filter: `thread_type_id` + (`color_id` IS NULL OR `ti.color_id = color_id`) + `warehouse_id` + `status IN ('RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED','RESERVED_FOR_ORDER')` (CÙNG `usableStatuses` đang truyền vào RPC ở `server/routes/inventory.ts`)
  - Join: `thread_inventory ti LEFT JOIN lots l ON l.id = ti.lot_id LEFT JOIN suppliers ls ON ls.id = l.supplier_id JOIN thread_types tt ON tt.id = ti.thread_type_id LEFT JOIN suppliers ts ON ts.id = tt.supplier_id`
  - Group: `COALESCE(ls.id, ts.id)` (ưu tiên supplier từ lot, fallback supplier của thread_type) — CÙNG fallback rule của RPC
  - Metrics: `full_cones = COUNT FILTER (NOT is_partial)`, `partial_cones = COUNT FILTER (is_partial)`, `partial_meters = SUM(quantity_meters) FILTER (is_partial)` — CÙNG metrics của RPC
  - Soft delete: tôn trọng filter `deleted_at IS NULL` ở các join nếu RPC có (kiểm tra migration `20260321172100_add_color_id_to_breakdown_functions.sql` để xác nhận)
- [x] 2.5 **Verify trước FE integration** — manual test 4 case: (a) không `warehouse_id` → response identical với hiện tại; (b) có `warehouse_id` hợp lệ → `data` 1 warehouse, `supplier_breakdown` chỉ supplier có cone TRONG warehouse đó với SỐ ĐÚNG (so sánh tay với raw query `SELECT ... FROM thread_inventory ti JOIN ... WHERE ti.warehouse_id = $X AND ti.status = ANY($usableStatuses)`); (c) `warehouse_id` không có cone → `data: []`, `supplier_breakdown: []`; (d) supplier có cone ở 2 warehouse, filter 1 warehouse → số supplier đó chỉ tính phần ở warehouse được filter (KHÔNG bao gồm warehouse kia). **Bonus check:** nếu supplier khác giữa lot và thread_type → COALESCE rule phải khớp với RPC.
- [x] 2.6 Document trong code comment ngắn: "khi warehouse_id present, supplier_breakdown re-derived từ thread_inventory MIRROR semantics fn_supplier_breakdown (cùng usableStatuses, cùng COALESCE supplier from lot/thread_type, cùng metrics) thay vì RPC để tránh cross-warehouse leak"

## 3. Frontend — Types & Service

- [x] 3.1 Thêm types trong `src/types/thread/inventory.ts` (hoặc file types gần cone-summary): `ConeReservedWeekEntry`, `ConeReservedWarehouseEntry`, `ConeReservedByWeekResponse`
- [x] 3.2 Thêm function `fetchConeReservedByWeek({ threadTypeId, colorId, warehouseId })` trong `src/services/threadService.ts` (hoặc `coneSummaryService`) dùng `fetchApi` với query string
- [x] 3.3 Sửa function fetch warehouse breakdown cũ trong service: nhận thêm optional `warehouseId`, append vào query string ← (verify: cả 2 function gọi qua `fetchApi`, không dùng `fetch` trực tiếp; types đồng bộ BE response)

## 4. Frontend — Composable

- [x] 4.1 Sửa `src/composables/thread/useConeSummary.ts`: `selectThreadType` & `fetchWarehouseBreakdown` nhận thêm optional `warehouseId`, truyền xuống service
- [x] 4.2 Thêm state + action `fetchReservedByWeek(threadTypeId, colorId, warehouseId?)` trả về dữ liệu từ endpoint mới (loading, data, error)
- [x] 4.3 Dùng `useSnackbar` để hiển thị error message tiếng Việt khi fetch thất bại ← (verify: không còn ref nào gọi service cũ không truyền `warehouseId`; error path gọi snackbar đúng)

## 5. Frontend — Component mới `ConeReservedByWeekTable`

- [x] 5.1 Tạo file `src/components/thread/ConeReservedByWeekTable.vue`, define props `threadTypeId: number`, `colorId?: number | null`, `warehouseId?: number | null`
- [x] 5.2 Render `q-table` với expand row pattern (parent = warehouse, child = weeks). Note 1 dòng: exception dùng q-table thẳng vì DataTable chưa hỗ trợ nested expand
- [x] 5.3 Cột parent: "Kho", "Khả dụng" (full / partial / meters), "Reserve" (số tuần). Cột child: "Tuần", "Trạng thái" (badge CONFIRMED), "Cuộn nguyên", "Cuộn lẻ", "Mét lẻ"
- [x] 5.4 Render thêm 1 row phụ "Reserve khác (không thuộc tuần CONFIRMED)" dưới mỗi warehouse khi `other_reserved` có giá trị > 0 — show full/partial/meters
- [x] 5.5 Fetch khi mount + watch `[threadTypeId, colorId, warehouseId]` refetch
- [x] 5.6 Loading state (q-inner-loading hoặc skeleton); empty state tiếng Việt ("Không có dữ liệu reserve")
- [x] 5.7 **Inline error state** — banner đỏ tiếng Việt "Không tải được dữ liệu reserve" + button "Thử lại" gọi refetch. Banner persist đến khi refetch thành công (snackbar chỉ là notification phụ)
- [x] 5.8 File ≤ 200 lines — nếu vượt, tách sub-component hoặc composable ← (verify: props đúng, refetch khi đổi prop, render đúng cấu trúc group, tiếng Việt đầy đủ, không dùng `as any`, inline error block hiển thị khi simulate fetch fail)

## 6. Frontend — Tích hợp dialog + trang inventory

- [x] 6.1 Sửa `src/components/thread/ConeWarehouseBreakdownDialog.vue`: thêm prop `warehouseId?: number | null`
- [x] 6.2 Truyền `warehouseId` vào service fetch warehouse breakdown (bảng cũ) qua composable
- [x] 6.3 Mount `<ConeReservedByWeekTable :thread-type-id="..." :color-id="..." :warehouse-id="warehouseId" />` BÊN DƯỚI bảng warehouse breakdown cũ trong dialog
- [x] 6.4 Thêm badge ở header dialog: khi `warehouseId` có giá trị → hiển thị `q-chip` text "Đang lọc theo kho: [tên kho]" (lấy tên từ list warehouses đã load hoặc prop thêm `warehouseName`)
- [x] 6.5 Sửa `src/pages/thread/inventory.vue`: truyền `filters.warehouse_id` (và optional `warehouseName`) vào `<ConeWarehouseBreakdownDialog>` và vào action `selectThreadType` của composable ← (verify: mở dialog khi chưa chọn kho → cả 2 bảng show tất cả kho, không có badge; chọn kho rồi mở dialog → cả 2 bảng chỉ 1 kho, có badge; đổi thread type khác trong cùng session → refetch đúng)

## 7. QA & Cleanup

- [x] 7.1 `npm run lint` — fix mọi warning/error (0 errors trên code mới; các warning còn lại là pre-existing trong `src/types/ui/*`)
- [x] 7.2 `npm run type-check` — 0 TS errors, không dùng `as any` / `@ts-ignore`
- [x] 7.3 **QA Matrix Manual E2E** trên trang `thread/inventory` — bắt buộc xác nhận tất cả các case sau:
  - 7.3.1 Thread type có reserve CONFIRMED, không filter warehouse → cả 2 bảng full
  - 7.3.2 Thread type có reserve CONFIRMED, filter 1 warehouse có cone → cả 2 bảng đồng bộ 1 warehouse, badge hiển thị
  - 7.3.3 Filter warehouse KHÔNG có cone của thread type → cả 2 bảng empty state, KHÔNG vỡ UI
  - 7.3.4 Thread type chỉ có AVAILABLE, không có CONFIRMED week → bảng mới hiển thị warehouses với weeks rỗng
  - 7.3.5 Thread type chỉ có RESERVED nhưng cho week DRAFT (không CONFIRMED) → "Reserve khác" row hiển thị, weeks rỗng
  - 7.3.6 Cone RESERVED bị move warehouse sau reserve → hiển thị warehouse hiện tại (verify khớp với DB query)
  - 7.3.7 Simulate API fail (devtools network throttle/block) → bảng mới hiển thị inline error banner + retry button hoạt động; bảng cũ phía trên độc lập
  - 7.3.8 Permission removed (`thread.allocations.view`) → endpoint trả 403, UI báo lỗi tiếng Việt
- [x] 7.4 Verify không có N+1: kiểm tra backend chỉ chạy ≤ 3 query (thread_inventory + warehouses + weeks) cho endpoint mới ← (verify: log SQL hoặc đọc code handler, đảm bảo dùng `.in()` batch, không loop)
- [x] 7.5 Verify supplier_breakdown consistency: với 1 thread type có cone ở 2+ warehouse và 2+ supplier, gọi endpoint cũ với `warehouse_id` → tổng từng supplier = số cone supplier đó TRONG warehouse được filter (KHÔNG bao gồm warehouse khác). So sánh với raw SQL query.
