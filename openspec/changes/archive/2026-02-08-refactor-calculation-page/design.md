## Context

Trang `src/pages/thread/calculation/index.vue` (~500 dòng) dùng trực tiếp 11 Quasar components thay vì custom wrappers trong `src/components/ui/`. Dự án có sẵn bộ component library đầy đủ với các tính năng:
- Auto dark mode detection (`AppCard`, `DataTable`)
- Vietnamese default labels (`DataTable`: "Không có dữ liệu")
- Standardized defaults (`AppButton`: noCaps=true, `AppSelect`: outlined=true, emitValue=true, mapOptions=true)
- Built-in empty state (`DataTable`, `EmptyState`)
- Standardized dialog layout (`AppDialog`: header/content/actions slots)

## Goals / Non-Goals

**Goals:**
- Thay thế tất cả Quasar components trực tiếp bằng custom wrapper components
- Giữ nguyên 100% business logic và behavior hiện tại
- Tận dụng các defaults có sẵn để giảm props boilerplate

**Non-Goals:**
- Không thay đổi logic tính toán, API calls, hoặc data flow
- Không refactor composables hoặc services
- Không thêm tính năng mới
- Không tạo component mới

## Decisions

### 1. Mapping component 1:1

| Hiện tại | Thay bằng | Lý do |
|----------|-----------|-------|
| `<h1>` + subtitle markup | `PageHeader` | Có sẵn title, subtitle, actions slot |
| `<q-btn-toggle>` | `ButtonToggle` | Wrapper có noCaps=true default |
| `<q-select>` | `AppSelect` | Default outlined=true, emitValue=true, mapOptions=true → bỏ 3 props |
| `<q-input>` | `AppInput` | Default outlined=true |
| `<q-btn>` | `AppButton` | Default noCaps=true, variant="filled" = unelevated |
| `<q-card flat bordered>` | `AppCard flat bordered` | Auto dark mode |
| `<q-table flat bordered>` | `DataTable` | Default flat=true, bordered=true, Vietnamese labels, built-in EmptyState |
| `<q-badge>` | `AppBadge` | Wrapper chuẩn |
| `<q-dialog>` + card layout | `AppDialog` | Header/content/actions slots tự động |
| Empty state markup | `EmptyState` | Tích hợp sẵn trong DataTable hoặc dùng standalone |
| `<q-tooltip>` | `AppTooltip` | Wrapper chuẩn |

### 2. AppDialog thay cho q-dialog + q-card manual layout

Hiện tại dialog Allocation Summary tự build layout (q-card > q-card-section header > q-card-section content > q-card-actions). `AppDialog` cung cấp sẵn các slots `header`, default, `actions` nên code sẽ gọn hơn.

Lưu ý: Dialog hiện `maximized` - cần giữ prop này trên AppDialog.

### 3. Standalone EmptyState cho trạng thái "Chưa có kết quả"

Hiện tại empty state là một `<q-card>` chứa icon + text. Thay bằng `AppCard` + `EmptyState` component.

## Risks / Trade-offs

- **[Thấp] Breaking visual**: Custom components có thể có styling hơi khác → Kiểm tra visual sau refactor
- **[Thấp] AppDialog card style**: AppDialog có `minWidth: 400px` khi không maximized, nhưng dialog này dùng `maximized` nên không ảnh hưởng
- **[Thấp] DataTable pagination**: DataTable có default `rowsPerPageOptions: [10,25,50,100]`, nhưng trang hiện dùng `[0]` (show all) với `hide-bottom` → cần giữ props này
