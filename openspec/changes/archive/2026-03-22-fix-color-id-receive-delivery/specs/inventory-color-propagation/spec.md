## ADDED Requirements

### Requirement: fn_receive_delivery MUST set color_id on created cones
The `fn_receive_delivery` function SHALL fetch `color_id` from `thread_types` for the given `thread_type_id` and include it in every INSERT into `thread_inventory`.

#### Scenario: Receive delivery for thread type with color
- **WHEN** `fn_receive_delivery` is called for a delivery whose `thread_type_id` has `color_id = 5`
- **THEN** all created `thread_inventory` rows SHALL have `color_id = 5`

#### Scenario: Receive delivery for thread type without color
- **WHEN** `fn_receive_delivery` is called for a delivery whose `thread_type_id` has `color_id = NULL`
- **THEN** all created `thread_inventory` rows SHALL have `color_id = NULL`

### Requirement: fn_return_cones_with_movements MUST copy color_id to partial cones
The `fn_return_cones_with_movements` function SHALL copy `color_id` from the original cone when creating a new partial return cone in `thread_inventory`.

#### Scenario: Partial return from cone with color
- **WHEN** a partial return is performed on a cone that has `color_id = 3`
- **THEN** the newly created partial cone SHALL have `color_id = 3`

#### Scenario: Partial return from cone without color
- **WHEN** a partial return is performed on a cone that has `color_id = NULL`
- **THEN** the newly created partial cone SHALL have `color_id = NULL`

### Requirement: Backfill existing cones with missing color_id
A migration SHALL update all `thread_inventory` rows where `color_id IS NULL` by setting `color_id` from the corresponding `thread_types.color_id`.

#### Scenario: Backfill cones linked to thread type with color
- **WHEN** migration runs and `thread_inventory.color_id IS NULL` but `thread_types.color_id = 7`
- **THEN** `thread_inventory.color_id` SHALL be updated to `7`

#### Scenario: Skip cones where thread type has no color
- **WHEN** migration runs and both `thread_inventory.color_id IS NULL` and `thread_types.color_id IS NULL`
- **THEN** `thread_inventory.color_id` SHALL remain `NULL`
