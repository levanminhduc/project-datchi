## Why

The employee detail dialog currently shows a fixed set of 7 fields (employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at). Adding or removing fields requires code changes. Root users need the ability to dynamically configure which fields appear in the employee detail view and in what order, without developer intervention.

## What Changes

- Add a "Cấu hình" (config) button next to "Thêm Nhân Viên" button on the employees page, visible only to root users
- Add a configuration dialog with toggle (on/off) and drag-and-drop reordering for all employee detail fields
- Fields `employee_id` and `full_name` are always visible (required, cannot be toggled off)
- 10 additional fields are configurable: department, chuc_vu, is_active, created_at, updated_at, last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until
- Store configuration in existing `system_settings` table (key: `employee_detail_fields`, value: JSONB array)
- Seed default configuration via database migration
- Refactor the employee detail dialog to render fields dynamically based on the stored configuration
- Add "Khôi phục mặc định" (restore defaults) and "Lưu" (save) buttons in the config dialog

## Capabilities

### New Capabilities
- `employee-detail-field-config`: Root-only UI to configure which fields appear in employee detail view, with drag-and-drop ordering and toggle visibility. Stores config in system_settings.

### Modified Capabilities

## Impact

- **Database**: New seed row in `system_settings` table (migration)
- **Frontend**: `src/pages/employees.vue` — new config button, config dialog, refactored detail dialog to be dynamic
- **Backend**: `server/routes/employees.ts` — GET /:id endpoint needs to return additional fields (last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until) that are currently excluded from the select
- **Auth**: Uses existing `isRoot` check from `useAuth` composable
- **Settings infrastructure**: Reuses existing `system_settings` table, `useSettings` composable, and settings API routes (GET/PUT)
