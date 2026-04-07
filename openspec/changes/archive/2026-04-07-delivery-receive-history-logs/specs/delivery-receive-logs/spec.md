## ADDED Requirements

### Requirement: Delivery receive log table stores every receive event
The system SHALL maintain a `delivery_receive_logs` table recording every delivery receive event as an immutable audit trail.

#### Scenario: Log table schema
- **WHEN** the table is created
- **THEN** it SHALL have columns: `id` (SERIAL PK), `delivery_id` (INTEGER NOT NULL FK to `thread_order_deliveries.id` ON DELETE CASCADE), `quantity` (INTEGER NOT NULL), `warehouse_id` (INTEGER NOT NULL FK to `warehouses.id`), `received_by` (VARCHAR(100) NOT NULL), `notes` (TEXT NULL), `created_at` (TIMESTAMPTZ DEFAULT NOW())
- **THEN** it SHALL have CHECK constraint `chk_receive_log_qty_positive` ensuring `quantity > 0`
- **THEN** it SHALL have indexes on `delivery_id` and `created_at DESC`

#### Scenario: Log entry created on each receive
- **WHEN** `fn_receive_delivery` executes successfully for delivery #5 with quantity=3, warehouse_id=2, received_by='Nguyen Van A'
- **THEN** a row SHALL be inserted into `delivery_receive_logs` with `delivery_id=5`, `quantity=3`, `warehouse_id=2`, `received_by='Nguyen Van A'`, `created_at=NOW()`

#### Scenario: Multiple partial receives create multiple log entries
- **WHEN** delivery #5 is received twice (first 3 cones, then 2 cones)
- **THEN** `delivery_receive_logs` SHALL contain 2 rows for `delivery_id=5` with quantities 3 and 2 respectively

#### Scenario: Cascade delete on delivery removal
- **WHEN** a `thread_order_deliveries` row is deleted
- **THEN** all associated `delivery_receive_logs` rows SHALL be cascade deleted

---

### Requirement: fn_receive_delivery writes log entry atomically
The `fn_receive_delivery` RPC function SHALL INSERT a row into `delivery_receive_logs` within the same transaction as the delivery update.

#### Scenario: Log written in same transaction as delivery update
- **WHEN** `fn_receive_delivery` is called with valid parameters
- **THEN** the INSERT into `delivery_receive_logs` SHALL occur after the UPDATE on `thread_order_deliveries` and before the function returns
- **THEN** if the function fails or rolls back, no log entry SHALL be persisted

#### Scenario: Existing receive behavior unchanged
- **WHEN** `fn_receive_delivery` is called
- **THEN** all existing behavior (update `received_by`, `received_at`, `received_quantity`, `inventory_status`, cone creation, auto-return) SHALL remain unchanged

---

### Requirement: API endpoint to query delivery receive logs
The system SHALL expose `GET /api/weekly-orders/deliveries/receive-logs` to retrieve receive history with optional filters.

#### Scenario: Fetch logs for a specific delivery
- **WHEN** GET `/api/weekly-orders/deliveries/receive-logs?delivery_id=5`
- **THEN** system SHALL return all `delivery_receive_logs` WHERE `delivery_id = 5` ordered by `created_at DESC`
- **THEN** each log entry SHALL include joined data: thread type name, supplier name, week name, warehouse name

#### Scenario: Fetch logs for a specific week
- **WHEN** GET `/api/weekly-orders/deliveries/receive-logs?week_id=10`
- **THEN** system SHALL return all `delivery_receive_logs` for deliveries belonging to week 10, ordered by `created_at DESC`

#### Scenario: Fetch logs without filters
- **WHEN** GET `/api/weekly-orders/deliveries/receive-logs`
- **THEN** system SHALL return the most recent receive logs across all deliveries, limited by the `limit` parameter (default 50)

#### Scenario: Pagination with limit parameter
- **WHEN** GET `/api/weekly-orders/deliveries/receive-logs?limit=20`
- **THEN** system SHALL return at most 20 log entries
- **THEN** the maximum allowed limit SHALL be 100

#### Scenario: Empty results
- **WHEN** no logs match the filter criteria
- **THEN** system SHALL return `{ data: [], error: null }`

#### Scenario: Permission required
- **WHEN** user without `thread.allocations.view` permission calls the endpoint
- **THEN** system SHALL return 403 Forbidden

#### Scenario: Zod validation rejects invalid params
- **WHEN** GET `/api/weekly-orders/deliveries/receive-logs?delivery_id=abc`
- **THEN** system SHALL return 400 with validation error

---

### Requirement: Frontend type definition for delivery receive log
The system SHALL define a `DeliveryReceiveLog` TypeScript interface in the weekly order types file.

#### Scenario: Type includes all log fields plus joined data
- **WHEN** the type is defined
- **THEN** `DeliveryReceiveLog` SHALL include: `id` (number), `delivery_id` (number), `quantity` (number), `warehouse_id` (number), `received_by` (string), `notes` (string | null), `created_at` (string), plus joined fields: `thread_type_name` (string), `supplier_name` (string), `week_name` (string), `warehouse_name` (string)

---

### Requirement: Frontend service method to fetch receive logs
The system SHALL provide a `getReceiveLogs` method in the delivery service.

#### Scenario: Service calls API with correct params
- **WHEN** `getReceiveLogs({ delivery_id: 5, limit: 20 })` is called
- **THEN** it SHALL call `fetchApi('/api/weekly-orders/deliveries/receive-logs?delivery_id=5&limit=20')`

#### Scenario: Service handles empty params
- **WHEN** `getReceiveLogs({})` is called
- **THEN** it SHALL call `fetchApi('/api/weekly-orders/deliveries/receive-logs')` with default server-side limit

---

### Requirement: Deliveries page has third tab for receive history
The deliveries page SHALL display a third tab "Lich su nhap kho" showing chronological receive history.

#### Scenario: Tab navigation includes history tab
- **WHEN** user visits `/thread/weekly-order/deliveries`
- **THEN** the page SHALL display three tabs: "Theo doi giao hang", "Nhap kho", "Lich su nhap kho"

#### Scenario: History tab displays receive logs table
- **WHEN** user clicks "Lich su nhap kho" tab
- **THEN** the system SHALL display a DataTable with columns: Thoi gian (created_at formatted DD/MM/YYYY HH:mm), Tuan (week_name), Loai chi (thread_type_name), NCC (supplier_name), Kho nhap (warehouse_name), So luong cuon (quantity), Nguoi nhap (received_by)
- **THEN** data SHALL be sorted by `created_at DESC` (newest first)

#### Scenario: History tab supports week filter
- **WHEN** user selects a week from the filter dropdown on the history tab
- **THEN** the table SHALL reload showing only logs for deliveries in that week

#### Scenario: History tab loading state
- **WHEN** logs are being fetched
- **THEN** the table SHALL show a loading indicator

#### Scenario: History tab empty state
- **WHEN** no receive logs exist for the current filter
- **THEN** the table SHALL show "Chua co lich su nhap kho"
