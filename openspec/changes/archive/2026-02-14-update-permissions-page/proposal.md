## Why

The permissions page (`/phan-quyen`) was built when the system had ~30 permissions covering the original feature set. Since then, 15+ new pages/features have been added (styles, weekly-order, issues v1/v2, reconciliation, calculation, mobile return/scan, settings) but their permissions were never seeded into the database. This means:

1. These new pages have no permission entries — they're invisible to the RBAC system and accessible to anyone who is authenticated.
2. The "Danh sách quyền" tab (Tab 2) is read-only — admins cannot add/edit/delete permissions from the UI, making it impossible to manage permissions for new features without writing SQL migrations.
3. Existing role-permission assignments are stale and don't cover the new features.

## What Changes

- **Seed ~17 new permissions** into the database for all new pages/features (styles, weekly-order, issues, reconciliation, calculation, mobile return/scan, settings, admin permissions CRUD)
- **Update role-permission assignments** so existing roles (admin, warehouse_manager, planning, warehouse_staff, production, viewer) cover the new permissions appropriately
- **Add Permission CRUD API endpoints** — `POST /api/auth/permissions`, `PUT /api/auth/permissions/:id`, `DELETE /api/auth/permissions/:id` with Zod validation
- **Upgrade Tab 2 ("Danh sách quyền")** from read-only to full CRUD — add "Thêm quyền" button, create/edit dialog, delete with confirmation
- **Add composable methods** `createPermission`, `updatePermission`, `deletePermission` in `usePermissionManagement`
- **Add TypeScript DTOs** `CreatePermissionData` and `UpdatePermissionData` in `types/auth`

## Capabilities

### New Capabilities
- `permission-seed-update`: Seed new permission records and update role-permission mappings via a new SQL migration
- `permission-crud-api`: Backend CRUD endpoints for managing permissions (create, update, delete) with Zod validation
- `permission-crud-ui`: Upgrade the permissions list tab from read-only to full CRUD with create/edit dialog and delete confirmation

### Modified Capabilities
<!-- No existing specs are affected — this is net-new functionality on the permissions page -->

## Impact

- **Database**: New migration file in `supabase/migrations/` — adds ~17 permission rows, updates role_permissions
- **Backend**: `server/routes/auth.ts` — 3 new endpoints; new `server/validation/auth.ts` — Zod schemas
- **Frontend**: `src/pages/phan-quyen.vue` (Tab 2 UI), `src/composables/usePermissionManagement.ts` (3 new methods), `src/types/auth/index.ts` (2 new DTOs)
- **No breaking changes** — all additions are backward-compatible
