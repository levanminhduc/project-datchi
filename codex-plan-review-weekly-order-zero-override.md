# Plan: Cho phép loại chỉ fallback được loại khỏi nhu cầu tuần

## Summary
Thêm cơ chế **“Không dùng”** cho các dòng tổng hợp weekly order phát sinh từ cảnh báo “màu chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định”. Chỉ những dòng có warning/fallback do backend đánh dấu mới được bật override về `0`; các dòng bình thường không có quyền chỉnh về 0.

Cơ chế này phải ảnh hưởng đồng bộ cả 2 luồng:
- Không tạo/đồng bộ dòng đặt NCC trong delivery.
- Không reserve/rút tồn kho khi xác nhận tuần hoặc re-reserve.

## Key Changes

### Backend calculation + JSON contract
- Không dựa vào warning string để nhận diện; thêm flag có cấu trúc từ backend calculation:
  - `can_zero_override: true`
  - `fallback_reason: 'MISSING_STYLE_COLOR_THREAD_SPEC'`
  - giữ `is_fallback_type: true` để UI highlight.
- Flag được gắn tại `color_breakdown` khi `style_color_thread_specs` không có `thread_type_id` cho màu đó.
- Frontend aggregate sẽ propagate flag này lên `AggregatedRow` theo key `thread_type_id + thread_color`.

### Frontend weekly order
- Trong bảng summary, chỉ dòng có `can_zero_override === true` mới hiển thị nút/toggle **“Không dùng”**.
- Khi bật:
  - set `is_zero_overridden: true`
  - set `total_final = 0`
  - set `additional_order = 0`
  - giữ lại `sl_can_dat`, `total_cones`, `total_meters` để người dùng vẫn thấy nhu cầu tính toán gốc.
- Khi tắt:
  - xóa `is_zero_overridden`
  - tính lại `total_final = sl_can_dat + additional_order`.
- Khi tính lại, load tuần cũ, hoặc merge kết quả đã lưu, phải giữ override nếu dòng đó vẫn còn `can_zero_override`; nếu sau này định mức màu đã setup đúng và flag biến mất thì override tự bị loại bỏ.
- Detail/leader-review/export chỉ hiển thị trạng thái “Không dùng” ở readonly, không cho chỉnh.

### Backend save/delivery/reserve
- `saveResults` và `enrichWithInventory` phải preserve `can_zero_override`, `is_zero_overridden`, `fallback_reason`; nếu `is_zero_overridden` hợp lệ thì backend force `total_final = 0`.
- `syncDeliveries` tiếp tục dùng `total_final`; vì dòng override có `total_final = 0`, nó không tạo delivery mới và sẽ xóa delivery pending chưa nhập nếu đã tồn tại.
- Thêm migration thay thế `fn_parse_calculation_cones` để loại khỏi kết quả parse các group có summary row:
  - `can_zero_override = true`
  - `is_zero_overridden = true`
  - cùng `thread_type_id` và cùng màu.
- Vì `fn_confirm_week_with_reserve`, `fn_receive_delivery`, và `fn_re_reserve_after_remove_po` đều dùng `fn_parse_calculation_cones`, override sẽ áp dụng nhất quán cho confirm, receive, và re-reserve.
- Không thêm endpoint mới; mở rộng contract JSON của endpoint hiện có `POST /api/weekly-orders/:id/results`.

## Assumptions
- UI dùng toggle **“Không dùng”**, không mở ô nhập số bất kỳ.
- Override chỉ áp dụng trước khi xác nhận tuần qua flow tạo/cập nhật DRAFT; confirmed-week chỉnh sâu không nằm trong scope.
- Không thêm cột database mới vì `thread_order_results.summary_data` là JSONB; chỉ cần migration cập nhật SQL functions.
