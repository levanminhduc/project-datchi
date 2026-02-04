---
spec_version: "1.0"
feature: "thread-management"
type: "tasks"
---

# Thread Management Hierarchical Restructure - Tasks

Total TODOs mapped: 132 (TODO markers: `thread-restructure-1` to `thread-restructure-132`)

<!-- @PHASE:PH-1 name="Database Schema" story=US-001,US-002,US-003,US-004,US-005 -->
## Phase 1: Database Schema (TODOs 1-22) - US-001, US-002, US-003, US-004, US-005 (P1) 🎯 MVP

**Goal**: Create normalized master tables and add FK columns using expand-contract pattern.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-001 status=pending --> T-001 | Create colors table migration | `supabase/migrations/20240101000024_colors.sql` | Table exists with id, name (unique), hex_code, pantone_code, ral_code, timestamps | [ ] |
| <!-- @TASK:T-002 status=pending --> T-002 | Create suppliers table migration | `supabase/migrations/20240101000025_suppliers.sql` | Table exists with id, code (unique), name, contact_name, phone, email, is_active, timestamps | [ ] |
| <!-- @TASK:T-003 status=pending --> T-003 | Create color_supplier junction table | `supabase/migrations/20240101000026_color_supplier.sql` | Table exists with FKs to colors and suppliers, unique constraint on (color_id, supplier_id) | [ ] |
| <!-- @TASK:T-004 status=pending --> T-004 | Add trigger for colors.updated_at | `supabase/migrations/20240101000024_colors.sql` | Trigger updates updated_at on row modification | [ ] |
| <!-- @TASK:T-005 status=pending --> T-005 | Add trigger for suppliers.updated_at | `supabase/migrations/20240101000025_suppliers.sql` | Trigger updates updated_at on row modification | [ ] |
| <!-- @TASK:T-006 status=pending --> T-006 | Add trigger for color_supplier.updated_at | `supabase/migrations/20240101000026_color_supplier.sql` | Trigger updates updated_at on row modification | [ ] |
| <!-- @TASK:T-007 status=pending --> T-007 | Create index on colors.name | `supabase/migrations/20240101000024_colors.sql` | Index idx_colors_name exists | [ ] |
| <!-- @TASK:T-008 status=pending --> T-008 | Create indexes on suppliers | `supabase/migrations/20240101000025_suppliers.sql` | Indexes on code, name, is_active exist | [ ] |
| <!-- @TASK:T-009 status=pending --> T-009 | Create indexes on color_supplier | `supabase/migrations/20240101000026_color_supplier.sql` | Indexes on color_id, supplier_id exist | [ ] |
| <!-- @TASK:T-010 status=pending --> T-010 | Add nullable color_id to thread_types | `supabase/migrations/20240101000027_thread_types_fks.sql` | Column exists with FK to colors(id) | [ ] |
| <!-- @TASK:T-011 status=pending --> T-011 | Add nullable supplier_id to thread_types | `supabase/migrations/20240101000027_thread_types_fks.sql` | Column exists with FK to suppliers(id) | [ ] |
| <!-- @TASK:T-012 status=pending --> T-012 | Add nullable color_supplier_id to thread_types | `supabase/migrations/20240101000027_thread_types_fks.sql` | Column exists with FK to color_supplier(id) | [ ] |
| <!-- @TASK:T-013 status=pending --> T-013 | Create index on thread_types.color_id | `supabase/migrations/20240101000027_thread_types_fks.sql` | Index idx_thread_types_color_id exists | [ ] |
| <!-- @TASK:T-014 status=pending --> T-014 | Create index on thread_types.supplier_id | `supabase/migrations/20240101000027_thread_types_fks.sql` | Index idx_thread_types_supplier_id exists | [ ] |
| <!-- @TASK:T-015 status=pending --> T-015 | Create index on thread_types.color_supplier_id | `supabase/migrations/20240101000027_thread_types_fks.sql` | Index idx_thread_types_color_supplier_id exists | [ ] |
| <!-- @TASK:T-016 status=pending --> T-016 | Add nullable supplier_id to lots | `supabase/migrations/20240101000028_lots_supplier_fk.sql` | Column exists with FK to suppliers(id) | [ ] |
| <!-- @TASK:T-017 status=pending --> T-017 | Create index on lots.supplier_id | `supabase/migrations/20240101000028_lots_supplier_fk.sql` | Index idx_lots_supplier_id exists | [ ] |
| <!-- @TASK:T-018 status=pending --> T-018 | Add comments to colors table | `supabase/migrations/20240101000024_colors.sql` | Table and column comments added | [ ] |
| <!-- @TASK:T-019 status=pending --> T-019 | Add comments to suppliers table | `supabase/migrations/20240101000025_suppliers.sql` | Table and column comments added | [ ] |
| <!-- @TASK:T-020 status=pending --> T-020 | Add comments to color_supplier table | `supabase/migrations/20240101000026_color_supplier.sql` | Table and column comments added | [ ] |
| <!-- @TASK:T-021 status=pending --> T-021 | Seed initial colors from existing data | `supabase/seed/colors_seed.sql` | Seed script extracts unique colors from thread_types | [ ] |
| <!-- @TASK:T-022 status=pending --> T-022 | Seed initial suppliers from existing data | `supabase/seed/suppliers_seed.sql` | Seed script extracts unique suppliers from thread_types and lots | [ ] |

