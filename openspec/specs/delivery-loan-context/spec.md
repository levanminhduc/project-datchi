### Requirement: Delivery tracking shows borrowing context per thread type
The system SHALL display borrowing context alongside delivery tracking data, showing how borrow/lend activity affects the expected delivery quantity.

#### Scenario: Delivery row shows borrowed-in cones
- **WHEN** viewing delivery tracking for W5 and W5 has borrowed 8 cones of thread_type_id=42 from other weeks (active loans where to_week_id = W5)
- **THEN** the delivery row for thread_type_id=42 SHALL show a "Đã mượn" column with value "8 cuộn"

#### Scenario: Delivery row shows lent-out cones
- **WHEN** viewing delivery tracking for W1 and W1 has lent 5 cones of thread_type_id=42 to other weeks (active loans where from_week_id = W1)
- **THEN** the delivery row for thread_type_id=42 SHALL show a "Cho mượn" column with value "5 cuộn"

#### Scenario: Net pending calculation visible
- **WHEN** delivery for W1 thread_type_id=42 has quantity_cones=20, received_quantity=10, and W1 has lent 3 cones of that type
- **THEN** the delivery row SHALL show:
  - Đặt NCC: 20 cuộn (quantity_cones, already adjusted)
  - Đã nhận: 10 cuộn
  - Chờ nhận: 10 cuộn (quantity_cones - received_quantity)
  - Cho mượn: 3 cuộn

#### Scenario: No borrow columns when no loans exist
- **WHEN** viewing delivery tracking and the week has no active loans for any thread type
- **THEN** the "Đã mượn" and "Cho mượn" columns SHALL be hidden to avoid clutter

---

### Requirement: API provides loan context per delivery
The system SHALL provide an endpoint or enhance existing delivery data to include per-thread-type loan aggregates for display.

#### Scenario: Delivery overview includes loan aggregates
- **WHEN** frontend requests delivery overview for a week
- **THEN** the response SHALL include per-delivery:
  - `borrowed_in`: total active loan cones where `to_week_id = week_id AND thread_type_id = delivery.thread_type_id`
  - `lent_out`: total active loan cones where `from_week_id = week_id AND thread_type_id = delivery.thread_type_id`

#### Scenario: Loan aggregates only count active loans
- **WHEN** calculating borrowed_in and lent_out
- **THEN** the system SHALL only count loans with `status = 'ACTIVE' AND deleted_at IS NULL`

---

### Requirement: Loan dashboard shows per-thread-type breakdown
The system SHALL provide a per-thread-type loan breakdown for each week on the loan dashboard page.

#### Scenario: Expandable thread type detail on loan summary
- **WHEN** user clicks on a week row in the loan summary table on `/thread/loans`
- **THEN** the system SHALL expand to show per-thread-type breakdown:
  - Thread type code + name
  - Borrowed cones (active)
  - Lent cones (active)
  - NCC pending cones

#### Scenario: Backend RPC returns per-thread-type data
- **WHEN** frontend requests thread-type breakdown for week_id=5
- **THEN** the system SHALL call `fn_loan_detail_by_thread_type(p_week_id)` which returns array of:
  - `thread_type_id`, `thread_code`, `thread_name`, `color_name`
  - `borrowed_cones`, `lent_cones`, `ncc_ordered`, `ncc_received`, `ncc_pending`

#### Scenario: Only thread types with activity are shown
- **WHEN** a week has deliveries for 10 thread types but only 3 have active loans
- **THEN** the breakdown SHALL show all 10 thread types (from deliveries) with loan columns showing 0 for types without loans
