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
The system SHALL send all valid rows to the backend API for processing. The backend SHALL process in a single transaction: create missing suppliers, create missing thread_types, and upsert thread_type_supplier links.

#### Scenario: Successful import with all new data
- **WHEN** user confirms import of 10 valid rows with 2 new suppliers and 3 new Tex values
- **THEN** system creates 2 suppliers, 3 thread_types, and 10 thread_type_supplier links, then redirects to suppliers page with success message

#### Scenario: Successful import with existing data (upsert)
- **WHEN** a row matches an existing (supplier_id, thread_type_id) in thread_type_supplier
- **THEN** system updates the existing row's unit_price and meters_per_cone instead of creating a duplicate

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
The system SHALL auto-create a new thread_type when no existing thread_type has the matching tex_number. The new thread_type SHALL have: code = `T-TEX{number}`, name = `Chi TEX {number}`, tex_number from Excel, density_grams_per_meter = tex_number / 1000, meters_per_cone from Excel row, is_active = true.

#### Scenario: Auto-create thread_type
- **WHEN** import processes a row with tex_number 40 and no thread_type with tex_number 40 exists
- **THEN** system creates a new thread_type with code "T-TEX40", density 0.040000

### Requirement: Navigate to import page from suppliers list
The system SHALL add an "Import NCC-Tex" button on the suppliers list page that navigates to `/thread/suppliers/import-tex`. The import page SHALL have a back button to return to the suppliers list.

#### Scenario: Navigation to import page
- **WHEN** user clicks "Import NCC-Tex" button on suppliers page
- **THEN** browser navigates to `/thread/suppliers/import-tex`

#### Scenario: Navigation back from import page
- **WHEN** user clicks back button on import page
- **THEN** browser navigates to `/thread/suppliers`