**Checkpoint**: All tables created, FK columns added, indexes in place. Database ready for backfill.
<!-- @END:PHASE:PH-1 -->

<!-- @PHASE:PH-2 name="Backend Types" story=US-007,US-008 prereq=PH-1 -->
## Phase 2: Backend Types (TODOs 23-34) - US-007, US-008 (P2)

**Goal**: Create TypeScript types for colors, suppliers, and update existing thread types.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-023 status=pending --> T-023 | Create ColorRow interface | `server/types/color.ts` | Interface matches database schema | [ ] |
| <!-- @TASK:T-024 status=pending --> T-024 | Create CreateColorDTO interface | `server/types/color.ts` | DTO with name required, codes optional | [ ] |
| <!-- @TASK:T-025 status=pending --> T-025 | Create UpdateColorDTO interface | `server/types/color.ts` | Partial of CreateColorDTO | [ ] |
| <!-- @TASK:T-026 status=pending --> T-026 | Create ColorApiResponse type | `server/types/color.ts` | Generic API response type for colors | [ ] |
| <!-- @TASK:T-027 status=pending --> T-027 | Create SupplierRow interface | `server/types/supplier.ts` | Interface matches database schema | [ ] |
| <!-- @TASK:T-028 status=pending --> T-028 | Create CreateSupplierDTO interface | `server/types/supplier.ts` | DTO with code, name required | [ ] |
| <!-- @TASK:T-029 status=pending --> T-029 | Create UpdateSupplierDTO interface | `server/types/supplier.ts` | Partial of CreateSupplierDTO + is_active | [ ] |
| <!-- @TASK:T-030 status=pending --> T-030 | Create SupplierApiResponse type | `server/types/supplier.ts` | Generic API response type for suppliers | [ ] |
| <!-- @TASK:T-031 status=pending --> T-031 | Create ColorSupplierRow interface | `server/types/color-supplier.ts` | Interface matches junction table | [ ] |
| <!-- @TASK:T-032 status=pending --> T-032 | Update ThreadTypeRow with FK fields | `server/types/thread.ts` | Add color_id, supplier_id, color_supplier_id | [ ] |
| <!-- @TASK:T-033 status=pending --> T-033 | Update CreateThreadTypeDTO with FK fields | `server/types/thread.ts` | Add optional color_id, supplier_id | [ ] |
| <!-- @TASK:T-034 status=pending --> T-034 | Update LotRow with supplier_id field | `server/types/batch.ts` | Add supplier_id to LotRow | [ ] |

**Checkpoint**: All backend types defined. Ready for route implementation.
<!-- @END:PHASE:PH-2 -->

<!-- @PHASE:PH-3 name="Backend Routes" story=US-007,US-008 prereq=PH-2 -->
## Phase 3: Backend Routes (TODOs 35-50) - US-007, US-008 (P2)

