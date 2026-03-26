## Context

The employees page (`src/pages/employees.vue`) has a detail dialog that displays a hardcoded set of 7 fields. The `employees` table has 17+ columns, but only basic ones are shown. Adding new fields to the detail view requires code changes each time.

The project already has a `system_settings` table (key/JSONB value), a `useSettings` composable, and settings API routes. The auth system has `isRoot` checks available in `useAuth`.

## Goals / Non-Goals

**Goals:**
- Root users can configure which employee fields appear in the detail dialog via a UI
- Fields can be toggled on/off and reordered via drag-and-drop
- `employee_id` and `full_name` are always visible (required fields)
- Configuration persists in `system_settings` and applies to all users viewing employee details
- Detail dialog renders dynamically based on stored config

**Non-Goals:**
- Per-user or per-role field visibility (config is global, set by root)
- Adding custom/computed fields not in the employees table
- Configuring the employees list table columns (only the detail dialog)
- Field-level formatting customization (date format, etc. — uses existing formatters)

## Decisions

### 1. Storage: Single row in `system_settings`

**Decision**: Store config as `key: "employee_detail_fields"` in `system_settings` with JSONB value.

**Value structure**:
```json
{
  "fields": [
    { "key": "employee_id", "label": "Mã nhân viên", "visible": true, "order": 1, "required": true },
    { "key": "full_name", "label": "Họ tên", "visible": true, "order": 2, "required": true },
    { "key": "department", "label": "Phòng ban", "visible": true, "order": 3 },
    { "key": "chuc_vu", "label": "Chức vụ", "visible": true, "order": 4 },
    { "key": "is_active", "label": "Trạng thái", "visible": true, "order": 5 },
    { "key": "created_at", "label": "Ngày tạo", "visible": true, "order": 6 },
    { "key": "updated_at", "label": "Cập nhật lần cuối", "visible": true, "order": 7 },
    { "key": "last_login_at", "label": "Lần đăng nhập cuối", "visible": false, "order": 8 },
    { "key": "must_change_password", "label": "Phải đổi mật khẩu", "visible": false, "order": 9 },
    { "key": "password_changed_at", "label": "Đổi MK lần cuối", "visible": false, "order": 10 },
    { "key": "failed_login_attempts", "label": "Số lần đăng nhập sai", "visible": false, "order": 11 },
    { "key": "locked_until", "label": "Khóa tài khoản đến", "visible": false, "order": 12 }
  ]
}
```

**Rationale**: Reuses existing infrastructure (table, API, composable). No new tables or endpoints needed. JSONB is flexible for future field additions.

**Alternative considered**: Separate `employee_detail_config` table → rejected because it adds unnecessary complexity for a single config record.

### 2. Seed via migration

**Decision**: Create a migration that inserts the default config row into `system_settings`.

**Rationale**: Ensures the setting exists on deployment. The settings API only supports GET and PUT (no POST/create), so the row must exist beforehand.

### 3. Backend: Expand employee detail select

**Decision**: Modify `GET /api/employees/:id` to return additional fields: `last_login_at`, `must_change_password`, `password_changed_at`, `failed_login_attempts`, `locked_until`. Exclude sensitive fields (`password_hash`, `refresh_token`, `refresh_token_expires_at`).

**Rationale**: The detail endpoint currently only selects 8 basic fields. The new configurable fields need to be available in the API response for the frontend to conditionally display them.

### 4. Frontend: Dynamic detail dialog rendering

**Decision**: Replace the hardcoded detail dialog body with a dynamic renderer that:
1. Fetches config from `system_settings` on mount (cached)
2. Filters to `visible: true` fields
3. Sorts by `order`
4. Renders each field using a field-type mapping (text, boolean badge, datetime)

**Field type mapping**:
| Field | Type | Rendering |
|-------|------|-----------|
| `employee_id`, `full_name`, `department`, `chuc_vu` | text | Plain text |
| `is_active`, `must_change_password` | boolean | Badge (positive/negative) |
| `created_at`, `updated_at`, `last_login_at`, `password_changed_at`, `locked_until` | datetime | `formatDateTime()` |
| `failed_login_attempts` | number | Plain number |

### 5. Drag-and-drop: vuedraggable (vue.draggable.next)

**Decision**: Use `vuedraggable` package (vue.draggable.next for Vue 3) for drag-and-drop reordering in the config dialog.

**Rationale**: Well-established Vue 3 drag-and-drop library built on Sortable.js. Lightweight, works with Quasar components.

**Alternative considered**: Native HTML5 drag-and-drop → rejected because it requires significantly more code and has inconsistent browser behavior.

### 6. Root-only visibility (frontend + backend)

**Decision**: Use `isRoot` from `useAuth()` composable to conditionally show the config button in the UI. Additionally, protect `PUT /api/settings/employee_detail_fields` with `authMiddleware` + `requireRoot` middleware on the backend to prevent unauthorized API calls.

**Rationale**: Frontend-only gating is insufficient — direct API calls can bypass UI restrictions. The existing `authMiddleware` and `requireRoot` from `server/middleware/auth.ts` can be applied to the settings PUT route.

### 7. Server-side validation for employee_detail_fields

**Decision**: Add a Zod validator specific to `employee_detail_fields` in the settings PUT handler. The validator enforces: allowed field keys only, unique keys, `employee_id` and `full_name` must have `required: true` and `visible: true`, valid order numbers.

**Rationale**: Generic `z.any()` validation on settings value allows malformed config that could break the detail dialog for all users.

### 8. Detail dialog fetches full employee data

**Decision**: When opening the detail dialog, call `employeeService.getById(id)` to fetch the full employee record (including auth fields) instead of using the list row data which only has basic fields.

**Rationale**: List endpoint selects only basic columns for performance. Detail view needs all configurable fields which are only returned by the detail endpoint.

## Risks / Trade-offs

- **[Risk] Config gets out of sync with schema**: If new columns are added to `employees` table later, the config won't automatically include them → **Mitigation**: Document that new employee fields require a migration to add them to the config JSONB. The default config acts as the source of truth.

- **[Risk] vuedraggable dependency**: Adding a new npm dependency → **Mitigation**: vuedraggable is mature (3M+ weekly downloads), small footprint, no transitive dependencies beyond Sortable.js.

- **[Risk] Large API response for employee detail**: Returning more fields than before → **Mitigation**: Negligible — only adding 5 lightweight fields, still excluding heavy auth fields (password_hash, tokens).

- **[Risk] Sensitive auth fields exposed to non-root users**: Fields like `failed_login_attempts`, `locked_until` become visible if root enables them → **Mitigation**: This is by design — root user explicitly chooses which fields to expose. The employees page itself is already permission-gated. Root takes responsibility for field visibility decisions.
