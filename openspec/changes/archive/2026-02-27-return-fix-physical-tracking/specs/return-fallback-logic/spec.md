## ADDED Requirements

### Requirement: Return with Quantity Validation Only

The system SHALL validate return quantities against issue line counters, not against inventory status.

#### Scenario: Valid return - within limits
- **WHEN** user submits return with `returned_full <= (issued_full - already_returned_full)` AND `returned_partial <= (issued_partial - already_returned_partial) + (remaining_full_as_convertible)`
- **THEN** system accepts the return and updates counters

#### Scenario: Invalid return - exceeds full issued
- **WHEN** user submits return with `returned_full > (issued_full - already_returned_full)`
- **THEN** system rejects with error containing the exceeded amounts

#### Scenario: Invalid return - exceeds total issued
- **WHEN** user submits return with total returned exceeding total issued
- **THEN** system rejects with error "Tổng trả vượt quá tổng đã xuất"

### Requirement: Fallback When No HARD_ALLOCATED Cones

The system SHALL continue with return operation when `HARD_ALLOCATED` cones are not found in inventory.

#### Scenario: HARD_ALLOCATED cones exist
- **WHEN** inventory has sufficient `HARD_ALLOCATED` cones for the thread_type
- **THEN** system flips cone status to `AVAILABLE` and updates counters

#### Scenario: No HARD_ALLOCATED cones - fallback
- **WHEN** inventory has no `HARD_ALLOCATED` cones for the thread_type
- **THEN** system logs warning, skips inventory update, and proceeds with counter updates

#### Scenario: Partial HARD_ALLOCATED available
- **WHEN** inventory has some but not enough `HARD_ALLOCATED` cones
- **THEN** system flips available cones, logs warning for missing ones, and updates counters

### Requirement: Warning Logs for Audit

The system SHALL log warnings when fallback logic is used for auditability.

#### Scenario: Log on fallback
- **WHEN** return uses fallback (no HARD_ALLOCATED cones found)
- **THEN** system logs: "[return] WARNING: Fallback used for thread_type_id X, issue_id Y - no HARD_ALLOCATED cones"

#### Scenario: Log includes details
- **WHEN** fallback warning is logged
- **THEN** log includes: thread_type_id, issue_id, line_id, requested quantities, found quantities

### Requirement: Simultaneous Full and Partial Return

The system SHALL allow returning both full cones and partial cones in a single request.

#### Scenario: Return both full and partial
- **WHEN** user submits return with both `returned_full > 0` AND `returned_partial > 0` for same line
- **THEN** system processes both quantities in single transaction

#### Scenario: Multiple lines with mixed returns
- **WHEN** user submits return with multiple lines, each having different full/partial combinations
- **THEN** system processes all lines atomically
