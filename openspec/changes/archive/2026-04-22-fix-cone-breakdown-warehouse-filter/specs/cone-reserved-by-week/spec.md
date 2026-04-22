## MODIFIED Requirements

### Requirement: Warehouse filter sync from inventory page
The inventory page SHALL pass the active warehouse filter to the breakdown dialog so that both the existing warehouse breakdown table and the new reserved-by-week table show the same warehouse scope. The page MUST bind both `warehouse-id` (from `filters.warehouse_id`) and `warehouse-name` (from the computed `selectedWarehouseName`) props on `ConeWarehouseBreakdownDialog` whenever the dialog is mounted.

#### Scenario: No warehouse filter selected
- **WHEN** the user opens the dialog without selecting a warehouse on the inventory page
- **THEN** both `warehouse-id` and `warehouse-name` props SHALL be `null`
- **AND** both tables SHALL display all warehouses for the thread type
- **AND** no filter badge SHALL appear in the dialog header

#### Scenario: Warehouse filter selected
- **WHEN** the user has selected a warehouse on `thread/inventory.vue` and opens the dialog
- **THEN** the page SHALL pass `:warehouse-id="filters.warehouse_id"` and `:warehouse-name="selectedWarehouseName"` to the dialog
- **AND** both the existing warehouse breakdown table and the new reserved-by-week table SHALL display only that warehouse
- **AND** the dialog header SHALL show a Vietnamese badge "Đang lọc theo kho: [tên kho]"

#### Scenario: Warehouse filter changes while dialog reopened
- **WHEN** the user changes the warehouse filter, closes and reopens the dialog
- **THEN** the new `warehouse_id` SHALL flow through to `ConeReservedByWeekTable`
- **AND** the table SHALL refetch and display data scoped to the new warehouse
