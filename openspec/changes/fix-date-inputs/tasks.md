## 1. Audit và xác định files cần sửa

- [x] 1.1 Tìm tất cả files dùng `type="date"` trong project
- [x] 1.2 Xác nhận pattern chuẩn từ `reports/allocations.vue`

## 2. Fix history.vue

- [x] 2.1 Import DatePicker component
- [x] 2.2 Thay thế `from_date` input: bỏ `type="date"`, thêm popup-proxy với DatePicker
- [x] 2.3 Thay thế `to_date` input: bỏ `type="date"`, thêm popup-proxy với DatePicker

## 3. Kiểm tra và fix các files khác (nếu có)

- [x] 3.1 Kiểm tra `AllocationFormDialog.vue` - đang dùng `AppInput type="date"` → CẦN FIX
- [x] 3.2 Fix nếu cần thiết → Fixed AllocationFormDialog.vue

## 4. Verification

- [x] 4.1 Chạy type-check
- [x] 4.2 Test UI trên browser - đảm bảo calendar popup hiển thị Vietnamese locale (USER VERIFY)
