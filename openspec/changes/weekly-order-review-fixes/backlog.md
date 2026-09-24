# Backlog Weekly Order: các mục chưa sửa

Nguồn: review ngày 2026-09-24. Số dòng lấy theo code lúc review, có thể đã lệch.

## Đã bỏ qua theo quyết định

- **Audit trail:** `fn_receive_delivery`, `fn_reserve_for_week`, `fn_borrow_thread`, `fn_transfer_reserved_cones`, `fn_release_week_reservations` không ghi `thread_movements`. DB có 113.679 cuộn `WO-%` nhưng 0 movement RECEIVE.
- **`weight_grams`:** 100% cuộn `WO-%` có `weight_grams = NULL`; `thread_movements` không có cột weight. Cần quyết định có backfill hay không.
- **Mượn:**
  - Không huỷ được tuần từng có khoản mượn: `core.ts` kiểm tra `deleted_at IS NULL` thay vì `status='ACTIVE'`.
  - `thread_order_loans` không có `color_id`, nên mượn/trả có thể lệch màu.
  - Người thực hiện luôn là "system" ở 3 route `loans-reservations.ts`: route đọc `c.get('jwtPayload')`, giá trị này không bao giờ được set.

## Cao (còn lại)

- **Hard delete:**
  - `core.ts`: items, week, warehouses, completions.
  - `syncDeliveries`: DELETE delivery mồ côi.
  - Nên chuyển sang soft-delete / CANCELLED.
- **`deliveries.vue:1136`:** hạn dùng mặc định là ngày nhập, nên cuộn mới bị FEFO ưu tiên xuất trước. Chưa rõ có phải chủ ý.
- **Tuần CONFIRMED:** `POST /:id/remove-po` không yêu cầu ROOT unlock. UI đã ẩn nút; BE vẫn mở.
- **Tuần 19:** đang giữ dư 427 cuộn so với calc hiện tại. Cần kiểm tra trước khi chạy re-reserve cho tuần này.

## Trung bình

- **Gộp màu theo `thread_type_id` ở nhiều đường đọc:**
  - BE: `/:id/deliveries`, overview, assignment-summary, thread-summary-live, reservations, quota update (`calculation.ts:83`).
  - Code còn join `thread_types.color_id` (luôn NULL) ở `deliveries.ts:~493`, `delivery-summary-helper.ts:81`, `process-trace.ts:758`, `threadCalculation.ts`.
  - FE lấy màu từ `thread_type.color`, cũng luôn NULL.
- **Nhập kho:** `received_by` lấy từ body, client có thể gửi tên người khác.
- **Save-results:** `calculation_data: z.any()`, client tự quyết số lượng giữ chỉ.
- **`syncDeliveries`:** INSERT nhiều dòng một lần, chỉ 1 dòng xung đột là rơi cả lô. Ở đường không có tx, lỗi vẫn bị nuốt.
- **Hiệu năng:**
  - process-trace quét toàn bộ `thread_audit_log` (khoảng 670k dòng / 820 MB).
  - search-po và thread-summary-live kéo tới 500k dòng lên JS.
  - `LIMIT 10000` cắt dữ liệu mà không báo.
  - Overview không phân trang.
  - `handleLoadWeek` tải PO tuần tự (N+1).
- **Phân quyền FE:**
  - Cả module không có `v-permission`.
  - Quyền mở trang (`weekly-order.view`) lệch với quyền BE (`allocations.view/manage`).
- **Race FE:** không có guard chống response cũ ghi đè ở index, [id], deliveries, history, workflow, leader-review.
- **Khác:**
  - Cache `fetchWeeks` không được invalidate sau create/update/delete.
  - History xuất Excel chỉ ra trang hiện tại.
  - `html: true` chèn tên PO mà không escape (`index.vue` handleRemovePO, `[id].vue` xoá dòng).

## Thấp / convention

- **Code:**
  - Comment trong code, cả FE lẫn SQL.
  - Khoảng 15 chỗ dùng `any`; 2 chỗ dùng `$q.dialog` (`index.vue` showInventoryDiffDialog, handleWeekNameBlur).
  - `POOrderCard.vue` mutate prop `subArtRequired`.
- **File quá dài:** `[id].vue`, `deliveries.vue`, `index.vue`, `core.ts`.
- **`src/types/thread/weeklyOrder.ts`:** bị đổi CRLF→LF, diff phình.
- **Validation:** hổng ở `completion-lookup`, `batch-complete`, filter enum, chuỗi ngày.
- **API/RPC:**
  - Message RPC không dấu, lộ lỗi pg thô cho người dùng.
  - `/:id/notify` không idempotent.
- **Test:**
  - Thiếu test cho receive, save-results/apply, cancel, remove-po, loans, reserve-from-stock, RPC.
  - `process-trace.test.ts` phụ thuộc data live.
  - Test route dùng `tx()` phải stub cả `pool.connect`, không chỉ `pool.query`.
