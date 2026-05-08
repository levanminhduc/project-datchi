## ADDED Requirements

### Requirement: Editable demand column
The system SHALL allow users to edit the "Nhu Cầu" value in the weekly order summary table when results are unsaved (readonly = false, same editability gate as additional_order). The edit SHALL use `quota_cones` as override, preserving the original `total_cones`.

#### Scenario: User edits demand via popup
- **WHEN** user clicks the "Nhu Cầu" cell for a row and the order is not readonly
- **THEN** a popup-edit opens with the current effective demand value (quota_cones ?? total_cones), allowing the user to enter a new number >= 0

#### Scenario: Demand column is readonly when results are saved
- **WHEN** results have been saved (resultsSaved = true) — same gate as additional_order
- **THEN** the "Nhu Cầu" column SHALL NOT be editable (no edit icon, no popup)

#### Scenario: Display shows override with original
- **WHEN** user has set quota_cones to a value different from total_cones
- **THEN** the cell SHALL display `{quota_cones} (gốc: {total_cones})` with a distinct visual style (e.g., text-orange)

#### Scenario: Display shows normal value when no override
- **WHEN** quota_cones is not set or equals total_cones
- **THEN** the cell SHALL display total_cones normally without the "(gốc: ...)" suffix

### Requirement: Downstream recalculation on demand change
The system SHALL recalculate `sl_can_dat` and `total_final` immediately when `quota_cones` changes, using the same formula as current logic but with the override value.

#### Scenario: Recalculation after increase
- **WHEN** user sets quota_cones = 150, equivalent_cones = 40, additional_order = 10
- **THEN** sl_can_dat = max(0, ceil(150 - 40)) = 110, total_final = 110 + 10 = 120

#### Scenario: Recalculation after decrease below inventory
- **WHEN** user sets quota_cones = 30, equivalent_cones = 40, additional_order = 5
- **THEN** sl_can_dat = max(0, ceil(30 - 40)) = 0, total_final = 0 + 5 = 5

#### Scenario: Clear override reverts to calculated
- **WHEN** user clears the quota_cones override (sets value to empty/blank in the popup)
- **THEN** the system SHALL set quota_cones to null and revert to using total_cones for sl_can_dat calculation
- **NOTE**: numeric `0` is a valid override (user explicitly wants 0 demand). Only null/undefined means "no override"

### Requirement: Mandatory note on demand increase
The system SHALL require a "Ghi chú" (note) when the user increases demand (quota_cones > total_cones). The note SHALL be displayed in a dedicated "Ghi chú" column in the summary table.

#### Scenario: Increasing demand requires note
- **WHEN** user sets quota_cones to a value greater than total_cones
- **THEN** the demand popup SHALL include a note input field, and the user MUST enter a non-empty note before the override is accepted (save button disabled until note is provided)

#### Scenario: Note enforcement is frontend-only
- **NOTE**: The mandatory note requirement is enforced at the UI level (popup disables save until note is provided). The backend does NOT reject saves with missing notes — it logs a warning for observability only. This is intentional: the backend save path handles bulk JSONB persistence and should not fail due to missing notes.

#### Scenario: Decreasing demand does not require note
- **WHEN** user sets quota_cones to a value less than or equal to total_cones
- **THEN** the note is optional — the override SHALL be accepted without a note

#### Scenario: Note column displays existing notes
- **WHEN** a row has a demand_note value
- **THEN** the "Ghi chú" column SHALL display the note text

### Requirement: Persistence through save and confirm
The system SHALL persist `quota_cones` and `demand_note` in the JSONB `summary_data` field when saving (draft) or confirming the order.

#### Scenario: Save draft preserves override
- **WHEN** user has set quota_cones and demand_note, then clicks "Lưu Đơn Hàng"
- **THEN** the summary_data JSONB SHALL contain the user's quota_cones and demand_note values

#### Scenario: Load saved week restores override
- **WHEN** user loads a previously saved week that has quota_cones overrides
- **THEN** the system SHALL restore quota_cones and demand_note from saved data, and recalculate sl_can_dat and total_final using the override

#### Scenario: Confirm order uses override for deliveries
- **WHEN** user confirms the order with quota_cones overrides
- **THEN** the total_final (derived from quota_cones) SHALL be used for delivery sync (quantity_cones in thread_order_deliveries)

### Requirement: Backend enrich uses override
The backend `enrichWithInventory` function SHALL use `quota_cones` (if set) instead of `total_cones` when calculating `sl_can_dat`.

#### Scenario: Enrich with override
- **WHEN** a summary row has quota_cones = 80 and total_cones = 100, equivalent_cones = 40
- **THEN** sl_can_dat = max(0, ceil(80 - 40)) = 40 (not ceil(100 - 40) = 60)

#### Scenario: Enrich without override
- **WHEN** a summary row has no quota_cones set (null/undefined) and total_cones = 100
- **THEN** sl_can_dat = max(0, ceil(100 - equivalent_cones)) — same as current behavior

### Requirement: Save does not overwrite user override
The backend save-results endpoint SHALL preserve the user's `quota_cones` when it has been explicitly set, instead of overwriting it with the recalculated value.

#### Scenario: Save preserves user quota_cones
- **WHEN** a summary row has user-set quota_cones = 80 and the recalculated value would be 100
- **THEN** the saved summary_data SHALL retain quota_cones = 80

#### Scenario: Save leaves quota_cones null for rows without override
- **WHEN** a summary row has no user override (quota_cones is null/undefined)
- **THEN** the save endpoint SHALL NOT populate quota_cones — it remains null, and the system uses total_cones as the effective demand
