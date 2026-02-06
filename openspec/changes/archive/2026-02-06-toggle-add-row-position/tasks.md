## 1. UI Implementation

- [ ] 1.1 Thêm ref `addToTop` để lưu trạng thái switch (default: false)
- [ ] 1.2 Thêm `AppToggle` bên trái nút "Thêm định mức" với label "Thêm đầu bảng"
- [ ] 1.3 Bind `v-model` của toggle với `addToTop` ref

## 2. localStorage Persistence

- [ ] 2.1 Đọc localStorage key `datchi_addRowPosition` khi component mount (onMounted)
- [ ] 2.2 Set `addToTop = true` nếu giá trị là `"top"`, false nếu khác
- [ ] 2.3 Watch `addToTop` và lưu vào localStorage khi thay đổi (`"top"` hoặc `"bottom"`)

## 3. Logic Thêm Dòng

- [ ] 3.1 Cập nhật hàm `addEmptyRow()` để check `addToTop.value`
- [ ] 3.2 Nếu `addToTop` = true: dùng `unshift()` thay vì `push()`
- [ ] 3.3 Nếu `addToTop` = false: giữ nguyên `push()` (behavior hiện tại)

## 4. Testing

- [ ] 4.1 Test: Switch OFF → click "Thêm định mức" → dòng mới ở cuối
- [ ] 4.2 Test: Switch ON → click "Thêm định mức" → dòng mới ở đầu
- [ ] 4.3 Test: Toggle switch → refresh page → switch giữ nguyên trạng thái
- [ ] 4.4 Run `npm run type-check` → pass
