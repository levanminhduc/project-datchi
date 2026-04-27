## ADDED Requirements

### Requirement: Backend provides summary fields per thread line
The `GET /:weekId/reserved-by-po` endpoint SHALL include two additional fields in each `ReservedThreadLine` object:
- `total_reserved_for_week`: Total cones with `reserved_week_id = weekId` AND `status = 'RESERVED_FOR_ORDER'` (across ALL warehouses)
- `already_at_destination`: Cones with `reserved_week_id = weekId` AND `warehouse_id = toWarehouseId` AND `status = 'RESERVED_FOR_ORDER'` (0 when `to_warehouse_id` query param is absent)

The endpoint SHALL accept an optional `to_warehouse_id` query parameter to compute `already_at_destination`.

#### Scenario: Summary fields present in response
- **WHEN** `GET /:weekId/reserved-by-po?warehouse_id=1&to_warehouse_id=2` is called
- **THEN** each `thread_lines` item includes `total_reserved_for_week` (number) and `already_at_destination` (number)

#### Scenario: already_at_destination defaults to 0 without to_warehouse_id
- **WHEN** `GET /:weekId/reserved-by-po?warehouse_id=1` is called without `to_warehouse_id`
- **THEN** each `thread_lines` item has `already_at_destination = 0`

#### Scenario: total_reserved_for_week counts all warehouses
- **WHEN** a thread type has 30 cones at source warehouse and 20 cones already at destination (both RESERVED_FOR_ORDER same week)
- **THEN** `total_reserved_for_week = 50`, `reserved_cones_at_source = 30`, `already_at_destination = 20`

### Requirement: PoSection displays summary line per thread row
The `PoSection.vue` component SHALL display a summary for each thread line row in the format:
`Gán: <total_reserved_for_week> | Đã chuyển: <already_at_destination> | Còn: <reserved_cones_at_source>`

The summary SHALL be displayed as a sub-row or additional column within the existing table, visible at all times (not only when row is selected).

The `PoSection` component SHALL receive `to_warehouse_id` as a prop to enable the summary display (summary shown when prop is present and non-null).

#### Scenario: Summary displays correct values
- **WHEN** a thread line has `total_reserved_for_week=50`, `already_at_destination=20`, `reserved_cones_at_source=30`
- **THEN** the row shows "Gán: 50 | Đã chuyển: 20 | Còn: 30"

#### Scenario: Summary visible without selecting the row
- **WHEN** the page loads with data and to_warehouse_id is selected
- **THEN** all thread lines show their summary without requiring the user to check the checkbox

#### Scenario: Summary hidden when to_warehouse_id not selected
- **WHEN** the user has not yet selected a destination warehouse
- **THEN** the summary columns/sub-rows show "—" or are hidden to avoid confusion
