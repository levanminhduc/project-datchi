## Context

The manual stock entry dialog in `src/pages/thread/inventory.vue` currently queries the `thread_type_supplier` junction table to populate tex/color dropdowns when a user selects a supplier. This junction table was introduced (migration `20240101000026`) as a many-to-many link between `thread_types` and `suppliers`, but was never backfilled with existing data. The result is that users see incomplete tex options during manual stock entry.

The `thread_types` table already has a direct `supplier_id` FK column (made `NOT NULL` in migration `20260215100000_fk_normalization.sql`). This column is the primary data source used by 12 out of 14 modules in the system (calculation, weekly order, styles, inventory overview, deliveries). The manual entry dialog is the only inventory-related flow that diverges by using the junction table.

Current flow:
```
Supplier selected → threadTypeSupplierService.getAll({ supplier_id })
                  → query thread_type_supplier table (INCOMPLETE DATA)
                  → extract tex_number from link.thread_type
```

Target flow:
```
Supplier selected → threadService.getAll({ supplier_id })
                  → query thread_types WHERE supplier_id = X (COMPLETE DATA)
                  → extract tex_number directly from ThreadType
```

## Goals / Non-Goals

**Goals:**
- Align manual stock entry with the same data source (thread_types.supplier_id) used by all other modules
- Ensure all thread types for a selected supplier appear in the tex/color dropdowns
- Minimal change footprint — frontend-only modification

**Non-Goals:**
- Deprecating or removing the `thread_type_supplier` junction table (still used by ThreadTypeSuppliersDialog for procurement data)
- Changing the backend API (GET /api/threads already supports supplier_id filter)
- Data migration or backfill of the junction table
- Modifying any other module's data flow

## Decisions

### Decision 1: Use existing GET /api/threads endpoint with supplier_id filter

**Choice**: Reuse `threadService.getAll({ supplier_id })` which calls `GET /api/threads?supplier_id=X`

**Rationale**: This endpoint already exists (threads.ts line 53-54), returns `color_data` via join (line 33), filters by `is_active` and `deleted_at IS NULL` (line 37), and is the same endpoint used by the thread management page. No backend changes needed.

**Alternatives considered**:
- Create a new lightweight endpoint: Unnecessary — existing endpoint returns all needed fields
- Add supplier_id filter to cone summary endpoint: Over-engineered — the existing threads endpoint is purpose-built for this

### Decision 2: Change data type from ThreadTypeSupplierWithRelations[] to ThreadType[]

**Choice**: `manualEntryThreadTypes` ref changes from `ThreadTypeSupplierWithRelations[]` to `ThreadType[]`

**Rationale**: The computed properties (`manualTexOptions`, `manualColorOptions`) only need `tex_number`, `color_data`, and `id` from the thread type — all of which are direct fields on `ThreadType`. No junction-specific data (supplier_item_code, unit_price) is needed for manual stock entry.

### Decision 3: Keep threadTypeSupplierService import only if needed elsewhere

**Choice**: Remove the `threadTypeSupplierService` import from inventory.vue if manual entry was its only usage on this page.

**Rationale**: Clean up unused imports to avoid confusion about which data source is canonical.

## Risks / Trade-offs

- **[Risk] ThreadType[] may include inactive thread types** → The GET /api/threads endpoint already filters `deleted_at IS NULL`. The `is_active` filter can be passed as a query param if needed, but the current junction table query also does not filter by is_active, so behavior is equivalent.

- **[Risk] ThreadType[] returns more data than junction query** → Acceptable. The junction query was a subset (only linked types); the direct query returns all types for the supplier, which is the correct and complete dataset. No performance concern since thread types per supplier is a small set.

- **[Trade-off] 1:1 vs M:N model** → The 1:1 model (thread_types.supplier_id) means each thread_type record is tied to exactly one supplier. In the garment factory context, this is correct — if the same tex+color comes from a different supplier, it gets a separate thread_type record with a different code. This matches how all other modules operate.
