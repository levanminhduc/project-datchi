## Context

`src/pages/thread/inventory.vue` (lines ~747-753) mounts `<ConeWarehouseBreakdownDialog />` without binding `warehouse-id` and `warehouse-name`. The dialog already declares these props (lines 332-333) and forwards them to the inner `ConeReservedByWeekTable`. The page already exposes the values (`filters.warehouse_id`, computed `selectedWarehouseName` at lines 842-847). The bug is purely a missing template binding.

## Goals / Non-Goals

**Goals:**
- Bảng `ConeReservedByWeekTable` trong dialog hiển thị đúng dữ liệu khi user lọc theo kho ở trang inventory.
- Hành vi khi không có filter kho không thay đổi.

**Non-Goals:**
- Không refactor dialog hoặc table component.
- Không thay đổi API endpoint hay schema.
- Không thêm test mới (manual verification đủ cho scope này).

## Decisions

- **Bind ngay tại template parent thay vì global state**: Dữ liệu (`filters.warehouse_id`, `selectedWarehouseName`) đã có sẵn trong scope của `inventory.vue`. Không cần composable hay store mới. Phù hợp YAGNI/KISS.
- **Truyền cả `warehouse-name`**: Dialog dùng nó để render badge "Đang lọc theo kho: [tên kho]". Truyền cả 2 cùng lúc tránh inconsistency.
- **Không sửa dialog/table**: Dialog đã forward props đúng. Lỗi cô lập ở parent.

## Risks / Trade-offs

- **Risk**: User có dialog đang mở khi đổi filter → state cũ. **Mitigation**: Hành vi hiện tại đã đóng/mở dialog mỗi lần click; reactive prop sẽ cập nhật nếu dialog vẫn mở.
- **Risk**: `selectedWarehouseName` trả về chuỗi rỗng thay vì null. **Mitigation**: Kiểm tra computed trả `null` khi không có filter (đã đúng theo lines 842-847).
