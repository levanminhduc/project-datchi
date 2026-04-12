## MODIFIED Requirements

### Requirement: Auto-reserve inventory on Weekly Order confirmation
The system SHALL automatically reserve available cones when a Weekly Order is confirmed. The PATCH /:id/status endpoint SHALL perform ONLY the atomic confirm + reserve operation. It SHALL NOT perform delivery sync, in-app notification broadcast, or external notification dispatch as part of this endpoint.

#### Scenario: Confirm WO with sufficient inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and 10+ cones AVAILABLE
- **THEN** system SHALL update 10 cones to status=RESERVED_FOR_ORDER and reserved_week_id=week_id

#### Scenario: Confirm WO with partial inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and only 6 cones AVAILABLE
- **THEN** system SHALL reserve 6 cones and return {reserved: 6, shortage: 4}

#### Scenario: Confirm WO with no inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and 0 cones AVAILABLE
- **THEN** system SHALL return {reserved: 0, shortage: 10} and WO status becomes CONFIRMED

#### Scenario: RPC error 42883 during confirmation
- **WHEN** the RPC function fn_reserve_cones_for_week returns error code 42883
- **THEN** system SHALL return HTTP 500 with error message and SHALL NOT set the week status to CONFIRMED

#### Scenario: Idempotent re-confirmation
- **WHEN** user calls PATCH /:id/status with status=CONFIRMED and the week is already CONFIRMED
- **THEN** system SHALL return HTTP 200 with the current week data without re-executing the reservation RPC

## ADDED Requirements

### Requirement: Sync deliveries endpoint
The system SHALL provide a POST /:id/sync-deliveries endpoint that synchronizes delivery data from thread_order_results.summary_data after confirmation.

#### Scenario: Sync deliveries for confirmed week
- **WHEN** POST /:id/sync-deliveries is called for a week with status=CONFIRMED
- **THEN** system SHALL read summary_data from thread_order_results, call syncDeliveries(), and return { data: { synced: true }, error: null }

#### Scenario: Sync deliveries for non-confirmed week
- **WHEN** POST /:id/sync-deliveries is called for a week with status other than CONFIRMED
- **THEN** system SHALL return HTTP 400 with error message indicating the week must be confirmed first

#### Scenario: Idempotent sync deliveries
- **WHEN** POST /:id/sync-deliveries is called multiple times for the same confirmed week
- **THEN** system SHALL execute syncDeliveries() each time without error (the function is idempotent)

### Requirement: Notify confirmation endpoint
The system SHALL provide a POST /:id/notify endpoint that sends in-app and external notifications after confirmation.

#### Scenario: Notify for confirmed week
- **WHEN** POST /:id/notify is called for a week with status=CONFIRMED
- **THEN** system SHALL broadcast in-app notification to warehouse and leader employees and dispatch external notification with event type ORDER_CONFIRMED, then return { data: { notified: true }, error: null }

#### Scenario: Notify for non-confirmed week
- **WHEN** POST /:id/notify is called for a week with status other than CONFIRMED
- **THEN** system SHALL return HTTP 400 with error message indicating the week must be confirmed first

### Requirement: Frontend error propagation for save results
The system SHALL propagate saveResults errors to the confirmation flow so that confirmation is blocked when save fails.

#### Scenario: saveResults fails before confirmation
- **WHEN** saveResults encounters an error during the confirmation flow
- **THEN** the error SHALL propagate to handleConfirmWeek, which SHALL stop the confirmation and display the error to the user

#### Scenario: saveResults succeeds before confirmation
- **WHEN** saveResults completes successfully during the confirmation flow
- **THEN** handleConfirmWeek SHALL proceed to the next confirmation step

### Requirement: Extended timeout for confirmation API call
The system SHALL use a 60-second timeout for the confirmation status update API call instead of the default timeout.

#### Scenario: Confirmation completes within 60 seconds
- **WHEN** the backend RPC takes 25 seconds to process
- **THEN** the frontend SHALL wait for the response and receive the success result

#### Scenario: Confirmation exceeds 60 seconds
- **WHEN** the backend RPC takes more than 60 seconds
- **THEN** the frontend SHALL show a timeout error on the confirmation step and the user MAY retry (the idempotent check will handle the already-confirmed case)
