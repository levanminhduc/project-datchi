## Why

The system manages thread types (Tex), suppliers (NCC), and colors as master data, but currently has no way to bulk import this data. Users must manually create each supplier, thread type, and color one by one. In practice, suppliers provide Excel catalogs with hundreds of Tex/color combinations. Manual entry is error-prone and extremely time-consuming.

This change adds Excel import functionality so users can upload supplier catalogs and automatically create/link NCC → Tex (with meters_per_cone and unit_price) and NCC → Colors in bulk. ROOT users configure the column mapping once, and all users follow that mapping when importing.

## What Changes

- **New DB column**: Add `meters_per_cone` to `thread_type_supplier` table (each supplier may have different cone lengths for the same Tex)
- **New system settings**: 2 new keys in `system_settings` for ROOT-configured Excel column mapping (`import_supplier_tex_mapping`, `import_supplier_color_mapping`)
- **Settings UI**: New section in Settings page (ROOT only) to configure import column mapping and download template files
- **Import NCC-Tex page**: New page `/thread/suppliers/import-tex` — upload Excel, preview parsed data, auto-create missing NCC/Tex, bulk insert into `thread_type_supplier`
- **Import Colors page**: New page `/thread/suppliers/import-colors` — select supplier first, upload Excel, auto-create missing colors (hex_code defaults to `#808080`), bulk link via `color_supplier`
- **Backend API**: New import endpoints for processing bulk data + template download endpoints
- **Suppliers page**: Add "Import NCC-Tex" button (global) and "Import Colors" button (per supplier row)

## Capabilities

### New Capabilities
- `import-supplier-tex`: Excel import for NCC → Tex mapping with meters_per_cone and unit_price. Includes upload, parsing, preview with validation, auto-creation of missing suppliers/thread_types, and bulk upsert into thread_type_supplier.
- `import-supplier-color`: Excel import for NCC → Color mapping. Includes supplier selection, upload, parsing, preview, auto-creation of missing colors (default hex), and bulk link via color_supplier.
- `import-settings`: ROOT-only configuration for Excel column mapping (sheet index, header row, data start row, column assignments) stored in system_settings. Includes template file download.

### Modified Capabilities
- (none — existing specs are not changing, only new functionality added)

## Impact

- **Database**: 1 migration (add column to `thread_type_supplier`, seed 2 system_settings rows)
- **Backend**: New route file(s) for import endpoints, template generation
- **Frontend**: 2 new pages, settings section update, suppliers page buttons
- **Dependencies**: ExcelJS (already in project for export features)
- **Auth**: Import pages need `thread.suppliers.manage` permission; settings need ROOT
