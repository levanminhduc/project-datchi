## ADDED Requirements

### Requirement: Auto-create style during PO import parse
The system SHALL treat unknown `style_code` values as new styles instead of rejecting them. During the parse phase, rows with unknown `style_code` MUST be marked with status `new_style` and included in the valid rows list.

#### Scenario: Parse row with unknown style_code
- **WHEN** a PO import row contains a `style_code` that does not exist in the `styles` table
- **THEN** the row SHALL have status `new_style` and be included in `validRows` (not `errorRows`)

#### Scenario: Parse row with known style_code
- **WHEN** a PO import row contains a `style_code` that exists in the `styles` table
- **THEN** existing behavior is unchanged (status `new` or `update` or `skip`)

### Requirement: Create style record during PO import execute
The system SHALL create a new `styles` record for each unique `style_code` with status `new_style` before creating `po_items`. The `style_name` SHALL equal the `style_code` value.

#### Scenario: Execute import with new_style rows
- **WHEN** the execute phase processes rows with status `new_style`
- **THEN** the system SHALL INSERT into `styles` table with `style_code` and `style_name` both set to the `style_code` value
- **AND** the system SHALL then create the `po_items` record using the newly created `style.id`

#### Scenario: Duplicate style_code in same import batch
- **WHEN** multiple import rows reference the same unknown `style_code`
- **THEN** the system SHALL create the style only once and reuse its `id` for all rows

### Requirement: Display new style indicator in preview
The import preview table SHALL display a warning-colored "Mã hàng mới" badge next to rows with status `new_style`.

#### Scenario: Preview shows new style tag
- **WHEN** the preview table renders a row with status `new_style`
- **THEN** the row SHALL display a `q-badge` with color `warning` and label "Mã hàng mới" next to the style_code cell
