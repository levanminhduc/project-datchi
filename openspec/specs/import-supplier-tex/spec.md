## ADDED Requirements

### Requirement: Upload and parse Excel file for NCC-Tex import
The system SHALL allow users to upload an Excel file (.xlsx, .xls) on the import page. The system SHALL parse the file client-side using ExcelJS according to the ROOT-configured mapping (sheet index, header row, data start row, column assignments).

#### Scenario: Successful file upload and parse
- **WHEN** user selects a valid Excel file on the Import NCC-Tex page
- **THEN** system parses the file using the configured mapping and displays a preview table with columns: Row#, NCC Name, Tex, Meters/Cone, Price (VND), Status

#### Scenario: Invalid file type
- **WHEN** user selects a non-Excel file (e.g., .pdf, .csv)
- **THEN** system shows an error message and does not proceed with parsing

#### Scenario: Missing mapping configuration
- **WHEN** import page loads but `import_supplier_tex_mapping` setting does not exist
- **THEN** system shows an error message directing user to ask ROOT to configure mapping in Settings

### Requirement: Preview with validation status
The system SHALL validate each parsed row and show status indicators in the preview table. Validation checks: NCC name is not empty, Tex is a positive number, Meters/Cone is a positive number, Price is a non-negative number.

#### Scenario: Valid row with existing supplier
- **WHEN** a row has a supplier name that matches an existing supplier (case-insensitive)
- **THEN** row status shows checkmark (valid) and supplier column shows matched name

#### Scenario: Valid row with new supplier
- **WHEN** a row has a supplier name not found in the database
- **THEN** row status shows "NEW NCC" badge indicating a new supplier will be created

#### Scenario: Valid row with new Tex
- **WHEN** a row has a tex_number not found in any existing thread_type
- **THEN** row status shows "NEW TEX" badge indicating a new thread_type will be created

#### Scenario: Invalid row
- **WHEN** a row has empty NCC name, non-numeric Tex, or non-numeric price
- **THEN** row status shows error icon with description of the validation failure

### Requirement: Bulk import NCC-Tex data
The system SHALL send all valid rows to the backend API for processing. The backend SHALL process each row: create missing suppliers, create or find missing thread_types (with fallback lookup), and upsert thread_type_supplier links handling both unique constraints. The response SHALL include per-row skip details.

#### Scenario: Successful import with all new data
- **WHEN** user confirms import of 10 valid rows with 2 new suppliers and 3 new Tex values
- **THEN** system creates 2 suppliers, 3 thread_types, and 10 thread_type_supplier links, then shows success message with counts

#### Scenario: Successful import with existing data (upsert)
- **WHEN** a row matches an existing (supplier_id, thread_type_id) in thread_type_supplier
- **THEN** system updates the existing row's unit_price, meters_per_cone, and supplier_item_code instead of creating a duplicate

#### Scenario: Supplier_item_code conflict with different thread_type
- **WHEN** a row would create a thread_type_supplier link where the supplier_item_code already exists for the same supplier but a different thread_type
- **THEN** system updates the supplier_item_code to resolve the conflict (append thread_type_id suffix) and proceeds with the upsert
- **AND** the row is NOT skipped

#### Scenario: Import with skipped rows returns details
- **WHEN** import completes with some rows skipped
- **THEN** response includes `skipped_details` array with `{ row_number, supplier_name, tex_number, reason }` for each skipped row

#### Scenario: Frontend displays skip details
- **WHEN** import result contains skipped_details with entries
- **THEN** the result screen shows a table listing each skipped row with its row number, supplier name, tex number, and reason for skipping

#### Scenario: Import with some invalid rows
- **WHEN** user confirms import and some rows are marked invalid
- **THEN** system imports only the valid rows and shows count of imported vs skipped rows

#### Scenario: Import failure (transaction rollback)
- **WHEN** backend encounters an error during processing
- **THEN** entire transaction rolls back and no partial data is created; user sees error message

### Requirement: Auto-create supplier during import
The system SHALL auto-create a new supplier when the NCC name from Excel does not match any existing supplier. The new supplier SHALL have: code auto-generated (e.g., `NCC-{timestamp}`), name from Excel, is_active = true, lead_time_days = 7 (default).

#### Scenario: Auto-create supplier
- **WHEN** import processes a row with supplier name "A&E Vietnam" and no supplier with that name exists
- **THEN** system creates a new supplier with name "A&E Vietnam" and auto-generated code

### Requirement: Auto-create thread_type during import
The system SHALL auto-create a new thread_type when no existing thread_type has the matching tex_number. The new thread_type SHALL have: code = `T-TEX{number}`, name = `Chỉ TEX {number}`, tex_number from Excel, density_grams_per_meter = tex_number / 1000, meters_per_cone from Excel row, is_active = true. When the insert fails (e.g., code uniqueness violation), the system SHALL fallback to SELECT from thread_types by `tex_number` (where `deleted_at IS NULL`) and use the existing record. The row SHALL only be skipped if both insert and fallback lookup fail.

#### Scenario: Auto-create thread_type
- **WHEN** import processes a row with tex_number 24 and no thread_type with tex_number 24 exists
- **THEN** system creates a new thread_type with code "T-TEX24", density 0.024000

#### Scenario: Thread_type insert fails but record exists
- **WHEN** import processes a row with tex_number 24 and INSERT fails due to code conflict, but a thread_type with tex_number 24 exists in DB
- **THEN** system uses the existing thread_type record and continues to upsert the supplier link
- **AND** the row is NOT skipped

#### Scenario: Thread_type insert fails and no record found
- **WHEN** import processes a row with tex_number 24, INSERT fails, and no thread_type with tex_number 24 exists (deleted_at IS NULL)
- **THEN** system skips the row and records the skip reason

### Requirement: Navigate to import page from suppliers list
The system SHALL add an "Import NCC-Tex" button on the suppliers list page that navigates to `/thread/suppliers/import-tex`. The import page SHALL have a back button to return to the suppliers list.

#### Scenario: Navigation to import page
- **WHEN** user clicks "Import NCC-Tex" button on suppliers page
- **THEN** browser navigates to `/thread/suppliers/import-tex`

#### Scenario: Navigation back from import page
- **WHEN** user clicks back button on import page
- **THEN** browser navigates to `/thread/suppliers`
