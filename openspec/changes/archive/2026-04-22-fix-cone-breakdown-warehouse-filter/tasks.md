## 1. Sửa template binding

- [x] 1.1 Mở `src/pages/thread/inventory.vue`, định vị chỗ mount `<ConeWarehouseBreakdownDialog ... />` (~lines 747-753)
- [x] 1.2 Xác nhận `filters.warehouse_id` và computed `selectedWarehouseName` (~lines 842-847) trả về `null` khi không có filter
- [x] 1.3 Thêm 2 prop bindings vào dialog: `:warehouse-id="filters.warehouse_id"` và `:warehouse-name="selectedWarehouseName"` ← (verify: dialog mount trong template có cả 2 prop, không gãy syntax Vue)

## 2. Kiểm tra build & manual test

- [x] 2.1 Chạy `npm run type-check` → 0 lỗi TS
- [x] 2.2 Chạy `npm run lint` → 0 lỗi
- [ ] 2.3 Manual test: mở trang inventory → chọn 1 kho ở filter → click vào row để mở breakdown dialog → kiểm tra `ConeReservedByWeekTable` chỉ hiển thị data của kho đã chọn, dialog header có badge "Đang lọc theo kho: [tên kho]"
- [ ] 2.4 Manual test edge case: mở dialog khi KHÔNG có filter kho → bảng hiển thị tất cả kho như cũ, không có badge ← (verify: hành vi unfiltered không bị regress; cả filtered và unfiltered đều khớp spec `cone-reserved-by-week` "Warehouse filter sync from inventory page")
