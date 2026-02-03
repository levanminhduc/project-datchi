## ADDED Requirements

### Requirement: Lot Entity Management
The system SHALL manage lots as first-class entities with complete metadata.

#### Scenario: Create new lot
- **WHEN** user submits POST /api/lots with lot_number, thread_type_id, warehouse_id
- **THEN** system creates lot record with status 'ACTIVE'
- **AND** returns lot details with generated id

#### Scenario: Create lot with duplicate lot_number
- **WHEN** user submits POST /api/lots with existing lot_number
- **THEN** system returns 409 Conflict with message "Mã lô đã tồn tại"

#### Scenario: Get lot details
- **WHEN** user requests GET /api/lots/:id
- **THEN** system returns lot metadata and list of cones belonging to lot

#### Scenario: Update lot metadata
- **WHEN** user submits PATCH /api/lots/:id with updated fields
- **THEN** system updates allowed fields (production_date, expiry_date, supplier, notes)
- **AND** returns updated lot details

#### Scenario: List lots with filters
- **WHEN** user requests GET /api/lots with optional filters (status, warehouse_id, thread_type_id)
- **THEN** system returns filtered list of lots ordered by created_at desc

### Requirement: Lot Status Lifecycle
The system SHALL track lot status through defined lifecycle states.

#### Scenario: New lot starts as ACTIVE
- **WHEN** lot is created
- **THEN** lot status SHALL be 'ACTIVE'

#### Scenario: Lot becomes DEPLETED when empty
- **WHEN** last available cone in lot is issued or consumed
- **THEN** lot status SHALL change to 'DEPLETED'

#### Scenario: Lot becomes EXPIRED past expiry date
- **WHEN** lot has expiry_date and current date exceeds expiry_date
- **THEN** lot status SHALL be reported as 'EXPIRED' in queries
- **AND** expired lots SHALL be excluded from batch operations by default

#### Scenario: Manual quarantine of lot
- **WHEN** user submits PATCH /api/lots/:id with status 'QUARANTINE'
- **THEN** lot status changes to 'QUARANTINE'
- **AND** all cones in lot become unavailable for allocation

#### Scenario: Release lot from quarantine
- **WHEN** user submits PATCH /api/lots/:id with status 'ACTIVE' for quarantined lot
- **THEN** lot status changes to 'ACTIVE'
- **AND** cones become available again

### Requirement: Lot-Cone Relationship
The system SHALL maintain relationship between lots and cones.

#### Scenario: Cone linked to lot
- **WHEN** cone is received into a lot
- **THEN** cone.lot_id SHALL reference the lot
- **AND** cone.lot_number SHALL match lot.lot_number

#### Scenario: Query cones by lot
- **WHEN** user requests GET /api/lots/:id/cones
- **THEN** system returns all cones with matching lot_id

#### Scenario: Lot counts updated on cone changes
- **WHEN** cone is added to or removed from lot
- **THEN** lot.total_cones and lot.available_cones SHALL be recalculated

### Requirement: Lot Traceability
The system SHALL support tracing lot history and origin.

#### Scenario: View lot transaction history
- **WHEN** user requests GET /api/lots/:id/transactions
- **THEN** system returns all batch_transactions involving this lot
- **AND** results ordered by performed_at desc

#### Scenario: Search by lot number
- **WHEN** user searches with lot_number query parameter
- **THEN** system returns matching lot(s) with partial match support
