## MODIFIED Requirements

### Requirement: Submit to thread_stock
The dialog SHALL submit the entry to `POST /api/stock` creating lots and cones. The endpoint SHALL also persist the authenticated employee's ID on the lot record.

#### Scenario: Successful submission
- **WHEN** user fills all required fields and clicks submit
- **THEN** the system SHALL call `POST /api/stock` with `{ thread_type_id, warehouse_id, qty_full_cones, qty_partial_cones, received_date: today }`
- **AND** the created lot record SHALL have `created_by_employee_id` set to the authenticated employee's ID from JWT claims
- **AND** show a success snackbar
- **AND** close the dialog

#### Scenario: Upsert behavior
- **WHEN** a `thread_stock` record already exists for the same thread_type_id + warehouse_id
- **THEN** the API SHALL add the quantities to the existing record (existing upsert behavior)

#### Scenario: Submission error
- **WHEN** the API returns an error
- **THEN** the system SHALL display the error message via snackbar
- **AND** keep the dialog open for correction
