## ADDED Requirements

### Requirement: Store creator identity on weekly order creation
The system SHALL store the creating employee's `full_name` in the `created_by` column of `thread_order_weeks` when a new weekly order is created via POST `/api/weekly-orders/`.

#### Scenario: Created by is populated on new weekly order
- **WHEN** an authenticated employee creates a new weekly order
- **THEN** the `created_by` field of the new `thread_order_weeks` record SHALL contain the employee's `full_name`

#### Scenario: Creator name persists after employee name change
- **WHEN** an employee's `full_name` is updated after creating a weekly order
- **THEN** the `created_by` value on previously created weekly orders SHALL remain unchanged

### Requirement: Store updater identity on weekly order update
The system SHALL store the updating employee's `full_name` in the `updated_by` column of `thread_order_weeks` when a weekly order is updated via PUT `/api/weekly-orders/:id`.

#### Scenario: Updated by is populated on weekly order update
- **WHEN** an authenticated employee updates a weekly order (status DRAFT)
- **THEN** the `updated_by` field SHALL be set to the employee's `full_name`

#### Scenario: Updated by reflects the last editor
- **WHEN** employee A creates a weekly order and employee B later updates it
- **THEN** `created_by` SHALL contain employee A's name and `updated_by` SHALL contain employee B's name

### Requirement: Display creator name in week history
The `WeekHistoryDialog` component SHALL display a "Người tạo" column showing the `created_by` value for each weekly order.

#### Scenario: Creator name visible in history table
- **WHEN** user opens the week history dialog
- **THEN** each row SHALL display the creator's name in the "Người tạo" column

#### Scenario: Creator name is empty for legacy records
- **WHEN** a weekly order was created before this feature (created_by is null)
- **THEN** the "Người tạo" column SHALL display "—"
