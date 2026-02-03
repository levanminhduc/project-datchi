## 1. Database Schema

- [x] 1.1 Create migration file `supabase/migrations/20240101000014_warehouse_hierarchy.sql` with ALTER TABLE to add parent_id, type, sort_order columns
- [x] 1.2 Add CHECK constraint for type IN ('LOCATION', 'STORAGE')
- [x] 1.3 Add foreign key constraint for parent_id referencing warehouses(id)
- [x] 1.4 Add indexes for parent_id and type columns
- [x] 1.5 Run migration and verify columns exist

## 2. Seed Data

- [x] 2.1 Create/update seed file to insert 2 LOCATION records (Điện Bàn, Phú Tường)
- [x] 2.2 Insert 4 STORAGE records with correct parent_id references
- [x] 2.3 Update any existing warehouse records to set type='STORAGE' and appropriate parent_id

## 3. Backend Types

- [x] 3.1 Update `server/types/thread.ts` WarehouseRow interface to include parent_id, type, sort_order
- [x] 3.2 Add WarehouseType enum ('LOCATION' | 'STORAGE')
- [x] 3.3 Create WarehouseTreeNode interface with children array

## 4. Backend API

- [x] 4.1 Update GET /api/warehouses to include new columns in select
- [x] 4.2 Add ordering by parent_id NULLS FIRST, then sort_order
- [x] 4.3 Implement format=tree query param logic to build tree structure
- [x] 4.4 Add GET /api/warehouses/locations endpoint for LOCATION-only list
- [x] 4.5 Add GET /api/warehouses/storage endpoint for STORAGE-only list (for inventory operations)

## 5. Frontend Types

- [x] 5.1 Update `src/services/warehouseService.ts` Warehouse interface with new fields
- [x] 5.2 Add WarehouseType type and WarehouseTreeNode interface
- [x] 5.3 Export types for use in components

## 6. Frontend Service

- [x] 6.1 Add getTree() method to warehouseService that calls ?format=tree
- [x] 6.2 Add getStorageOnly() method for inventory forms
- [x] 6.3 Add getByLocation(locationId) method for filtering

## 7. Composable Updates

- [x] 7.1 Update `src/composables/useWarehouses.ts` to fetch tree structure
- [x] 7.2 Add computed properties: locations, storageWarehouses, warehousesByLocation
- [x] 7.3 Add helper method getLocationName(warehouseId) to get parent location name
- [x] 7.4 Add helper method getStoragesForLocation(locationId)

## 8. UI Components

- [x] 8.1 Create `src/components/ui/AppWarehouseSelect.vue` with grouped display
- [x] 8.2 Implement LOCATION as group headers (bold, non-selectable)
- [x] 8.3 Implement STORAGE as indented options under parent
- [x] 8.4 Add prop to filter storage-only for inventory forms

## 9. Update Existing Pages

- [x] 9.1 Update inventory receive page to use new AppWarehouseSelect
- [x] 9.2 Update inventory list page to support filter by location
- [x] 9.3 Update mobile receive page to use grouped selector
- [x] 9.4 Update any other pages using warehouse selector

## 10. Testing & Verification

- [x] 10.1 Verify migration runs without errors
- [x] 10.2 Test API returns correct flat and tree formats
- [x] 10.3 Test UI displays grouped warehouses correctly
- [x] 10.4 Test inventory operations still work with STORAGE warehouses
- [x] 10.5 Verify backward compatibility - existing warehouse_id references work
