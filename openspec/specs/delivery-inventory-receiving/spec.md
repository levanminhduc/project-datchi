## ADDED Requirements

### Requirement: Delivery record tracks inventory receiving status
The system SHALL track inventory receiving status separately from delivery status on each `thread_order_deliveries` record with fields: `received_quantity`, `inventory_status`, `warehouse_id`, `received_by`, `received_at`.

#### Scenario: New delivery record defaults
- **WHEN** a delivery record is created from weekly order calculation
- **THEN** the record SHALL have `received_quantity = 0` and `inventory_status = 'pending'`

#### Scenario: Partial receive updates status
- **WHEN** user receives 8 cones for a delivery with `total_final = 10`
- **THEN** the delivery SHALL have `inventory_status = 'partial'` and `received_quantity = 8`

#### Scenario: Full receive updates status
- **WHEN** user receives remaining cones bringing total to match or exceed `total_final`
- **THEN** the delivery SHALL have `inventory_status = 'received'`

---

### Requirement: User can receive delivered items into inventory
The system SHALL provide a UI to receive delivered items into inventory from the deliveries page, requiring warehouse selection and quantity confirmation. After receiving, the system SHALL display a detailed result dialog showing cones created, reservations made, and any auto-return loan settlements.

#### Scenario: Receive dialog opens for delivered item
- **WHEN** user clicks "Nhập kho" button on a delivery with `status = 'delivered'`
- **THEN** the system SHALL display a receive dialog showing:
  - Thread type name and supplier
  - Ordered quantity (`quantity_cones`)
  - Already received quantity
  - Input for quantity to receive (default: remaining quantity)
  - Warehouse selector (required)
  - Expiry date picker (optional)
  - Current user displayed as receiver (auto-filled)

#### Scenario: Receive into inventory succeeds with result dialog
- **WHEN** user confirms receive with valid warehouse and quantity
- **THEN** the system SHALL:
  - Create `quantity` records in `thread_inventory` via `fn_receive_delivery` RPC
  - Close the receive input dialog
  - Open a result dialog showing: cones created, cones reserved, remaining shortage, auto-return details (if any)
  - Refresh delivery list after result dialog is dismissed

#### Scenario: Receive validates warehouse required
- **WHEN** user attempts to receive without selecting a warehouse
- **THEN** the system SHALL show validation error "Vui lòng chọn kho nhập"

#### Scenario: Receive validates quantity
- **WHEN** user enters quantity less than 1
- **THEN** the system SHALL show validation error "Số lượng phải lớn hơn 0"

---

### Requirement: Lot number auto-generated on receive
The system SHALL auto-generate a unique lot number for each receive action using format `LOT-{YYYYMMDD}-{HHmmss}`.

#### Scenario: Lot number created for received cones
- **WHEN** user receives 5 cones at 2026-02-10 14:30:45
- **THEN** all 5 created cones SHALL have `lot_number = 'LOT-20260210-143045'`

---

### Requirement: Cone records created with correct attributes
The system SHALL create `thread_inventory` records with attributes derived from the delivery and thread type.

#### Scenario: Cone attributes populated correctly
- **WHEN** receiving cones for a delivery
- **THEN** each created cone SHALL have:
  - `cone_id`: Auto-generated as `CONE-{timestamp}-{seq}`
  - `thread_type_id`: From delivery record
  - `warehouse_id`: From user selection
  - `quantity_meters`: From `thread_types.meters_per_cone`
  - `status`: `'AVAILABLE'`
  - `lot_number`: Auto-generated lot number
  - `received_date`: Current date

---

### Requirement: Deliveries page has two tabs for delivery and receiving
The deliveries page SHALL organize content with three tabs: delivery tracking, inventory receiving, and receive history.

#### Scenario: Tab navigation works
- **WHEN** user visits `/thread/weekly-order/deliveries`
- **THEN** the page SHALL display three tabs:
  - "Theo doi giao hang" (default active) - existing delivery status view
  - "Nhap kho" - pending receive items view
  - "Lich su nhap kho" - chronological receive history view

#### Scenario: Receive tab shows pending items
- **WHEN** user clicks "Nhập kho" tab
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
  - "Nhập kho" button (enabled if pending > 0)

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
