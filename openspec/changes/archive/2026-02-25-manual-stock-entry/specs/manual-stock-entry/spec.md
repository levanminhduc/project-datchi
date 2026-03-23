## ADDED Requirements

### Requirement: Manual stock entry button exists on inventory page
The inventory page SHALL display a "Nhập Thủ Công" button in the toolbar area alongside the existing "Nhập Kho" and "Quét tra cứu" buttons.

#### Scenario: Button visibility for authorized users
- **WHEN** user with `thread.batch.receive` permission navigates to the inventory page
- **THEN** the "Nhập Thủ Công" button SHALL be visible in the toolbar

#### Scenario: Button hidden for unauthorized users
- **WHEN** user without `thread.batch.receive` permission navigates to the inventory page
- **THEN** the "Nhập Thủ Công" button SHALL NOT be visible

#### Scenario: Button opens dialog
- **WHEN** user clicks the "Nhập Thủ Công" button
- **THEN** a dialog SHALL open with the manual stock entry form

### Requirement: Cascading supplier selection
The dialog SHALL provide a supplier dropdown as the first selection step, populated from the existing suppliers list.

#### Scenario: Supplier list loaded
- **WHEN** the dialog opens
- **THEN** the supplier dropdown SHALL display all active suppliers from `GET /api/suppliers`

#### Scenario: Supplier selection resets dependent fields
- **WHEN** user selects a different supplier
- **THEN** the Tex dropdown and Color dropdown SHALL be reset to empty
- **AND** the Tex dropdown SHALL be populated with tex values from thread types linked to the selected supplier via `thread_type_supplier` junction

### Requirement: Cascading tex number selection
The dialog SHALL provide a Tex dropdown as the second selection step, showing distinct tex_number values from thread types linked to the selected supplier.

#### Scenario: Tex options grouped from thread types
- **WHEN** a supplier is selected
- **THEN** the Tex dropdown SHALL show distinct `tex_number` values from thread types associated with that supplier via `GET /api/thread-type-suppliers?supplier_id=X`

#### Scenario: Tex selection resets color
- **WHEN** user selects a tex number
- **THEN** the Color dropdown SHALL be reset and populated with colors from thread types matching the selected supplier AND tex number

#### Scenario: No thread types for supplier
- **WHEN** a supplier has no linked thread types
- **THEN** the Tex dropdown SHALL be empty and display a hint "NCC này chưa có loại chỉ nào"

### Requirement: Cascading color selection
The dialog SHALL provide a Color dropdown as the third selection step, showing colors from thread types matching the selected supplier and tex number.

#### Scenario: Color options from filtered thread types
- **WHEN** a supplier and tex number are selected
- **THEN** the Color dropdown SHALL display colors (with hex color dot) from thread types that match both the selected supplier AND tex number

#### Scenario: Color selection determines thread_type_id
- **WHEN** user selects a color
- **THEN** the system SHALL resolve the specific `thread_type_id` from the thread type matching the selected supplier + tex + color combination

### Requirement: Warehouse and quantity input
The dialog SHALL provide warehouse selection and quantity inputs for full cones and partial cones.

#### Scenario: Warehouse selection
- **WHEN** the dialog is open
- **THEN** a warehouse dropdown SHALL be available with all active STORAGE-type warehouses only (excluding LOCATION-type parent nodes)

#### Scenario: Quantity inputs
- **WHEN** the dialog is open
- **THEN** there SHALL be two numeric inputs: "Cuộn nguyên" (full cones, required, min 0) and "Cuộn lẻ" (partial cones, optional, default 0)

#### Scenario: At least one quantity required
- **WHEN** user attempts to submit with both quantities at 0
- **THEN** the system SHALL show a validation error requiring at least one quantity > 0

### Requirement: Submit to thread_stock
The dialog SHALL submit the entry to `POST /api/stock` creating or updating a `thread_stock` record.

#### Scenario: Successful submission
- **WHEN** user fills all required fields and clicks submit
- **THEN** the system SHALL call `POST /api/stock` with `{ thread_type_id, warehouse_id, qty_full_cones, qty_partial_cones, received_date: today }`
- **AND** show a success snackbar
- **AND** close the dialog

#### Scenario: Upsert behavior
- **WHEN** a `thread_stock` record already exists for the same thread_type_id + warehouse_id
- **THEN** the API SHALL add the quantities to the existing record (existing upsert behavior)

#### Scenario: Submission error
- **WHEN** the API returns an error
- **THEN** the system SHALL display the error message via snackbar
- **AND** keep the dialog open for correction
