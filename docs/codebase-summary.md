# Codebase Summary

**Project:** Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)
**Stack:** Vue 3.5.21 + Quasar 2.17.10 + TypeScript 5.9 + Vite 7.1.5 | Hono 4.11.5 | Supabase (PostgreSQL) + Zod 4.3.6
**Last updated:** 2026-03-21

---

## Architecture

```
Supabase (PostgreSQL + Auth)
    ↓ supabaseAdmin (service_role key — bypasses RLS)
Hono API (server/routes/ — 28 route files, ~19,800 LOC)
    ↓ authMiddleware (global on /api/* via app.use('*'), except /api/auth/login)
Vite proxy (/api → localhost:3000, dev only)
    ↓
Service Layer (src/services/ — 32 services) → fetchApi() wrapper
    ↓
Composables (src/composables/ — 48 composables) → reactive state + logic
    ↓
Pages (src/pages/ — 50 pages, file-based routing via unplugin-vue-router)
    ↓
UI Components (src/components/ — 141+ total: 67 ui + 62 thread + 7 qr + 3 hardware + 2 offline)
    ↑ (exception: realtime subscriptions use Supabase JS client directly)
Supabase Realtime — useRealtime composable
```

---

## Server Layer (`server/`)

### Route Files (28 total)

| File | LOC | Key Operations |
|------|-----|----------------|
| `issuesV2.ts` | 2,697 | CRUD, create-with-lines, confirm, return, return-logs, order-options, form-data |
| `weeklyOrder.ts` | 2,652 | CRUD, status workflow, results, loans, loan-batch, reservations, reserve-from-stock, deliveries, history, assignment-summary |
| `allocations.ts` | 1,634 | CRUD, approve/reject/execute/issue/cancel/split |
| `import.ts` | 1,600 | PO import, thread/color import, SSE streaming progress |
| `recovery.ts` | 928 | initiate, weigh, confirm, writeoff, reject |
| `auth.ts` | 923 | login, me, permissions, change-password, reset-password, roles CRUD, employee roles/permissions |
| `inventory.ts` | 896 | barcode/warehouse/cone-summary queries, receive, stocktake |
| `threadCalculation.ts` | 753 | Thread calculation engine |
| `stock.ts` | 748 | receive, deduct, return, summary |
| `batch.ts` | 683 | Batch receive/transfer/issue/return + transactions + batch-borrow |
| `dashboard.ts` | 603 | summary, alerts, conflicts, pending, activity |
| `colors.ts` | 555 | Thread colors CRUD + supplier links |
| `purchaseOrders.ts` | 544 | PO CRUD + items + history |
| `employees.ts` | 535 | Employee CRUD + unique-positions/count/departments |
| `lots.ts` | 335 | Lot CRUD + cones/transactions |
| `positions.ts` | 288 | Position CRUD |
| `notifications.ts` | 137 | Notification CRUD + unread-count + read-all |
| `warehouses.ts` | — | Warehouse management |
| `threads.ts` | — | Thread types CRUD |
| `suppliers.ts` | — | Supplier management |
| `styles.ts` | — | Style management |
| `styleThreadSpecs.ts` | — | Style-thread specifications |
| `styleColors.ts` | — | Style colors (new 2026-03-14) |
| `subArts.ts` | — | Sub-articles per style (new 2026-03-12) |
| `reconciliation.ts` | — | Reconciliation |
| `reports.ts` | — | Allocation reports |
| `settings.ts` | — | System settings CRUD |
| `thread-type-supplier.ts` | — | Thread type-supplier links |

### Middleware & Utils

| File | Purpose |
|------|---------|
| `server/middleware/auth.ts` | JWT verify (HS256/RS256 via jose 6.1.3), `requirePermission()`, `requireAdmin()` |
| `server/db/supabase.ts` | `supabaseAdmin` — service_role client, bypasses RLS |
| `server/utils/errorHelper.ts` | Error response formatting |
| `server/utils/notificationService.ts` | Push notification logic |
| `server/utils/sanitize.ts` | Input sanitization |
| `server/utils/settings-helper.ts` | System settings access helper |

