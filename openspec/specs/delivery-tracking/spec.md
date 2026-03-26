### Requirement: Database table for delivery tracking
The system SHALL have a `thread_order_deliveries` table with columns: `id` (SERIAL PK), `week_id` (FK to `thread_order_weeks`, ON DELETE CASCADE), `thread_type_id` (FK to `thread_types`), `supplier_id` (FK to `suppliers`), `delivery_date` (DATE NOT NULL), `actual_delivery_date` (DATE nullable), `status` (VARCHAR DEFAULT 'pending'), `notes` (TEXT nullable), `created_at`, `updated_at`. The table SHALL have a UNIQUE constraint on `(week_id, thread_type_id)`.

#### Scenario: Table creation
- **WHEN** the migration is applied
- **THEN** the `thread_order_deliveries` table SHALL exist with all specified columns and constraints

#### Scenario: Cascade delete on week removal
- **WHEN** a `thread_order_weeks` record is deleted
- **THEN** all associated `thread_order_deliveries` records SHALL be automatically deleted

#### Scenario: Unique constraint per week and thread type
- **WHEN** a delivery record already exists for week_id=1 and thread_type_id=42
- **AND** an insert is attempted with the same week_id and thread_type_id
- **THEN** the insert SHALL fail with a unique constraint violation

---

### Requirement: Calculation API returns delivery date
The thread calculation API (`/api/thread-calculation/calculate-batch` and `/api/thread-calculation/calculate`) SHALL return `supplier_id`, `delivery_date`, and `lead_time_days` in each `CalculationItem` of the response. The `delivery_date` SHALL be computed as the current date plus the supplier's `lead_time_days`. When `lead_time_days` is NULL or ≤ 0, the system SHALL default to 7 days.

#### Scenario: Supplier with lead_time_days = 10
- **WHEN** the current date is 2026-02-09
- **AND** the supplier for a thread spec has `lead_time_days = 10`
- **THEN** the response SHALL include `supplier_id` matching the supplier, `lead_time_days: 10`, and `delivery_date: "2026-02-19"`

#### Scenario: Supplier with NULL lead_time_days
- **WHEN** a supplier has `lead_time_days = NULL`
- **THEN** the response SHALL use a default of 7 days for `delivery_date` calculation
- **AND** `lead_time_days` SHALL be returned as `7`

#### Scenario: Thread spec without supplier
- **WHEN** a `style_thread_specs` row has no `supplier_id` (NULL)
- **THEN** `supplier_id` SHALL be `null`, `delivery_date` SHALL be `null`, and `lead_time_days` SHALL be `null`

---

### Requirement: Detail table displays delivery date column
The `ResultsDetailView.vue` detail table SHALL display a "Ngày giao" column with behavior that depends on the save state of the weekly order:

**Before save (unsaved results):**
- The column SHALL display an inline-editable DatePicker showing the delivery_date in DD/MM/YYYY format
- Users SHALL be able to click the date to open a DatePicker popup and change the delivery_date
- Edited delivery_dates SHALL be stored locally and NOT persisted until the user saves results
- When results are saved, the locally edited delivery_dates SHALL be included in the persisted data

**After save (saved results):**
- The column SHALL display a countdown format showing days remaining until delivery
- The column SHALL be read-only for regular users
- Users with role `root` or `admin` SHALL still see the inline DatePicker and be able to edit

#### Scenario: Editable date before save
- **WHEN** calculation results are displayed and results have NOT been saved yet
- **AND** a row has `delivery_date: "2026-02-19"`
- **THEN** the "Ngày giao" column SHALL display "19/02/2026" with a clickable DatePicker
- **AND** the user SHALL be able to change the date to a different value

#### Scenario: Local-only changes before save
- **WHEN** a user edits a delivery_date from "2026-02-19" to "2026-02-25" in the detail table
- **AND** the user has NOT yet clicked "Lưu" (Save)
- **THEN** the edited date SHALL be reflected in the UI immediately
- **AND** no API call SHALL be made until the user saves

#### Scenario: Edited dates persisted on save
- **WHEN** the user has edited delivery_dates for some rows
- **AND** the user clicks "Lưu" (Save)
- **THEN** the save API SHALL receive the edited delivery_date values in the calculation_data and summary_data

#### Scenario: Countdown display after save - days remaining
- **WHEN** results have been saved
- **AND** a row has `delivery_date: "2026-02-17"` and today is "2026-02-10"
- **THEN** the "Ngày giao" column SHALL display "còn 7 Ngày"

#### Scenario: Countdown display after save - due today
- **WHEN** results have been saved
- **AND** a row has `delivery_date: "2026-02-10"` and today is "2026-02-10"
- **THEN** the "Ngày giao" column SHALL display "Đã đến hạn Giao"

#### Scenario: Countdown display after save - overdue
- **WHEN** results have been saved
- **AND** a row has `delivery_date: "2026-02-08"` and today is "2026-02-10"
- **THEN** the "Ngày giao" column SHALL display "Đã đến hạn Giao"

#### Scenario: Tooltip shows actual date on countdown
- **WHEN** the countdown format is displayed ("còn N Ngày" or "Đã đến hạn Giao")
- **THEN** hovering over the text SHALL show a tooltip with the actual delivery_date in DD/MM/YYYY format

