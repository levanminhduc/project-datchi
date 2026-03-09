## ADDED Requirements

### Requirement: Enrich endpoint computes equivalent inventory with partial cone conversion
The enrich endpoint (`POST /api/weekly-orders/enrich-inventory`) SHALL read `partial_cone_ratio` from `system_settings` and compute equivalent inventory as `full_cones + (partial_cones * ratio)` per thread_type_id.

#### Scenario: Enrich with mixed full and partial cones
- **WHEN** enrich-inventory is called with thread_type_id=42 having 10 full cones and 20 partial cones AVAILABLE
- **AND** `partial_cone_ratio` in system_settings is 0.3
- **THEN** the response SHALL include `full_cones: 10`, `partial_cones: 20`, `inventory_cones: 30` (raw), `equivalent_cones: 16` (10 + 20*0.3)
- **AND** `sl_can_dat` SHALL equal `max(0, total_cones - equivalent_cones)`

#### Scenario: Enrich with only full cones
- **WHEN** enrich-inventory is called with thread_type_id=42 having 25 full cones and 0 partial cones
- **THEN** `full_cones: 25`, `partial_cones: 0`, `equivalent_cones: 25`, `inventory_cones: 25`

#### Scenario: Enrich with only partial cones
- **WHEN** enrich-inventory is called with thread_type_id=42 having 0 full cones and 10 partial cones
- **AND** `partial_cone_ratio` is 0.3
- **THEN** `full_cones: 0`, `partial_cones: 10`, `equivalent_cones: 3` (10*0.3)

#### Scenario: Missing partial_cone_ratio setting
- **WHEN** `partial_cone_ratio` key does not exist in system_settings
- **THEN** the endpoint SHALL default to ratio = 0.3

### Requirement: Summary table displays full, partial, equivalent columns
The weekly order summary table SHALL display four inventory-related columns: "Ton kho KD" (raw count), "Cuon nguyen" (full cones), "Cuon le" (partial cones), "Ton kho QD" (equivalent cones).

#### Scenario: Table renders all inventory columns
- **WHEN** the aggregated results are displayed in the summary table
- **THEN** columns SHALL appear in order: ..., Ton kho KD, Cuon nguyen, Cuon le, Ton kho QD, SL can dat, ...
- **AND** "SL can dat" SHALL be computed from `equivalent_cones`, not `inventory_cones`

#### Scenario: Zero inventory for a thread type
- **WHEN** a thread_type_id has no AVAILABLE cones
- **THEN** all four columns SHALL display 0