**Auth strategy:** Global `authMiddleware` via `app.use('*')` trên tất cả `/api/*`; chỉ `/api/auth/login` là public.

### Zod Validation Schemas (8)

`server/validation/`: `auth`, `issuesV2`, `purchaseOrder`, `settings`, `stock`, `subArts`, `threadCalculation`, `weeklyOrder`

---

## Frontend Layer (`src/`)

### Services (32 total in `src/services/`)

| Service | Purpose |
|---------|---------|
| `api.ts` | `fetchApi()` — auto token attach, 401 refresh (single-flight) |
| `authService.ts` | Login, logout, change-password (dùng `authenticatedFetch`) |
| `auth-error-utils.ts` | Auth error classification helpers |
| `allocationService.ts` | Allocation CRUD + workflow |
| `batchService.ts` | Batch operations + batch-borrow |
| `colorService.ts` | Color CRUD + supplier links |
| `dashboardService.ts` | Dashboard data |
| `deliveryService.ts` | Delivery tracking |
| `employeeService.ts` | Employee management |
| `importService.ts` | PO/thread import (SSE streaming) |
| `inventoryService.ts` | Inventory queries + server-side pagination (`getPaginated`) |
| `issueV2Service.ts` | Issue V2 CRUD + workflow |
| `lotService.ts` | Lot management |
| `notificationService.ts` | Notification fetch |
| `positionService.ts` | Position management |
| `purchaseOrderService.ts` | PO management |
| `reconciliationService.ts` | Reconciliation |
| `recoveryService.ts` | Recovery workflow |
| `reportService.ts` | Report export |
| `settingsService.ts` | System settings |
| `stockService.ts` | Stock operations |
| `styleColorService.ts` | Style colors (new 2026-03-14) |
| `styleService.ts` | Style management |
| `styleThreadSpecService.ts` | Style-thread specifications |
| `subArtService.ts` | Sub-articles (new 2026-03-12) |
| `supplierService.ts` | Supplier management |
| `threadCalculationService.ts` | Thread calculation |
| `threadService.ts` | Thread master data |
| `threadTypeSupplierService.ts` | Thread type-supplier links |
| `warehouseService.ts` | Warehouse management |
| `weeklyOrderService.ts` | Weekly ordering + loans + reservations + deliveries |
| `weeklyOrderService.ts` *(delivery subset)* | Delivery tracking sub-functions |

### Composables (48 total in `src/composables/`)

**Infrastructure (16):**

| Composable | Purpose |
|------------|---------|
| `useSnackbar.ts` | Toast notifications — `success()`, `error()`, `warning()` |
| `useLoading.ts` | Global loading state |
| `useConfirm.ts` | Confirmation prompts |
| `useDialog.ts` | Dialog helpers |
| `useDarkMode.ts` | Dark mode toggle |
| `useSidebar.ts` | Sidebar open/close state |
| `useAuth.ts` | Auth state, login/logout — module-level singleton |
| `usePermission.ts` | Per-component permission checks |
| `usePermissionManagement.ts` | Role and permission management UI logic |
| `useSettings.ts` | System settings state |
| `useNotifications.ts` | Notification polling + read state |
| `useRealtime.ts` | Supabase Realtime subscriptions (direct client — exception) |
| `useOfflineSync.ts` | Offline operation queue sync |
| `useOfflineOperation.ts` | Offline-first operation wrapper |
| `useQrScanner.ts` | QR code scanner integration |
| `use-session-health.ts` | Session validation, proactive token refresh, loading overlay |

**Domain — root (7):**

| Composable | Purpose |
|------------|---------|
| `useEmployees.ts` | Employee list state |
| `usePositions.ts` | Position list state |
| `useWarehouses.ts` | Warehouse list state |
| `useLots.ts` | Lot list state |
| `useThreadRequests.ts` | Thread request state |
| `useBatchOperations.ts` | Batch inventory operations |
| `useReports.ts` | Excel export via ExcelJS (dynamic import) |

**Thread domain (21):**

