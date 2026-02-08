## Why

Trang `thread/calculation` hiện dùng trực tiếp Quasar components (q-btn, q-select, q-input, q-card, q-table, q-dialog, q-badge, q-tooltip) thay vì sử dụng các custom wrapper components có sẵn trong `src/components/ui/`. Điều này gây không nhất quán với convention của dự án, thiếu các default props chuẩn hóa (Vietnamese labels, dark mode auto-detect), và duplicate logic (tự viết empty state, page header).

## What Changes

- Thay `<h1>` + `<p>` page header bằng `PageHeader` component
- Thay `<q-btn-toggle>` bằng `ButtonToggle` component
- Thay `<q-select>` bằng `AppSelect` component
- Thay `<q-input>` bằng `AppInput` component
- Thay `<q-btn>` bằng `AppButton` component
- Thay `<q-card>` bằng `AppCard` component
- Thay `<q-table>` bằng `DataTable` component
- Thay `<q-badge>` bằng `AppBadge` component
- Thay `<q-dialog>` + card layout bằng `AppDialog` component
- Thay empty state markup tự viết bằng `EmptyState` component
- Thay `<q-tooltip>` bằng `AppTooltip` component

## Capabilities

### New Capabilities

(Không có - chỉ refactor, không thêm tính năng mới)

### Modified Capabilities

(Không có thay đổi requirements)

## Impact

- **File thay đổi**: `src/pages/thread/calculation/index.vue` (duy nhất)
- **Không thay đổi logic**: Chỉ thay component tags, giữ nguyên toàn bộ business logic
- **Không ảnh hưởng API**: Không thay đổi backend
- **Risk thấp**: Refactor thuần UI, không thay đổi data flow
