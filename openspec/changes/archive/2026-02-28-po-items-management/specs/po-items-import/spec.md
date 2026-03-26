## ADDED Requirements

### Requirement: Parse Excel file for preview
The system SHALL parse an uploaded Excel file and return a preview of PO items to be imported.

#### Scenario: Successfully parse valid Excel
- **WHEN** user sends POST `/api/import/po-items/parse` with Excel file and mapping config
- **THEN** system parses file according to mapping configuration
- **AND** system validates each row (style_code exists, required fields present)
- **AND** system returns preview with: valid rows, error rows, summary counts

#### Scenario: Parse with invalid file format
- **WHEN** user sends POST with non-Excel file
- **THEN** system returns error with status 400 and message indicating invalid format

#### Scenario: Parse with missing required columns
- **WHEN** Excel file is missing po_number, style_code, or quantity columns based on mapping
- **THEN** system returns error with status 400 listing missing columns

### Requirement: Validate style codes during parse
The system SHALL validate that all style codes in the Excel file exist in the database.

#### Scenario: Style code exists
- **WHEN** parsing row with style_code that exists in `styles` table
- **THEN** system marks row as valid and includes resolved style_id

#### Scenario: Style code not found
- **WHEN** parsing row with style_code that doesn't exist
- **THEN** system marks row as invalid with error "Style không tồn tại"

### Requirement: Execute import with ADDITIVE strategy
The system SHALL execute import using ADDITIVE merge strategy (add new, update existing, never delete).

#### Scenario: Import new PO with items
- **WHEN** user sends POST `/api/import/po-items/execute` with valid rows for new PO number
- **THEN** system creates `purchase_orders` record
- **AND** system creates `po_items` records for each row
- **AND** system logs history entries with change_type='CREATE'
- **AND** system returns summary with created counts

#### Scenario: Import items for existing PO
- **WHEN** user sends execute with po_number that already exists
- **THEN** system uses existing PO (does not create duplicate)
- **AND** system processes items according to ADDITIVE strategy

#### Scenario: ADDITIVE - new item for existing PO
- **WHEN** importing row with style_id not in existing PO
- **THEN** system creates new `po_items` record
- **AND** system logs history with change_type='CREATE'

#### Scenario: ADDITIVE - update existing item quantity
- **WHEN** importing row with style_id already in PO and different quantity
- **THEN** system updates `po_items.quantity`
- **AND** system logs history with change_type='UPDATE', old and new quantities

#### Scenario: ADDITIVE - skip unchanged item
- **WHEN** importing row with style_id already in PO and same quantity
- **THEN** system skips row (no update, no history entry)
- **AND** system counts row as "skipped"

### Requirement: Import preview response format
The system SHALL return structured preview data for UI display.

#### Scenario: Preview response structure
- **WHEN** parse completes successfully
- **THEN** system returns JSON with:
  - `valid_rows`: array of valid rows with po_number, style_code, style_name, quantity, status ('new' | 'update' | 'skip')
  - `error_rows`: array of invalid rows with row_number, data, error message
  - `summary`: { total, valid, errors, new_pos, update_items, skip_items }

### Requirement: Import mapping configuration
The system SHALL read column mapping from settings with key `import_po_items_mapping`.

#### Scenario: Use saved mapping configuration
- **WHEN** parsing Excel file
- **THEN** system reads mapping from settings table
- **AND** system applies column positions as configured

#### Scenario: Default mapping when not configured
- **WHEN** mapping setting doesn't exist
- **THEN** system uses default: sheet_index=0, header_row=1, data_start_row=2, columns A/B/C for po_number/style_code/quantity

### Requirement: Download Excel template
The system SHALL provide a downloadable Excel template with correct column headers.

#### Scenario: Download template
- **WHEN** user requests template download
- **THEN** system returns Excel file with columns: Số PO, Mã hàng, Số lượng SP, Khách hàng, Ngày đặt, Ghi chú
- **AND** file includes sample data row for reference