| Composable | Purpose |
|------------|---------|
| `useThreadTypes.ts` | Thread type master data |
| `useInventory.ts` | Inventory state + server-side pagination + queries |
| `useAllocations.ts` | Allocation workflow |
| `useRecovery.ts` | Recovery workflow |
| `useDashboard.ts` | Dashboard data |
| `useConeSummary.ts` | Cone summary state |
| `useConflicts.ts` | Allocation conflict detection |
| `useColors.ts` | Thread color state |
| `useSuppliers.ts` | Supplier state |
| `useThreadTypeSuppliers.ts` | Thread-supplier link state |
| `usePurchaseOrders.ts` | Purchase order state |
| `useStyles.ts` | Style management state |
| `useStyleThreadSpecs.ts` | Style-thread spec state |
| `useStyleColors.ts` | Style colors state (new 2026-03-14) |
| `useThreadCalculation.ts` | Thread calculation |
| `useWeeklyOrder.ts` | Weekly order state |
| `useWeeklyOrderCalculation.ts` | Order calculation logic |
| `useWeeklyOrderReservations.ts` | Reservation state |
| `useIssueV2.ts` | Issue V2 workflow |
| `useReturnV2.ts` | Return workflow |
| `useReconciliation.ts` | Reconciliation state |

**Hardware (3):**

| Composable | Purpose |
|------------|---------|
| `useScanner.ts` | Barcode/QR scanner |
| `useScale.ts` | Weight scale integration |
| `useAudioFeedback.ts` | Audio feedback cho scan events |

### UI Components (128+ total)

**`ui/` — 67 components in 16 categories:**

| Category | Count | Key Components |
|----------|-------|----------------|
| `buttons/` | 5 | `AppButton`, `IconButton`, `ButtonGroup`, `ButtonToggle`, `ButtonDropdown` |
| `cards/` | 5 | `AppCard`, `AppBadge`, `AppChip`, `InfoCard`, `StatCard` |
| `dialogs/` | 7 | `AppDialog`, `FormDialog`, `ConfirmDialog`, `DeleteDialog`, `AppMenu`, `AppTooltip`, `PopupEdit` |
| `feedback/` | 7 | `AppSpinner`, `AppProgress`, `AppSkeleton`, `EmptyState`, `AppBanner`, `CircularProgress`, `InnerLoading` |
| `inputs/` | 12 | `AppInput`, `AppSelect`, `AppTextarea`, `AppCheckbox`, `AppToggle`, `AppRange`, `AppSlider`, `SearchInput`, `AppWarehouseSelect`, `ColorSelector`, `SupplierSelector` |
| `layout/` | 6 | `AppDrawer`, `AppSeparator`, `AppSpace`, `AppToolbar`, `PageHeader`, `SectionHeader` |
| `lists/` | 2 | `AppList`, `ListItem` |
| `media/` | 4 | `AppCarousel`, `AppImage`, `AppParallax`, `AppVideo` |
| `navigation/` | 7 | `AppTabs`, `AppStepper`, `AppPagination`, `AppBreadcrumbs`, `SidebarItem`, `StepperStep`, `TabPanel` |
| `pickers/` | 5 | `DatePicker` (DD/MM/YYYY), `ColorPicker`, `FilePicker`, `TimePicker`, `AppEditor` |
| `scroll/` | 6 | `ScrollArea`, `InfiniteScroll`, `PullToRefresh`, `VirtualScroll`, `Timeline`, `TimelineEntry` |
| `tables/` | 1 | `DataTable` |
| `(root ui/)` | 1 | `NotificationBell` |

**`thread/` — 51 domain components** (allocation, inventory, issue, recovery, weekly-order, styles, etc.)

**Other components (12):**
- `auth/` (1) — auth guard
- `hardware/` (3) — `BarcodeScanField` + hardware integrations
- `qr/` (7) — `QrScannerStream` + QR label print utilities
- `offline/` (2) — offline status indicators
- `showcase/` (3) — component showcase pages

### Pages (50 total in `src/pages/`)

File-based routing via `unplugin-vue-router`. Dynamic params: `[id]` → `:id`.

