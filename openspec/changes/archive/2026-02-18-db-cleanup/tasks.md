## 1. Research & Verification (Pre-flight)

- [ ] 1.1 Verify view `v_issue_reconciliation_v2` definition by reading migration `20260215100000_fk_normalization.sql` to capture exact CREATE VIEW SQL for recreation
- [ ] 1.2 Verify `lots.supplier` column usage in `server/routes/lots.ts` — confirm all write paths also write `supplier_id`, identify code that reads only VARCHAR column
- [ ] 1.3 Grep full codebase for any remaining references to `fn_calculate_quota` or `fn_check_quota` (migrations, SQL files, backend code)
- [ ] 1.4 Verify `permission_action` enum current values in live DB: `SELECT unnest(enum_range(NULL::permission_action))` ← (verify: confirm lowercase values exist before writing rename migration)

## 2. Database Migration — Drop Orphaned Functions

- [ ] 2.1 Write migration section: `DROP FUNCTION IF EXISTS fn_calculate_quota()`
- [ ] 2.2 Write migration section: `DROP FUNCTION IF EXISTS fn_check_quota()`
- [ ] 2.3 Write migration section: Drop `fn_update_system_settings_timestamp()` and recreate `trigger_system_settings_updated_at` to use `fn_update_updated_at_column()` ← (verify: trigger still fires correctly on system_settings UPDATE)

## 3. Database Migration — Drop Duplicate Indexes

- [ ] 3.1 Write migration section: `DROP INDEX IF EXISTS` for all 11 duplicate indexes (idx_colors_name, idx_employees_employee_id, idx_permissions_code, idx_suppliers_code, idx_styles_style_code, idx_purchase_orders_po_number, idx_thread_types_code, idx_warehouses_code, idx_lots_lot_number, idx_thread_issues_issue_code, idx_thread_inventory_cone_id) ← (verify: UNIQUE constraint indexes still exist and serve queries, run EXPLAIN on a sample query)

## 4. Database Migration — Enum Standardization

- [ ] 4.1 Write migration section: Rename `permission_action` values to UPPERCASE using `ALTER TYPE permission_action RENAME VALUE 'view' TO 'VIEW'` (repeat for create, edit, delete, manage)
- [ ] 4.2 Write migration section: Create `po_priority` enum with `LOW, NORMAL, HIGH, URGENT`, convert `purchase_orders.priority` column from VARCHAR to `po_priority` with `USING UPPER(priority)::po_priority`, set default to `'NORMAL'`
- [ ] 4.3 Write migration section: Create `notification_type` enum with all 7 values, drop CHECK constraint `chk_notification_type`, convert `notifications.type` from VARCHAR to `notification_type` ← (verify: all 3 enum conversions succeed, check with `\dT+ permission_action` and `\dT+ po_priority` and `\dT+ notification_type`)

## 5. Database Migration — Naming Standardization

- [ ] 5.1 Write migration section: Rename trigger `update_warehouses_updated_at` → `trigger_warehouses_updated_at` (DROP + CREATE)
- [ ] 5.2 Write migration section: Rename indexes on `thread_issue_return_logs` (idx_return_logs_issue_id → idx_thread_issue_return_logs_issue_id, idx_return_logs_line_id → idx_thread_issue_return_logs_line_id) using `ALTER INDEX ... RENAME TO`
- [ ] 5.3 Write migration section: Rename indexes on `employee_refresh_tokens` (idx_refresh_tokens_employee → idx_employee_refresh_tokens_employee_id, idx_refresh_tokens_expires → idx_employee_refresh_tokens_expires_at)
- [ ] 5.4 Write migration section: Rename `idx_warehouses_active` → `idx_warehouses_is_active`
- [ ] 5.5 Write migration section: Rename unnamed UNIQUE constraints on `color_supplier` and `thread_type_supplier` — DROP old + ADD CONSTRAINT with `uq_` prefix names ← (verify: all renames succeed, no orphaned objects remain)

