## ADDED Requirements

### Requirement: SubArt column on issue lines
The system SHALL store an optional sub_art_id on thread_issue_lines to record which sub-art was selected during issuance.

#### Scenario: Column addition
- **WHEN** migration runs
- **THEN** thread_issue_lines SHALL have a new nullable column sub_art_id (FK to sub_arts.id)

#### Scenario: FK constraint behavior
- **WHEN** a sub_art is referenced by any thread_issue_lines row
- **THEN** system SHALL prevent deletion of that sub_art (RESTRICT)

### Requirement: Style has_sub_arts flag in order-options
The system SHALL include a `has_sub_arts` boolean flag when returning style options from the order-options endpoint.

#### Scenario: Style with sub_arts
- **WHEN** client sends GET /api/issues/v2/order-options?po_id=X and a style has rows in sub_arts table
- **THEN** that style option SHALL include `has_sub_arts: true`

#### Scenario: Style without sub_arts
- **WHEN** client sends GET /api/issues/v2/order-options?po_id=X and a style has no rows in sub_arts table
- **THEN** that style option SHALL include `has_sub_arts: false`

### Requirement: Conditional SubArt dropdown in issue creation
The system SHALL show a SubArt dropdown between Style and Color selections when the selected style has sub_arts.

#### Scenario: Style with sub_arts selected
- **WHEN** user selects a style that has has_sub_arts=true
- **THEN** system SHALL show a SubArt dropdown populated with sub_arts for that style
- **THEN** SubArt selection SHALL be required before Color can be selected

#### Scenario: Style without sub_arts selected
- **WHEN** user selects a style that has has_sub_arts=false
- **THEN** system SHALL NOT show SubArt dropdown
- **THEN** system SHALL proceed directly to Color selection (existing behavior)

#### Scenario: Style changed after SubArt selection
- **WHEN** user changes the selected style
- **THEN** system SHALL clear SubArt and Color selections

### Requirement: SubArt validation on issue line creation
The system SHALL validate sub_art_id when adding lines to an issue.

#### Scenario: Style has sub_arts but sub_art_id not provided
- **WHEN** client sends POST to add issue line with a style_id that has sub_arts but no sub_art_id
- **THEN** system SHALL return 400 error

#### Scenario: Style has sub_arts and valid sub_art_id provided
- **WHEN** client sends POST to add issue line with valid sub_art_id matching the style_id
- **THEN** system SHALL accept and store sub_art_id on the line

#### Scenario: Style has no sub_arts and sub_art_id is null
- **WHEN** client sends POST to add issue line for a style with no sub_arts and sub_art_id is null
- **THEN** system SHALL accept normally (existing behavior)

#### Scenario: sub_art_id does not belong to the given style
- **WHEN** client sends POST with sub_art_id that references a different style than style_id
- **THEN** system SHALL return 400 error

#### Scenario: Style has no sub_arts but sub_art_id is provided
- **WHEN** client sends POST with a non-null sub_art_id for a style that has no sub_arts
- **THEN** system SHALL return 400 error

### Requirement: SubArt pre-validation
The system SHALL validate sub_art_id during the pre-validation step (validate-line endpoint) with the same rules as line creation.

#### Scenario: validate-line with sub_art_id
- **WHEN** client sends POST to validate-line with sub_art_id
- **THEN** system SHALL apply the same sub_art_id validation rules as line creation (required when style has sub_arts, must belong to correct style)

### Requirement: SubArt display in issue detail
The system SHALL display SubArt information in the issue detail view when present.

#### Scenario: Issue line has sub_art
- **WHEN** user views issue detail and a line has sub_art_id set
- **THEN** system SHALL display sub_art_code in the line's order info

#### Scenario: Issue line has no sub_art
- **WHEN** user views issue detail and a line has sub_art_id=NULL
- **THEN** system SHALL display order info as before (no SubArt shown)
