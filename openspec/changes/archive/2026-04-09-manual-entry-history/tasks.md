## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_add_created_by_employee_id_to_lots.sql` that adds nullable column `created_by_employee_id INTEGER REFERENCES employees(id)` to the `lots` table
- [x] 1.2 Run `supabase migration up` to apply the migration locally <- (verify: column exists via `\d lots` in psql, FK constraint present, existing rows have NULL)

## 2. Backend -- Modify POST /api/stock to persist employee ID

- [x] 2.1 In `server/routes/stock.ts`, update the `POST /` handler: extract `employee_id` from `c.get('claims')` and add `created_by_employee_id: claims.employee_id` to the lots insert object (around line 323-336)
- [x] 2.2 Verify the claims type includes `employee_id` by checking `server/middleware/auth.ts` JWT claims structure <- (verify: POST /api/stock creates lot with created_by_employee_id populated, existing fields unchanged)

## 3. Backend -- New GET /api/stock/manual-history endpoint

- [x] 3.1 Add Zod schema `ManualHistoryQuerySchema` in `server/validation/stock.ts` for query params: `page` (int, min 1, default 1), `pageSize` (int, min 1, max 100, default 25)
- [x] 3.2 Add `GET /manual-history` route in `server/routes/stock.ts` BEFORE any `/:id` routes. Guard with `requirePermission('thread.batch.receive')`. Parse and validate query params with Zod schema.
- [x] 3.3 Implement the query: select from `lots` WHERE `lot_number LIKE 'MC-LOT-%'`, join `thread_types` (code, name + colors via color_id), `warehouses` (name), `suppliers` (name), `employees` (full_name via created_by_employee_id). Order by `created_at DESC`. Use `.range(offset, offset+pageSize-1)` with `{ count: 'exact' }`.
- [x] 3.4 For cone count breakdown: after fetching lots, batch-query `thread_inventory` grouped by `lot_id` and `is_partial` to get full/partial counts per lot. Merge into response. Avoid N+1 queries.
- [x] 3.5 Return response in format `{ data: rows, count, page, pageSize, error: null }` <- (verify: endpoint returns correct paginated data with all joined fields, cone counts match, permission guard works)

## 4. Frontend -- Service method

- [x] 4.1 Add `ManualEntryHistoryRow` type in `src/types/thread/stock.ts` with fields: `id`, `lot_number`, `created_at`, `total_cones`, `full_cones`, `partial_cones`, `thread_type` (nested: code, name, color), `warehouse` (nested: name), `supplier` (nested: name), `created_by` (nested: full_name, nullable)
- [x] 4.2 Add `getManualEntryHistory(params: { page: number, pageSize: number })` method to `src/services/stockService.ts` that calls `GET /api/stock/manual-history` via `fetchApi()` and returns `{ data: ManualEntryHistoryRow[], count: number }` <- (verify: method compiles, return type matches API response)

## 5. Frontend -- ManualEntryHistoryDialog component

- [x] 5.1 Create `src/components/thread/ManualEntryHistoryDialog.vue` with props: `modelValue` (boolean, v-model for show/hide)
- [x] 5.2 Implement dialog layout: use `q-dialog` with `q-card` (max-width 1100px), title "Lich Su Nhap Thu Cong", close button in header
- [x] 5.3 Add `q-table` with server-side pagination: columns for Ngay nhap, Loai chi, Kho, Cuon nguyen, Cuon le, Tong cuon, Ma lo, NCC, Nguoi nhap. Default sort by created_at DESC, page size options [10, 25, 50], default 25.
- [x] 5.4 Implement `@request` handler that calls `stockService.getManualEntryHistory()` and updates rows + pagination
- [x] 5.5 Format created_at as `DD/MM/YYYY HH:mm`. Display "-" for null `created_by`. Show empty state message "Chua co du lieu nhap thu cong" when no data. <- (verify: dialog opens, table paginates correctly, all columns render, empty state shows when no MC-LOT entries exist)

## 6. Frontend -- Inventory page integration

- [x] 6.1 In `src/pages/thread/inventory.vue`, add `showManualEntryHistoryDialog` ref (boolean, default false)
- [x] 6.2 Add "Lich su nhap" button with icon `history` and color `blue-grey`, `outline` style, next to the existing "Nhap Thu Cong" button (around line 114-121). Gate with `v-if="canReceive"`. On click set `showManualEntryHistoryDialog = true`.
- [x] 6.3 Import `ManualEntryHistoryDialog` and mount it in the template with `v-model="showManualEntryHistoryDialog"` <- (verify: button appears for authorized users, opens dialog, dialog closes cleanly, inventory page still works correctly)
