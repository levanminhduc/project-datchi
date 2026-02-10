## MODIFIED Requirements

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
