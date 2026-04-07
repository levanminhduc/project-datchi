## MODIFIED Requirements

### Requirement: Deliveries page has two tabs for delivery and receiving
The deliveries page SHALL organize content with three tabs: delivery tracking, inventory receiving, and receive history.

#### Scenario: Tab navigation works
- **WHEN** user visits `/thread/weekly-order/deliveries`
- **THEN** the page SHALL display three tabs:
  - "Theo doi giao hang" (default active) - existing delivery status view
  - "Nhap kho" - pending receive items view
  - "Lich su nhap kho" - chronological receive history view

#### Scenario: Receive tab shows pending items
- **WHEN** user clicks "Nhap kho" tab
- **THEN** the system SHALL display deliveries where:
  - `status = 'delivered'` AND
  - `inventory_status != 'received'`
  - Sorted by `actual_delivery_date` ascending (oldest first)

#### Scenario: Receive tab shows received status
- **WHEN** viewing the receive tab
- **THEN** each row SHALL show:
  - Thread type, supplier, week name
  - Ordered quantity (`total_final`)
  - Received quantity
  - Pending quantity (ordered - received)
  - "Nhap kho" button (enabled if pending > 0)

---

### Requirement: API endpoint for receiving delivery into inventory
The system SHALL provide `POST /api/weekly-orders/deliveries/:id/receive` endpoint to process inventory receiving, returning detailed auto-return information. The receive operation SHALL also create a log entry in `delivery_receive_logs` atomically.

#### Scenario: API response includes auto-return details
- **WHEN** calling POST `/api/weekly-orders/deliveries/123/receive` and auto-return loans are settled
- **THEN** the API SHALL return:
  - `cones_created`: number of cones created
  - `cones_reserved`: number of cones auto-reserved for this week
  - `remaining_shortage`: remaining shortage after reserve
  - `lot_number`: generated lot number
  - `auto_return`: object with `settled`, `returned_cones`, and `details` array containing per-loan settlement info

#### Scenario: Receive creates audit log entry
- **WHEN** calling POST `/api/weekly-orders/deliveries/123/receive` with quantity=5, warehouse_id=2
- **THEN** the system SHALL INSERT a row into `delivery_receive_logs` within the same transaction as the delivery update

#### Scenario: API rejects invalid delivery ID
- **WHEN** calling receive endpoint with non-existent delivery ID
- **THEN** the API SHALL return 400 with error "Khong tim thay don giao hang"

#### Scenario: API rejects undelivered item
- **WHEN** calling receive endpoint for delivery with `status != 'delivered'`
- **THEN** the API SHALL return 400 with error from RPC validation
