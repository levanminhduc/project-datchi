## Why

Khi user lọc theo kho ở trang inventory rồi mở dialog "Cone Warehouse Breakdown", bảng `ConeReservedByWeekTable` bên trong dialog không hiển thị dữ liệu (hoặc hiển thị sai phạm vi) vì `ConeWarehouseBreakdownDialog` không nhận và truyền xuống prop `warehouse_id`. Lỗi này làm sai lệch thông tin cone đã reserve theo kho mà user đang chọn.

## What Changes

- Truyền `warehouse_id` và `warehouse_name` từ trang `inventory.vue` vào `ConeWarehouseBreakdownDialog` khi mount (2 dòng prop trong template).
- Dialog hiện đã khai báo các props này (lines 332-333) → chỉ thiếu binding ở parent.
- Khi không có filter kho → props pass `null`, hành vi hiện tại không đổi.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `cone-reserved-by-week`: Bổ sung yêu cầu rằng dialog warehouse breakdown phải nhận và truyền context `warehouse_id` từ filter của trang cha xuống bảng cone-reserved-by-week để bảng lọc đúng kho.

## Impact

- Code: `src/pages/thread/inventory.vue` (template, ~2 dòng)
- API: không đổi (endpoint đã hỗ trợ optional `warehouse_id`)
- DB: không đổi
- Risk: Thấp — thay đổi cô lập trong template, không tạo code path mới, defaults xử lý null an toàn.
