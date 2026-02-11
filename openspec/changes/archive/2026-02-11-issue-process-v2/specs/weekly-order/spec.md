## MODIFIED Requirements

### Requirement: Weekly order items include quota cones
The thread_order_items table SHALL include a quota_cones column for cone-based quota tracking.

#### Scenario: Column addition
- **WHEN** the migration runs
- **THEN** thread_order_items SHALL have new column quota_cones (DECIMAL(8,2) NULL)

### Requirement: Calculate quota cones from meters
The system SHALL calculate quota_cones when calculating weekly order results.

#### Scenario: Quota calculation
- **WHEN** calculating weekly order results
- **THEN** system SHALL compute quota_cones = CEILING(total_meters / meters_per_cone) for each thread type
- **AND** store quota_cones in thread_order_items

#### Scenario: Missing meters_per_cone
- **WHEN** thread_type has no meters_per_cone value
- **THEN** system SHALL use default of 2000 meters and log a warning

### Requirement: User can adjust quota cones
The system SHALL allow users to override the calculated quota_cones value.

#### Scenario: Edit quota
- **WHEN** user edits quota_cones for an order item
- **THEN** system SHALL save the user's value (not recalculate)

### Requirement: Display quota cones in UI
The Weekly Order UI SHALL display quota_cones alongside meters.

#### Scenario: Results display
- **WHEN** viewing weekly order calculation results
- **THEN** system SHALL show columns: Thread Type, Total Meters, Quota Cones
- **AND** Quota Cones SHALL be editable

#### Scenario: Show calculation source
- **WHEN** displaying quota cones
- **THEN** system SHALL show tooltip: "= total_meters / meters_per_cone (có thể điều chỉnh)"
