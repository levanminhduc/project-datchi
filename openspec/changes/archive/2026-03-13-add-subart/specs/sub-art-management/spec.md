## ADDED Requirements

### Requirement: SubArt database table
The system SHALL have a `sub_arts` table to store sub-article codes linked to styles.

#### Scenario: Table structure
- **WHEN** the sub_arts table is created
- **THEN** it SHALL have columns: id (SERIAL PK), style_id (FK to styles NOT NULL), sub_art_code (VARCHAR(100) NOT NULL), created_at (TIMESTAMPTZ DEFAULT NOW())
- **THEN** it SHALL have a UNIQUE constraint on (style_id, sub_art_code)
- **THEN** style_id FK SHALL use ON DELETE CASCADE

### Requirement: List sub-arts by style
The system SHALL provide an API to list sub-arts for a given style.

#### Scenario: List sub-arts for a style with data
- **WHEN** client sends GET /api/sub-arts?style_id=X
- **THEN** system SHALL return array of sub_arts with id and sub_art_code for that style
- **THEN** results SHALL be ordered by sub_art_code ascending

#### Scenario: List sub-arts for a style with no data
- **WHEN** client sends GET /api/sub-arts?style_id=X and no sub_arts exist
- **THEN** system SHALL return empty array

#### Scenario: Missing style_id parameter
- **WHEN** client sends GET /api/sub-arts without style_id
- **THEN** system SHALL return 400 error

### Requirement: Excel import for sub-arts
The system SHALL allow importing sub-art data from an Excel file with 2 columns: style_code and sub_art_code.

#### Scenario: Successful import
- **WHEN** user uploads Excel with valid style_code and sub_art_code rows
- **THEN** system SHALL match style_code to styles.style_code
- **THEN** system SHALL create sub_arts records for each matched row
- **THEN** system SHALL return summary with imported count

#### Scenario: Unmatched style_code
- **WHEN** Excel contains a style_code that does not exist in styles table
- **THEN** system SHALL skip that row and include it in warnings list
- **THEN** system SHALL NOT fail the entire import

#### Scenario: Duplicate sub_art_code for same style
- **WHEN** Excel contains a (style_code, sub_art_code) pair that already exists in sub_arts
- **THEN** system SHALL skip that row (upsert/ignore behavior)
- **THEN** system SHALL include it in skipped count

#### Scenario: Empty or invalid file
- **WHEN** user uploads a file that is not Excel or has no valid rows
- **THEN** system SHALL return 400 error with descriptive message

### Requirement: SubArt import page
The system SHALL provide a frontend page to upload Excel files for sub-art import.

#### Scenario: Upload flow
- **WHEN** user navigates to SubArt import page
- **THEN** system SHALL show a file upload area accepting .xlsx files
- **THEN** after upload, system SHALL display import results (imported, skipped, warnings)

#### Scenario: Import results display
- **WHEN** import completes
- **THEN** system SHALL show: total rows processed, successfully imported count, skipped count, and list of warning rows with reasons
