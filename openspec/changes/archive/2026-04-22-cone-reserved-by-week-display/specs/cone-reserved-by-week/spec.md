## ADDED Requirements

### Requirement: Cone reservation breakdown by warehouse and week
The system SHALL provide an API endpoint that returns cone inventory grouped by warehouse, with each warehouse expanding into weekly orders (status `CONFIRMED`) that are reserving cones of a given thread type and color.

#### Scenario: Endpoint returns warehouse-week breakdown
- **WHEN** the client calls `GET /api/thread/cone-summary/by-warehouse-week` with `thread_type_id` and `color_id`
- **THEN** the response SHALL return `{ data: { warehouses: [...] }, error: null }` where each warehouse contains `warehouse_id`, `warehouse_code`, `warehouse_name`, an `available` object (`full_cones`, `partial_cones`, `partial_meters`) aggregating cones with status `AVAILABLE`, and a `weeks` array

#### Scenario: Weeks contain only CONFIRMED orders
- **WHEN** building the `weeks` array for each warehouse
- **THEN** the system SHALL include only weekly orders with `thread_order_weeks.status = 'CONFIRMED'` (the `thread_order_weeks` table has no `deleted_at` column) that have at least one cone with `thread_inventory.status = 'RESERVED_FOR_ORDER'` and matching `reserved_week_id`
- **AND** each week entry SHALL contain `week_id`, `week_name`, `status`, `full_cones`, `partial_cones`, `partial_meters`

#### Scenario: Reserved cones with non-CONFIRMED or orphan week reference
- **WHEN** a cone has `status = 'RESERVED_FOR_ORDER'` but its `reserved_week_id` is NULL, references a non-existent week, or references a week whose status is not `CONFIRMED`
- **THEN** the cone SHALL NOT appear in the `weeks` array
- **AND** the cone SHALL be aggregated into an `other_reserved` object per warehouse containing `full_cones`, `partial_cones`, `partial_meters`
- **AND** a warehouse SHALL remain in the response if it has `available > 0` OR any `weeks` entry OR any `other_reserved > 0`

#### Scenario: Optional warehouse filter
- **WHEN** the request includes `warehouse_id` query param
- **THEN** the response SHALL include only that warehouse in the `warehouses` array

#### Scenario: No reserved cones
- **WHEN** no cones are reserved for any CONFIRMED week of the thread type/color
- **THEN** warehouses with available cones SHALL still be returned with an empty `weeks` array and empty `other_reserved`
- **AND** if there are no AVAILABLE or RESERVED_FOR_ORDER cones at all, the `warehouses` array SHALL be empty

#### Scenario: Cone warehouse grouping at fetch time
- **WHEN** a cone's `thread_inventory.warehouse_id` has changed since reservation
- **THEN** the cone SHALL be grouped by its CURRENT `warehouse_id` at query time (no historical reservation warehouse tracking)

#### Scenario: Thread type/color filter
- **WHEN** the request includes `thread_type_id` and `color_id`
- **THEN** the system SHALL include only cones whose `thread_type_id` matches AND whose related thread type's `color_id` matches the param

#### Scenario: Permission required
- **WHEN** the caller lacks `thread.allocations.view` permission
- **THEN** the endpoint SHALL respond with HTTP 403

#### Scenario: Invalid params
- **WHEN** `thread_type_id` is missing or not a positive integer
- **THEN** the endpoint SHALL respond with HTTP 400 and `{ data: null, error: <Vietnamese message> }`

### Requirement: Cone reservation table inside breakdown dialog
The dialog `ConeWarehouseBreakdownDialog` SHALL render a table component below the existing warehouse breakdown table, showing reserved cones grouped by warehouse and expandable to weekly orders.

#### Scenario: Component is mounted below existing breakdown
- **WHEN** the dialog opens with a selected thread type and color
- **THEN** the component `ConeReservedByWeekTable` SHALL be mounted below the warehouse breakdown table inside the dialog body
- **AND** the component SHALL fetch data from `GET /api/thread/cone-summary/by-warehouse-week`

#### Scenario: Group by warehouse with expandable weeks
- **WHEN** the component renders data
- **THEN** each warehouse SHALL be a parent row showing the warehouse name and the available totals (full cones, partial cones, partial meters) plus the count of reserve weeks
- **AND** clicking the expand control SHALL reveal child rows, one per CONFIRMED week, showing `week_name`, `status`, `full_cones`, `partial_cones`, `partial_meters`

#### Scenario: Empty state
- **WHEN** the API returns an empty `warehouses` array
- **THEN** the component SHALL render a Vietnamese empty-state message (e.g., "Không có dữ liệu reserve")

#### Scenario: Loading state
- **WHEN** the fetch is in flight
- **THEN** the component SHALL show a loading indicator and disable interactions

#### Scenario: Inline error state
- **WHEN** the fetch fails (network / 4xx / 5xx)
- **THEN** the component SHALL render an inline Vietnamese error banner (e.g. "Không tải được dữ liệu reserve") with a retry button
- **AND** the component SHALL also surface a snackbar notification, but the inline banner SHALL persist until a successful refetch

#### Scenario: Other reserved indicator
- **WHEN** a warehouse has `other_reserved` totals greater than zero
- **THEN** the component SHALL render an additional row (or tooltip) under that warehouse labeled "Reserve khác (không thuộc tuần CONFIRMED)" showing the totals, to surface data drift cases

#### Scenario: Refetch on prop change
- **WHEN** `threadTypeId`, `colorId`, or `warehouseId` prop changes
- **THEN** the component SHALL refetch data with the new params

### Requirement: Warehouse filter sync from inventory page
The inventory page SHALL pass the active warehouse filter to the breakdown dialog so that both the existing warehouse breakdown table and the new reserved-by-week table show the same warehouse scope.

#### Scenario: No warehouse filter selected
- **WHEN** the user opens the dialog without selecting a warehouse on the inventory page
- **THEN** both tables SHALL display all warehouses for the thread type
- **AND** no filter badge SHALL appear in the dialog header

#### Scenario: Warehouse filter selected
- **WHEN** the user has selected a warehouse on `thread/inventory.vue` and opens the dialog
- **THEN** both the existing warehouse breakdown table and the new reserved-by-week table SHALL display only that warehouse
- **AND** the dialog header SHALL show a Vietnamese badge "Đang lọc theo kho: [tên kho]"
