## ADDED Requirements

### Requirement: Warehouse selection write paths consolidated to handleCalculate and handleSave
The system SHALL persist warehouse filter selection to the database (`thread_order_week_warehouses`) from exactly two call sites: (1) inside `handleCalculate` when a saved week ID exists and selection is non-empty, and (2) inside `handleSave` for both the create and update branches (always, including empty array). Checkbox toggle SHALL NOT trigger a PUT request to `/:id/warehouses`.

**Implementation note**: The original design called for `handleSave` to also remove the warehouse write path. During testing a UX deadlock was discovered (banner said "click Tính toán" but button was disabled). The resolution was to drop the `canCalculateWithWarehouse` gate and re-add `saveWarehouseFilter` into both `handleSave` branches so the junction is always consistent at save time.

#### Scenario: Checkbox toggle does not write to DB
- **WHEN** the user toggles a warehouse checkbox in the "Lọc kho tồn" multi-select
- **THEN** only the local `selectedWarehouseIds` reactive state is updated
- **THEN** no HTTP PUT request to `/:id/warehouses` is made

#### Scenario: "Lưu" writes warehouse selection as part of atomic save
- **WHEN** the user clicks "Lưu" on an existing DRAFT week (update branch)
- **THEN** the week name, start date, notes, and order items are saved
- **THEN** an HTTP PUT request to `/:id/warehouses` IS made to sync the junction (including empty array)
- **WHEN** the user clicks "Lưu" creating a new week (create branch)
- **THEN** after the week record is created, an HTTP PUT request to `/:id/warehouses` is made to sync the junction

#### Scenario: "Tính toán" persists warehouse selection before calculation
- **WHEN** the user clicks "Tính toán" and a saved week exists (`selectedWeek.value?.id` is non-null) and `selectedWarehouseIds` is non-empty
- **THEN** an HTTP PUT request to `/:id/warehouses` is made BEFORE the enrich-inventory call
- **THEN** `calculateAll` is invoked with the persisted warehouse IDs
- **THEN** if the PUT fails, calculation is aborted and an error snackbar is shown

#### Scenario: "Tính toán" with empty warehouse selection skips PUT
- **WHEN** the user clicks "Tính toán" with no warehouses selected (`selectedWarehouseIds` is empty)
- **THEN** no HTTP PUT request to `/:id/warehouses` is made
- **THEN** `calculateAll` is invoked with `warehouseIds = undefined` (meaning all warehouses)

#### Scenario: New week — calculate runs but warehouse PUT is skipped until save
- **WHEN** the user has not yet saved the week (no `selectedWeek.value?.id`) and has a non-empty warehouse selection
- **THEN** the "Tính toán" button is NOT disabled by this gate (canCalculateWithWarehouse gate was removed to prevent UX deadlock)
- **THEN** `handleCalculate` runs `calculateAll` without calling `saveWarehouseFilter` (no week ID exists yet)
- **THEN** warehouse selection is persisted to the DB when the user subsequently clicks "Lưu" (which always calls `saveWarehouseFilter` in both create and update branches)

#### Scenario: Confirm is consistent with calculation warehouse state
- **WHEN** the user confirms a week immediately after calculation (no warehouse changes in between)
- **THEN** `thread_order_week_warehouses` rows match the warehouse IDs used in the most recent `calculateAll` call
- **THEN** no race condition 400 error occurs from the backend

### Requirement: Single write path eliminates race condition
The system SHALL ensure no concurrent PUT `/warehouses` request can be in-flight at the time the user initiates Confirm. By restricting writes to `handleCalculate` (a user gesture with loading state), simultaneous Confirm + warehouse-write conflicts SHALL be structurally impossible.

#### Scenario: Stress toggle then immediate confirm
- **WHEN** the user rapidly toggles warehouse checkboxes 10 or more times in quick succession
- **THEN** no PUT request fires during toggling
- **WHEN** the user then clicks "Xác nhận" immediately after toggling
- **THEN** no 400 error is returned from the backend
