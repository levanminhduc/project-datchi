## ADDED Requirements

### Requirement: Select supplier before color import
The system SHALL require users to select an existing supplier from a dropdown before uploading the color Excel file. The dropdown SHALL show all active suppliers.

#### Scenario: Supplier selection
- **WHEN** user navigates to Import Colors page
- **THEN** system shows a supplier dropdown that must be selected before file upload is enabled

#### Scenario: No supplier selected
- **WHEN** user has not selected a supplier
- **THEN** the file upload input is disabled

### Requirement: Upload and parse Excel file for color import
The system SHALL allow users to upload an Excel file (.xlsx, .xls) on the Import Colors page. The system SHALL parse the file client-side using ExcelJS according to the ROOT-configured mapping (`import_supplier_color_mapping`).

#### Scenario: Successful file upload and parse
- **WHEN** user selects a supplier and uploads a valid Excel file
- **THEN** system parses the file and displays a preview table with columns: Row#, Color Name, Supplier Color Code, Status

#### Scenario: Missing mapping configuration
- **WHEN** import page loads but `import_supplier_color_mapping` setting does not exist
- **THEN** system shows an error message directing user to ask ROOT to configure mapping

### Requirement: Preview with validation for color import
The system SHALL validate each parsed row. Validation: color name is not empty. The system SHALL check if color name already exists in the `colors` table (case-insensitive match).

#### Scenario: Color already exists in system
- **WHEN** a row has color name "Trang" and a color with name "Trang" (or "trắng") exists
- **THEN** row status shows "EXISTS" — will only link to supplier, not create new color

#### Scenario: New color
- **WHEN** a row has color name "Xanh Navy" and no matching color exists
- **THEN** row status shows "NEW" badge — will create new color with hex_code = #808080

#### Scenario: Invalid row (empty color name)
- **WHEN** a row has empty color name
- **THEN** row status shows error icon

### Requirement: Bulk import colors for supplier
The system SHALL send valid rows to the backend API. Backend SHALL process in a transaction: create missing colors (with hex_code #808080), then create color_supplier links for the selected supplier.

#### Scenario: Successful import with new colors
- **WHEN** user confirms import of 5 rows, 3 are new colors
- **THEN** system creates 3 colors and 5 color_supplier links, shows success message

#### Scenario: Color already linked to supplier
- **WHEN** a color_supplier link already exists for (color_id, supplier_id)
- **THEN** system skips that link (no duplicate created) and shows it as "already linked"

#### Scenario: Import failure
- **WHEN** backend encounters an error
- **THEN** entire transaction rolls back; user sees error message

### Requirement: Auto-create color during import
The system SHALL auto-create a new color when the color name from Excel does not match any existing color (case-insensitive). The new color SHALL have: name from Excel, hex_code = '#808080' (default gray), is_active = true.

#### Scenario: Auto-create color
- **WHEN** import processes "Xanh Navy" and no matching color exists
- **THEN** system creates color with name "Xanh Navy", hex_code "#808080"

### Requirement: Navigate to color import from suppliers list
The system SHALL add an "Import Colors" action button per supplier row on the suppliers list page. Clicking it navigates to `/thread/suppliers/import-colors?supplier_id={id}`. The import page pre-selects the supplier from the URL parameter.

#### Scenario: Navigation with pre-selected supplier
- **WHEN** user clicks "Import Colors" on the Coats row (id=5) in suppliers list
- **THEN** browser navigates to `/thread/suppliers/import-colors?supplier_id=5` and Coats is pre-selected

#### Scenario: Navigation back
- **WHEN** user clicks back button on Import Colors page
- **THEN** browser navigates to `/thread/suppliers`
