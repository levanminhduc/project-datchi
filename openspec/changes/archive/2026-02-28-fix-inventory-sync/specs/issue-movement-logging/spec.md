## ADDED Requirements

### Requirement: Log movement when issuing cones

The system SHALL insert a record into `thread_movements` when cones are issued (status changed to HARD_ALLOCATED) via Issue V2 workflow.

#### Scenario: Issue full cones
- **WHEN** `deductStock()` changes cone status from 'AVAILABLE' to 'HARD_ALLOCATED'
- **THEN** a movement record SHALL be inserted with:
  - `cone_id`: the affected cone ID
  - `movement_type`: 'ISSUE'
  - `quantity_meters`: cone's `quantity_meters`
  - `from_status`: 'AVAILABLE'
  - `to_status`: 'HARD_ALLOCATED'
  - `reference_type`: 'ISSUE_LINE'
  - `reference_id`: the issue line ID

#### Scenario: Issue partial cones
- **WHEN** `deductStock()` changes a partial cone status from 'AVAILABLE' to 'HARD_ALLOCATED'
- **THEN** a movement record SHALL be inserted with the same fields as full cones

### Requirement: Log movement when returning cones

The system SHALL insert a record into `thread_movements` when cones are returned (status changed back to AVAILABLE) via Issue V2 workflow.

#### Scenario: Return full cones
- **WHEN** return route changes cone status from 'HARD_ALLOCATED' to 'AVAILABLE'
- **THEN** a movement record SHALL be inserted with:
  - `cone_id`: the affected cone ID
  - `movement_type`: 'RETURN'
  - `quantity_meters`: cone's `quantity_meters`
  - `from_status`: 'HARD_ALLOCATED'
  - `to_status`: 'AVAILABLE'
  - `reference_type`: 'ISSUE_LINE'
  - `reference_id`: the issue line ID

#### Scenario: Return partial cones (new partial created)
- **WHEN** a new partial cone is created during return
- **THEN** a movement record SHALL be inserted with:
  - `cone_id`: the new partial cone ID
  - `movement_type`: 'RETURN'
  - `from_status`: 'HARD_ALLOCATED'
  - `to_status`: 'AVAILABLE'

### Requirement: Movement records preserve audit context

Each movement record SHALL include reference information to trace back to the originating operation.

#### Scenario: Trace movement to issue line
- **WHEN** a movement is logged for Issue V2 operation
- **THEN** `reference_type` SHALL be 'ISSUE_LINE' and `reference_id` SHALL be the issue_line.id

#### Scenario: Movement includes performer
- **WHEN** a movement is logged
- **THEN** `performed_by` SHALL contain the current user identifier if available
