## ADDED Requirements

### Requirement: Convert permission_action enum to UPPERCASE
The migration SHALL rename all values in the `permission_action` enum from lowercase to UPPERCASE: `view→VIEW`, `create→CREATE`, `edit→EDIT`, `delete→DELETE`, `manage→MANAGE`.

#### Scenario: Enum values are UPPERCASE after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT unnest(enum_range(NULL::permission_action))` SHALL return `VIEW, CREATE, EDIT, DELETE, MANAGE`

#### Scenario: Existing permission records use new values
- **WHEN** the `permissions` table has rows with `action = 'view'`
- **THEN** after migration those rows SHALL have `action = 'VIEW'`

### Requirement: Create po_priority enum
The migration SHALL create a new enum type `po_priority` with values `LOW`, `NORMAL`, `HIGH`, `URGENT` and convert `purchase_orders.priority` from VARCHAR(10) to this enum.

#### Scenario: priority column uses enum type
- **WHEN** the migration runs successfully
- **THEN** `purchase_orders.priority` column type SHALL be `po_priority`
- **THEN** the default value SHALL be `'NORMAL'`

#### Scenario: Existing priority values converted
- **WHEN** `purchase_orders` has rows with `priority = 'normal'`
- **THEN** after migration those rows SHALL have `priority = 'NORMAL'`

### Requirement: Create notification_type enum
The migration SHALL create a new enum type `notification_type` with values `STOCK_ALERT`, `BATCH_RECEIVE`, `BATCH_ISSUE`, `ALLOCATION`, `CONFLICT`, `RECOVERY`, `WEEKLY_ORDER` and convert `notifications.type` from VARCHAR(50) + CHECK constraint to this enum.

#### Scenario: type column uses enum
- **WHEN** the migration runs successfully
- **THEN** `notifications.type` column type SHALL be `notification_type`
- **THEN** the CHECK constraint `chk_notification_type` SHALL be dropped

#### Scenario: Existing notification rows preserved
- **WHEN** `notifications` has rows with `type = 'STOCK_ALERT'`
- **THEN** after migration those rows SHALL still have `type = 'STOCK_ALERT'`
