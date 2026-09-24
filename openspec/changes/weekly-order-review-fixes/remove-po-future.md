# Hướng mở lại chức năng xoá PO khỏi tuần

Hiện tại nút xoá PO bị ẩn khi tuần đã lưu (`POOrderCard` prop `canRemove`). Form chưa lưu vẫn bỏ PO cục bộ được. Route BE `POST /:id/remove-po` vẫn còn, đã bọc tx và đóng băng tồn kho.

## Tuần DRAFT đã lưu

- Xoá items của PO và kết quả đã lưu, bắt người dùng tính lại.
- Tuần DRAFT không có cuộn giữ nên an toàn.

## Tuần CONFIRMED

1. **Điều kiện:** bắt buộc ROOT unlock (`isRootUnlocked`) ở BE.
2. **Preview trước khi làm:**
   - Số cuộn sẽ nhả theo (type, color).
   - Delivery NCC bị giảm hoặc huỷ.
   - Cuộn đã nhận cho tuần (lot `WO-<week>` / `receive_log_id`) và cuộn mượn về.
3. **Thực thi trong 1 tx:**
   1. Lock tuần.
   2. Soft-delete items, không DELETE.
   3. Cập nhật `summary_data` với tồn đóng băng.
   4. `fn_re_reserve_after_remove_po`: chỉ nhả phần dư của cuộn lấy từ tồn.
   5. Sync delivery: PENDING chưa nhận → CANCELLED thay vì DELETE.
4. **Cuộn đã nhận cho tuần:** không tự nhả. Cho chọn giữ lại hoặc chuyển qua luồng transfer-reserved sẵn có.
5. **Movement log:** ghi kèm khi làm hạng mục audit trail `thread_movements`.