| Path | Module |
|------|--------|
| `/` | Dashboard |
| `/login` | Authentication |
| `/forbidden` | 403 page |
| `/settings` | System settings |
| `/employees`, `/phan-quyen` | HR management |
| `/thread/` | Thread module root |
| `/thread/allocations` | Allocation management |
| `/thread/inventory` | Inventory queries |
| `/thread/recovery` | Recovery workflow |
| `/thread/calculation` | Thread calculation |
| `/thread/styles/`, `/thread/styles/[id]` | Style management + tabs |
| `/thread/styles/[id]/sub-arts` | Sub-art management (new 2026-03-12) |
| `/thread/purchase-orders/` | PO list / import / detail |
| `/thread/weekly-order/` | Weekly ordering list / detail / history / deliveries |
| `/thread/issues/v2/` | Issue V2 list / detail / return / reconciliation |
| `/thread/batch/` | Batch receive / issue / transfer / history |
| `/thread/transfer-reserved` | Chuyển kho cho chỉ đã gán theo Tuần đặt hàng |
| `/thread/lots/`, `/thread/lots/[id]` | Lots list + detail |
| `/thread/suppliers/` | Supplier import tools |
| `/thread/mobile/` | Mobile receive / issue / recovery (3 pages) |
| `/reports/` | Reporting module |
| `/ke-hoach`, `/ky-thuat` | Placeholders |

### Types (~40 files in `src/types/`)

**`thread/` — 22 type files:**
`allocation`, `batch`, `color`, `enums`, `import`, `inventory`, `issueV2`, `lot`, `purchaseOrder`, `reconciliation`, `recovery`, `stock`, `style`, `styleColor` (new), `styleThreadSpec`, `subArt` (new), `supplier`, `threadCalculation`, `thread-type`, `thread-type-supplier`, `weeklyOrder`, `delivery`

**`ui/` — 12 type files:**
`base`, `buttons`, `data-display`, `dialogs`, `feedback`, `inputs`, `layout`, `media`, `navigation`, `pickers`, `scroll`, `tables`

**Root — 6 type files:**
`auth`, `employee`, `notification`, `position`, `qr`, `settings`

---

## Database

- **112 migrations** in `supabase/migrations/`
- Schema organized in `supabase/schema/`: enums, auth tables, master data, thread operations, functions, triggers, indexes
- Soft delete: `deleted_at TIMESTAMPTZ NULL`
- Timestamps: `created_at`, `updated_at` on all tables (auto via triggers)
- Views: `v_` prefix | Functions: `fn_` prefix | Enums: ALL UPPERCASE

### Key Enums (9)

`cone_status` (12 values), `allocation_status`, `allocation_priority`, `movement_type`, `recovery_status`, `lot_status`, `thread_material`, `permission_action`, `batch_operation_type`

### Key RPC Functions (~40)

`fn_allocate_thread`, `fn_issue_cone`, `fn_recover_cone`, `fn_split_allocation`, `fn_reserve_for_week`, `fn_borrow_thread`, `fn_batch_borrow_thread`, `fn_reserve_from_stock`, `fn_receive_delivery`, `fn_auto_return_loans`, `fn_loan_dashboard_summary`, `fn_return_cones_with_movements`, `fn_get_partial_cone_ratio`, `fn_get_employee_permissions`, `fn_update_updated_at_column`, `fn_cone_summary_filtered`, `fn_get_tex_options_by_supplier`, `fn_get_supplier_unique_tex`, `fn_count_available_cones`, `fn_warehouse_breakdown`, `fn_supplier_breakdown`, `fn_transfer_reserved_cones`

### Views (4 active)

`v_cone_summary` — pre-aggregated cone inventory per thread_type (full/partial cones, meters, weight) — dùng cho Summary tab
`v_stock_summary` — aggregated inventory per thread_type + warehouse
`v_issue_reconciliation` — issue reconciliation aggregation view
`v_issue_reconciliation_v2` — v2 issue reconciliation view

### Recent Migrations (2026-03-06 → 2026-03-18)

