## Why

Trang `components.vue` hiện tại chỉ demo các Quasar components gốc, không hiển thị ~52 custom wrapper components trong `src/components/ui/`. Developer cần một nơi để xem và reference tất cả UI components có sẵn trong dự án, giúp việc phát triển tính năng mới nhanh hơn và nhất quán hơn.

## What Changes

- Thay thế nội dung trang `src/pages/components.vue` với Component Showcase mới
- Hiển thị tất cả UI wrapper components từ `src/components/ui/**`
- Mỗi component có: Demo visual + Props table
- Tổ chức theo categories: Buttons, Inputs, Dialogs, Feedback, Navigation, Layout, Cards, Media, Pickers, Scroll
- Sử dụng Tab-based layout để dễ navigate
- Loại bỏ demos của Quasar components gốc (không còn relevant)

## Capabilities

### New Capabilities
- `component-showcase`: Trang hiển thị tất cả UI components với demo và props documentation

### Modified Capabilities
<!-- Không có capability nào bị thay đổi -->

## Impact

- **Files changed**: `src/pages/components.vue` (rewrite)
- **Dependencies**: Sử dụng existing UI components, không thêm dependencies mới
- **No breaking changes**: Đây là trang internal reference, không ảnh hưởng API hay user-facing features
