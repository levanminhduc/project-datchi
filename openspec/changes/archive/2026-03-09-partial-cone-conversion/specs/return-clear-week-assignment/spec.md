## ADDED Requirements

### Requirement: fn_return_cones_with_movements clears week assignment fields
When cones are returned to AVAILABLE status via `fn_return_cones_with_movements`, the function SHALL set `reserved_week_id = NULL` and `original_week_id = NULL` on every returned cone.

#### Scenario: Full return clears week fields
- **WHEN** fn_return_cones_with_movements is called with cone IDs that have `reserved_week_id = NULL` and `original_week_id = 5`
- **THEN** after return, those cones SHALL have `status = 'AVAILABLE'`, `reserved_week_id = NULL`, `original_week_id = NULL`

#### Scenario: Full return on cones with no week assignment
- **WHEN** fn_return_cones_with_movements is called with cone IDs that have `reserved_week_id = NULL` and `original_week_id = NULL`
- **THEN** after return, those cones SHALL have `status = 'AVAILABLE'`, `reserved_week_id = NULL`, `original_week_id = NULL` (no change to week fields)

#### Scenario: Partial return creates new cone without week assignment
- **WHEN** fn_return_cones_with_movements processes a partial return (creating a new partial cone)
- **THEN** the newly created partial cone SHALL have `reserved_week_id = NULL` and `original_week_id = NULL`
- **AND** the original cone (marked CONSUMED) SHALL retain its existing week field values

#### Scenario: Returned cones are available for any future week reservation
- **WHEN** a cone is returned via fn_return_cones_with_movements
- **AND** a different week calls fn_reserve_for_week for the same thread_type_id
- **THEN** the returned cone SHALL be eligible for reservation (status = AVAILABLE, reserved_week_id = NULL)