**Goal**: Create Hono routes for colors and suppliers CRUD operations.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-035 status=pending --> T-035 | Create GET /api/colors route | `server/routes/colors.ts` | Returns array of all colors | [ ] |
| <!-- @TASK:T-036 status=pending --> T-036 | Create GET /api/colors/:id route | `server/routes/colors.ts` | Returns single color or 404 | [ ] |
| <!-- @TASK:T-037 status=pending --> T-037 | Create POST /api/colors route | `server/routes/colors.ts` | Creates color, 409 on duplicate name | [ ] |
| <!-- @TASK:T-038 status=pending --> T-038 | Create PUT /api/colors/:id route | `server/routes/colors.ts` | Updates color, 404 if not found | [ ] |
| <!-- @TASK:T-039 status=pending --> T-039 | Create DELETE /api/colors/:id route | `server/routes/colors.ts` | Soft-deletes or checks FK constraints | [ ] |
| <!-- @TASK:T-040 status=pending --> T-040 | Register colors routes in server index | `server/index.ts` | Routes mounted at /api/colors | [ ] |
| <!-- @TASK:T-041 status=pending --> T-041 | Create GET /api/suppliers route | `server/routes/suppliers.ts` | Returns array with optional search, is_active filters | [ ] |
| <!-- @TASK:T-042 status=pending --> T-042 | Create GET /api/suppliers/:id route | `server/routes/suppliers.ts` | Returns single supplier or 404 | [ ] |
| <!-- @TASK:T-043 status=pending --> T-043 | Create POST /api/suppliers route | `server/routes/suppliers.ts` | Creates supplier, 409 on duplicate code | [ ] |
| <!-- @TASK:T-044 status=pending --> T-044 | Create PUT /api/suppliers/:id route | `server/routes/suppliers.ts` | Updates supplier, 404 if not found | [ ] |
| <!-- @TASK:T-045 status=pending --> T-045 | Create DELETE /api/suppliers/:id route | `server/routes/suppliers.ts` | Soft-deletes (is_active=false) | [ ] |
| <!-- @TASK:T-046 status=pending --> T-046 | Register suppliers routes in server index | `server/index.ts` | Routes mounted at /api/suppliers | [ ] |
| <!-- @TASK:T-047 status=pending --> T-047 | Add Vietnamese error messages for colors | `server/routes/colors.ts` | All errors in Vietnamese | [ ] |
| <!-- @TASK:T-048 status=pending --> T-048 | Add Vietnamese error messages for suppliers | `server/routes/suppliers.ts` | All errors in Vietnamese | [ ] |
| <!-- @TASK:T-049 status=pending --> T-049 | Add success messages for colors | `server/routes/colors.ts` | Create/update/delete success messages | [ ] |
| <!-- @TASK:T-050 status=pending --> T-050 | Add success messages for suppliers | `server/routes/suppliers.ts` | Create/update/delete success messages | [ ] |

**Checkpoint**: Colors and suppliers APIs functional. Can test with curl/Postman.
<!-- @END:PHASE:PH-3 -->

<!-- @PHASE:PH-4 name="Update Backend Routes" story=US-004,US-005,US-006 prereq=PH-3 -->
## Phase 4: Update Backend Routes for Dual-Write (TODOs 51-62) - US-004, US-005, US-006 (P1/P2)

**Goal**: Update thread and lot routes to support FK fields and implement dual-write logic.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-051 status=pending --> T-051 | Update GET /api/threads to LEFT JOIN colors | `server/routes/threads.ts` | Returns color_data object with thread types | [ ] |
| <!-- @TASK:T-052 status=pending --> T-052 | Update GET /api/threads to LEFT JOIN suppliers | `server/routes/threads.ts` | Returns supplier_data object with thread types | [ ] |
| <!-- @TASK:T-053 status=pending --> T-053 | Add color_id filter to GET /api/threads | `server/routes/threads.ts` | Can filter by color_id alongside color text | [ ] |
| <!-- @TASK:T-054 status=pending --> T-054 | Add supplier_id filter to GET /api/threads | `server/routes/threads.ts` | Can filter by supplier_id alongside supplier text | [ ] |
| <!-- @TASK:T-055 status=pending --> T-055 | Implement dual-write for color in POST /api/threads | `server/routes/threads.ts` | If color_id provided, lookup and set color text field | [ ] |
| <!-- @TASK:T-056 status=pending --> T-056 | Implement dual-write for supplier in POST /api/threads | `server/routes/threads.ts` | If supplier_id provided, lookup and set supplier text field | [ ] |
| <!-- @TASK:T-057 status=pending --> T-057 | Implement dual-write for color in PUT /api/threads/:id | `server/routes/threads.ts` | Same as POST for updates | [ ] |
| <!-- @TASK:T-058 status=pending --> T-058 | Implement dual-write for supplier in PUT /api/threads/:id | `server/routes/threads.ts` | Same as POST for updates | [ ] |
| <!-- @TASK:T-059 status=pending --> T-059 | Update GET /api/lots to LEFT JOIN suppliers | `server/routes/lots.ts` | Returns supplier_data object with lots | [ ] |
| <!-- @TASK:T-060 status=pending --> T-060 | Add supplier_id filter to GET /api/lots | `server/routes/lots.ts` | Can filter by supplier_id | [ ] |
| <!-- @TASK:T-061 status=pending --> T-061 | Implement dual-write for supplier in POST /api/lots | `server/routes/lots.ts` | If supplier_id provided, lookup and set supplier text | [ ] |
| <!-- @TASK:T-062 status=pending --> T-062 | Implement dual-write for supplier in PUT /api/lots/:id | `server/routes/lots.ts` | Same as POST for updates | [ ] |

