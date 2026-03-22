## ADDED Requirements

### Requirement: Manual thread borrowing between Weekly Orders
The system SHALL allow users to manually borrow reserved cones from one WO for another.

#### Scenario: Borrow threads successfully
- **WHEN** user requests to borrow 5 cones of thread_type_id=1 from WO#5 for WO#3 with reason
- **THEN** system SHALL:
  - Update 5 cones: reserved_week_id=5→3, original_week_id=5
  - INSERT into thread_order_loans (from=5, to=3, qty=5, reason)

#### Scenario: Borrow more than available
- **WHEN** user requests to borrow 10 cones but WO#5 only has 6 reserved
- **THEN** system SHALL return error "Không đủ chỉ để mượn"

#### Scenario: Borrow from same WO
- **WHEN** user requests to borrow from WO#5 for WO#5
- **THEN** system SHALL return error "Không thể mượn từ cùng một đơn"

### Requirement: Track loan history
The system SHALL maintain audit trail of all thread loans.

#### Scenario: View loan history for WO
- **WHEN** user views loan history for WO#5
- **THEN** system SHALL return:
  - Loans given: WOs that borrowed from WO#5
  - Loans received: WOs that WO#5 borrowed from

#### Scenario: Loan record fields
- **WHEN** a loan is created
- **THEN** system SHALL record: from_week_id, to_week_id, thread_type_id, quantity, reason, created_by, created_at

### Requirement: Auto-record loan on cross-WO allocation
The system SHALL automatically record a loan when allocating cones reserved for a different WO.

#### Scenario: Allocate from different WO's reservation
- **WHEN** PO#1234 (belongs to WO#3) allocates CONE-001 (reserved for WO#5)
- **THEN** system SHALL:
  - Clear cone's reserved_week_id
  - Set cone's original_week_id=5
  - INSERT thread_order_loans (from=5, to=3, qty=1, reason="Auto: PO allocation")
