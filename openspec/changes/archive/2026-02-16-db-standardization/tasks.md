## 1. FK Normalization (thread_types)

- [x] 1.1 Create migration: backfill `thread_types.color_id` from `colors.name` using fuzzy match (LOWER/TRIM), log unmatched rows
- [x] 1.2 Create migration: backfill `thread_types.supplier_id` from `suppliers.name` using fuzzy match (LOWER/TRIM), log unmatched rows
- [x] 1.3 Verify backfill results — check for any remaining NULL `color_id`/`supplier_id` where legacy text was non-NULL
- [x] 1.4 Create migration: drop legacy columns `color`, `color_code`, `supplier` from `thread_types` ← (verify: migration runs cleanly, no FK violations, all non-NULL legacy values mapped)
- [x] 1.5 Update `server/routes/threads.ts`: remove `lookupColorName`/`lookupSupplierName` functions and dual-write logic, use FK only for insert/update
- [x] 1.6 Update `server/types/` and Zod validation: remove legacy `color`/`color_code`/`supplier` fields from thread type types and schemas
- [x] 1.7 Update `src/types/thread/thread-type.ts`: remove legacy fields, keep only FK references
- [x] 1.8 Update `src/components/thread/ThreadTypeFormDialog.vue`: ensure form only uses `color_id`/`supplier_id` (already does, just verify no legacy field references remain) ← (verify: FE type-check passes, form creates/updates thread types with FK only)

## 2. Function Naming (fn_ prefix)

- [x] 2.1 Create migration: rename 12 regular functions using `ALTER FUNCTION ... RENAME TO fn_...`
- [x] 2.2 Create migration: update function bodies that call renamed functions (e.g., `can_manage_employee` calls `is_admin` → update to call `fn_is_admin`)
- [x] 2.3 Create migration: rename 3 trigger functions (`thread_audit_trigger_func`, `update_lots_updated_at`, `update_updated_at_column`) and update all trigger definitions to reference new names
- [x] 2.4 Update `server/routes/allocations.ts`: change `.rpc('allocate_thread')` → `.rpc('fn_allocate_thread')`, `.rpc('issue_cone')` → `.rpc('fn_issue_cone')`, `.rpc('split_allocation')` → `.rpc('fn_split_allocation')`
- [x] 2.5 Update `server/routes/issuesV2.ts`: change `.rpc('fn_generate_issue_code')`, `.rpc('fn_calculate_quota')`, `.rpc('fn_check_quota')` (already have fn_ prefix — verify no changes needed)
- [x] 2.6 Update `server/routes/recovery.ts`: change `.rpc('recover_cone')` → `.rpc('fn_recover_cone')` (N/A — no RPC calls exist)
- [x] 2.7 Update `server/routes/employees.ts` and auth-related routes: update RPC calls (N/A — no RPC calls, uses direct queries) ← (verify: all .rpc() calls in server/ match renamed functions, no 500 errors)

## 3. Trigger Naming (trigger_ pattern)

- [x] 3.1 Create migration: drop and recreate 8 triggers from `update_*` to `trigger_*` pattern, keeping same function and timing ← (verify: all updated_at triggers fire correctly after rename)

## 4. Status Standardization (UPPERCASE enums)

- [x] 4.1 Create migration: create `po_status` enum, migrate `purchase_orders.status` data to UPPERCASE, alter column type
- [x] 4.2 Create migration: create `order_week_status` enum, migrate `thread_order_weeks.status` data to UPPERCASE, alter column type
- [x] 4.3 Create migration: create `delivery_status` enum, migrate `thread_order_deliveries.status` data to UPPERCASE, alter column type
- [x] 4.4 Create migration: create `inventory_receipt_status` enum, migrate `thread_order_deliveries.inventory_status` data to UPPERCASE, alter column type
- [x] 4.5 Update `server/routes/purchaseOrders.ts`: change all status string references to UPPERCASE
- [x] 4.6 Update `server/routes/weeklyOrder.ts`: change all status string references to UPPERCASE
- [x] 4.7 Update `server/routes/stock.ts` and delivery-related routes: change status references to UPPERCASE
- [x] 4.8 Update frontend types and components: handle UPPERCASE status values for PO, weekly order, deliveries ← (verify: status filters, badges, and displays all show correct values with UPPERCASE enums)

## 5. v1 Issue Deprecation

- [x] 5.1 Create migration: migrate `thread_issue_requests` data → `thread_issues` + `thread_issue_lines` (map status: PENDING→DRAFT, COMPLETED→CONFIRMED)
- [x] 5.2 Create migration: verify row counts match, then drop v1 tables (`thread_issue_requests`, `thread_issue_items`, `thread_issue_returns`)
- [x] 5.3 Create migration: drop `v_issue_reconciliation` view (v1), drop trigger functions `fn_update_issue_request_issued_meters` and `fn_update_issue_request_status`
- [x] 5.4 Delete `server/routes/issues.ts` (v1 routes, ~1000 LOC) and remove its registration from `server/index.ts`
- [x] 5.5 Delete `server/validation/issues.ts` (v1 validation)
- [x] 5.6 Remove v1-specific types from `server/types/` if any remain
- [x] 5.7 Update `server/routes/reconciliation.ts`: switch from `v_issue_reconciliation` to `v_issue_reconciliation_v2`, update over-quota query ← (verify: reconciliation API returns correct data using v2 view, no references to v1 tables remain in codebase)

## 6. Timestamp Compliance

- [x] 6.1 Create migration: add `created_at` to tables missing it (batch_transactions, employee_permissions, employee_roles, system_settings, thread_order_results)
- [x] 6.2 Create migration: add `updated_at` to 13 tables missing it + create `trigger_<table>_updated_at` for each
- [x] 6.3 Create migration: add `deleted_at` soft delete column to master data tables (colors, suppliers, styles, warehouses, thread_types, purchase_orders, employees) ← (verify: all new columns exist, triggers fire on UPDATE, deleted_at defaults to NULL)

## 7. Schema Cleanup

- [x] 7.1 Create migration: drop `employees.refresh_token` and `employees.refresh_token_expires_at` columns
- [x] 7.2 Update backend: remove any references to dropped employee token columns
- [x] 7.3 Create migration: add `COMMENT ON COLUMN` for cone_id columns in thread_movements, thread_recovery, thread_allocation_cones explaining FK target
- [x] 7.4 Add `NOTIFY pgrst, 'reload schema'` to all migrations that rename/create objects ← (verify: PostgREST serves correct schema after all migrations)

## 8. Backend Soft Delete Integration

- [x] 8.1 Update SELECT queries on master data tables to add `.is('deleted_at', null)` filter
- [x] 8.2 Update DELETE endpoints on master data tables to SET `deleted_at = now()` instead of hard delete ← (verify: soft delete works end-to-end, deleted records hidden from list queries but still in DB)

## 9. Final Verification

- [x] 9.1 Run `npm run type-check` — all TypeScript errors resolved
- [x] 9.2 Run `npm run lint` — no lint errors
- [x] 9.3 Run `npm run build` — build succeeds ← (verify: full build passes, no runtime errors on key pages: thread types list, allocations, issues v2, reconciliation, weekly orders)
