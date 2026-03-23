## ADDED Requirements

### Requirement: List notifications endpoint
The system SHALL provide `GET /api/notifications` that returns paginated notifications for the authenticated employee, ordered by `created_at` DESC, excluding soft-deleted rows. It SHALL accept optional query parameters: `limit` (default 20, max 50), `offset` (default 0), `type` (filter by notification type), `is_read` (filter by read status).

#### Scenario: Fetch notifications for current user
- **WHEN** an authenticated employee calls `GET /api/notifications`
- **THEN** the response SHALL contain `{ data: Notification[], error: null }` with only that employee's non-deleted notifications

#### Scenario: Filter by type
- **WHEN** an authenticated employee calls `GET /api/notifications?type=STOCK_ALERT`
- **THEN** only notifications with type `STOCK_ALERT` SHALL be returned

#### Scenario: Pagination
- **WHEN** an authenticated employee calls `GET /api/notifications?limit=10&offset=10`
- **THEN** the response SHALL return up to 10 notifications starting from offset 10

### Requirement: Unread count endpoint
The system SHALL provide `GET /api/notifications/unread-count` that returns the count of unread, non-deleted notifications for the authenticated employee.

#### Scenario: Get unread count
- **WHEN** an authenticated employee calls `GET /api/notifications/unread-count`
- **THEN** the response SHALL contain `{ data: { count: number }, error: null }`

#### Scenario: No unread notifications
- **WHEN** the employee has no unread notifications
- **THEN** the count SHALL be 0

### Requirement: Mark single notification as read
The system SHALL provide `PATCH /api/notifications/:id/read` that marks a specific notification as read. It SHALL verify the notification belongs to the authenticated employee.

#### Scenario: Mark as read
- **WHEN** an authenticated employee calls `PATCH /api/notifications/123/read`
- **AND** notification 123 belongs to that employee
- **THEN** `is_read` SHALL be set to `true` and response SHALL be `{ data: { success: true }, error: null }`

#### Scenario: Notification belongs to another employee
- **WHEN** an authenticated employee calls `PATCH /api/notifications/123/read`
- **AND** notification 123 does NOT belong to that employee
- **THEN** the response SHALL be 404 with `{ data: null, error: "Không tìm thấy thông báo" }`

### Requirement: Mark all notifications as read
The system SHALL provide `PATCH /api/notifications/read-all` that marks all unread, non-deleted notifications for the authenticated employee as read.

#### Scenario: Mark all as read
- **WHEN** an authenticated employee calls `PATCH /api/notifications/read-all`
- **THEN** all unread notifications for that employee SHALL have `is_read` set to `true`

### Requirement: Delete notification
The system SHALL provide `DELETE /api/notifications/:id` that soft-deletes a notification. It SHALL verify the notification belongs to the authenticated employee.

#### Scenario: Soft delete
- **WHEN** an authenticated employee calls `DELETE /api/notifications/123`
- **AND** notification 123 belongs to that employee
- **THEN** `deleted_at` SHALL be set to current timestamp

### Requirement: Create notification utility
The backend SHALL expose a `createNotification` utility function that can be called from any route handler to programmatically create notifications. It SHALL accept: `employeeId`, `type`, `title`, `body`, `actionUrl`, `metadata`.

#### Scenario: Create notification from route handler
- **WHEN** an allocation is approved in the allocations route
- **THEN** the handler SHALL call `createNotification` to notify the requesting employee

### Requirement: Broadcast notification utility
The backend SHALL expose a `broadcastNotification` utility function that creates the same notification for multiple employees. It SHALL accept: `employeeIds` (array), `type`, `title`, `body`, `actionUrl`, `metadata`.

#### Scenario: Broadcast to warehouse staff
- **WHEN** a conflict is detected
- **THEN** the handler SHALL call `broadcastNotification` with all warehouse manager employee IDs

### Requirement: Auth middleware integration
All notification endpoints SHALL use `authMiddleware` for authentication. The employee ID SHALL be extracted from `c.get('auth').employeeId`.

#### Scenario: Unauthenticated request
- **WHEN** a request without valid JWT calls any notification endpoint
- **THEN** the response SHALL be 401 with `{ error: true, message: "Token không hợp lệ" }`
