## ADDED Requirements

### Requirement: Notifications table
The system SHALL have a `notifications` table with columns: `id` (SERIAL PK), `employee_id` (INTEGER FK to employees.id NOT NULL), `type` (VARCHAR NOT NULL), `title` (VARCHAR(255) NOT NULL), `body` (TEXT), `is_read` (BOOLEAN DEFAULT false), `action_url` (VARCHAR(500)), `metadata` (JSONB), `created_at` (TIMESTAMPTZ DEFAULT NOW()), `deleted_at` (TIMESTAMPTZ nullable for soft delete).

#### Scenario: Table creation
- **WHEN** the migration is applied
- **THEN** the `notifications` table SHALL exist with all specified columns, FK constraint to `employees(id)`, and indexes on `employee_id`, `is_read`, `created_at`, and `type`

### Requirement: Notification type values
The system SHALL support notification types: `STOCK_ALERT`, `BATCH_RECEIVE`, `BATCH_ISSUE`, `ALLOCATION`, `CONFLICT`, `RECOVERY`, `WEEKLY_ORDER`.

#### Scenario: Valid notification type
- **WHEN** a notification is inserted with type `STOCK_ALERT`
- **THEN** the insert SHALL succeed

#### Scenario: Invalid notification type
- **WHEN** a notification is inserted with type `UNKNOWN_TYPE`
- **THEN** the insert SHALL be rejected by a CHECK constraint

### Requirement: DB trigger for batch movements
The system SHALL have a trigger on `thread_movements` table that creates a notification when a new row with `movement_type` IN ('RECEIVE', 'ISSUE') is inserted. The notification SHALL target employees with warehouse-related roles.

#### Scenario: Batch receive creates notification
- **WHEN** a new row is inserted into `thread_movements` with `movement_type = 'RECEIVE'`
- **THEN** one notification per warehouse employee SHALL be created with type `BATCH_RECEIVE`, title containing the cone_id, and action_url pointing to the inventory page

#### Scenario: Batch issue creates notification
- **WHEN** a new row is inserted into `thread_movements` with `movement_type = 'ISSUE'`
- **THEN** one notification per warehouse employee SHALL be created with type `BATCH_ISSUE`

### Requirement: DB trigger for stock alerts
The system SHALL have a trigger function that can be called to check if a thread type's available inventory has dropped below its `reorder_level_meters`. If so, it SHALL create a `STOCK_ALERT` notification, but only if no unread `STOCK_ALERT` for the same thread type exists within the last hour (deduplication).

#### Scenario: Stock drops below reorder level
- **WHEN** inventory changes cause a thread type's total available meters to drop below `reorder_level_meters`
- **THEN** a `STOCK_ALERT` notification SHALL be created for warehouse managers with the percentage and thread type name

#### Scenario: Duplicate stock alert within 1 hour
- **WHEN** a `STOCK_ALERT` for the same thread type already exists (unread, created within the last hour)
- **THEN** no new notification SHALL be created

### Requirement: Soft delete support
The system SHALL support soft deletion of notifications by setting `deleted_at` timestamp. Queries SHALL exclude rows where `deleted_at IS NOT NULL` by default.

#### Scenario: Soft delete a notification
- **WHEN** a notification is soft-deleted
- **THEN** `deleted_at` SHALL be set to the current timestamp and the notification SHALL not appear in normal queries
