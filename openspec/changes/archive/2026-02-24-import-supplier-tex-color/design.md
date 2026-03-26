## Context

The application manages thread inventory for garment factories. Master data includes suppliers (NCC), thread types (identified by Tex number), and colors. Currently:

- `thread_type_supplier` junction table links thread types to suppliers with `supplier_item_code` and `unit_price`, but lacks `meters_per_cone` (cone length varies by supplier).
- `color_supplier` junction table links colors to suppliers with `price_per_kg`.
- `system_settings` table stores key-value configs (JSONB) — used for partial_cone_ratio, employee_detail_fields.
- ExcelJS is already a dependency (used in 7+ export features).
- FilePicker component exists but is unused in production.
- Settings page (`/settings`) has ROOT-only sections pattern.
- File-based routing via `unplugin-vue-router` — pages at `src/pages/thread/suppliers/` auto-register routes.

## Goals / Non-Goals

**Goals:**
- Allow bulk import of NCC→Tex data (supplier, tex_number, meters_per_cone, unit_price) from Excel
- Allow bulk import of Colors for a specific NCC from Excel
- ROOT configures column mapping once; all users follow it
- Auto-create missing suppliers, thread_types, and colors during import
- Provide downloadable Excel templates matching the configured mapping
- Each NCC maintains independent master data (import for NCC A does not affect NCC B)

**Non-Goals:**
- Hex code auto-detection from color names (users edit hex after import)
- Pantone/RAL code import
- Price per kg in color import (price already captured in NCC-Tex import)
- Editing/deleting existing data via import (import is additive/upsert only)
- Multi-file or drag-drop upload (single file at a time)
- Real-time progress for large files (synchronous processing)

## Decisions

### D1: Frontend-side Excel parsing (not backend)
Parse Excel on the client using ExcelJS `workbook.xlsx.load(buffer)`. This allows preview before sending to server, reducing unnecessary API calls for invalid files.
- **Alternative**: Upload file to server, parse there → rejected because no preview capability without extra round-trips.

### D2: Column mapping via system_settings (ROOT-configured)
Store mapping config as JSONB in `system_settings` with keys `import_supplier_tex_mapping` and `import_supplier_color_mapping`. ROOT configures once; import pages read this config to know which Excel columns to use.
- **Alternative**: Per-import column selection UI → rejected per user requirement for ROOT preset + template download.

### D3: Separate pages for import (not dialogs)
Import NCC-Tex and Import Colors are full pages (`/thread/suppliers/import-tex`, `/thread/suppliers/import-colors`) with back navigation, not modal dialogs.
- **Reason**: Preview tables can be large; dialogs feel cramped. User explicitly requested separate pages.

### D4: Add meters_per_cone to thread_type_supplier
Different suppliers sell different cone lengths for the same Tex. Add `meters_per_cone DECIMAL(12,2)` to `thread_type_supplier` table.
- **Alternative**: Use existing `thread_types.meters_per_cone` → rejected because it's a global value, not per-supplier.

### D5: Auto-create missing entities
- Missing supplier → create with auto-generated code (e.g., `NCC-001`), name from Excel
- Missing thread_type (by tex_number) → create with auto code (e.g., `T-TEX40`), density calculated as `tex/1000`
- Missing color (by name match) → create with `hex_code = '#808080'` (default gray), user edits later
- **Matching strategy**: Suppliers match by `name` (case-insensitive). Thread types match by `tex_number`. Colors match by `name` (case-insensitive).

### D6: Upsert behavior for existing links
If `thread_type_supplier` row already exists for (supplier_id, thread_type_id), UPDATE `unit_price` and `meters_per_cone`. Do not create duplicates.

### D7: Backend bulk API (not individual inserts)
Single POST endpoint receives array of validated rows. Backend processes in a transaction: create missing entities → upsert links.
- **Alternative**: Frontend calls individual create APIs per row → rejected for performance (N+1 problem).

### D8: Template generation from mapping config
When user clicks "Download template", system reads current mapping config and generates an Excel file with correct column headers at the configured positions. Includes 1 example row.

## Risks / Trade-offs

- **[Large file performance]** → ExcelJS parsing 10,000+ rows on client could be slow. Mitigation: Show loading spinner; practical limit ~5000 rows per import (sufficient for supplier catalogs).
- **[Duplicate supplier names]** → Two suppliers with similar names (e.g., "Coats" vs "Coats Phong Phú") may not match. Mitigation: Preview shows "NEW" badge; user can cancel and fix Excel.
- **[hex_code NOT NULL constraint]** → New colors created during import need hex_code. Mitigation: Default `#808080`; user edits in /thread/colors page after import.
- **[No rollback for partial import]** → If import creates 50 entities and fails at row 51, first 50 are committed. Mitigation: Use database transaction; all-or-nothing commit.
- **[Mapping config deleted/missing]** → Import pages won't work without settings. Mitigation: Seed default mapping in migration; validate config exists before showing import UI.

## Migration Plan

1. Run migration: ADD COLUMN `meters_per_cone` to `thread_type_supplier`, INSERT 2 default settings rows
2. Deploy backend: New import routes
3. Deploy frontend: Settings section + import pages + supplier page buttons
4. ROOT user configures mapping in Settings (or uses defaults)
5. Users can start importing

**Rollback**: Drop column `meters_per_cone`, delete settings rows. No data loss for existing features.
