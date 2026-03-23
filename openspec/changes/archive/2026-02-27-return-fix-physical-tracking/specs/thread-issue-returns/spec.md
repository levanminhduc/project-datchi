## MODIFIED Requirements

### Requirement: Return Validation

The system SHALL validate that return quantities are within allowed limits (relaxed from requiring HARD_ALLOCATED cone existence).

#### Scenario: Valid return - quantities within limits
- **WHEN** worker submits return with quantities not exceeding remaining issued amounts
- **THEN** system accepts the return

#### Scenario: Valid return - no inventory check
- **WHEN** worker submits return and inventory has no HARD_ALLOCATED cones
- **THEN** system accepts the return (does not require inventory status check)

#### Scenario: Invalid return - exceeds issued amounts
- **WHEN** worker tries to return more than issued - already_returned
- **THEN** system rejects with error showing the exceeded amounts

### Requirement: Update Inventory on Return

The system SHALL update thread_inventory when cone is returned, with best-effort approach.

#### Scenario: Update status - cones found
- **WHEN** cone is returned AND HARD_ALLOCATED cones exist in inventory
- **THEN** thread_inventory.status changes to AVAILABLE for those cones

#### Scenario: Update status - cones not found
- **WHEN** cone is returned AND no HARD_ALLOCATED cones exist in inventory
- **THEN** system skips inventory update, logs warning, continues with counter updates

#### Scenario: Record movement
- **WHEN** cone is returned
- **THEN** system creates thread_issue_return_logs record
