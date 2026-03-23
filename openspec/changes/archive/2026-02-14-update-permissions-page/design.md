## Context

The Thread Inventory Management System uses a custom RBAC system built on PostgreSQL with:
- `permissions` table — defines available permissions (code, module, resource, action, route_path)
- `roles` table — groups of permissions with hierarchy levels
- `role_permissions` — many-to-many role↔permission
- `employee_roles` / `employee_permissions` — assignment tables
- Hono API backend with JWT auth, frontend via Vue 3 + Quasar

The permissions table was seeded with ~35 permissions during initial build. Since then, 15+ new pages have been added but their permissions were never created. The UI for managing permissions (Tab 2 in `/phan-quyen`) is read-only, and the backend has no CRUD endpoints for the `permissions` table itself.

**Current state:**
- Roles CRUD: full (GET/POST/PUT/DELETE in `server/routes/auth.ts`)
- Permissions: GET only (`GET /api/auth/permissions/all`)
- Tab 2 UI: read-only list grouped by module with search filter

## Goals / Non-Goals

**Goals:**
- Seed all missing permissions so every page/feature is covered by RBAC
- Update role-permission mappings for existing roles to include new permissions
- Add backend CRUD endpoints for permissions with proper validation
- Upgrade Tab 2 to allow creating, editing, and deleting permissions from the UI
- Maintain consistency with existing patterns (Zod validation, `authService.authenticatedFetch`, Quasar components)

**Non-Goals:**
- Adding `permissions` meta to `definePage()` on each new page (separate change)
- Redesigning the permission model or role hierarchy
- Adding permission CRUD for non-ROOT users (stays ROOT-only)
- Building a permission sync/auto-discovery mechanism
- Touching placeholder pages (`ke-hoach`, `ky-thuat`) or alias pages (`kho`, `nhan-su/danh-sach`)

## Decisions

### D1: New permissions — migration seed vs API at runtime

**Decision**: Add new permissions via a SQL migration file in `supabase/migrations/`.

**Why**: Consistent with existing pattern (migration `20240101000025_auth_permissions.sql` seeds all current permissions). Permissions are system-defined, not user-created. Using `ON CONFLICT (code) DO NOTHING` makes migrations idempotent.

**Alternative considered**: Seed via API call on app startup — rejected because it couples app boot to permission state and adds failure modes.

### D2: Permission grouping for issues-related pages

**Decision**: Group `/thread/issues/*`, `/thread/issues/v2/*`, and `/thread/requests` under `resource: 'issues'` with a single set of permissions (`thread.issues.view`, `thread.issues.create`, `thread.issues.edit`, `thread.issues.delete`, `thread.issues.return`).

**Why**: User confirmed these are related features (issue requests, issuance, returns). Separate granularity would create too many permissions with no practical benefit. `thread.issues.return` is a distinct action since return workflows are separate from creating/editing issues.

### D3: Reconciliation as a separate resource

**Decision**: `thread.reconciliation.view` as a separate resource under module `thread`, not under `reports`.

**Why**: The reconciliation page lives at `/thread/issues/reconciliation` and is tightly coupled to the issues workflow. It's a report-like view but specific to thread consumption. Keeping it in the `thread` module is more intuitive for permission assignment.

### D4: Permission CRUD endpoint authorization

**Decision**: All permission CRUD endpoints require ROOT role (same as role CRUD).

**Why**: Permissions define system capabilities. Only ROOT should create/modify/delete them. This matches the existing pattern where role CRUD is ROOT-only.

### D5: Tab 2 UI — dialog vs inline editing

**Decision**: Use a dialog for create/edit (consistent with Tab 1's role dialog pattern).

**Why**: Permissions have 7+ fields (code, name, description, module, resource, action, routePath, isPageAccess, sortOrder). A dialog provides enough space and matches the existing role dialog pattern. Inline editing would be cramped.

### D6: Soft delete vs hard delete for permissions

**Decision**: Hard delete with a safety check — cannot delete permissions that are assigned to any role or employee.

**Why**: Permissions are system metadata. Soft delete would leave orphaned codes in the permission list. The safety check prevents breaking existing assignments. If a permission needs to be removed, admin must first unassign it from all roles/employees.

## Risks / Trade-offs

- **Risk**: Deleting a permission that's checked by `v-permission` directive or route guard → UI elements disappear unexpectedly.
  → **Mitigation**: Delete endpoint checks for role/employee assignments. UI shows warning with assignment count before delete.

- **Risk**: Migration adds permissions but role assignments may not match organizational needs.
  → **Mitigation**: The migration provides reasonable defaults. ROOT user can adjust via the UI immediately after migration runs.

- **Risk**: Duplicate permission codes if admin creates via UI what migration would also seed.
  → **Mitigation**: `code` column has UNIQUE constraint. UI shows validation error on duplicate. Migration uses `ON CONFLICT DO NOTHING`.

- **Trade-off**: No auto-sync between pages and permissions — permissions must be manually maintained.
  → **Accepted**: Auto-sync would require convention-based permission naming and tight coupling between router and RBAC. Manual management is simpler and more flexible for this scale (~50 permissions).
