## ADDED Requirements

### Requirement: Update permission_action references in backend
All backend code (Zod schemas, route handlers, middleware, services) that references lowercase permission_action values SHALL be updated to use UPPERCASE values.

#### Scenario: Zod schemas validate UPPERCASE permission actions
- **WHEN** a Zod schema validates `permission_action` values
- **THEN** it SHALL accept `VIEW`, `CREATE`, `EDIT`, `DELETE`, `MANAGE`
- **THEN** it SHALL reject `view`, `create`, `edit`, `delete`, `manage`

#### Scenario: Permission seed data uses UPPERCASE
- **WHEN** permission seed SQL or code inserts permission records
- **THEN** the `action` values SHALL be UPPERCASE

### Requirement: Update priority references in backend
All backend code that references `purchase_orders.priority` as a string SHALL be updated to use UPPERCASE enum values (`LOW`, `NORMAL`, `HIGH`, `URGENT`).

#### Scenario: Priority validation uses UPPERCASE
- **WHEN** backend validates priority input
- **THEN** it SHALL accept `LOW`, `NORMAL`, `HIGH`, `URGENT`

### Requirement: Update lots.supplier references in backend
All backend code that reads or writes `lots.supplier` (VARCHAR) SHALL be updated to use `lots.supplier_id` (FK) with a join to the `suppliers` table.

#### Scenario: No backend reference to lots.supplier
- **WHEN** searching backend code for `lots.supplier` (excluding `lots.supplier_id`)
- **THEN** zero results SHALL be found

### Requirement: Update assigned_at references in backend
All backend code that reads or writes `employee_roles.assigned_at` or `employee_permissions.assigned_at` SHALL be updated to use `created_at`.

#### Scenario: No backend reference to assigned_at
- **WHEN** searching backend code for `assigned_at`
- **THEN** zero results SHALL be found in route handlers and services

### Requirement: Update view name in backend queries
All backend code referencing `v_issue_reconciliation_v2` SHALL be updated to reference `v_issue_reconciliation`.

#### Scenario: No backend reference to old view name
- **WHEN** searching backend code for `v_issue_reconciliation_v2`
- **THEN** zero results SHALL be found

### Requirement: Update TypeScript types for enum changes
Backend TypeScript type definitions SHALL reflect the new UPPERCASE enum values and new enum types (`po_priority`, `notification_type`).

#### Scenario: Types match new enum definitions
- **WHEN** TypeScript types are compiled
- **THEN** `PermissionAction` type SHALL have UPPERCASE values
- **THEN** `PoPriority` type SHALL exist with `LOW | NORMAL | HIGH | URGENT`
- **THEN** `NotificationType` type SHALL exist with all notification type values