**Checkpoint**: APIs return joined data, dual-write works, backward compatibility maintained.
<!-- @END:PHASE:PH-4 -->

<!-- @PHASE:PH-5 name="Frontend Types" story=US-009,US-010 prereq=PH-4 -->
## Phase 5: Frontend Types (TODOs 63-70, 122-131) - US-009, US-010 (P2)

**Goal**: Create frontend TypeScript types and update existing thread/lot types.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-063 status=pending --> T-063 | Create Color interface | `src/types/color.ts` | Interface matches API response | [ ] |
| <!-- @TASK:T-064 status=pending --> T-064 | Create ColorFormData interface | `src/types/color.ts` | Form data for create/update | [ ] |
| <!-- @TASK:T-065 status=pending --> T-065 | Create Supplier interface | `src/types/supplier.ts` | Interface matches API response | [ ] |
| <!-- @TASK:T-066 status=pending --> T-066 | Create SupplierFormData interface | `src/types/supplier.ts` | Form data for create/update | [ ] |
| <!-- @TASK:T-067 status=pending --> T-067 | Create SupplierFilters interface | `src/types/supplier.ts` | Search and is_active filters | [ ] |
| <!-- @TASK:T-068 status=pending --> T-068 | Export types from index | `src/types/index.ts` | Color and Supplier exported | [ ] |
| <!-- @TASK:T-069 status=pending --> T-069 | Import Color type in thread-type.ts | `src/types/thread/thread-type.ts` | Import statement added | [ ] |
| <!-- @TASK:T-070 status=pending --> T-070 | Import Supplier type in thread-type.ts | `src/types/thread/thread-type.ts` | Import statement added | [ ] |
| <!-- @TASK:T-071 status=pending --> T-071 | Add color_id to ThreadType interface | `src/types/thread/thread-type.ts` | Field: color_id: number | null | [ ] |
| <!-- @TASK:T-072 status=pending --> T-072 | Add supplier_id to ThreadType interface | `src/types/thread/thread-type.ts` | Field: supplier_id: number | null | [ ] |
| <!-- @TASK:T-073 status=pending --> T-073 | Add color_data to ThreadType interface | `src/types/thread/thread-type.ts` | Optional field: color_data?: Color | [ ] |
| <!-- @TASK:T-074 status=pending --> T-074 | Add supplier_data to ThreadType interface | `src/types/thread/thread-type.ts` | Optional field: supplier_data?: Supplier | [ ] |
| <!-- @TASK:T-075 status=pending --> T-075 | Update ThreadTypeFormData with FK fields | `src/types/thread/thread-type.ts` | Add color_id, supplier_id optional fields | [ ] |
| <!-- @TASK:T-076 status=pending --> T-076 | Update ThreadTypeFilters with FK fields | `src/types/thread/thread-type.ts` | Add color_id, supplier_id optional fields | [ ] |
| <!-- @TASK:T-077 status=pending --> T-077 | Add supplier_id to Lot interface | `src/types/thread/lot.ts` | Field: supplier_id: number | null | [ ] |
| <!-- @TASK:T-078 status=pending --> T-078 | Add supplier_data to Lot interface | `src/types/thread/lot.ts` | Optional field: supplier_data?: Supplier | [ ] |

**Checkpoint**: All frontend types updated. Ready for service layer.
<!-- @END:PHASE:PH-5 -->

