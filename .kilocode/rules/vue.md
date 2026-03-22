# vue.md

VueJs Frontend - Quasar Framework

## Skills Cần Gọi

- `vue-best-practices` - TypeScript patterns, Volar configuration
- `frontend-design` - UI aesthetics (chỉ khi thiết kế mới)

## Quy Tắc Bắt Buộc

### Components

- Luôn sử dụng UI components từ `src/components/ui/`
- Naming: `App[Name]` (wrapper) | `[Context][Name]` (composite) | `[Parent]Item` (item)
- Không tạo component mới nếu đã có sẵn trong thư viện UI

### Composables

- Sử dụng composables từ `src/composables/` cho state management
- Composable đã xử lý notifications → KHÔNG thêm duplicate trong Pages
- Pattern: `snackbar.success()`, `snackbar.error()`, `loading.withLoading()`

### Types

- Import types từ `@/types` hoặc `@/types/ui`
- Spread reactive objects trước khi gửi API: `createEmployee({ ...formData })`

### Quasar Specifics

- Icons: Chỉ dùng Material Icons format (`check_circle`, không phải `mdi-check-circle`)
- q-notify: Dùng conditional spread `...(color && { color })`
- q-popup-edit: Lưu `initialVal` để rollback khi API fail
- Responsive: Dùng `$q.screen.lt.sm` cho mobile columns
- Pagination: Watch search/filter để reset `page = 1`

### Form Validation

- Sử dụng `:rules` của Quasar với Vietnamese messages
- Pattern: `(val: string) => !!val?.trim() || 'Thông báo lỗi'`

## File Structure Reference

| Thư mục              | Mục đích                             |
| -------------------- | ------------------------------------ |
| `src/pages/`         | Page components (file-based routing) |
| `src/components/ui/` | Quasar wrappers                      |
| `src/composables/`   | State & logic                        |
| `src/services/`      | API client                           |
| `src/types/ui/`      | Component interfaces                 |
