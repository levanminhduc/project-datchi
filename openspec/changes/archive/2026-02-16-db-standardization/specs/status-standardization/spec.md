## ADDED Requirements

### Requirement: Convert purchase_orders.status to UPPERCASE enum
The system SHALL create a `po_status` enum with values: PENDING, IN_PRODUCTION, COMPLETED, CANCELLED. Existing lowercase varchar data SHALL be migrated to UPPERCASE enum values.

#### Scenario: Existing data migrated
- **WHEN** the migration runs
- **THEN** `purchase_orders.status` = 'pending' SHALL become 'PENDING', 'in_production' SHALL become 'IN_PRODUCTION', etc.

#### Scenario: Column type changed
- **WHEN** migration completes
- **THEN** `purchase_orders.status` SHALL be type `po_status` (enum), not varchar

### Requirement: Convert thread_order_weeks.status to UPPERCASE enum
The system SHALL create an `order_week_status` enum with values: DRAFT, CONFIRMED, COMPLETED, CANCELLED. Existing lowercase data SHALL be migrated.

#### Scenario: Existing data migrated
- **WHEN** the migration runs
- **THEN** 'draft' SHALL become 'DRAFT', 'confirmed' SHALL become 'CONFIRMED'

### Requirement: Convert thread_order_deliveries.status to UPPERCASE enum
The system SHALL create a `delivery_status` enum with values: PENDING, DELIVERED, CANCELLED. Existing lowercase data SHALL be migrated.

#### Scenario: Existing data migrated
- **WHEN** the migration runs
- **THEN** 'pending' SHALL become 'PENDING', 'delivered' SHALL become 'DELIVERED'

### Requirement: Convert thread_order_deliveries.inventory_status to UPPERCASE enum
The system SHALL create an `inventory_receipt_status` enum with values: PENDING, PARTIAL, RECEIVED. Existing lowercase data SHALL be migrated.

#### Scenario: Existing data migrated
- **WHEN** the migration runs
- **THEN** 'pending' SHALL become 'PENDING', 'partial' SHALL become 'PARTIAL', 'received' SHALL become 'RECEIVED'

### Requirement: Update backend queries for new enum values
All backend code referencing these status fields SHALL use UPPERCASE values.

#### Scenario: Backend status references updated
- **WHEN** status enums are created
- **THEN** all hardcoded status strings in server/routes/*.ts SHALL use UPPERCASE (e.g., 'PENDING' not 'pending')

#### Scenario: Frontend status display
- **WHEN** status values change to UPPERCASE
- **THEN** frontend types and display logic SHALL handle UPPERCASE values
