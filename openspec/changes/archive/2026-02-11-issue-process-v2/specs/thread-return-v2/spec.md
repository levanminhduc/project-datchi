## ADDED Requirements

### Requirement: Return flow on issue lines
The system SHALL track returns on the same issue line that was issued.

#### Scenario: Return updates existing line
- **WHEN** returning cones for an issue
- **THEN** system SHALL update returned_full and returned_partial on the matching issue line

### Requirement: Return API
The system SHALL provide an API to record returns.

#### Scenario: Return to issue
- **WHEN** client sends POST /api/issues/v2/:id/return with line_id, returned_full, returned_partial
- **THEN** system SHALL update the line and add stock back to inventory

#### Scenario: Return validation
- **WHEN** returned quantity exceeds issued quantity
- **THEN** system SHALL reject with error "Số trả vượt quá số đã xuất"

### Requirement: Return adds stock back
The system SHALL add returned cones back to stock.

#### Scenario: Full cones returned
- **WHEN** returning full cones
- **THEN** system SHALL increase qty_full_cones in thread_stock

#### Scenario: Partial cones returned
- **WHEN** returning partial cones
- **THEN** system SHALL increase qty_partial_cones in thread_stock

### Requirement: Return UI
The system SHALL provide a UI for recording returns.

#### Scenario: Select issue to return
- **WHEN** user navigates to return page
- **THEN** system SHALL show list of confirmed issues with outstanding items

#### Scenario: Enter return quantities
- **WHEN** user selects an issue
- **THEN** system SHALL show all lines with issued vs returned quantities
- **AND** user can enter returned_full and returned_partial for each line

#### Scenario: Confirm return
- **WHEN** user clicks "Xác nhận nhập lại"
- **THEN** system SHALL update return quantities and add stock back

### Requirement: Mark issue fully returned
The system SHALL update issue status when all items are returned.

#### Scenario: All items returned
- **WHEN** all lines have returned_full >= issued_full AND returned_partial >= issued_partial
- **THEN** system SHALL set issue status = RETURNED

#### Scenario: Partial return
- **WHEN** some items are returned but not all
- **THEN** system SHALL keep issue status = CONFIRMED

### Requirement: Calculate net consumption
The system SHALL calculate net consumption for reconciliation.

#### Scenario: Consumption formula
- **WHEN** calculating consumption for a line
- **THEN** system SHALL use: consumed = (issued_full - returned_full) + (issued_partial - returned_partial) × partial_cone_ratio
