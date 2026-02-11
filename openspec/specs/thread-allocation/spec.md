## MODIFIED Requirements

### Requirement: Allocation Integration with Issue System

The existing allocation system SHALL integrate with the new issue request system by allowing issue items to reference allocation records.

#### Scenario: Issue from allocation
- **WHEN** user issues cones that were allocated via thread_allocations
- **THEN** issue_item.allocation_id references the allocation record

#### Scenario: Update allocation on issue
- **WHEN** cone is issued with allocation_id reference
- **THEN** allocation.issued_meters is incremented

#### Scenario: Direct issue without allocation
- **WHEN** user issues cones directly (not via allocation)
- **THEN** allocation_id is NULL and allocation records are not affected

#### Scenario: View allocation source in issue detail
- **WHEN** user views issue item with allocation_id
- **THEN** system shows allocation reference and original allocation details
