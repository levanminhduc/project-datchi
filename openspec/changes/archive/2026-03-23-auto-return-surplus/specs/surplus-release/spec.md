## ADDED Requirements

### Requirement: Release surplus reserved cones
The system SHALL release all `RESERVED_FOR_ORDER` cones for a weekly order when the "Trả dư" action is confirmed. Own cones become `AVAILABLE`; borrowed cones return to their original lending week.

#### Scenario: Release own cones to AVAILABLE
- **WHEN** the surplus release executes AND a cone has `reserved_week_id = week_id` AND `original_week_id IS NULL` (or equals `week_id`)
- **THEN** cone status changes to `AVAILABLE`, `reserved_week_id` is cleared, `original_week_id` is cleared

#### Scenario: Return borrowed cones to original week
- **WHEN** the surplus release executes AND a cone has `original_week_id` set to a different week AND that original week status is `CONFIRMED`
- **THEN** cone's `reserved_week_id` changes to `original_week_id`, `original_week_id` is cleared, cone remains `RESERVED_FOR_ORDER`

#### Scenario: Borrowed cone's original week is not CONFIRMED
- **WHEN** the surplus release executes AND a cone has `original_week_id` pointing to a week with status `COMPLETED` or `CANCELLED`
- **THEN** cone becomes `AVAILABLE` (same as own cone), `reserved_week_id` and `original_week_id` are cleared

### Requirement: Auto-settle loans on week completion
The system SHALL automatically settle all active loan records associated with the completing week before releasing cones.

#### Scenario: Auto-settle active loans
- **WHEN** the surplus release executes AND the week has active loans (status `ACTIVE`)
- **THEN** all loan records where `to_week_id = week_id` or `from_week_id = week_id` are updated to `status = 'SETTLED'` with `returned_cones = quantity_cones`

### Requirement: Log WEEK_COMPLETED movements
The system SHALL create a `thread_movements` record for every cone affected by the surplus release, using movement type `WEEK_COMPLETED`.

#### Scenario: Movement logged for released own cone
- **WHEN** an own cone is released to AVAILABLE
- **THEN** a movement record is created with `movement_type = 'WEEK_COMPLETED'`, `from_status = 'RESERVED_FOR_ORDER'`, `to_status = 'AVAILABLE'`, `reference_type = 'WEEK'`, `reference_id = week_id`

#### Scenario: Movement logged for returned borrowed cone
- **WHEN** a borrowed cone is returned to its original week
- **THEN** a movement record is created with `movement_type = 'WEEK_COMPLETED'`, `from_status = 'RESERVED_FOR_ORDER'`, `to_status = 'RESERVED_FOR_ORDER'`, `reference_type = 'WEEK'`, `reference_id = week_id`, notes indicating the return to original week

### Requirement: Atomic surplus release operation
The system SHALL execute the entire surplus release (loan settlement + cone release + movement logging + status update) as a single atomic transaction.

#### Scenario: Rollback on failure
- **WHEN** any step of the surplus release fails (e.g., concurrent modification detected)
- **THEN** the entire operation rolls back — no cones released, no loans settled, week remains `CONFIRMED`

#### Scenario: Concurrent release prevention
- **WHEN** two users attempt "Trả dư" simultaneously on the same week
- **THEN** the first request succeeds, the second receives an error "Tuần đã được hoàn tất"

### Requirement: Surplus release API returns summary
The system SHALL return a summary of the release operation including counts of released own cones, returned borrowed cones, and settled loans.

#### Scenario: Successful release response
- **WHEN** the surplus release completes successfully
- **THEN** the response includes `{ released_own: N, returned_borrowed: M, settled_loans: L, week_status: 'COMPLETED' }`
