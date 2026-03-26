## ADDED Requirements

### Requirement: Trigger automatically syncs lots.available_cones

The system SHALL automatically update `lots.available_cones` whenever `thread_inventory` records are inserted, updated, or deleted.

#### Scenario: Cone inserted with lot_id
- **WHEN** a new cone is inserted into `thread_inventory` with a `lot_id`
- **THEN** `lots.available_cones` for that lot SHALL be recalculated as COUNT of cones with status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')

#### Scenario: Cone status changed from AVAILABLE to HARD_ALLOCATED
- **WHEN** a cone's status changes from 'AVAILABLE' to 'HARD_ALLOCATED'
- **THEN** `lots.available_cones` SHALL decrease by 1

#### Scenario: Cone status changed from HARD_ALLOCATED to AVAILABLE
- **WHEN** a cone's status changes from 'HARD_ALLOCATED' to 'AVAILABLE'
- **THEN** `lots.available_cones` SHALL increase by 1

#### Scenario: Cone deleted from lot
- **WHEN** a cone with `lot_id` is deleted from `thread_inventory`
- **THEN** `lots.available_cones` for that lot SHALL be recalculated

#### Scenario: Cone moved between lots
- **WHEN** a cone's `lot_id` changes from lot A to lot B
- **THEN** both `lots.available_cones` for lot A AND lot B SHALL be recalculated

### Requirement: Trigger updates lot status when depleted

The system SHALL automatically update `lots.status` based on available cone count.

#### Scenario: Lot becomes depleted
- **WHEN** `lots.available_cones` becomes 0 after recalculation
- **THEN** `lots.status` SHALL be set to 'DEPLETED'

#### Scenario: Lot becomes active again
- **WHEN** `lots.available_cones` becomes greater than 0 after recalculation
- **AND** current `lots.status` is 'DEPLETED'
- **THEN** `lots.status` SHALL be set to 'ACTIVE'

### Requirement: Available status definition

A cone SHALL be counted as "available" for lot aggregation when its status is one of: 'AVAILABLE', 'RECEIVED', 'INSPECTED'.

#### Scenario: SOFT_ALLOCATED not counted
- **WHEN** a cone has status 'SOFT_ALLOCATED'
- **THEN** it SHALL NOT be counted in `lots.available_cones`

#### Scenario: HARD_ALLOCATED not counted
- **WHEN** a cone has status 'HARD_ALLOCATED'
- **THEN** it SHALL NOT be counted in `lots.available_cones`

#### Scenario: IN_PRODUCTION not counted
- **WHEN** a cone has status 'IN_PRODUCTION'
- **THEN** it SHALL NOT be counted in `lots.available_cones`
