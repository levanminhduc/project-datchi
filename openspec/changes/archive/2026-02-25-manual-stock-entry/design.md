## Context

The inventory page (`src/pages/thread/inventory.vue`) currently has two stock entry methods:
1. **"Nhập Kho"** — creates individual `thread_inventory` cone records with barcode IDs
2. **"Quét tra cứu"** — QR scanner for lookup

There is a separate `thread_stock` table for quantity-based tracking (qty_full_cones + qty_partial_cones), grouped by thread_type + warehouse + lot_number. This table already has a fully functional API (`POST /api/stock`) with upsert logic.

The cascading data model:
- `suppliers` → `thread_type_supplier` (junction) → `thread_types` (each record = 1 tex + 1 color)
- `thread_types` has `tex_number` and `color_id` (FK to `colors`)
- Multiple `thread_types` can share the same `tex_number` but have different `color_id`

## Goals / Non-Goals

**Goals:**
- Add "Nhập Thủ Công" button to inventory page toolbar
- Implement cascading selection: Supplier → Tex → Color → Warehouse + Quantities
- Submit to `thread_stock` via existing `POST /api/stock`
- Reuse existing APIs without creating new backend endpoints

**Non-Goals:**
- No new database tables or migrations
- No new backend API routes
- No changes to existing "Nhập Kho" (cone-level) flow
- No offline support for this feature
- No batch import from Excel

## Decisions

### D1: Use `thread_type_supplier` junction for cascading filter (not `thread_types.supplier_id`)

**Choice**: Query `GET /api/thread-type-suppliers?supplier_id=X` to get thread types for a supplier.

**Rationale**: The junction table `thread_type_supplier` is the canonical many-to-many relationship. The `thread_types.supplier_id` FK is a legacy direct reference that may not include all supplier-thread associations. Using the junction table ensures completeness.

**Alternative considered**: Filter `GET /api/threads?supplier_id=X` — rejected because it queries the direct FK, not the junction table.

### D2: Group thread types by tex_number on frontend

**Choice**: After fetching thread types for a supplier, group them by `tex_number` in the frontend to create the Tex dropdown. When a tex is selected, show only thread types matching that tex (each has a different color).

**Rationale**: No need for a backend endpoint that groups by tex. The dataset per supplier is small enough (typically <50 thread types) for frontend grouping.

### D3: Use existing `stockService.addStock()` for submission

**Choice**: Call existing `POST /api/stock` which already handles upsert (add to existing record if same thread_type_id + warehouse_id + lot_number).

**Rationale**: The API and service are fully implemented and tested. No need to duplicate.

### D4: Dialog component inline in inventory.vue

**Choice**: Add the dialog directly in `inventory.vue` rather than creating a separate component file.

**Rationale**: The page already has a similar pattern with the "Stock Receipt Dialog" (`FormDialog` + form fields). Keeping it in the same file follows the existing pattern and avoids unnecessary file creation.

**If the dialog grows too complex**: Extract to `src/components/thread/ManualStockEntryDialog.vue` later.

### D5: Use `threadTypeSupplierService` for fetching thread types by supplier

**Choice**: Use existing frontend service for `thread-type-suppliers` API, or add a method if needed.

**Rationale**: The API `GET /api/thread-type-suppliers?supplier_id=X` returns thread type data with nested `thread_type` object including `tex_number` and color info via join.

### D6: Use project UI conventions (AppSelect/AppInput/AppButton, FormDialog, q-btn)

**Choice**: All form fields use `AppSelect`, `AppInput`. Dialog uses `FormDialog`. Toolbar button uses `q-btn` (consistent with existing inventory toolbar). Icons use Material Icons naming (e.g., `edit_note`), not `mdi-*`.

**Rationale**: Project convention — `v-autocomplete`/`v-text-field` are Vuetify components not available in this Quasar-based project. AppSelect/AppInput are project wrappers around Quasar components.

### D7: Only STORAGE-type warehouses for stock entry

**Choice**: Use `warehouseService.getStorageOnly()` instead of `getAll()` for the warehouse dropdown.

**Rationale**: Warehouses have two types: LOCATION (parent nodes) and STORAGE (actual storage). Stock should only be posted to STORAGE warehouses.

### D8: Permission gating

**Choice**: Gate the "Nhập Thủ Công" button visibility by `thread.batch.receive` permission using `useAuth().hasPermission()`. Cascade API calls (`GET /api/suppliers`, `GET /api/thread-type-suppliers`) require `thread.suppliers.view` — users with `thread.batch.receive` should also have this permission in the role bundle.

**Rationale**: Prevents unauthorized users from seeing the button. If cascade APIs fail with 403, show Vietnamese error message.

## Risks / Trade-offs

- **[Data completeness]** Thread types without `color_id` set will show "No color" in the color dropdown → Mitigation: Show them with a "Không xác định" label
- **[Junction table data]** If a supplier has no `thread_type_supplier` records, the Tex dropdown will be empty → Mitigation: Show hint "NCC này chưa có loại chỉ nào" and disable Tex/Color selects
- **[Permission coupling]** Cascade APIs require `thread.suppliers.view` while submit requires `thread.batch.receive` → Mitigation: Gate button by `thread.batch.receive`, handle 403 from cascade APIs with Vietnamese error
- **[Response format mismatch]** `POST /api/stock` returns `{ success, data, error }` format (not `{ data, error }`) → Mitigation: Handle both formats in the service call
- **[Type contract gap]** Backend and frontend `ThreadTypeSummary` types lack `color_id`/`color_data`/`tex_number` → Mitigation: Explicit task to update both type files before frontend work
