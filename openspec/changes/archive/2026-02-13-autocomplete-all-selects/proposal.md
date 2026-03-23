## Why

Only 4 out of 56 AppSelect instances across the application have autocomplete/search enabled via `use-input`. Users cannot quickly find options in dropdowns with many items (thread types, POs, styles, colors, warehouses, suppliers). This creates a poor UX especially on pages with large datasets where scrolling through a long dropdown is slow and error-prone.

## What Changes

- Add `use-input`, `fill-input`, and `hide-selected` props to ~35 AppSelect instances that have dynamic options with potentially many items
- Skip selects with few static options (status filters, priority, unit selectors, reason dropdowns) where autocomplete adds no value
- Affected field types: Thread Type (Loại Chỉ), PO, Style (Mã Hàng), Color (Màu), Warehouse (Kho), Supplier (Nhà cung cấp), Department (Bộ Phận), Material (Chất liệu), Issue selector (Phiếu xuất)

## Capabilities

### New Capabilities
- `select-autocomplete`: Add autocomplete search capability to all AppSelect components with dynamic/large option sets across the application

### Modified Capabilities

## Impact

- ~24 Vue files affected (pages and components)
- Template-only changes — no script logic, no API, no database changes
- AppSelect component itself already supports `use-input` prop — no component modification needed
- Zero risk of breaking existing functionality (additive props only)