<!-- @PHASE:PH-6 name="Frontend Services" story=US-007,US-008,US-009,US-010 prereq=PH-5 -->
## Phase 6: Frontend Services (TODOs 71-84) - US-007, US-008, US-009, US-010 (P2)

**Goal**: Create service layer for colors and suppliers API calls.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-079 status=pending --> T-079 | Create colorService.getAll() | `src/services/colorService.ts` | Fetches all colors from API | [ ] |
| <!-- @TASK:T-080 status=pending --> T-080 | Create colorService.getById() | `src/services/colorService.ts` | Fetches single color by ID | [ ] |
| <!-- @TASK:T-081 status=pending --> T-081 | Create colorService.create() | `src/services/colorService.ts` | Creates new color | [ ] |
| <!-- @TASK:T-082 status=pending --> T-082 | Create colorService.update() | `src/services/colorService.ts` | Updates existing color | [ ] |
| <!-- @TASK:T-083 status=pending --> T-083 | Create colorService.delete() | `src/services/colorService.ts` | Deletes color | [ ] |
| <!-- @TASK:T-084 status=pending --> T-084 | Export colorService | `src/services/index.ts` | Service exported from barrel | [ ] |
| <!-- @TASK:T-085 status=pending --> T-085 | Create supplierService.getAll() | `src/services/supplierService.ts` | Fetches suppliers with optional filters | [ ] |
| <!-- @TASK:T-086 status=pending --> T-086 | Create supplierService.getById() | `src/services/supplierService.ts` | Fetches single supplier by ID | [ ] |
| <!-- @TASK:T-087 status=pending --> T-087 | Create supplierService.create() | `src/services/supplierService.ts` | Creates new supplier | [ ] |
| <!-- @TASK:T-088 status=pending --> T-088 | Create supplierService.update() | `src/services/supplierService.ts` | Updates existing supplier | [ ] |
| <!-- @TASK:T-089 status=pending --> T-089 | Create supplierService.delete() | `src/services/supplierService.ts` | Soft-deletes supplier | [ ] |
| <!-- @TASK:T-090 status=pending --> T-090 | Export supplierService | `src/services/index.ts` | Service exported from barrel | [ ] |
| <!-- @TASK:T-091 status=pending --> T-091 | Add buildQueryString helper for suppliers | `src/services/supplierService.ts` | Query string builder for filters | [ ] |
| <!-- @TASK:T-092 status=pending --> T-092 | Handle API errors with Vietnamese messages | `src/services/colorService.ts`, `src/services/supplierService.ts` | Error handling consistent with project pattern | [ ] |

**Checkpoint**: Services call APIs correctly. Ready for composables.
<!-- @END:PHASE:PH-6 -->

<!-- @PHASE:PH-7 name="Frontend Composables" story=US-009,US-010 prereq=PH-6 -->
## Phase 7: Frontend Composables (TODOs 85-100) - US-009, US-010 (P2)

**Goal**: Create Vue composables for colors and suppliers state management.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-093 status=pending --> T-093 | Create useColors composable | `src/composables/useColors.ts` | Reactive colors array state | [ ] |
| <!-- @TASK:T-094 status=pending --> T-094 | Implement fetchColors() | `src/composables/useColors.ts` | Fetches and caches colors | [ ] |
| <!-- @TASK:T-095 status=pending --> T-095 | Implement createColor() | `src/composables/useColors.ts` | Creates color and updates cache | [ ] |
| <!-- @TASK:T-096 status=pending --> T-096 | Implement updateColor() | `src/composables/useColors.ts` | Updates color and refreshes cache | [ ] |
| <!-- @TASK:T-097 status=pending --> T-097 | Implement deleteColor() | `src/composables/useColors.ts` | Deletes color and removes from cache | [ ] |
| <!-- @TASK:T-098 status=pending --> T-098 | Add loading and error states | `src/composables/useColors.ts` | Reactive loading/error refs | [ ] |
| <!-- @TASK:T-099 status=pending --> T-099 | Create useSuppliers composable | `src/composables/useSuppliers.ts` | Reactive suppliers array state | [ ] |
| <!-- @TASK:T-100 status=pending --> T-100 | Implement fetchSuppliers() | `src/composables/useSuppliers.ts` | Fetches and caches suppliers | [ ] |
| <!-- @TASK:T-101 status=pending --> T-101 | Implement createSupplier() | `src/composables/useSuppliers.ts` | Creates supplier and updates cache | [ ] |
| <!-- @TASK:T-102 status=pending --> T-102 | Implement updateSupplier() | `src/composables/useSuppliers.ts` | Updates supplier and refreshes cache | [ ] |
| <!-- @TASK:T-103 status=pending --> T-103 | Implement deleteSupplier() | `src/composables/useSuppliers.ts` | Soft-deletes and removes from cache | [ ] |
| <!-- @TASK:T-104 status=pending --> T-104 | Add loading and error states | `src/composables/useSuppliers.ts` | Reactive loading/error refs | [ ] |
| <!-- @TASK:T-105 status=pending --> T-105 | Add getColorById() helper | `src/composables/useColors.ts` | Find color by ID from cache | [ ] |
| <!-- @TASK:T-106 status=pending --> T-106 | Add getSupplierById() helper | `src/composables/useSuppliers.ts` | Find supplier by ID from cache | [ ] |
| <!-- @TASK:T-107 status=pending --> T-107 | Use useSnackbar for notifications | `src/composables/useColors.ts`, `src/composables/useSuppliers.ts` | Success/error notifications | [ ] |
| <!-- @TASK:T-108 status=pending --> T-108 | Export composables from index | `src/composables/index.ts` | useColors, useSuppliers exported | [ ] |

