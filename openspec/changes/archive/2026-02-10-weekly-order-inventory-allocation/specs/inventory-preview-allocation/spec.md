## ADDED Requirements

### Requirement: Backend calculates inventory preview allocation

The system SHALL simulate FEFO allocation during thread calculation to provide inventory availability data without modifying cone status.

#### Scenario: Calculate with inventory preview enabled
- **WHEN** frontend calls `/api/thread-calculation` with `include_inventory_preview: true`
- **THEN** backend SHALL return `CalculationItem[]` with additional fields: `inventory_available`, `shortage_cones`, `is_fully_stocked`

#### Scenario: Query available inventory
- **WHEN** backend processes calculation with inventory preview
- **THEN** system SHALL query `thread_inventory` table WHERE `status = 'AVAILABLE'` grouped by `thread_type_id`

### Requirement: Allocation follows position order

The system SHALL allocate inventory to calculation items based on their position in the request array (first position = highest priority).

#### Scenario: First item gets full allocation
- **WHEN** thread type has 15 available cones
- **AND** first item needs 10 cones, second item needs 8 cones
- **THEN** first item receives `inventory_available: 10`, `shortage_cones: 0`, `is_fully_stocked: true`
- **AND** second item receives `inventory_available: 5`, `shortage_cones: 3`, `is_fully_stocked: false`

#### Scenario: Running balance decrements per item
- **WHEN** multiple items share the same thread_type_id
- **THEN** system SHALL track running_available balance
- **AND** each subsequent item receives from remaining balance

### Requirement: Preview is read-only

The system SHALL NOT modify any database records during preview allocation calculation.

#### Scenario: No cone status changes during preview
- **WHEN** preview allocation is calculated
- **THEN** all cones in `thread_inventory` table SHALL remain unchanged
- **AND** no records SHALL be inserted into `thread_allocations` table

### Requirement: Display fully stocked indicator

The system SHALL indicate when inventory fully covers the requirement.

#### Scenario: Fully stocked item display
- **WHEN** `is_fully_stocked` is true for a calculation item
- **THEN** "Ngày Giao" column SHALL display "Sẵn Kho" with green styling
- **AND** delivery date calculation SHALL be skipped

#### Scenario: Partial stock item display
- **WHEN** `is_fully_stocked` is false and `shortage_cones > 0`
- **THEN** "Ngày Giao" column SHALL display "Thiếu {shortage_cones}" with delivery date
- **AND** delivery date SHALL apply to shortage quantity only

### Requirement: Inventory column in detail view

The system SHALL display an "Tồn Kho" column in `ResultsDetailView` showing allocated inventory per row.

#### Scenario: Inventory column displays available count
- **WHEN** calculation results are displayed in detail view
- **THEN** each row SHALL show `inventory_available` value in "Tồn Kho" column
- **AND** column SHALL appear before "Ngày Giao" column

### Requirement: Create allocations on save for shortages

The system SHALL create soft allocation records when saving weekly order results for items with shortages.

#### Scenario: Save creates allocation for shortage items
- **WHEN** user saves weekly order results
- **AND** calculation item has `shortage_cones > 0`
- **THEN** system SHALL create allocation record with `requested_meters = shortage_cones * meters_per_cone`
- **AND** allocation status SHALL be PENDING

#### Scenario: Skip allocation for fully stocked items
- **WHEN** user saves weekly order results
- **AND** calculation item has `is_fully_stocked: true`
- **THEN** system SHALL NOT create allocation record for that item
