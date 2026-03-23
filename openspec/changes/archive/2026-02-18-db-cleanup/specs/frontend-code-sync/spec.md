## ADDED Requirements

### Requirement: Update frontend permission types
Frontend TypeScript types for `permission_action` SHALL use UPPERCASE values.

#### Scenario: Frontend permission types are UPPERCASE
- **WHEN** frontend code references permission action values
- **THEN** it SHALL use `VIEW`, `CREATE`, `EDIT`, `DELETE`, `MANAGE`

### Requirement: Update frontend priority types
Frontend TypeScript types and any UI dropdowns for `purchase_orders.priority` SHALL use the new `po_priority` enum values.

#### Scenario: Priority dropdown uses UPPERCASE values
- **WHEN** a priority selector is rendered
- **THEN** the options SHALL use `LOW`, `NORMAL`, `HIGH`, `URGENT` as values

### Requirement: Update frontend notification types
Frontend TypeScript types for notification types SHALL use the `notification_type` enum values.

#### Scenario: Notification type filtering works
- **WHEN** frontend filters notifications by type
- **THEN** it SHALL use the enum values `STOCK_ALERT`, `BATCH_RECEIVE`, `BATCH_ISSUE`, `ALLOCATION`, `CONFLICT`, `RECOVERY`, `WEEKLY_ORDER`

### Requirement: Remove assigned_at from frontend types
Frontend TypeScript types for `employee_roles` and `employee_permissions` SHALL NOT include `assigned_at`.

#### Scenario: No frontend reference to assigned_at
- **WHEN** searching frontend code for `assigned_at`
- **THEN** zero results SHALL be found in type definitions, composables, and components