#### Scenario: Read-only for regular users after save
- **WHEN** results have been saved
- **AND** the current user does NOT have role `root` or `admin`
- **THEN** the "Ngày giao" column SHALL be read-only (no DatePicker, no editing)

#### Scenario: Editable for root/admin after save
- **WHEN** results have been saved
- **AND** the current user has role `root` or `admin`
- **THEN** the "Ngày giao" column SHALL display the DatePicker allowing inline editing
- **AND** changes SHALL be saved via API call

#### Scenario: No delivery date available
- **WHEN** a calculation row has `delivery_date: null` (no supplier linked)
- **THEN** the "Ngày giao" column SHALL display "—" regardless of save state

---

### Requirement: Auto-create delivery records on save
When weekly order results are saved via `POST /api/weekly-orders/:id/results`, the backend SHALL automatically create or update delivery records in `thread_order_deliveries` for each aggregated row that has a valid `supplier_id` and `delivery_date`. The system SHALL use UPSERT on `(week_id, thread_type_id)` to avoid duplicates.

#### Scenario: First save creates delivery records
- **WHEN** results are saved for week_id=1 with 3 aggregated rows each having valid supplier_id
- **THEN** 3 records SHALL be created in `thread_order_deliveries` with status='pending'
- **AND** delivery_date SHALL match the computed dates from the aggregated data

#### Scenario: Re-save updates existing delivery records
- **WHEN** results are re-saved for week_id=1 (recalculated with different quantities)
- **THEN** existing delivery records SHALL be updated (upsert on week_id + thread_type_id)
- **AND** manually edited delivery_date values SHALL be preserved (not overwritten)

#### Scenario: Aggregated row without supplier
- **WHEN** an aggregated row has `supplier_id: null`
- **THEN** no delivery record SHALL be created for that row

---

### Requirement: Delivery CRUD API endpoints
The system SHALL provide API endpoints for managing delivery records:
- `GET /api/weekly-orders/:id/deliveries` — list deliveries for a week with joined supplier and thread type names, plus computed `days_remaining`
- `PATCH /api/weekly-orders/deliveries/:deliveryId` — update delivery_date, actual_delivery_date, status, notes
- `GET /api/weekly-orders/deliveries/overview` — list all deliveries across weeks with filtering by status and date range

#### Scenario: List deliveries for a week
- **WHEN** `GET /api/weekly-orders/5/deliveries` is called
- **AND** week 5 has 3 delivery records
- **THEN** the response SHALL return 3 records with joined `supplier_name`, `thread_type_name`, and computed `days_remaining = delivery_date - current_date`

#### Scenario: Days remaining calculation
- **WHEN** the current date is 2026-02-10 and a delivery has `delivery_date = 2026-02-16`
- **THEN** `days_remaining` SHALL be `6`

#### Scenario: Overdue delivery
- **WHEN** the current date is 2026-02-18 and a delivery has `delivery_date = 2026-02-16` and `status = 'pending'`
- **THEN** `days_remaining` SHALL be `-2`
- **AND** the response SHALL include `is_overdue: true`

#### Scenario: Update delivery date
- **WHEN** `PATCH /api/weekly-orders/deliveries/7` is called with `{ delivery_date: "2026-02-25" }`
- **THEN** the delivery record SHALL be updated with the new date
- **AND** the response SHALL return the updated record

#### Scenario: Mark delivery as delivered
- **WHEN** `PATCH /api/weekly-orders/deliveries/7` is called with `{ status: "delivered", actual_delivery_date: "2026-02-14" }`
- **THEN** the record SHALL be updated with status='delivered' and the actual date

#### Scenario: Overview with status filter
- **WHEN** `GET /api/weekly-orders/deliveries/overview?status=pending` is called
- **THEN** the response SHALL return only deliveries with status='pending' across all weeks

---

### Requirement: Delivery management page
The system SHALL provide a delivery management page at `/thread/weekly-order/deliveries` that displays all delivery records grouped or filterable by week, with the ability to edit delivery dates and mark deliveries as complete.

#### Scenario: Page displays delivery list
- **WHEN** user navigates to `/thread/weekly-order/deliveries`
- **THEN** the page SHALL display a table with columns: Tuần, Loại chỉ, NCC, Ngày giao dự kiến, Còn lại (ngày), Ngày giao thực tế, Trạng thái
- **AND** overdue deliveries (days_remaining < 0, status=pending) SHALL be highlighted in red

#### Scenario: Edit delivery date inline
- **WHEN** user clicks on a delivery date cell
- **THEN** a date picker SHALL appear allowing the user to change the delivery date
- **AND** upon confirmation the system SHALL call `PATCH /api/weekly-orders/deliveries/:id`

#### Scenario: Mark as delivered
- **WHEN** user clicks a "Đã giao" action button on a pending delivery row
- **THEN** a dialog SHALL prompt for the actual delivery date (defaulting to today)
- **AND** upon confirmation the system SHALL update status to 'delivered' and set actual_delivery_date

#### Scenario: Filter by status
- **WHEN** user selects "Chờ giao" filter
- **THEN** only deliveries with status='pending' SHALL be displayed
