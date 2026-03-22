## ADDED Requirements

### Requirement: Configurable reserve priority setting
The system SHALL store a `reserve_priority` key in `system_settings` with allowed values `partial_first` (default) or `full_first`.

#### Scenario: Default setting exists after migration
- **WHEN** the migration is applied
- **THEN** `system_settings` SHALL contain key `reserve_priority` with value `partial_first`

#### Scenario: Settings page displays reserve priority selector
- **WHEN** user navigates to settings page
- **THEN** a selector SHALL show current reserve priority value
- **AND** options SHALL be: "Uu tien cuon le" (partial_first) and "Uu tien cuon nguyen" (full_first)

### Requirement: fn_reserve_for_week respects reserve_priority setting
The `fn_reserve_for_week` function SHALL read `reserve_priority` from `system_settings` and order candidate cones accordingly.

#### Scenario: Reserve with partial_first (default)
- **WHEN** `reserve_priority` = `partial_first`
- **THEN** fn_reserve_for_week SHALL order by `is_partial DESC` (partial cones first), then `expiry_date ASC NULLS LAST`, then `received_date ASC`

#### Scenario: Reserve with full_first
- **WHEN** `reserve_priority` = `full_first`
- **THEN** fn_reserve_for_week SHALL order by `is_partial ASC` (full cones first), then `expiry_date ASC NULLS LAST`, then `received_date ASC`

#### Scenario: Missing reserve_priority setting
- **WHEN** `reserve_priority` key does not exist in system_settings
- **THEN** fn_reserve_for_week SHALL default to `partial_first` behavior (is_partial DESC)

### Requirement: fn_borrow_thread and fn_reserve_from_stock respect reserve_priority
Both functions SHALL read `reserve_priority` from `system_settings` and apply the same ORDER BY logic as fn_reserve_for_week.

#### Scenario: Borrow with full_first setting
- **WHEN** `reserve_priority` = `full_first`
- **AND** fn_borrow_thread is called
- **THEN** candidate cones SHALL be ordered by `is_partial ASC` (full first)

#### Scenario: Reserve from stock with partial_first setting
- **WHEN** `reserve_priority` = `partial_first`
- **AND** fn_reserve_from_stock is called
- **THEN** candidate cones SHALL be ordered by `is_partial DESC` (partial first)
