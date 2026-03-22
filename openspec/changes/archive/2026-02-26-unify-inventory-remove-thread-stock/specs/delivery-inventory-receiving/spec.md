## MODIFIED Requirements

### Requirement: API endpoint for receiving delivery into inventory
The system SHALL provide `POST /api/weekly-orders/deliveries/:id/receive` endpoint to process inventory receiving. The endpoint SHALL create individual `thread_inventory` cone records with a `lots` record, instead of a single `thread_stock` aggregate record.

#### Scenario: API creates individual inventory cone records
- **WHEN** calling POST `/api/weekly-orders/deliveries/123/receive` with:
  ```json
  { "warehouse_id": 1, "quantity": 5, "received_by": "user@example.com" }
  ```
- **THEN** the API SHALL:
  - Query `thread_types.meters_per_cone` for the delivery's thread_type_id
  - Create 1 `lots` record with `lot_number=LOT-{YYYYMMDD}-{HHmmss}, thread_type_id, warehouse_id, supplier_id` (from delivery), `total_cones=5, available_cones=5, status='ACTIVE'`
  - Create 5 `thread_inventory` records each with:
    - `cone_id`: `DLV-{timestamp}-{seq}`
    - `thread_type_id`: from delivery
    - `warehouse_id`: from request
    - `quantity_meters`: from `thread_types.meters_per_cone`
    - `is_partial`: false
    - `status`: `AVAILABLE`
    - `lot_number`: auto-generated
    - `lot_id`: from created lots record
    - `received_date`: current date
  - Update delivery's `received_quantity`, `inventory_status`, `warehouse_id`, `received_by`, `received_at`
  - Return created cone IDs and updated delivery

#### Scenario: API accepts optional expiry_date
- **WHEN** calling receive with `{ "warehouse_id": 1, "quantity": 5, "received_by": "user@example.com", "expiry_date": "2027-06-15" }`
- **THEN** all created cones SHALL have `expiry_date='2027-06-15'`
- **AND** the lots record SHALL have `expiry_date='2027-06-15'`

#### Scenario: API rejects invalid delivery ID
- **WHEN** calling receive endpoint with non-existent delivery ID
- **THEN** the API SHALL return 404 with error "Không tìm thấy delivery"

#### Scenario: API rejects undelivered item
- **WHEN** calling receive endpoint for delivery with `status != 'delivered'`
- **THEN** the API SHALL return 400 with error "Chỉ có thể nhập kho cho đơn đã giao"

#### Scenario: Partial receive updates delivery status
- **WHEN** user receives 8 cones for a delivery with `total_final = 10`
- **THEN** the delivery SHALL have `inventory_status = 'PARTIAL'` and `received_quantity = 8`

#### Scenario: Full receive updates delivery status
- **WHEN** user receives remaining cones bringing total to match or exceed `total_final`
- **THEN** the delivery SHALL have `inventory_status = 'RECEIVED'`

#### Scenario: Received cones visible to Issue V2 immediately
- **WHEN** delivery receive creates 5 cones with `status='AVAILABLE'`
- **THEN** `issuesV2.ts getStockAvailability()` SHALL include these 5 cones in its count
- **AND** realtime subscriptions on `thread_inventory` SHALL fire for inventory page refresh

---

### Requirement: Cone records created with correct attributes
The system SHALL create `thread_inventory` records with attributes derived from the delivery and thread type.

#### Scenario: Cone attributes populated correctly
- **WHEN** receiving cones for a delivery
- **THEN** each created cone SHALL have:
  - `cone_id`: Auto-generated as `DLV-{timestamp}-{seq}`
  - `thread_type_id`: From delivery record
  - `warehouse_id`: From user selection
  - `quantity_meters`: From `thread_types.meters_per_cone`
  - `status`: `'AVAILABLE'`
  - `lot_number`: Auto-generated lot number
  - `lot_id`: FK to created lots record
  - `received_date`: Current date
  - `expiry_date`: From request body (optional, defaults to null)

---

### Requirement: Lot record created for delivery receive
The system SHALL create a `lots` record when receiving delivery into inventory, linking the lot to the delivery's supplier.

#### Scenario: Lot created with supplier_id from delivery
- **WHEN** receiving delivery with `supplier_id=3`
- **THEN** the `lots` record SHALL have `supplier_id=3`
- **AND** all cone records SHALL have `lot_id` pointing to this lots record