| Migration | Change |
|-----------|--------|
| `20260318220000` | `fn_warehouse_breakdown` + `fn_supplier_breakdown` RPCs |
| `20260318210000` | `fn_count_available_cones` bulk RPC |
| `20260318170000` | `color_id` on `thread_inventory`; update `fn_cone_summary_filtered` |
| `20260318000001` | Reconcile production warehouses (Điện Bàn / Phú Tường) |
| `20260314151300` | `fn_get_supplier_unique_tex` RPC |
| `20260314143000` | `fn_get_tex_options_by_supplier` RPC |
| `20260314100000` | View `v_cone_summary`, RPC `fn_cone_summary_filtered`, performance indexes for inventory pagination |
| `20260314093300` | Seeds initial Coats inventory (4 suppliers × 5 thread types) |
| `20260314010000` | New table `style_colors` |
| `20260313233200` | `thread_color_id` on `style_color_thread_specs`; `thread_type_id` nullable |
| `20260313000003` | `tex_label VARCHAR(100)` on `thread_types` |
| `20260313000002` | `week` on `purchase_orders`; `finished_product_code` on `po_items`; seeds `import_po_items_mapping` |
| `20260313000001` | `sub_art_id` on `thread_order_items`, rebuilds unique index |
| `20260312000001` | New table `sub_arts`; `sub_art_id` FK on `thread_issue_lines` |
| `20260309000001` | Updates fn_reserve_for_week, fn_borrow_thread, fn_reserve_from_stock, fn_return_cones_with_movements — reads `reserve_priority`; partial cone support |
| `20260307000002` | `tex_number` NUMERIC → VARCHAR(20) on `thread_types` |
| `20260307000001` | Seeds `po_items` column mapping into `system_settings` |
| `20260306000001` | Fix nested JSON parse bug in reserve/borrow functions |

### Earlier 2026-03 Migrations

| Migration | Change |
|-----------|--------|
| `20260302000003` | `weekly_order_reserve_inventory` |
| `20260302000004` | `weekly_order_reserve_functions` |
| `20260302000005` | `modify_allocate_thread_reserve` |
| `20260303000001` | `delivery_quantity_tracking` |
| `20260303000002` | `delivery_quantity_tracking_functions` |
| `20260305000001` | `update_warehouses_production` |
| `20260305000002` | `loan_status_auto_return` |
| `20260305000003` | `loan_dashboard_summary` |
| `20260305000004` | `batch_borrow_thread` |

---

## Key Patterns

| Pattern | Implementation |
|---------|---------------|
| API calls | `fetchApi()` trong `src/services/api.ts` — không dùng raw `fetch()` |
| Auth | JWT (HS256/RS256) via jose, claims: `employee_id`, `employee_code`, `is_root`, `roles` |
| CRUD frontend | Service → `fetchApi()` → Hono route → `supabaseAdmin` query |
| Realtime | `useRealtime` composable → Supabase JS client (exception duy nhất) |
| Offline | `useOfflineSync` → `useOfflineOperation` — queue then sync (raw fetch — exception) |
| Excel export | ExcelJS (dynamic import) trong `useReports.ts` |
| SSE streaming | `import.ts` route + `importService.ts` cho bulk import progress |
| QR scanning | `useQrScanner` + `src/components/qr/` |
| Allocation strategy | FEFO (`FOR UPDATE SKIP LOCKED` tại DB level) |
| Unit of measure | Dual UoM: kg + meters |
| Toasts | Vietnamese text via `useSnackbar()` |
| Date format | DD/MM/YYYY via `DatePicker` component |

---

## File Count Summary

| Category | Count |
|----------|-------|
| Composables | 48 (49 với index) |
| UI component categories | 16 dirs |
| UI component files | 67 .vue (+ NotificationBell at root) |
| Thread domain components | 51 |
| Other components (qr, hardware, auth, offline, showcase) | 12 |
| Type files | ~40 .ts |
| Services | 32 .ts |
| Route handlers | 28 .ts |
| Migrations | 112 .sql |
| Pages | 50 .vue |
| Validation schemas | 8 .ts |
| Total project files | ~1,051 |
| Core app LOC | ~101K (src + server + supabase) |
