## ADDED Requirements

### Requirement: Route ordering fix
The system SHALL register `/api/issues/v2` routes BEFORE `/api/issues` routes in server/index.ts to ensure correct route matching.

#### Scenario: Issue V2 form-data endpoint accessible
- **WHEN** client calls `GET /api/issues/v2/form-data?po_id=1&style_id=2&color_id=3`
- **THEN** the request is handled by `issuesV2Router`, not `issuesRouter`

### Requirement: Load PO options from confirmed weekly orders
The system SHALL provide an endpoint to retrieve distinct PO options from `thread_order_items` where:
- The parent `thread_order_weeks.status = 'confirmed'`
- The item has `po_id IS NOT NULL`

#### Scenario: Get PO list
- **WHEN** client calls `GET /api/issues/v2/order-options` with no parameters
- **THEN** system returns distinct POs with `{ id, po_number }` from confirmed weekly order items

#### Scenario: No confirmed weeks
- **WHEN** client calls `GET /api/issues/v2/order-options` and no weeks have status 'confirmed'
- **THEN** system returns empty array `{ data: [] }`

### Requirement: Load Style options filtered by PO
The system SHALL return distinct Styles for a given PO from confirmed weekly order items.

#### Scenario: Get Styles for PO
- **WHEN** client calls `GET /api/issues/v2/order-options?po_id=5`
- **THEN** system returns distinct Styles `{ id, style_code, style_name }` that exist in confirmed weekly order items for that PO

#### Scenario: Invalid PO
- **WHEN** client calls `GET /api/issues/v2/order-options?po_id=999` where PO 999 has no items in confirmed weeks
- **THEN** system returns empty array `{ data: [] }`

### Requirement: Load Color options filtered by PO and Style
The system SHALL return distinct Colors for a given PO + Style combination from confirmed weekly order items.

#### Scenario: Get Colors for PO and Style
- **WHEN** client calls `GET /api/issues/v2/order-options?po_id=5&style_id=10`
- **THEN** system returns distinct Colors `{ id, name, hex_code }` that exist in confirmed weekly order items for that PO + Style

### Requirement: Frontend cascading selection
The Issue V2 page SHALL load PO/Style/Color options from the order-options endpoint with cascading filters.

#### Scenario: Initial page load
- **WHEN** user opens `/thread/issues/v2` page
- **THEN** system loads only PO options from order-options endpoint (not from all purchase orders)

#### Scenario: PO selection triggers Style load
- **WHEN** user selects a PO from the dropdown
- **THEN** system loads Style options filtered by that PO from order-options endpoint
- **THEN** system clears any previously selected Style and Color

#### Scenario: Style selection triggers Color load
- **WHEN** user selects a Style from the dropdown
- **THEN** system loads Color options filtered by PO + Style from order-options endpoint
- **THEN** system clears any previously selected Color

### Requirement: Empty state messaging
The system SHALL display informative messages when no options are available.

#### Scenario: No confirmed orders
- **WHEN** PO dropdown has no options because no confirmed weekly orders exist
- **THEN** system displays message "Không có đơn hàng trong tuần đã xác nhận"

#### Scenario: No styles for PO
- **WHEN** Style dropdown has no options for the selected PO
- **THEN** system displays message "Không có mã hàng cho PO này"

#### Scenario: No colors for Style
- **WHEN** Color dropdown has no options for the selected PO + Style
- **THEN** system displays message "Không có màu cho mã hàng này"
