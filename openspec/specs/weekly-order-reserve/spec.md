## ADDED Requirements

### Requirement: Auto-reserve inventory on Weekly Order confirmation
The system SHALL automatically reserve available cones when a Weekly Order is confirmed.

#### Scenario: Confirm WO with sufficient inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and 10+ cones AVAILABLE
- **THEN** system SHALL update 10 cones to status=RESERVED_FOR_ORDER and reserved_week_id=week_id

#### Scenario: Confirm WO with partial inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and only 6 cones AVAILABLE
- **THEN** system SHALL reserve 6 cones and return {reserved: 6, shortage: 4}

#### Scenario: Confirm WO with no inventory
- **WHEN** user confirms Weekly Order with 10 cones needed and 0 cones AVAILABLE
- **THEN** system SHALL return {reserved: 0, shortage: 10} and WO status becomes CONFIRMED

### Requirement: Auto-release reservations on Weekly Order cancellation
The system SHALL release all reserved cones when a Weekly Order is cancelled.

#### Scenario: Cancel WO with reservations
- **WHEN** user cancels Weekly Order that has 6 reserved cones
- **THEN** system SHALL update those cones to status=AVAILABLE and reserved_week_id=NULL

#### Scenario: Cancel WO with no reservations
- **WHEN** user cancels Weekly Order that has 0 reserved cones
- **THEN** system SHALL update WO status to CANCELLED without inventory changes

### Requirement: Auto-reserve on delivery receipt
The system SHALL automatically reserve newly received cones for the delivery's Weekly Order shortage.

#### Scenario: Receive delivery for WO with shortage
- **WHEN** NCC delivers 10 cones for WO#5 which has shortage of 4
- **THEN** system SHALL reserve 4 cones for WO#5 and leave 6 as AVAILABLE

#### Scenario: Receive delivery for WO with no shortage
- **WHEN** NCC delivers 10 cones for WO#5 which has no shortage
- **THEN** system SHALL leave all 10 cones as AVAILABLE (status=RECEIVED)

### Requirement: View reservation status
The system SHALL display reservation status for Weekly Orders.

#### Scenario: View WO with full reservation
- **WHEN** user views Weekly Order detail
- **THEN** system SHALL display per-thread-type: {needed: X, reserved: Y, shortage: Z}

#### Scenario: View reserved cones list
- **WHEN** user requests reservation detail for a thread type in WO
- **THEN** system SHALL return list of cone_ids reserved for that WO and thread type
