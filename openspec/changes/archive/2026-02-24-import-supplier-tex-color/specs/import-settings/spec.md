## ADDED Requirements

### Requirement: ROOT configures import column mapping for NCC-Tex
The system SHALL provide a settings section (ROOT only) to configure Excel column mapping for NCC-Tex import. Config fields: sheet index (default 0), header row (default 1), data start row (default 2), and column assignments for: supplier name (required), tex number (required), meters per cone (required), unit price VND (required), supplier item code (optional).

#### Scenario: Save NCC-Tex mapping configuration
- **WHEN** ROOT user fills in mapping fields and clicks Save
- **THEN** system saves config as JSONB to system_settings key `import_supplier_tex_mapping`

#### Scenario: Load existing configuration
- **WHEN** ROOT user opens Settings page and NCC-Tex mapping config exists
- **THEN** form fields are pre-populated with the saved values

#### Scenario: Non-ROOT user cannot see settings
- **WHEN** non-ROOT user opens Settings page
- **THEN** import mapping sections are not visible

### Requirement: ROOT configures import column mapping for Colors
The system SHALL provide a settings section (ROOT only) to configure Excel column mapping for Color import. Config fields: sheet index (default 0), header row (default 1), data start row (default 2), and column assignments for: color name (required), supplier color code (optional).

#### Scenario: Save Color mapping configuration
- **WHEN** ROOT user fills in Color mapping fields and clicks Save
- **THEN** system saves config as JSONB to system_settings key `import_supplier_color_mapping`

### Requirement: Download template Excel file
The system SHALL provide a "Download template" button for each import type. The template SHALL be generated based on the current mapping configuration with correct column headers at the configured positions and 1 example data row.

#### Scenario: Download NCC-Tex template
- **WHEN** user clicks "Download template" on Import NCC-Tex page (or Settings)
- **THEN** system downloads an Excel file with headers matching the configured columns (e.g., column A = "Nha Cung Cap", column B = "Tex", etc.) and 1 example row

#### Scenario: Download Color template
- **WHEN** user clicks "Download template" on Import Colors page (or Settings)
- **THEN** system downloads an Excel file with headers matching configured columns and 1 example row

### Requirement: Default mapping seeded in database
The system SHALL seed default mapping values during migration so import features work without ROOT configuration.

#### Scenario: Fresh installation
- **WHEN** migration runs on a fresh database
- **THEN** system_settings contains `import_supplier_tex_mapping` with default: sheet 0, header row 1, data row 2, columns A/B/C/D/E
- **AND** system_settings contains `import_supplier_color_mapping` with default: sheet 0, header row 1, data row 2, columns A/B