**Checkpoint**: Composables manage state. Ready for selector components.
<!-- @END:PHASE:PH-7 -->

<!-- @PHASE:PH-8 name="Frontend Selector Components" story=US-009,US-010 prereq=PH-7 -->
## Phase 8: Frontend Selector Components (TODOs 101-112) - US-009, US-010 (P2)

**Goal**: Create ColorSelector and SupplierSelector components following AppWarehouseSelect pattern.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-109 status=pending --> T-109 | Create ColorSelector component | `src/components/ui/inputs/ColorSelector.vue` | Component renders q-select | [ ] |
| <!-- @TASK:T-110 status=pending --> T-110 | Add color swatch preview in options | `src/components/ui/inputs/ColorSelector.vue` | Shows hex_code color preview | [ ] |
| <!-- @TASK:T-111 status=pending --> T-111 | Emit color_id and color_data | `src/components/ui/inputs/ColorSelector.vue` | Both values emitted for dual-write | [ ] |
| <!-- @TASK:T-112 status=pending --> T-112 | Add autoFetch with useColors | `src/components/ui/inputs/ColorSelector.vue` | Fetches colors on mount if needed | [ ] |
| <!-- @TASK:T-113 status=pending --> T-113 | Add props: required, clearable, disable | `src/components/ui/inputs/ColorSelector.vue` | Standard input props | [ ] |
| <!-- @TASK:T-114 status=pending --> T-114 | Add validation rules support | `src/components/ui/inputs/ColorSelector.vue` | Computes rules with required | [ ] |
| <!-- @TASK:T-115 status=pending --> T-115 | Create SupplierSelector component | `src/components/ui/inputs/SupplierSelector.vue` | Component renders q-select | [ ] |
| <!-- @TASK:T-116 status=pending --> T-116 | Add search/filter capability | `src/components/ui/inputs/SupplierSelector.vue` | Can search by name or code | [ ] |
| <!-- @TASK:T-117 status=pending --> T-117 | Emit supplier_id and supplier_data | `src/components/ui/inputs/SupplierSelector.vue` | Both values emitted for dual-write | [ ] |
| <!-- @TASK:T-118 status=pending --> T-118 | Add autoFetch with useSuppliers | `src/components/ui/inputs/SupplierSelector.vue` | Fetches suppliers on mount if needed | [ ] |
| <!-- @TASK:T-119 status=pending --> T-119 | Add activeOnly filter prop | `src/components/ui/inputs/SupplierSelector.vue` | Filter to show only active suppliers | [ ] |
| <!-- @TASK:T-120 status=pending --> T-120 | Export selectors from inputs index | `src/components/ui/inputs/index.ts` | ColorSelector, SupplierSelector exported | [ ] |

**Checkpoint**: Selector components work standalone. Ready for form integration.
<!-- @END:PHASE:PH-8 -->

<!-- @PHASE:PH-9 name="Update Frontend Components" story=US-011,US-012 prereq=PH-8 -->
## Phase 9: Update Frontend Components (TODOs 113-121, 132) - US-011, US-012 (P2/P3)

