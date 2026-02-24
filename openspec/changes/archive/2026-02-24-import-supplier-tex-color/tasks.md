## 1. Database Migration

- [ ] 1.1 Create migration: ADD COLUMN `meters_per_cone DECIMAL(12,2)` to `thread_type_supplier` table
- [ ] 1.2 Create migration: INSERT default `import_supplier_tex_mapping` and `import_supplier_color_mapping` into `system_settings` ← (verify: migration runs clean, settings retrievable via API)

## 2. Backend Types

- [ ] 2.1 Add `meters_per_cone` field to `ThreadTypeSupplierRow`, `CreateThreadTypeSupplierDTO`, `UpdateThreadTypeSupplierDTO`, `LinkSupplierDTO` in `server/types/thread-type-supplier.ts`
- [ ] 2.2 Create `server/types/import.ts` with types: `ImportTexRow`, `ImportTexRequest`, `ImportTexResponse`, `ImportColorRow`, `ImportColorRequest`, `ImportColorResponse`, `ImportMappingConfig`

## 3. Backend Import API

- [ ] 3.1 Create `server/routes/import.ts` with POST `/api/import/supplier-tex` endpoint — receives array of validated rows, processes in transaction (create suppliers → create thread_types → upsert thread_type_supplier)
- [ ] 3.2 Add POST `/api/import/supplier-colors` endpoint — receives supplier_id + array of color rows, processes in transaction (create colors with #808080 → create color_supplier links)
- [ ] 3.3 Add GET `/api/import/template/supplier-tex` endpoint — generates and returns Excel template based on mapping config
- [ ] 3.4 Add GET `/api/import/template/supplier-colors` endpoint — generates and returns Excel template based on mapping config
- [ ] 3.5 Register import routes in `server/index.ts` ← (verify: all 4 endpoints respond correctly, transactions rollback on error, auto-create logic works for new NCC/Tex/Color)

## 4. Frontend Types

- [ ] 4.1 Create `src/types/thread/import.ts` with frontend types: `ImportTexRow`, `ImportColorRow`, `ImportMappingConfig`, `ParsedExcelRow`, `ImportPreviewStatus`

## 5. Frontend Service

- [ ] 5.1 Create `src/services/importService.ts` with methods: `importSupplierTex(rows)`, `importSupplierColors(supplierId, rows)`, `downloadTexTemplate()`, `downloadColorTemplate()`, `getImportMapping(key)`

## 6. Settings UI (ROOT only)

- [ ] 6.1 Add Import Mapping section to `src/pages/settings.vue` — NCC-Tex mapping config form (sheet index, header row, data start row, column A-Z dropdowns for each field)
- [ ] 6.2 Add Color Mapping section to `src/pages/settings.vue` — Color mapping config form (sheet index, header row, data start row, column dropdowns)
- [ ] 6.3 Add "Download Template" buttons in settings that call template download endpoints ← (verify: ROOT sees sections, non-ROOT does not, save/load works, template downloads correctly)

## 7. Import NCC-Tex Page

- [ ] 7.1 Create `src/pages/thread/suppliers/import-tex.vue` — page layout with back button, file upload (FilePicker accept .xlsx/.xls), stepper or section layout
- [ ] 7.2 Implement Excel parsing logic using ExcelJS — read file buffer, apply mapping config, extract rows into `ImportTexRow[]`
- [ ] 7.3 Implement preview table with validation — show parsed rows with status column (valid/new NCC/new Tex/error), summary counts
- [ ] 7.4 Implement import confirmation — send valid rows to API, show result (success count, created NCC/Tex count, skipped count), navigate back on success ← (verify: full flow works end-to-end, new NCC and Tex auto-created, upsert works for existing links, error rows skipped correctly)

## 8. Import Colors Page

- [ ] 8.1 Create `src/pages/thread/suppliers/import-colors.vue` — page layout with back button, supplier dropdown (pre-selected from URL param), file upload
- [ ] 8.2 Implement Excel parsing logic for colors — read file, apply color mapping config, extract rows
- [ ] 8.3 Implement preview table with validation — show color name, supplier color code, status (exists/new/error)
- [ ] 8.4 Implement import confirmation — send to API, show result, navigate back ← (verify: full flow works, new colors created with #808080 hex, existing colors just linked, supplier pre-selection from URL works)

## 9. Suppliers Page Integration

- [ ] 9.1 Add "Import NCC-Tex" button to suppliers page toolbar — navigates to `/thread/suppliers/import-tex`
- [ ] 9.2 Add "Import Colors" action button per supplier row — navigates to `/thread/suppliers/import-colors?supplier_id={id}` ← (verify: both buttons visible with correct permissions, navigation works, import-colors pre-selects supplier)
