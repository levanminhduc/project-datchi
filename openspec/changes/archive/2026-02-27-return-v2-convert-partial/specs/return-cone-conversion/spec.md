## ADDED Requirements

### Requirement: Return validation allows cross-type conversion
The system SHALL validate return quantities using total-based rules instead of per-type rules.

#### Scenario: Valid return with more partial than issued partial
- **WHEN** an issue has `issued_full=5, issued_partial=2` and user submits `returned_full=1, returned_partial=5`
- **THEN** system SHALL accept the return because `returned_full(1) <= issued_full(5)` AND `total_returned(6) <= total_issued(7)`

#### Scenario: Invalid return exceeding total
- **WHEN** an issue has `issued_full=5, issued_partial=2` and user submits `returned_full=2, returned_partial=6`
- **THEN** system SHALL reject with error because `total_returned(8) > total_issued(7)`

#### Scenario: Invalid return exceeding full cones
- **WHEN** an issue has `issued_full=5, issued_partial=2` and user submits `returned_full=6, returned_partial=0`
- **THEN** system SHALL reject with error because `returned_full(6) > issued_full(5)`

### Requirement: Auto-convert full cones to partial on return
The system SHALL automatically convert full cones to partial cones when returning more partial cones than available in HARD_ALLOCATED status.

#### Scenario: Partial return uses existing partial cones first
- **WHEN** returning 3 partial cones and 3 partial cones are HARD_ALLOCATED for this thread type
- **THEN** system SHALL update those 3 partial cones to AVAILABLE status without changing `is_partial`

#### Scenario: Partial return converts full cones when insufficient partial
- **WHEN** returning 5 partial cones but only 2 partial cones are HARD_ALLOCATED
- **THEN** system SHALL:
  - Update the 2 partial cones to AVAILABLE (keeping `is_partial=true`)
  - Find 3 full cones with `is_partial=false` and `status=HARD_ALLOCATED`
  - Update those 3 full cones: `status=AVAILABLE`, `is_partial=true`, `quantity_meters=meters_per_cone * partial_cone_ratio`

#### Scenario: Conversion uses partial_cone_ratio from settings
- **WHEN** converting a full cone to partial
- **THEN** system SHALL calculate `quantity_meters = thread_types.meters_per_cone * system_settings.partial_cone_ratio` (default 0.3)

### Requirement: Return full cones without conversion
The system SHALL return full cones without converting them to partial.

#### Scenario: Full cone return preserves is_partial flag
- **WHEN** returning full cones (`returned_full > 0`)
- **THEN** system SHALL find cones with `is_partial=false` and `status=HARD_ALLOCATED`, update to `status=AVAILABLE` while keeping `is_partial=false`

### Requirement: Frontend validation matches backend rules
The frontend validation in useReturnV2 SHALL apply the same validation formula as the backend.

#### Scenario: Frontend allows valid cross-type return
- **WHEN** user enters `returned_partial > issued_partial` but `total_returned <= total_issued`
- **THEN** frontend SHALL NOT show validation error

#### Scenario: Frontend rejects invalid total
- **WHEN** user enters quantities where `total_returned > total_issued`
- **THEN** frontend SHALL show validation error before submission
