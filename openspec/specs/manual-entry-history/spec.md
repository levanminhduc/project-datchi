## ADDED Requirements

### Requirement: Manual entry history button on inventory page
The inventory page SHALL display a "Lich su nhap" button with a history icon in the toolbar area, next to the existing "Nhap Thu Cong" button.

#### Scenario: Button visibility for authorized users
- **WHEN** user with `thread.batch.receive` permission navigates to the inventory page
- **THEN** the "Lich su nhap" button SHALL be visible next to the "Nhap Thu Cong" button

#### Scenario: Button hidden for unauthorized users
- **WHEN** user without `thread.batch.receive` permission navigates to the inventory page
- **THEN** the "Lich su nhap" button SHALL NOT be visible

#### Scenario: Button opens history dialog
- **WHEN** user clicks the "Lich su nhap" button
- **THEN** a dialog SHALL open displaying the manual entry history table

### Requirement: Manual entry history dialog displays paginated table
The history dialog SHALL display a server-side paginated table of past manual stock entries queried from lots with prefix `MC-LOT-`.

#### Scenario: Dialog layout
- **WHEN** the history dialog opens
- **THEN** it SHALL display a title "Lich Su Nhap Thu Cong", a paginated table, and a close button
- **AND** the dialog SHALL be wide enough to display all columns comfortably (max-width 1100px)

#### Scenario: Table columns
- **WHEN** the history table renders
- **THEN** it SHALL display these columns: Ngay nhap (created_at formatted DD/MM/YYYY HH:mm), Loai chi (thread type name from join), Kho (warehouse name from join), Cuon nguyen (full cone count), Cuon le (partial cone count), Tong cuon (total_cones), Ma lo (lot_number), NCC (supplier name from join), Nguoi nhap (employee name from created_by_employee_id join)

#### Scenario: Default sort order
- **WHEN** the history table loads
- **THEN** rows SHALL be sorted by `created_at` descending (newest first)

#### Scenario: Pagination controls
- **WHEN** the table has more rows than the page size
- **THEN** pagination controls SHALL appear with options [10, 25, 50] rows per page
- **AND** default page size SHALL be 25

#### Scenario: Empty state
- **WHEN** there are no manual entry lots in the database
- **THEN** the table SHALL display a message "Chua co du lieu nhap thu cong"

#### Scenario: Employee column for old entries
- **WHEN** a lot record has NULL `created_by_employee_id`
- **THEN** the Nguoi nhap column SHALL display a dash "-"

### Requirement: Manual entry history API endpoint
The system SHALL provide a `GET /api/stock/manual-history` endpoint that returns paginated manual entry lots.

#### Scenario: Successful paginated query
- **WHEN** client sends `GET /api/stock/manual-history?page=1&pageSize=25`
- **THEN** the endpoint SHALL return lots WHERE `lot_number LIKE 'MC-LOT-%'` with joined data from thread_types, warehouses, suppliers, and employees
- **AND** response format SHALL be `{ data: ManualEntryRow[], count: number, page: number, pageSize: number, error: null }`

#### Scenario: Server-side pagination with range
- **WHEN** client requests page 2 with pageSize 25
- **THEN** the endpoint SHALL use `.range(25, 49)` with `{ count: 'exact' }` to return the correct page and total count

#### Scenario: Permission guard
- **WHEN** a user without `thread.batch.receive` permission calls the endpoint
- **THEN** the endpoint SHALL return 403 Forbidden

#### Scenario: Query parameter validation
- **WHEN** client sends invalid query parameters (e.g., page=-1, pageSize=500)
- **THEN** the endpoint SHALL clamp values to safe defaults (page min 1, pageSize max 100)

#### Scenario: Sort by created_at descending
- **WHEN** the endpoint is called without explicit sort parameters
- **THEN** results SHALL be ordered by `created_at` descending

### Requirement: Cone count breakdown per lot
The API response SHALL include separate counts for full cones and partial cones per lot.

#### Scenario: Cone count computation
- **WHEN** the API builds the response for a lot
- **THEN** it SHALL query `thread_inventory` for that lot_id to count cones where `is_partial = true` (partial count) and `is_partial = false` (full count)

#### Scenario: Lot with only full cones
- **WHEN** a lot has 10 total_cones and 0 partial cones in thread_inventory
- **THEN** the response SHALL show full_cones=10 and partial_cones=0

#### Scenario: Lot with mixed cones
- **WHEN** a lot has 10 total_cones, 7 non-partial and 3 partial in thread_inventory
- **THEN** the response SHALL show full_cones=7 and partial_cones=3

### Requirement: Frontend service method for manual entry history
The `stockService` SHALL provide a `getManualEntryHistory()` method for fetching paginated history data.

#### Scenario: Service method signature
- **WHEN** the frontend needs manual entry history
- **THEN** it SHALL call `stockService.getManualEntryHistory({ page, pageSize })` which returns `Promise<{ data: ManualEntryHistoryRow[], count: number }>`

#### Scenario: Service delegates to fetchApi
- **WHEN** `getManualEntryHistory` is called
- **THEN** it SHALL use `fetchApi()` to call `GET /api/stock/manual-history` with query parameters
