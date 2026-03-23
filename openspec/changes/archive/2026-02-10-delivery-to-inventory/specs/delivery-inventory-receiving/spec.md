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
The system SHALL provide a UI to receive delivered items into inventory from the deliveries page, requiring warehouse selection and quantity confirmation.

#### Scenario: Receive dialog opens for delivered item
- **WHEN** user clicks "Nhập kho" button on a delivery with `status = 'delivered'`
- **THEN** the system SHALL display a receive dialog showing:
  - Thread type name and supplier
  - Ordered quantity (`total_final`)
  - Already received quantity
  - Input for quantity to receive (default: remaining quantity)
  - Warehouse selector (required)
  - Current user displayed as receiver (auto-filled)

#### Scenario: Receive into inventory succeeds
- **WHEN** user confirms receive with valid warehouse and quantity
- **THEN** the system SHALL:
  - Create `quantity` records in `thread_inventory` with `status = 'AVAILABLE'`
  - Update delivery's `received_quantity`, `inventory_status`, `warehouse_id`, `received_by`, `received_at`
  - Show success notification with count of cones created

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
The system SHALL organize the deliveries page with two tabs: one for delivery tracking and one for inventory receiving.

#### Scenario: Tab navigation works
- **WHEN** user visits `/thread/weekly-order/deliveries`
- **THEN** the page SHALL display two tabs:
  - "Theo dõi giao hàng" (default active) - existing delivery status view
  - "Nhập kho" - pending receive items view

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
The system SHALL provide `POST /api/weekly-orders/deliveries/:id/receive` endpoint to process inventory receiving.

#### Scenario: API creates inventory records
- **WHEN** calling POST `/api/weekly-orders/deliveries/123/receive` with:
  ```json
  { "warehouse_id": 1, "quantity": 5, "received_by": "user@example.com" }
  ```
- **THEN** the API SHALL:
  - Validate delivery exists and status is 'delivered'
  - Create 5 `thread_inventory` records
  - Update delivery `received_quantity += 5`
  - Update `inventory_status` based on total received vs ordered
  - Return created cone IDs and updated delivery

#### Scenario: API rejects invalid delivery ID
- **WHEN** calling receive endpoint with non-existent delivery ID
- **THEN** the API SHALL return 404 with error "Không tìm thấy delivery"

#### Scenario: API rejects undelivered item
- **WHEN** calling receive endpoint for delivery with `status != 'delivered'`
- **THEN** the API SHALL return 400 with error "Chỉ có thể nhập kho cho đơn đã giao"
