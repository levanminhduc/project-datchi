## 1. Database Migration

- [x] 1.1 Create new migration file in `supabase/migrations/` with next sequence number
- [x] 1.2 Add INSERT statements for ~17 new permissions (styles, weekly-order, issues, reconciliation, calculation, mobile return/scan, settings, admin permissions CRUD) using `ON CONFLICT (code) DO NOTHING`
- [x] 1.3 Add INSERT statements for role_permissions mapping new permissions to existing roles (admin, warehouse_manager, planning, warehouse_staff, production, viewer)

## 2. Backend — Zod Validation

- [x] 2.1 Create `server/validation/auth.ts` with `createPermissionSchema` and `updatePermissionSchema` Zod schemas

## 3. Backend — Permission CRUD Endpoints

- [x] 3.1 Add `POST /api/auth/permissions` endpoint in `server/routes/auth.ts` — create permission with ROOT-only auth, Zod validation, duplicate code check (409)
- [x] 3.2 Add `PUT /api/auth/permissions/:id` endpoint — update permission (excluding code field) with ROOT-only auth, 404 handling
- [x] 3.3 Add `DELETE /api/auth/permissions/:id` endpoint — delete with ROOT-only auth, usage check against role_permissions and employee_permissions (409 if in use), 404 handling

## 4. Frontend — TypeScript Types

- [x] 4.1 Add `CreatePermissionData` and `UpdatePermissionData` interfaces to `src/types/auth/index.ts`

## 5. Frontend — Composable Methods

- [x] 5.1 Add `createPermission(data)` method to `usePermissionManagement` — POST to `/api/auth/permissions`, refresh list on success
- [x] 5.2 Add `updatePermission(id, data)` method — PUT to `/api/auth/permissions/:id`, refresh list on success
- [x] 5.3 Add `deletePermission(id)` method — DELETE to `/api/auth/permissions/:id`, refresh list on success

## 6. Frontend — Tab 2 UI Upgrade

- [x] 6.1 Add "Thêm quyền" button in Tab 2 header section (next to search input)
- [x] 6.2 Add permission create/edit dialog with fields: code, name, description, module (autocomplete), resource, action (select), routePath, isPageAccess (toggle), sortOrder
- [x] 6.3 Add actions column to permission table with edit and delete icon buttons per row
- [x] 6.4 Wire up create dialog — openCreatePermissionDialog, savePermission, snackbar feedback
- [x] 6.5 Wire up edit dialog — openEditPermissionDialog with pre-filled data, code readonly
- [x] 6.6 Wire up delete — confirmDeletePermission with useConfirm, handle 409 error message from API

## 7. Verification

- [x] 7.1 Run `npm run type-check` to verify TypeScript compilation
- [x] 7.2 Run `npm run lint` to verify ESLint passes