**Goal**: Update existing forms and pages to use new selector components.

| ID | Task | Files | DoD | Status |
|----|------|-------|-----|--------|
| <!-- @TASK:T-121 status=pending --> T-121 | Import ColorSelector in ThreadTypeFormDialog | `src/components/thread/ThreadTypeFormDialog.vue` | Import statement added | [ ] |
| <!-- @TASK:T-122 status=pending --> T-122 | Import SupplierSelector in ThreadTypeFormDialog | `src/components/thread/ThreadTypeFormDialog.vue` | Import statement added | [ ] |
| <!-- @TASK:T-123 status=pending --> T-123 | Add color_id and supplier_id to form state | `src/components/thread/ThreadTypeFormDialog.vue` | Form reactive includes FK fields | [ ] |
| <!-- @TASK:T-124 status=pending --> T-124 | Replace color input with ColorSelector | `src/components/thread/ThreadTypeFormDialog.vue` | ColorSelector renders, emits work | [ ] |
| <!-- @TASK:T-125 status=pending --> T-125 | Replace supplier input with SupplierSelector | `src/components/thread/ThreadTypeFormDialog.vue` | SupplierSelector renders, emits work | [ ] |
| <!-- @TASK:T-126 status=pending --> T-126 | Handle dual-write in onSubmit | `src/components/thread/ThreadTypeFormDialog.vue` | Send both FK and text values | [ ] |
| <!-- @TASK:T-127 status=pending --> T-127 | Populate selectors in edit mode | `src/components/thread/ThreadTypeFormDialog.vue` | Edit mode shows correct selections | [ ] |
| <!-- @TASK:T-128 status=pending --> T-128 | Update thread list filters with ColorSelector | `src/pages/thread/index.vue` | Color filter uses dropdown | [ ] |
| <!-- @TASK:T-129 status=pending --> T-129 | Update thread list filters with SupplierSelector | `src/pages/thread/index.vue` | Supplier filter uses dropdown | [ ] |
| <!-- @TASK:T-130 status=pending --> T-130 | Update filter state to include FK values | `src/pages/thread/index.vue` | Filters include color_id, supplier_id | [ ] |
| <!-- @TASK:T-131 status=pending --> T-131 | Update useThreadTypes to handle FK filters | `src/composables/thread/useThreadTypes.ts` | Filter by FK when provided | [ ] |
| <!-- @TASK:T-132 status=pending --> T-132 | Display color_data and supplier_data in list | `src/pages/thread/index.vue` | List shows joined data | [ ] |

**Checkpoint**: Forms use selectors, filters work with FK values, list displays joined data. Feature complete.
<!-- @END:PHASE:PH-9 -->

---

## Summary

| Phase | Stories | Tasks | Priority | Est. Effort |
|-------|---------|-------|----------|-------------|
| Phase 1: Database | US-001, US-002, US-003, US-004, US-005 | T-001 to T-022 (22) | P1 MVP | 16h |
| Phase 2: Backend Types | US-007, US-008 | T-023 to T-034 (12) | P2 | 4h |
| Phase 3: Backend Routes | US-007, US-008 | T-035 to T-050 (16) | P2 | 8h |
| Phase 4: Update Backend | US-004, US-005, US-006 | T-051 to T-062 (12) | P1/P2 | 8h |
| Phase 5: Frontend Types | US-009, US-010 | T-063 to T-078 (16) | P2 | 4h |
| Phase 6: Frontend Services | US-007 to US-010 | T-079 to T-092 (14) | P2 | 6h |
| Phase 7: Frontend Composables | US-009, US-010 | T-093 to T-108 (16) | P2 | 8h |
| Phase 8: Selector Components | US-009, US-010 | T-109 to T-120 (12) | P2 | 8h |
| Phase 9: Update Frontend | US-011, US-012 | T-121 to T-132 (12) | P2/P3 | 8h |

**Total**: 132 Tasks, ~70 hours estimated

## Critical Path

```
Phase 1 (DB) → Phase 2 (Types) → Phase 3 (Routes) → Phase 4 (Update Backend)
                                                           ↓
Phase 5 (FE Types) → Phase 6 (Services) → Phase 7 (Composables) → Phase 8 (Selectors) → Phase 9 (Update FE)
```

MVP completion requires Phase 1 + Phase 4 (dual-write) = ~24h
Full feature requires all phases = ~70h
