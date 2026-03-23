## ADDED Requirements

### Requirement: RPC function to reserve from available stock
The system SHALL provide a PostgreSQL function `fn_reserve_from_stock(p_week_id, p_thread_type_id, p_quantity, p_reason, p_user)` that reserves available inventory cones for a confirmed weekly order.

#### Scenario: Reserve available cones successfully
- **WHEN** fn_reserve_from_stock is called with week_id=1, thread_type_id=42, quantity=10
- **AND** week_id=1 is CONFIRMED
- **AND** there are 15 AVAILABLE cones with thread_type_id=42
- **THEN** the function SHALL reserve 10 cones (set status=RESERVED_FOR_ORDER, reserved_week_id=1)
- **AND** return `{ success: true, reserved: 10, shortage: 0, loan_id: <id> }`

#### Scenario: Partial reserve when insufficient stock
- **WHEN** fn_reserve_from_stock is called with quantity=10
- **AND** only 6 AVAILABLE cones exist
- **THEN** the function SHALL reserve 6 cones
- **AND** return `{ success: true, reserved: 6, shortage: 4, loan_id: <id> }`

#### Scenario: Reject for non-confirmed week
- **WHEN** fn_reserve_from_stock is called for a week with status=DRAFT
- **THEN** the function SHALL raise exception "Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận"

#### Scenario: FEFO order respected
- **WHEN** fn_reserve_from_stock reserves cones
- **THEN** cones SHALL be selected in order: is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC

---

### Requirement: Loan record created for stock reservation
When fn_reserve_from_stock reserves cones, it SHALL create a loan record in `thread_order_loans` with `from_week_id = NULL` to indicate the cones came from general stock.

#### Scenario: Loan record with null source
- **WHEN** fn_reserve_from_stock reserves 10 cones for week_id=1
- **THEN** a record SHALL be created in thread_order_loans with:
  - from_week_id = NULL
  - to_week_id = 1
  - thread_type_id = <thread_type_id>
  - quantity_cones = 10
  - reason = <provided reason>
  - created_by = <provided user>

#### Scenario: from_week_id nullable constraint
- **WHEN** the migration is applied
- **THEN** thread_order_loans.from_week_id SHALL be nullable
- **AND** constraint chk_loan_self_borrow SHALL allow from_week_id = NULL

---

### Requirement: Stock reservation reduces delivery quantity_cones
When fn_reserve_from_stock reserves cones, it SHALL reduce the delivery record's `quantity_cones` by the reserved amount.

#### Scenario: Delivery quantity reduced after reserve
- **WHEN** fn_reserve_from_stock reserves 10 cones for week_id=1, thread_type_id=42
- **AND** the delivery has quantity_cones=30
- **THEN** the delivery SHALL have quantity_cones=20 (30 - 10)

#### Scenario: Delivery quantity cannot go negative
- **WHEN** fn_reserve_from_stock reserves 15 cones
- **AND** the delivery has quantity_cones=10
- **THEN** the delivery SHALL have quantity_cones=0 (not -5)

---

### Requirement: API endpoint for reserve from stock
The system SHALL provide `POST /api/weekly-orders/:id/reserve-from-stock` endpoint to reserve available inventory for a confirmed week.

#### Scenario: Successful reserve via API
- **WHEN** POST /api/weekly-orders/1/reserve-from-stock is called with:
  ```json
  { "thread_type_id": 42, "quantity": 10, "reason": "Tồn kho có thêm từ return" }
  ```
- **AND** week_id=1 is CONFIRMED
- **THEN** the API SHALL call fn_reserve_from_stock and return the result
- **AND** response SHALL include loan_id for audit

#### Scenario: Validation rejects missing thread_type_id
- **WHEN** request body is missing thread_type_id
- **THEN** the API SHALL return 400 with error "thread_type_id là bắt buộc"

#### Scenario: Validation rejects invalid quantity
- **WHEN** quantity is 0 or negative
- **THEN** the API SHALL return 400 with error "Số lượng phải lớn hơn 0"

---

### Requirement: UI for reserve from stock action
The weekly order reservation view SHALL display a "Lấy từ tồn kho" button for each thread type with shortage > 0 on CONFIRMED weeks.

#### Scenario: Button visible for thread with shortage
- **WHEN** viewing reservation summary for a CONFIRMED week
- **AND** thread_type_id=42 has shortage > 0
- **THEN** a "Lấy từ tồn kho" button SHALL be displayed for that row

#### Scenario: Button hidden when no shortage
- **WHEN** a thread type has shortage = 0
- **THEN** the "Lấy từ tồn kho" button SHALL NOT be displayed

#### Scenario: Button hidden for non-confirmed weeks
- **WHEN** the week is DRAFT or CANCELLED
- **THEN** no "Lấy từ tồn kho" buttons SHALL be displayed

#### Scenario: Dialog shows available stock and quantity input
- **WHEN** user clicks "Lấy từ tồn kho" for thread_type_id=42
- **THEN** a dialog SHALL display:
  - Thread type name
  - Current shortage amount
  - Available stock count for that thread type
  - Quantity input (default: min(shortage, available))
  - Optional reason input
  - Confirm and Cancel buttons

#### Scenario: Quantity limited to available stock
- **WHEN** shortage=30 and available stock=10
- **THEN** the quantity input max SHALL be 10

#### Scenario: Confirm triggers API call
- **WHEN** user confirms the dialog with quantity=10
- **THEN** the system SHALL call POST /api/weekly-orders/:id/reserve-from-stock
- **AND** refresh the reservation summary on success
- **AND** show success notification with reserved count
