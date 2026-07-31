# Điều chỉnh tồn kho tuần hàng + hoàn tác lần nhập kho

## Bối cảnh

Hai tình huống chưa có đường xử lý:

1. Bảng nhu cầu chỉ của tuần liệt kê tồn kho theo từng loại chỉ. Con số đó sai (hệ thống 1000, kho đếm 900) thì không chỉnh được.
2. Trang Theo dõi NCC giao hàng cho nhập kho nhưng không cho sửa. Nhập nhầm quá số lượng là hỏng luôn.

Ba phát hiện định hình thiết kế:

- Tồn kho trong bảng tuần không phải data lưu sẵn — là kết quả đếm trực tiếp `thread_inventory` mỗi lần tải (`server/routes/weekly-order/enrich-helper.ts:22`). Muốn 1000 thành 900 thì 100 cuộn thật phải đổi trạng thái.
- `fn_receive_delivery` tạo mỗi cuộn với `status = 'RESERVED_FOR_ORDER'` và `reserved_week_id = tuần`. Nhập kho là gán cho tuần luôn, nên cuộn cần loại bỏ nằm trong nhóm đang reserve cho chính tuần đó.
- `thread_inventory` không có cột nào trỏ về `delivery_receive_logs`. Cuộn chỉ mang `lot_number = 'WO-<tuần>'` và `received_date` → chưa xác định được "100 cuộn của lần nhập đó".

Đường ghi giảm đúng chuẩn đã có sẵn, không cần xóa dòng: cuộn → `WRITTEN_OFF` kèm `thread_movements` loại `WRITE_OFF`.

Quyết định đã chốt:

- Ý nghĩa: kho đếm thực tế còn ít hơn → giảm tồn kho thật, không phải sửa số hiển thị, không phải reserve thêm.
- Quyền: chỉ ROOT và tuần đang mở khóa (`weekly_order_edit_unlocks`). Mọi thao tác ghi nhật ký theo tuần.
- Cuộn đã xuất / chuyển kho / cho tuần khác mượn: chặn toàn bộ, báo rõ, không tự động đụng vào.
- Nhập nhầm: hoàn tác nguyên một lần nhập rồi nhập lại đúng số.

## Database

`supabase/migrations/{timestamp}_add_receive_log_link_and_stock_adjust.sql` — additive:

```sql
ALTER TABLE thread_inventory ADD COLUMN IF NOT EXISTS receive_log_id INTEGER;
ALTER TABLE delivery_receive_logs
  ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reverted_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS revert_reason TEXT;
```

Không đặt FK cho `receive_log_id` để tránh ràng buộc ngược lên bảng log.

`fn_receive_delivery`: chuyển `INSERT INTO delivery_receive_logs ... RETURNING id` lên trước vòng lặp tạo cuộn, rồi gán `receive_log_id` cho từng cuộn. Phần tính màu, reserve, cập nhật `received_quantity` giữ nguyên.

Backfill có kiểm soát (chỉ `UPDATE`): delivery chỉ có đúng một dòng log thì gán `receive_log_id` cho các cuộn khớp `lot_number` + `thread_type_id` + `warehouse_id` + màu. Delivery từ 2 lần nhập trở lên bỏ qua — không đoán.

`fn_write_off_week_cones(p_week_id, p_thread_type_id, p_color_id, p_quantity, p_receive_log_id, p_reason, p_performed_by)` — lõi dùng chung:

- Chọn cuộn `reserved_week_id = p_week_id`, khớp thread type + màu, `status IN ('RESERVED_FOR_ORDER','AVAILABLE','RECEIVED','INSPECTED')`; có `p_receive_log_id` thì lọc thêm theo cột đó. Sắp xếp mới nhất trước, `FOR UPDATE`.
- Không đủ cuộn còn nguyên → `RAISE EXCEPTION` tiếng Việt kèm số đã dùng. Không loại bỏ một phần.
- `status = 'WRITTEN_OFF'`, giữ `reserved_week_id` để truy vết, ghi `thread_movements` cho từng cuộn.

`fn_revert_delivery_receive(p_log_id, p_performed_by, p_reason)`: khóa dòng log, từ chối nếu đã `reverted_at`, gọi hàm trên với đúng số lượng của lần nhập, trừ `received_quantity`, tính lại `inventory_status`, đánh dấu `reverted_at/by/reason`.

## Backend

`server/routes/weekly-order/stock-adjust.ts`, đăng ký trước `coreRoutes` trong `index.ts`:

- `POST /:id/stock-adjust/preview` — trả tồn hiện tại, chênh lệch, cuộn sẽ loại bỏ, cuộn đã bị dùng. Chỉ đọc.
- `POST /:id/stock-adjust` — gọi `fn_write_off_week_cones`.
- `POST /deliveries/receive-logs/:logId/revert` — gọi `fn_revert_delivery_receive`.

Cả ba gác bằng `isRootUnlocked` (`server/utils/weekly-order-unlock.ts`) → 403 tiếng Việt. Mỗi thao tác thành công gọi `logWeekAudit`.

Số thực tế lớn hơn tồn hiện tại bị từ chối — tạo cuộn từ hư không thì không có nguồn gốc.

## Frontend

- `src/services/weeklyOrderStockAdjustService.ts` — `preview`, `adjust`, `revertReceive`.
- `src/components/thread/weekly-order/AdjustWeekStockDialog.vue` — tồn hiện tại, ô nhập số đếm thực tế, lý do bắt buộc, bảng xem trước cuộn sẽ loại bỏ.
- `ResultsSummaryTable.vue` — thêm nút chỉnh tồn vào cột thao tác sẵn có, emit `adjust-stock`.
- `RevertReceiveDialog.vue` + cột thao tác ở tab "Lịch sử nhập kho". `deliveries.vue` đang 1129 dòng nên không thêm logic vào trang.
- Dòng log đã hoàn tác hoặc không có cuộn mang `receive_log_id` → nút vô hiệu hóa kèm giải thích.

## Giai đoạn

1. **GĐ1** — migration + route/UI hoàn tác lần nhập.
2. **GĐ2** — điều chỉnh tồn kho theo dòng trong bảng nhu cầu chỉ của tuần.

## Kiểm thử

`npm run lint`, `npm run type-check`, `npx tsx server/routes/weekly-order/stock-adjust.test.ts`.

Thủ công với tài khoản root: nhập 10 cuộn → kiểm tra `receive_log_id` gán đủ → hoàn tác → cuộn về `WRITTEN_OFF`, `received_quantity` trở lại, có movements, log có `reverted_at`; xuất một cuộn rồi thử hoàn tác → bị chặn; bảng nhu cầu chỉ: tồn 10 nhập thực tế 8 → còn 8; card nhật ký ở Cài Đặt hiện đủ.

## Ghi chú

Lỗi sẵn có, không sửa trong lần này: `server/routes/recovery.ts:563` và `:702` insert `thread_movements` bằng các cột không tồn tại (`weight_grams`, `meters_before`, `meters_after`, `status_before`, `status_after`), nằm trong `SAVEPOINT` + `try/catch` nên thất bại âm thầm — thao tác ở trang Thu Hồi hiện không ghi được movement nào.
