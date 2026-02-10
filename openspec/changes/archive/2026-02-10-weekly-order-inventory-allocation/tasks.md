## 1. Setup & Dependencies

- [x] 1.1 Install `vuedraggable` package (Vue 3 compatible version)
- [x] 1.2 Extend `CalculationItem` type with `inventory_available`, `shortage_cones`, `is_fully_stocked` fields

## 2. Backend - Inventory Preview Allocation

- [x] 2.1 Add `include_inventory_preview` parameter handling to `/api/thread-calculation` endpoint
- [x] 2.2 Create helper function to query available inventory by `thread_type_id` (status = 'AVAILABLE')
- [x] 2.3 Implement preview allocation logic: process items in order, track running balance per thread_type_id
- [x] 2.4 Enrich `CalculationItem` response with inventory preview fields

## 3. Backend - Save Allocations

- [x] 3.1 Modify `/api/weekly-orders/:id/results` to accept inventory preview data
- [x] 3.2 Create allocation records for items with `shortage_cones > 0` on save
- [x] 3.3 Skip allocation creation for `is_fully_stocked` items

## 4. Frontend - Inventory Column

- [x] 4.1 Add "Tồn Kho" column to `ResultsDetailView.vue` columns array (before Ngày Giao)
- [x] 4.2 Create body-cell template for inventory_available display

## 5. Frontend - Enhanced Delivery Date Display

- [x] 5.1 Update "Ngày Giao" column template to check `is_fully_stocked`
- [x] 5.2 Display "Sẵn Kho" badge (green) when `is_fully_stocked: true`
- [x] 5.3 Display "Thiếu X" + delivery date when `shortage_cones > 0`

## 6. Frontend - Drag & Drop Reordering

- [x] 6.1 Import and wrap Style cards with `<draggable>` component in `ResultsDetailView.vue`
- [x] 6.2 Add drag handle icon (≡) to Style card header
- [x] 6.3 Implement `@change` handler to reorder `perStyleResults` array
- [x] 6.4 Add debounced recalculation (300ms) after reorder

## 7. Composable - Position Tracking

- [x] 7.1 Ensure `perStyleResults` order matches user-defined position
- [x] 7.2 Update `calculateAll()` to pass items in position order to backend
- [x] 7.3 Add `include_inventory_preview: true` flag to calculation request

## 8. Testing & Verification

- [ ] 8.1 Test allocation preview with single style (verify inventory counts)
- [ ] 8.2 Test allocation preview with multiple styles sharing same thread type
- [ ] 8.3 Test drag-and-drop reorder triggers recalculation
- [ ] 8.4 Test save creates allocations only for shortage items
- [x] 8.5 Run `npm run type-check` and `npm run lint`
