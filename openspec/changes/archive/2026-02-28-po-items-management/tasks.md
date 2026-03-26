## 1. Database Migration

- [x] 1.1 Add `deleted_at` column to `po_items` table
- [x] 1.2 Create unique partial index `idx_po_items_po_style_active` on `(po_id, style_id) WHERE deleted_at IS NULL` to prevent duplicate styles in same PO
- [x] 1.3 Create enum `po_item_change_type` with values: 'CREATE', 'UPDATE', 'DELETE' (MUST be created BEFORE table that uses it)
- [x] 1.4 Create `po_item_history` table with: `id`, `po_item_id`, `change_type` (uses enum from 1.3), `previous_quantity`, `new_quantity`, `changed_by`, `created_at`, `notes`
- [x] 1.5 Attach `fn_thread_audit_trigger_func` trigger to `po_items` table
- [x] 1.6 Add indexes for `po_item_history.po_item_id`
- [x] 1.7 Create migration for new permissions: `thread.purchase-orders.view`, `thread.purchase-orders.create`, `thread.purchase-orders.edit`, `thread.purchase-orders.delete`, `thread.purchase-orders.import` ← (verify: migration runs without errors in correct order: enum → table, unique constraint prevents duplicate style_id per PO)

## 2. Backend - PO Items CRUD

- [x] 2.1 Add TypeScript types for `POItem`, `POItemHistory`, `CreatePOItemDTO`, `UpdatePOItemDTO`
- [x] 2.2 Add Zod validation schemas for PO item operations
- [x] 2.3 REMOVE existing router-level `purchaseOrders.use('*', requirePermission('thread.lots.view'))` middleware
- [x] 2.4 Apply per-endpoint permissions: `requirePermission('thread.purchase-orders.view')` for GET, `requirePermission('thread.purchase-orders.create')` for POST, `requirePermission('thread.purchase-orders.edit')` for PUT, `requirePermission('thread.purchase-orders.delete')` for DELETE (applies to BOTH existing PO header endpoints AND new item endpoints)
- [x] 2.5 Implement POST `/api/purchase-orders/:id/items` - add item with history logging, handle 409 for duplicate style_id
- [x] 2.6 Implement PUT `/api/purchase-orders/:id/items/:itemId` - update quantity with validation (>= ordered) and history
- [x] 2.7 Implement DELETE `/api/purchase-orders/:id/items/:itemId` - soft delete with order check
- [x] 2.8 Implement GET `/api/purchase-orders/:id/items/:itemId/history` - get history with employee names, ordered by `created_at DESC`
- [x] 2.9 Update existing GET PO routes to filter `deleted_at IS NULL` on items
- [x] 2.10 Update weekly-order `po_items` lookups to filter `deleted_at IS NULL` in all validation queries (ensure over-ordering check still works with soft-deleted items) ← (verify: all CRUD endpoints match spec scenarios, old thread.lots.view guard removed, new PO permissions enforced correctly, history logging works, weekly-order validation ignores soft-deleted items)

## 3. Backend - Import API

- [x] 3.1 Add TypeScript types for import: `POImportRow`, `POImportPreview`, `POImportResult`
- [x] 3.2 Add Zod validation schemas for import request/response
- [x] 3.3 Implement POST `/api/import/po-items/parse` with `requirePermission('thread.purchase-orders.import')` - parse Excel with mapping config, validate file format (xlsx/xls only), detect missing required columns
- [x] 3.4 Define parse response contract matching spec exactly: `{ valid_rows: POImportRow[] (each with status: 'new'|'update'|'skip'), error_rows: { row_number, data, error_message }[], summary: { total, valid, errors, new_pos, update_items, skip_items } }`
- [x] 3.5 Implement style_code validation during parse (lookup in styles table)
- [x] 3.6 Implement POST `/api/import/po-items/execute` with `requirePermission('thread.purchase-orders.import')` - ADDITIVE merge strategy
- [x] 3.7 Implement GET `/api/import/po-items/template` with `requirePermission('thread.purchase-orders.import')` - generate Excel template with correct columns and sample row
- [x] 3.8 Add import mapping setting key `import_po_items_mapping` with default values
- [x] 3.9 Add `import_po_items_mapping` to `rootOnlySettingsKeys` array in `server/routes/settings.ts` ← (verify: all import endpoints require permission, parse returns correct preview matching spec contract, handles invalid files gracefully, execute creates/updates correctly with ADDITIVE strategy, template download works)

## 4. Frontend - Types and Services

- [x] 4.1 Add frontend types in `src/types/thread/purchaseOrder.ts` for items, history, import
- [x] 4.2 Extend `purchaseOrderService.ts` with item CRUD methods
- [x] 4.3 Extend `importService.ts` with PO import methods (parse, execute, downloadTemplate)

## 5. Frontend - PO List Page

- [x] 5.1 Create `src/pages/thread/purchase-orders/index.vue` with table layout
- [x] 5.2 Implement PO list fetch with pagination and sorting
- [x] 5.3 Add status filter and search input
- [x] 5.4 Create `POFormDialog.vue` component for create/edit PO header
- [x] 5.5 Implement create PO flow with dialog
- [x] 5.6 Implement row click navigation to detail page ← (verify: list page displays POs correctly, create dialog works)

## 6. Frontend - PO Detail Page

- [x] 6.1 Create `src/pages/thread/purchase-orders/[id].vue` with header info section
- [x] 6.2 Implement items table with columns: Mã hàng, Tên, SL SP, Đã đặt, Actions
- [x] 6.3 Calculate "Đã đặt" from weekly order data
- [x] 6.4 Create `AddItemDialog.vue` for adding items with style autocomplete
- [x] 6.5 Implement inline quantity editing with PopupEdit
- [x] 6.6 Implement delete item with confirmation and order check
- [x] 6.7 Create `POItemHistoryDialog.vue` for viewing history
- [x] 6.8 Implement history dialog open from action button ← (verify: detail page shows all item info, add/edit/delete work correctly, history displays properly)

## 7. Frontend - Import Page

- [x] 7.1 Create `src/pages/thread/purchase-orders/import.vue` with stepper layout
- [x] 7.2 Implement Step 1: File upload with FilePicker component
- [x] 7.3 Implement Step 2: Preview table with validation status indicators
- [x] 7.4 Implement Step 3: Execute import and show results
- [x] 7.5 Add error row highlighting and summary display
- [x] 7.6 Implement template download button ← (verify: full import flow works end-to-end, preview shows correct validation, execute creates/updates data)

## 8. Frontend - Settings Section

- [x] 8.1 Add PO import mapping section to `src/pages/settings.vue`
- [x] 8.2 Implement mapping form fields (sheet, header row, data row, columns)
- [x] 8.3 Implement save mapping to settings API
- [x] 8.4 Implement template download from settings ← (verify: settings section visible for ROOT, mapping saves and loads correctly)

## 9. Navigation and Integration

- [x] 9.1 Update `useSidebar.ts` to add "Đơn Hàng (PO)" menu item under "Kế Hoạch"
- [x] 9.2 Add route permission checks: `definePage` with appropriate permissions for each page (`thread.purchase-orders.view`, `thread.purchase-orders.import`)
- [x] 9.3 Update role-permission mapping: assign new PO permissions to appropriate roles (ADMIN, MANAGER, etc.)
- [x] 9.4 Run `npm run type-check` and fix any TypeScript errors
- [x] 9.5 Run `npm run lint` and fix any linting issues
- [x] 9.6 Run `npm run build` and verify successful build ← (verify: menu shows in correct position, navigation works, permissions enforced, build passes without errors)