## 6. Database Migration — Retire Dual-Write & Fix Timestamps

- [ ] 6.1 Write migration section: `ALTER TABLE lots DROP COLUMN IF EXISTS supplier`
- [ ] 6.2 Write migration section: `ALTER TABLE employee_roles DROP COLUMN IF EXISTS assigned_at`
- [ ] 6.3 Write migration section: `ALTER TABLE employee_permissions DROP COLUMN IF EXISTS assigned_at`
- [ ] 6.4 Write migration section: Fix nullable timestamps — `ALTER TABLE thread_order_items ALTER COLUMN updated_at SET NOT NULL`, same for `thread_order_results.created_at` and `thread_order_results.updated_at` (SET DEFAULT NOW() first for existing NULLs)
- [ ] 6.5 Write migration section: Drop `v_issue_reconciliation_v2` and recreate as `v_issue_reconciliation` with exact same definition ← (verify: migration runs end-to-end without errors via `supabase migration up`)

## 7. Backend Code Sync — Types & Validation

- [ ] 7.1 Update `server/types/auth.ts`: Change `action: 'view' | 'create' | 'edit' | 'delete' | 'manage'` to UPPERCASE values
- [ ] 7.2 Update `server/types/auth.ts`: Remove `assigned_at` from EmployeeRole and EmployeePermission types
- [ ] 7.3 Update `server/validation/auth.ts`: Change Zod enum to `z.enum(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'])`
- [ ] 7.4 Update `server/types/notification.ts`: Add `NotificationType` type with UPPERCASE values if not already present
- [ ] 7.5 Update `server/routes/lots.ts`: Remove all reads/writes to `lots.supplier` VARCHAR, keep only `supplier_id` FK logic
- [ ] 7.6 Update `server/routes/reconciliation.ts`: Replace all 3 occurrences of `v_issue_reconciliation_v2` with `v_issue_reconciliation`
- [ ] 7.7 Update `server/routes/purchaseOrders.ts`: Update priority default/validation to use UPPERCASE `NORMAL` ← (verify: `npx tsc --noEmit` passes with zero errors in server/)

## 8. Frontend Code Sync — Types & Components

- [ ] 8.1 Update `src/types/auth/index.ts`: Change `PermissionAction` type to UPPERCASE values
- [ ] 8.2 Update `src/types/notification.ts`: Update notification type values if hardcoded
- [ ] 8.3 Update `src/types/thread/purchaseOrder.ts`: Update priority type to UPPERCASE values
- [ ] 8.4 Update `src/composables/thread/useReconciliation.ts`: Update any priority references to UPPERCASE
- [ ] 8.5 Update `src/components/ui/NotificationBell.vue`: Update notification type references if hardcoded
- [ ] 8.6 Update `server/utils/notificationService.ts`: Verify notification type values are already UPPERCASE ← (verify: `npx vue-tsc --noEmit` passes with zero frontend type errors)

## 9. Verification & Testing

- [ ] 9.1 Run full migration on local Supabase: `supabase migration up` (NOT db reset)
- [ ] 9.2 Verify orphaned functions gone: `SELECT proname FROM pg_proc WHERE proname IN ('fn_calculate_quota', 'fn_check_quota')`
- [ ] 9.3 Verify duplicate indexes gone: Check that 11 indexes no longer exist while UNIQUE constraint indexes remain
- [ ] 9.4 Verify enum values: `SELECT unnest(enum_range(NULL::permission_action))` returns UPPERCASE
- [ ] 9.5 Verify naming: Check trigger names, index names, constraint names match conventions
- [ ] 9.6 Run backend TypeScript compilation: `npx tsc --noEmit`
- [ ] 9.7 Run frontend TypeScript compilation: `npx vue-tsc --noEmit`
- [ ] 9.8 Grep for stale references: Search for lowercase permission values, old view name, assigned_at in code ← (verify: ALL verifications pass — system is clean, consistent, and compiles)
