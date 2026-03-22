## 1. Database

- [x] 1.1 Create migration to seed `employee_detail_fields` config into `system_settings` table with default JSONB value (12 fields, first 7 visible, last 5 hidden). Use `INSERT ... ON CONFLICT (key) DO NOTHING` to avoid overwriting existing config on re-run

## 2. Backend

- [x] 2.1 Update GET /api/employees/:id select to include `last_login_at`, `must_change_password`, `password_changed_at`, `failed_login_attempts`, `locked_until` (exclude `password_hash`, `refresh_token`, `refresh_token_expires_at`)
- [x] 2.2 Update Employee TypeScript types (both `server/types/employee.ts` and `src/types/employee.ts`) to include the new optional fields
- [x] 2.3 Add `authMiddleware` + `requireRoot` middleware to `PUT /api/settings/:key` route when updating `employee_detail_fields` key. Only root users can modify this setting — no admin fallback
- [x] 2.4 Add Zod validation schema for `employee_detail_fields` value: enforce exactly 12 expected field keys (no partial configs), unique keys, unique order values covering full range 1-12, `employee_id`/`full_name` must have `required: true` and `visible: true`. Reject incomplete/malformed payloads with Vietnamese error messages. Apply in PUT handler when `key === 'employee_detail_fields'` ← (verify: unauthorized PUT returns 401/403, partial config rejected, malformed config rejected with Vietnamese error, valid complete config saves correctly)

## 3. Frontend - Config Dialog

- [x] 3.1 Install `vuedraggable` (vue.draggable.next) dependency
- [ ] 3.2 Add config button next to "Thêm Nhân Viên" button in `employees.vue`, visible only when `isRoot` is true (use `useAuth`)
- [ ] 3.3 Create config dialog with field list: each field has checkbox toggle + drag handle + Vietnamese label
- [ ] 3.4 Implement required field locking: `employee_id` and `full_name` checkboxes are checked and disabled with lock indicator
- [ ] 3.5 Implement drag-and-drop reordering using vuedraggable
- [ ] 3.6 Implement "Lưu" button: save config via `useSettings().updateSetting('employee_detail_fields', ...)`, show success/error toast, close dialog on success
- [ ] 3.7 Implement "Khôi phục mặc định" button: reset field list to default config (not auto-saved) ← (verify: config dialog opens, drag-and-drop works, save persists to DB, restore defaults resets correctly)

## 4. Frontend - Dynamic Detail Dialog

- [ ] 4.1 Fetch `employee_detail_fields` config on employees page mount (or use cached value)
- [ ] 4.2 Update detail dialog open handler to call `employeeService.getById(id)` to fetch full employee record (including auth fields), add loading state while fetching
- [ ] 4.3 Refactor detail dialog to render fields dynamically: filter by `visible: true`, sort by `order`, use field-type mapping (text/boolean badge/datetime/number)
- [ ] 4.4 Handle fallback when config doesn't exist: render default 7 fields ← (verify: detail dialog renders only visible fields in correct order, boolean fields show badges, datetime fields use formatDateTime, fallback works when no config exists, detail fetches full data via getById)
