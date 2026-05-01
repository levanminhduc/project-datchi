## ADDED Requirements

### Requirement: Staleness detection for warehouse selection
The system SHALL track the warehouse IDs that were active at the time of the most recent `calculateAll` call (`lastCalculatedWarehouseIds`). The system SHALL compare this snapshot against the current `selectedWarehouseIds` to produce a boolean `isWarehouseChangedSinceCalc`. Comparison SHALL be order-independent (sort both arrays before comparing).

#### Scenario: Guard activates after warehouse change post-calculation
- **WHEN** the user completes a calculation (clicks "Tính toán" and it succeeds)
- **THEN** `lastCalculatedWarehouseIds` is set to the current `selectedWarehouseIds` value
- **WHEN** the user subsequently toggles any warehouse checkbox
- **THEN** `isWarehouseChangedSinceCalc` becomes `true`

#### Scenario: Guard resets after recalculation
- **WHEN** `isWarehouseChangedSinceCalc` is `true` (user changed warehouses since last calc)
- **WHEN** the user clicks "Tính toán" again and it completes successfully
- **THEN** `lastCalculatedWarehouseIds` is updated to the new selection
- **THEN** `isWarehouseChangedSinceCalc` becomes `false`

#### Scenario: Guard is dormant on initial load
- **WHEN** a DRAFT week is loaded and `lastCalculatedWarehouseIds` is `null`
- **THEN** `isWarehouseChangedSinceCalc` is `false` (null means no baseline to compare against)
- **THEN** no staleness banner is shown

### Requirement: Warning banner for stale warehouse selection
The system SHALL display a warning banner when `isWarehouseChangedSinceCalc` is `true` AND the week status is DRAFT. The banner SHALL contain the message "Bạn đã thay đổi lọc kho. Vui lòng nhấn Tính toán lại trước khi xác nhận." The banner SHALL be dismissed automatically when `isWarehouseChangedSinceCalc` becomes `false`.

#### Scenario: Banner appears when warehouses changed after calculate
- **WHEN** the user has calculated results for a DRAFT week
- **WHEN** the user then adds or removes a warehouse from "Lọc kho tồn"
- **THEN** a warning banner is displayed with the message "Bạn đã thay đổi lọc kho. Vui lòng nhấn Tính toán lại trước khi xác nhận."

#### Scenario: Banner is hidden in CONFIRMED mode
- **WHEN** a week has status CONFIRMED (read-only mode)
- **THEN** the warehouse changed banner is NOT shown regardless of `lastCalculatedWarehouseIds`

#### Scenario: Banner disappears after recalculation
- **WHEN** the warning banner is visible
- **WHEN** the user clicks "Tính toán" and the calculation completes
- **THEN** the banner is no longer displayed

### Requirement: Confirm button disabled when warehouse selection is stale
The system SHALL disable the "Xác nhận" button when `isWarehouseChangedSinceCalc` is `true`. The disabled state SHALL include a tooltip explaining the required action: "Vui lòng tính toán lại sau khi thay đổi kho."

#### Scenario: Confirm disabled when warehouses changed since calc
- **WHEN** `isWarehouseChangedSinceCalc` is `true`
- **THEN** the "Xác nhận" button is disabled
- **THEN** hovering over "Xác nhận" shows tooltip "Vui lòng tính toán lại sau khi thay đổi kho."

#### Scenario: Confirm re-enabled after recalculation
- **WHEN** `isWarehouseChangedSinceCalc` was `true` and the user clicks "Tính toán"
- **WHEN** the calculation completes successfully
- **THEN** `isWarehouseChangedSinceCalc` becomes `false`
- **THEN** the "Xác nhận" button is no longer disabled by this guard (other disable conditions may still apply)

#### Scenario: Confirm not affected by guard in CONFIRMED mode
- **WHEN** week status is CONFIRMED
- **THEN** the "Xác nhận" guard condition does not apply (button may be hidden or handled by existing read-only logic)
