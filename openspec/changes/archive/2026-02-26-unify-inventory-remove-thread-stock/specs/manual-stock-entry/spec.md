## MODIFIED Requirements

### Requirement: Cascading tex number selection
The dialog SHALL provide a Tex dropdown as the second selection step, showing distinct tex_number values from thread types linked to the selected supplier via `thread_types.supplier_id` (direct FK).

#### Scenario: Tex options from thread_types direct relationship
- **WHEN** a supplier is selected
- **THEN** the Tex dropdown SHALL show distinct `tex_number` values from thread types where `thread_types.supplier_id` matches the selected supplier via `GET /api/threads?supplier_id=X`

#### Scenario: Tex selection resets color
- **WHEN** user selects a tex number
- **THEN** the Color dropdown SHALL be reset and populated with colors from thread types matching the selected supplier AND tex number

#### Scenario: No thread types for supplier
- **WHEN** a supplier has no linked thread types (via `thread_types.supplier_id`)
- **THEN** the Tex dropdown SHALL be empty and display a hint "NCC này chưa có loại chỉ nào"

---

### Requirement: Cascading color selection
The dialog SHALL provide a Color dropdown as the third selection step, showing colors from thread types matching the selected supplier (via `thread_types.supplier_id`) and tex number.

#### Scenario: Color options from filtered thread types
- **WHEN** a supplier and tex number are selected
- **THEN** the Color dropdown SHALL display colors (with hex color dot) from thread types that match both the selected supplier (via `thread_types.supplier_id` direct FK) AND tex number

#### Scenario: Color selection determines thread_type_id
- **WHEN** user selects a color
- **THEN** the system SHALL resolve the specific `thread_type_id` from the thread type matching the selected supplier + tex + color combination

## REMOVED Requirements

### Requirement: Submit to thread_stock
**Reason:** The `thread_stock` table is being removed. Manual stock entry already creates `thread_inventory` cones via `POST /api/stock`. This requirement referenced `thread_stock` which no longer exists.
**Migration:** Manual entry submits to `POST /api/stock` which creates individual `thread_inventory` cones (already implemented in current code). No API change needed — only the spec text was outdated.
