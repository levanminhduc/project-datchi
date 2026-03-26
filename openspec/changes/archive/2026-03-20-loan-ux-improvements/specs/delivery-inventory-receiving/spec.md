## MODIFIED Requirements

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

### Requirement: API endpoint for receiving delivery into inventory
The system SHALL provide `POST /api/weekly-orders/deliveries/:id/receive` endpoint to process inventory receiving, returning detailed auto-return information.

#### Scenario: API response includes auto-return details
- **WHEN** calling POST `/api/weekly-orders/deliveries/123/receive` and auto-return loans are settled
- **THEN** the API SHALL return:
  - `cones_created`: number of cones created
  - `cones_reserved`: number of cones auto-reserved for this week
  - `remaining_shortage`: remaining shortage after reserve
  - `lot_number`: generated lot number
  - `auto_return`: object with `settled`, `returned_cones`, and `details` array containing per-loan settlement info

#### Scenario: API rejects invalid delivery ID
- **WHEN** calling receive endpoint with non-existent delivery ID
- **THEN** the API SHALL return 400 with error "Không tìm thấy đơn giao hàng"

#### Scenario: API rejects undelivered item
- **WHEN** calling receive endpoint for delivery with `status != 'delivered'`
- **THEN** the API SHALL return 400 with error from RPC validation
