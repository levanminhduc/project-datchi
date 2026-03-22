## ADDED Requirements

### Requirement: Display auto-return results after receiving delivery
The system SHALL display a result dialog after successfully receiving a delivery into inventory, showing the full breakdown of what happened including auto-return loan settlements.

#### Scenario: Receive with no active loans
- **WHEN** user receives 10 cones for a delivery and the owning week has no active loans as borrower
- **THEN** the system SHALL display a result dialog showing:
  - "Đã nhập 10 cuộn vào kho"
  - Cones reserved for this week's shortage (if any)
  - Remaining shortage (if any)
  - No auto-return section

#### Scenario: Receive with auto-return settling loans
- **WHEN** user receives 20 cones for W5's delivery, W5 has shortage of 12, and W5 has an active loan of 5 cones from W1
- **THEN** the system SHALL display a result dialog showing:
  - "Đã nhập 20 cuộn vào kho"
  - "12 cuộn đã reserve cho tuần này"
  - Auto-return section: "Đã tự động trả chỉ mượn:"
  - Detail row: "W1 — 5 cuộn (khoản mượn đã thanh toán)"
  - Remaining surplus info if applicable

#### Scenario: Receive with partial auto-return
- **WHEN** user receives 15 cones for W5's delivery, W5 has shortage of 12, W5 has active loan of 5 cones from W1, but only 3 surplus cones available after reserve
- **THEN** the system SHALL display a result dialog showing:
  - Auto-return section with "3 cuộn đã trả" (partial)
  - Loan status remains ACTIVE (not fully settled)

#### Scenario: Result dialog dismissal
- **WHEN** user clicks "Đóng" or presses Escape on the result dialog
- **THEN** the dialog SHALL close and the delivery list SHALL refresh to reflect updated quantities

### Requirement: Backend returns auto-return details in receive response
The system SHALL include detailed auto-return information in the `fn_receive_delivery` response, beyond just the count of settled loans.

#### Scenario: Response includes loan settlement details
- **WHEN** `fn_receive_delivery` triggers `fn_auto_return_loans` and loans are settled
- **THEN** the `auto_return` field in the response SHALL include:
  - `settled`: number of fully settled loans
  - `returned_cones`: total cones returned across all loans
  - `details`: array of `{ loan_id, from_week_id, from_week_name, cones_returned, fully_settled }` for each loan that received returns

#### Scenario: Response with no auto-return activity
- **WHEN** `fn_receive_delivery` creates cones and all are reserved for the owning week (no surplus)
- **THEN** the `auto_return` field SHALL be `{ settled: 0, returned_cones: 0, details: [] }`

#### Scenario: fn_auto_return_loans returns detail array
- **WHEN** `fn_auto_return_loans` processes 2 active loans (loan#1 from W1 for 5 cones, loan#2 from W3 for 3 cones) with 7 available cones
- **THEN** the function SHALL return:
  - `settled: 1` (loan#1 fully settled)
  - `returned_cones: 7`
  - `details: [{ loan_id: 1, from_week_id: W1_id, cones_returned: 5, fully_settled: true }, { loan_id: 2, from_week_id: W3_id, cones_returned: 2, fully_settled: false }]`
