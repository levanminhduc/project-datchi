## Requirements

### Requirement: All route endpoints require permission authorization
Every route handler in the 22 unprotected route files SHALL include `requirePermission()` middleware with the appropriate permission code(s) from the `permissions` table.

#### Scenario: User with correct permission accesses endpoint
- **WHEN** an authenticated user with `thread.inventory.view` permission sends `GET /api/inventory`
- **THEN** the system SHALL allow the request and return data

#### Scenario: User without required permission
- **WHEN** an authenticated user WITHOUT `thread.inventory.view` permission sends `GET /api/inventory`
- **THEN** the system SHALL return HTTP 403 with `{ error: true, message: "Bạn không có quyền thực hiện thao tác này" }`

#### Scenario: ROOT user bypasses all permission checks
- **WHEN** an authenticated ROOT user sends any request to any endpoint
- **THEN** the system SHALL allow the request regardless of specific permissions

### Requirement: Permission mapping for thread management routes
The system SHALL enforce these permission mappings:

**threads.ts** (thread types):
- `GET` endpoints → `requirePermission('thread.types.view')`
- `POST` → `requirePermission('thread.types.create')`
- `PUT` → `requirePermission('thread.types.edit')`
- `DELETE` → `requirePermission('thread.types.delete')`

**colors.ts**:
- `GET` → `requirePermission('thread.colors.view')`
- `POST`, `PUT`, `DELETE` → `requirePermission('thread.colors.manage')`

**suppliers.ts**:
- `GET` → `requirePermission('thread.suppliers.view')`
- `POST`, `PUT`, `DELETE` → `requirePermission('thread.suppliers.manage')`

**inventory.ts**:
- `GET` → `requirePermission('thread.inventory.view')`
- `PUT` → `requirePermission('thread.inventory.edit')`

**lots.ts**:
- `GET` → `requirePermission('thread.lots.view')`
- `POST`, `PUT` → `requirePermission('thread.lots.manage')`

**allocations.ts**:
- `GET` → `requirePermission('thread.allocations.view')`
- `POST`, `PUT`, `DELETE` → `requirePermission('thread.allocations.manage')`

**recovery.ts**:
- `GET` → `requirePermission('thread.recovery.view')`
- `POST`, `PUT` → `requirePermission('thread.recovery.manage')`

**batch.ts**:
- Receive operations → `requirePermission('thread.batch.receive')`
- Issue operations → `requirePermission('thread.batch.issue')`
- Transfer operations → `requirePermission('thread.batch.transfer')`
- `GET` (history/list) → `requirePermission('thread.inventory.view')`

**stock.ts**:
- `GET` → `requirePermission('thread.inventory.view')`
- `POST` (add stock) → `requirePermission('thread.batch.receive')`
- `POST` (deduct/return) → `requirePermission('thread.batch.issue')`

#### Scenario: Warehouse staff can receive stock but not manage allocations
- **WHEN** a user with role `warehouse_staff` (has `thread.batch.receive` but NOT `thread.allocations.manage`) sends `POST /api/allocations`
- **THEN** the system SHALL return HTTP 403

#### Scenario: Planning role can view and manage allocations
- **WHEN** a user with role `planning` (has `thread.allocations.view` and `thread.allocations.manage`) sends `POST /api/allocations`
- **THEN** the system SHALL allow the request

### Requirement: Permission mapping for support routes
The system SHALL enforce these permission mappings for routes that serve supporting data:

**dashboard.ts** → `requirePermission('dashboard.view')`
**reports.ts** → `requirePermission('reports.view')`
**employees.ts**:
- `GET` → `requirePermission('employees.view')`
- `POST` → `requirePermission('employees.create')`
- `PUT` → `requirePermission('employees.edit')`
- `DELETE` → `requirePermission('employees.delete')`

**positions.ts** → `requirePermission('employees.view')`
**warehouses.ts** → `requirePermission('thread.inventory.view')`
**styles.ts** → `requirePermission('thread.types.view')`
**styleThreadSpecs.ts** → `requirePermission('thread.types.view')`
**purchaseOrders.ts** → `requirePermission('thread.lots.view')`
**threadCalculation.ts** → `requirePermission('thread.inventory.view')`
**thread-type-supplier.ts** → `requirePermission('thread.suppliers.view')`
**reconciliation.ts** → `requirePermission('thread.inventory.view')`
**issuesV2.ts** → `requirePermission('thread.allocations.view')`
**weeklyOrder.ts**:
- `GET` → `requirePermission('thread.allocations.view')`
- `POST`, `PUT` → `requirePermission('thread.allocations.manage')`

#### Scenario: Viewer role can see dashboard but not employees
- **WHEN** a user with role `viewer` (has `dashboard.view` but NOT `employees.view`) sends `GET /api/employees`
- **THEN** the system SHALL return HTTP 403

#### Scenario: Viewer role can access dashboard
- **WHEN** a user with role `viewer` (has `dashboard.view`) sends `GET /api/dashboard`
- **THEN** the system SHALL allow the request

### Requirement: Notifications route authorization
The `notifications.ts` route SHALL require authentication (via global middleware) but SHALL NOT require any specific permission — all authenticated users can access their own notifications.

#### Scenario: Any authenticated user can read notifications
- **WHEN** any authenticated user sends `GET /api/notifications`
- **THEN** the system SHALL allow the request and return only that user's notifications
