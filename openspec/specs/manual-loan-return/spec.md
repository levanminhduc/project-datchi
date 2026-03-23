# manual-loan-return Specification

## Purpose
Manual return of borrowed thread cones from borrower week to lender week, with API endpoint and UI dialog. Synced from change: loan-return-tracking (2026-03-21).

## Requirements

### Requirement: Manual return of borrowed cones
The system SHALL allow users to manually return borrowed cones from a borrower week to a lender week.

#### Scenario: Successful manual return
- **WHEN** user requests manual return of 5 cones for loan #1 (from_week=10, to_week=12, quantity_cones=10, returned_cones=3)
- **THEN** system SHALL:
  - Select 5 cones with `status='RESERVED_FOR_ORDER' AND reserved_week_id=12 AND thread_type_id=loan.thread_type_id` ordered by `received_date ASC` (FIFO)
  - Update each selected cone: `reserved_week_id = 10` (lender week)
  - Update loan: `returned_cones = 3 + 5 = 8`
  - Loan status remains ACTIVE (8 < 10)
  - Insert return log: `(loan_id=1, cones_returned=5, return_type='MANUAL', returned_by=<user>, notes=<optional>)`
  - Return `{ success: true, returned: 5, remaining: 2, settled: false }`

#### Scenario: Manual return completes the loan
- **WHEN** user returns exactly the remaining debt (e.g., loan has quantity_cones=10, returned_cones=8, user returns 2)
- **THEN** system SHALL:
  - Move 2 cones as above
  - Update loan: `returned_cones = 10, status = 'SETTLED'`
  - Insert return log with `cones_returned=2`
  - Return `{ success: true, returned: 2, remaining: 0, settled: true }`

#### Scenario: Return quantity exceeds remaining debt
- **WHEN** user requests to return 6 cones but remaining debt is 4 (quantity_cones=10, returned_cones=6)
- **THEN** system SHALL reject with error "Chỉ có thể trả tối đa 4 cuộn"

#### Scenario: Return quantity is zero or negative
- **WHEN** user requests to return 0 or negative cones
- **THEN** system SHALL reject with error "Số cuộn phải lớn hơn 0"

#### Scenario: Insufficient cones in borrower inventory
- **WHEN** user requests to return 5 cones but borrower week only has 3 RESERVED_FOR_ORDER cones of matching thread type
- **THEN** system SHALL reject with error "Không đủ cuộn khả dụng trong kho tuần mượn (có 3, cần 5)"

#### Scenario: Loan already settled
- **WHEN** user attempts manual return on a SETTLED loan
- **THEN** system SHALL reject with error "Khoản mượn đã được thanh toán đầy đủ"

#### Scenario: Concurrent manual return (race condition)
- **WHEN** two users attempt manual return on the same loan simultaneously
- **THEN** system SHALL use row-level locking (`SELECT FOR UPDATE`) on the loan record. The second request SHALL validate against the updated `returned_cones` value.

### Requirement: Manual return API endpoint
The system SHALL expose `POST /api/weekly-orders/:weekId/loans/:loanId/manual-return` for manual returns.

#### Scenario: Valid API request
- **WHEN** POST with body `{ "quantity": 5, "notes": "Trả bù" }`
- **THEN** system SHALL validate with Zod schema, call `fn_manual_return_loan()`, return `{ data: { success, returned, remaining, settled }, error: null }`

#### Scenario: Invalid request body
- **WHEN** POST with missing or invalid `quantity`
- **THEN** system SHALL return 400 with Zod validation error

#### Scenario: Permission check
- **WHEN** user without `thread.allocations.manage` permission calls this endpoint
- **THEN** system SHALL return 403

### Requirement: Manual return UI dialog
The system SHALL provide a `ManualReturnDialog` component for manual return input.

#### Scenario: Dialog displays loan context
- **WHEN** dialog opens for loan (from_week=T10, to_week=T12, thread_type=60S/2, quantity_cones=10, returned_cones=6)
- **THEN** dialog SHALL show: "Tuần 10 → Tuần 12 | Chỉ 60S/2", "Mượn: 10 cuộn | Đã trả: 6/10", "Còn lại: 4 cuộn"

#### Scenario: Quantity validation in dialog
- **WHEN** user enters quantity > remaining (e.g., 5 when remaining = 4)
- **THEN** submit button SHALL be disabled, input shows validation error "Tối đa 4 cuộn"

#### Scenario: Successful submission
- **WHEN** user submits valid quantity and API returns success
- **THEN** dialog closes, parent component refreshes loan data, snackbar shows "Đã trả X cuộn thành công"

#### Scenario: API error on submission
- **WHEN** API returns error (400/500)
- **THEN** snackbar.error shows server error message, dialog stays open for retry

### Requirement: Manual return button placement
The system SHALL show "Trả thủ công" button for ACTIVE loans in both `loans.vue` and `weekly-order/[id].vue`.

#### Scenario: Button visibility
- **WHEN** loan status = 'ACTIVE'
- **THEN** "Trả thủ công" button SHALL be visible

#### Scenario: Button hidden for settled loans
- **WHEN** loan status = 'SETTLED'
- **THEN** "Trả thủ công" button SHALL NOT be shown
