## ADDED Requirements

### Requirement: Week-grouped history endpoint
The system SHALL provide `GET /api/weekly-orders/history-by-week` that returns order history grouped by week with nested PO → Style → Color hierarchy and PO progress data.

#### Scenario: Default request without filters
- **WHEN** client sends `GET /api/weekly-orders/history-by-week`
- **THEN** system returns paginated weeks (default page=1, limit=10) ordered by `created_at` descending, excluding CANCELLED weeks, each containing `po_groups` with nested `styles` and `colors`

#### Scenario: Paginated response
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?page=2&limit=5`
- **THEN** system returns weeks 6-10 with correct `pagination` object containing `page`, `limit`, `total`, `totalPages`

#### Scenario: Filter by PO
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?po_id=123`
- **THEN** system returns only weeks that contain at least one item with `po_id=123`, and within each week only items matching that PO are included

#### Scenario: Filter by style
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?style_id=456`
- **THEN** system returns only weeks that contain at least one item with `style_id=456`, and within each week only items matching that style are included

#### Scenario: Filter by date range
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?from_date=2026-01-01&to_date=2026-03-01`
- **THEN** system returns only weeks with `created_at` within that range (inclusive)

#### Scenario: Filter by status — specific status
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?status=DRAFT`
- **THEN** system returns only weeks with status `DRAFT`

#### Scenario: Filter by status — ALL
- **WHEN** client sends `GET /api/weekly-orders/history-by-week?status=ALL`
- **THEN** system returns weeks of all statuses including CANCELLED

#### Scenario: Default status filter excludes CANCELLED
- **WHEN** client sends `GET /api/weekly-orders/history-by-week` without status param
- **THEN** system excludes weeks with status `CANCELLED`

### Requirement: PO progress data per style
Each style within a week's response SHALL include PO fulfillment progress calculated across all non-CANCELLED weeks.

#### Scenario: Style with partial PO fulfillment
- **WHEN** PO-001 has `po_items.quantity = 5000` for style ST-001, and total ordered across all non-CANCELLED weeks is 3000 (including 1000 in current week)
- **THEN** the style entry shows `po_quantity: 5000`, `total_ordered: 3000`, `this_week_quantity: 1000`, `remaining: 2000`, `progress_pct: 60`

#### Scenario: Style with no PO (po_id is null)
- **WHEN** an item has `po_id = null`
- **THEN** the style entry shows `po_quantity: 0`, `total_ordered: 0`, `this_week_quantity: <sum>`, `remaining: 0`, `progress_pct: 0`, and items are grouped under a "No PO" group

#### Scenario: Style exceeding PO quantity
- **WHEN** total ordered (4200) exceeds `po_items.quantity` (4000)
- **THEN** `remaining: 0`, `progress_pct: 105`

### Requirement: Total quantity per week
Each week entry SHALL include `total_quantity` representing the sum of all item quantities in that week (respecting active filters).

#### Scenario: Week total with filters
- **WHEN** week has items for PO-001 (500 SP) and PO-002 (300 SP), and filter is `po_id=PO-001`
- **THEN** `total_quantity` is 500 (only filtered items counted)

### Requirement: Remove old order-history endpoint
The system SHALL remove `GET /api/weekly-orders/order-history` and all associated code.

#### Scenario: Old endpoint returns 404
- **WHEN** client sends `GET /api/weekly-orders/order-history`
- **THEN** system returns 404 (route no longer exists)

### Requirement: Input validation
The endpoint SHALL validate query parameters using Zod schema.

#### Scenario: Invalid page number
- **WHEN** client sends `?page=-1`
- **THEN** system returns 400 with validation error message

#### Scenario: Limit capped at 100
- **WHEN** client sends `?limit=500`
- **THEN** system caps limit to 100

### Requirement: Authorization
The endpoint SHALL require `thread.allocations.view` permission.

#### Scenario: Unauthorized access
- **WHEN** user lacks `thread.allocations.view` permission
- **THEN** system returns 403
