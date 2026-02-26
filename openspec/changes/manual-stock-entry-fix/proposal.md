## Why

The manual stock entry dialog in the inventory page (`src/pages/thread/inventory.vue`) uses the `thread_type_supplier` junction table to populate tex/color dropdowns when a supplier is selected. This junction table is severely incomplete — no data migration was ever created to populate it from existing `thread_types.supplier_id` data. As a result, users see fewer tex options than actually exist, blocking legitimate stock entry.

Meanwhile, 12 out of 14 modules in the system already use `thread_types.supplier_id` (the direct 1:1 FK) to filter thread types by supplier. The manual entry dialog is the only inventory-related module that goes through the junction table, creating an inconsistency.

## What Changes

- Replace the `thread_type_supplier` junction table query in the manual stock entry dialog with a direct `thread_types` query filtered by `supplier_id`
- Change the data source from `threadTypeSupplierService.getAll({ supplier_id })` to `threadService.getAll({ supplier_id })`, aligning with how 12 other modules already work
- Update computed properties (`manualTexOptions`, `manualColorOptions`) to work with `ThreadType[]` instead of `ThreadTypeSupplierWithRelations[]`
- Remove the unused `threadTypeSupplierService` import from `inventory.vue` (if no other usage remains)

## Capabilities

### New Capabilities

- `manual-entry-supplier-filter`: Replace junction-table-based tex/color filtering with direct thread_types.supplier_id filtering in the manual stock entry dialog

### Modified Capabilities

## Impact

- **Frontend**: `src/pages/thread/inventory.vue` — manual entry logic (~20 lines changed)
- **Backend**: No changes needed — `GET /api/threads?supplier_id=X` already exists and returns `color_data` via join
- **Data**: No migration needed — `thread_types.supplier_id` is already `NOT NULL` and fully populated
- **Other modules**: No impact — this change only affects the manual entry dialog
- **`thread_type_supplier` table**: Remains for its procurement purpose (ThreadTypeSuppliersDialog — supplier_item_code, unit_price management) but no longer gates inventory entry
