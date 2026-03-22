## ADDED Requirements

### Requirement: Manual entry tex dropdown SHALL use thread_types.supplier_id filter
When a supplier is selected in the manual stock entry dialog, the system SHALL query the `thread_types` table filtered by `supplier_id` to populate the tex number dropdown. The system SHALL NOT use the `thread_type_supplier` junction table for this purpose.

#### Scenario: Supplier selected shows all tex numbers
- **WHEN** user selects a supplier in the manual entry dialog
- **THEN** the tex dropdown SHALL display all unique `tex_number` values from `thread_types` WHERE `supplier_id` equals the selected supplier AND `deleted_at IS NULL`

#### Scenario: Supplier with no thread types shows empty dropdown
- **WHEN** user selects a supplier that has zero `thread_types` records with matching `supplier_id`
- **THEN** the tex dropdown SHALL be empty

### Requirement: Manual entry color dropdown SHALL derive from thread_types directly
When a tex number is selected, the system SHALL filter the same `thread_types` result set (already filtered by supplier) to show available colors for that tex number.

#### Scenario: Tex selected shows available colors
- **WHEN** user has selected a supplier AND selects a tex number
- **THEN** the color dropdown SHALL display all `thread_types` records matching both the selected `supplier_id` AND `tex_number`, showing `color_data.name` as label and `thread_type.id` as value

#### Scenario: Color selection sets thread_type_id
- **WHEN** user selects a color from the color dropdown
- **THEN** `manualEntryForm.thread_type_id` SHALL be set to the selected `thread_type.id`

### Requirement: Manual entry data type SHALL be ThreadType[]
The `manualEntryThreadTypes` reactive reference SHALL hold `ThreadType[]` instead of `ThreadTypeSupplierWithRelations[]`. All computed properties accessing this data SHALL use direct ThreadType field access (e.g., `tt.tex_number`) instead of nested junction access (e.g., `link.thread_type?.tex_number`).

#### Scenario: Data shape after supplier selection
- **WHEN** the API responds with thread types for the selected supplier
- **THEN** `manualEntryThreadTypes` SHALL contain `ThreadType[]` objects with direct access to `tex_number`, `color_data`, `id`, and other ThreadType fields

### Requirement: Unused junction table import SHALL be removed
If `threadTypeSupplierService` has no remaining usage in `inventory.vue` after this change, the import SHALL be removed.

#### Scenario: No remaining junction table usage
- **WHEN** the manual entry dialog uses `threadService` instead of `threadTypeSupplierService`
- **THEN** the `threadTypeSupplierService` import line SHALL be removed from `inventory.vue` if no other code on the page references it
