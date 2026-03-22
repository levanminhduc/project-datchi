## MODIFIED Requirements

### Requirement: Allocate thread for production order
The system SHALL allocate available cones for production orders using FEFO priority.

#### Scenario: Allocate from AVAILABLE and RESERVED_FOR_ORDER
- **WHEN** fn_allocate_thread is called for thread_type_id with requested_meters
- **THEN** system SHALL query cones WHERE status IN ('AVAILABLE', 'RESERVED_FOR_ORDER') ORDER BY is_partial DESC, expiry_date ASC, received_date ASC

#### Scenario: Allocate reserved cone
- **WHEN** system allocates a cone with status=RESERVED_FOR_ORDER
- **THEN** system SHALL:
  - Update status to SOFT_ALLOCATED
  - Set original_week_id = reserved_week_id (preserve source)
  - Set reserved_week_id = NULL

#### Scenario: Allocate available cone
- **WHEN** system allocates a cone with status=AVAILABLE
- **THEN** system SHALL update status to SOFT_ALLOCATED (no change to week_id columns)
