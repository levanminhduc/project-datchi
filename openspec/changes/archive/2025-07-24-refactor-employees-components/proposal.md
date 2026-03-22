## Why

The `employees.vue` page (963 lines) uses raw Quasar components (`q-input`, `q-btn`, `q-dialog`, `q-badge`, etc.) throughout most of its template, violating the project convention of using App component wrappers (`AppButton`, `AppDialog`, `SearchInput`, `DeleteDialog`, etc.). This creates inconsistency with the rest of the codebase and bypasses the standardized Vietnamese defaults and styling that App components provide.

## What Changes

- Replace page header (manual `div` + `q-input` + `q-btn`) with `PageHeader` + `SearchInput` + `AppButton`
- Replace table loading skeleton (`q-inner-loading` + `q-spinner-dots`) with `InnerLoading`
- Replace table empty state (manual `div` + `q-icon`) with `EmptyState`
- Replace inline edit `q-popup-edit` + `q-input` (full_name, department columns) with `PopupEdit`
- Replace table action buttons (`q-btn` + `q-tooltip` x3) with `IconButton` + `AppTooltip`
- Replace delete confirmation dialog (manual `q-dialog` + `q-card`, ~42 lines) with `DeleteDialog` (~5 lines)
- Replace detail dialog (manual `q-dialog` + `q-card`, ~200 lines) with `AppDialog` + `AppList` + `ListItem` + `AppBadge` + `AppButton`
- Keep `FormDialog` section unchanged (already uses correct components)
- Keep `q-popup-edit` + `q-select` for `chuc_vu` column (PopupEdit does not support select mode)
- Keep `q-table` (no suitable DataTable wrapper for all features)

## Capabilities

### New Capabilities
- `employees-component-refactor`: Refactor employees.vue template to replace raw Quasar components with project App component wrappers while preserving all existing behavior and logic

### Modified Capabilities

## Impact

- **File changed**: `src/pages/employees.vue` (template only, no logic changes)
- **Lines reduced**: ~80-100 lines (delete dialog 42→5, detail dialog simplified)
- **Risk**: Low — purely template refactor, no business logic or API changes
- **Dependencies**: All App components already exist (`PageHeader`, `SearchInput`, `AppButton`, `IconButton`, `AppTooltip`, `InnerLoading`, `EmptyState`, `PopupEdit`, `DeleteDialog`, `AppDialog`, `AppList`, `ListItem`, `AppBadge`)
