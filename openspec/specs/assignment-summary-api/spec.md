## ADDED Requirements

### Requirement: Assignment summary endpoint
The system SHALL provide a GET endpoint at `/api/weekly-orders/assignment-summary` that returns aggregated assignment data for all weekly orders.

#### Scenario: Successful retrieval without filter
- **WHEN** client calls `GET /api/weekly-orders/assignment-summary`
- **THEN** system returns `{ data: AssignmentSummaryRow[], error: null }` with all weeks

#### Scenario: Filter by week status
- **WHEN** client calls `GET /api/weekly-orders/assignment-summary?status=CONFIRMED`
- **THEN** system returns only rows where `thread_order_weeks.status = 'CONFIRMED'`

#### Scenario: Empty result
- **WHEN** no weekly orders match the filter
- **THEN** system returns `{ data: [], error: null }`

### Requirement: Assignment summary response format
Each row in the response SHALL contain:
- `week_id`: number
- `week_name`: string
- `week_status`: string (DRAFT|CONFIRMED|COMPLETED|CANCELLED)
- `thread_type_id`: number
- `thread_type_code`: string
- `thread_type_name`: string
- `planned_cones`: number (from summary_data)
- `reserved_cones`: number (from thread_inventory)
- `allocated_cones`: number (from thread_allocations)
- `gap`: number (reserved_cones - planned_cones)

#### Scenario: Data aggregation from multiple sources
- **WHEN** endpoint is called
- **THEN** `planned_cones` is extracted from `thread_order_results.summary_data` JSONB
- **THEN** `reserved_cones` is COUNT of `thread_inventory` WHERE `reserved_week_id = week_id` AND `status = 'RESERVED_FOR_ORDER'`
- **THEN** `allocated_cones` is derived from `thread_allocations` WHERE `week_id = week_id` AND `status IN ('FULFILLED', 'PARTIAL')`

### Requirement: Authorization
The endpoint SHALL require `thread.allocations.view` permission.

#### Scenario: Unauthorized access
- **WHEN** user without `thread.allocations.view` permission calls the endpoint
- **THEN** system returns HTTP 403 with error message
