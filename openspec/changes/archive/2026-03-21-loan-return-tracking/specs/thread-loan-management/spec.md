## MODIFIED Requirements

### Requirement: Track loan history
The system SHALL maintain audit trail of all thread loans with partial return tracking.

#### Scenario: Loan record fields
- **WHEN** a loan is created
- **THEN** system SHALL record: from_week_id, to_week_id, thread_type_id, quantity_cones, returned_cones (DEFAULT 0), status (DEFAULT 'ACTIVE'), reason, created_by, created_at

#### Scenario: View loan history for WO
- **WHEN** user views loan history for WO#5
- **THEN** system SHALL return:
  - Loans given: WOs that borrowed from WO#5
  - Loans received: WOs that WO#5 borrowed from
  - Each loan includes `returned_cones` showing partial return progress

## ADDED Requirements

### Requirement: Partial return tracking via returned_cones column
The system SHALL track cumulative returned cones per loan via `returned_cones` column on `thread_order_loans`.

#### Scenario: Column added with backfill
- **WHEN** migration runs
- **THEN** system SHALL add `returned_cones INTEGER NOT NULL DEFAULT 0` to `thread_order_loans`. Existing SETTLED loans get `returned_cones = quantity_cones`. Existing ACTIVE loans get `returned_cones = 0`.

#### Scenario: Auto-return updates returned_cones
- **WHEN** `fn_auto_return_loans()` returns N cones to a loan
- **THEN** system SHALL increment `returned_cones` by N

#### Scenario: Manual return updates returned_cones
- **WHEN** `fn_manual_return_loan()` returns N cones to a loan
- **THEN** system SHALL increment `returned_cones` by N

### Requirement: Cumulative SETTLED condition
The system SHALL settle a loan when cumulative returned cones reach or exceed quantity_cones.

#### Scenario: Auto-return after partial manual return
- **WHEN** loan has quantity_cones=10, returned_cones=6 (from prior manual return), and auto-return returns 4 more cones
- **THEN** system SHALL check `(6 + 4) >= 10 = TRUE` and set `status = 'SETTLED'`

#### Scenario: Single auto-return insufficient
- **WHEN** loan has quantity_cones=10, returned_cones=6, and auto-return returns 2 cones
- **THEN** system SHALL update `returned_cones = 8`, status remains ACTIVE (8 < 10)

### Requirement: Return progress in loan summary dashboard
The system SHALL include aggregated return data in the loan summary dashboard.

#### Scenario: Summary includes returned_cones
- **WHEN** user views loan summary dashboard (`loans.vue` Section 1)
- **THEN** each week row SHALL include aggregated `returned_cones` showing total cones returned across all loans for that week

### Requirement: Return progress display in loan lists
The system SHALL show return progress in loan list tables.

#### Scenario: Returned column in loan table
- **WHEN** user views loan list (both `loans.vue` Section 2 and `weekly-order/[id].vue` loan tab)
- **THEN** each loan row SHALL display "X/Y" format (returned_cones / quantity_cones) with visual progress indicator

### Requirement: fn_loan_detail_by_thread_type includes returned_cones
The system SHALL include returned_cones in the per-thread-type loan breakdown.

#### Scenario: Response includes return data
- **WHEN** `fn_loan_detail_by_thread_type(p_week_id)` is called
- **THEN** each row SHALL include `borrowed_returned_cones` (SUM of returned_cones for loans where this week is the borrower) and `lent_returned_cones` (SUM for loans where this week is the lender)
