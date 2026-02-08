## 1. Page Header & Layout

- [x] 1.1 Thay `<h1>` + `<p>` page header bằng `PageHeader` component (title, subtitle props)
- [x] 1.2 Thay các `<q-card flat bordered>` bằng `AppCard flat bordered`

## 2. Form Inputs

- [x] 2.1 Thay `<q-btn-toggle>` bằng `ButtonToggle` component
- [x] 2.2 Thay các `<q-select>` (style selector, PO selector) bằng `AppSelect`
- [x] 2.3 Thay `<q-input>` (quantity) bằng `AppInput`
- [x] 2.4 Thay các `<q-btn>` bằng `AppButton` component

## 3. Results Display

- [x] 3.1 Thay các `<q-table>` bằng `DataTable` component (giữ custom slots)
- [x] 3.2 Thay `<q-badge>` bằng `AppBadge` trong template body-cell-thread_color
- [x] 3.3 Thay `<q-tooltip>` bằng `AppTooltip` trong template body-cell-total_cones

## 4. Dialog & Empty State

- [x] 4.1 Thay empty state markup bằng `EmptyState` component (bọc trong AppCard)
- [x] 4.2 Thay `<q-dialog>` allocation summary bằng `AppDialog` (sử dụng header, default, actions slots)

## 5. Verification

- [x] 5.1 Kiểm tra không còn direct usage của q-btn, q-select, q-input, q-card, q-table, q-dialog, q-badge, q-tooltip
- [x] 5.2 Kiểm tra type-check pass (`npm run type-check`)
