## ADDED Requirements

### Requirement: System settings table exists
The system SHALL have a `system_settings` table storing configurable parameters as key-value pairs with JSONB values.

#### Scenario: Table structure
- **WHEN** the system_settings table is created
- **THEN** it SHALL have columns: id (SERIAL PRIMARY KEY), key (VARCHAR UNIQUE), value (JSONB), description (TEXT), updated_at (TIMESTAMPTZ)

### Requirement: Default partial cone ratio setting
The system SHALL have a default setting `partial_cone_ratio` with value `0.3`.

#### Scenario: Initial seed data
- **WHEN** the system is initialized
- **THEN** the setting `partial_cone_ratio` SHALL exist with value `0.3` and description "Tỷ lệ quy đổi cuộn lẻ so với cuộn nguyên"

### Requirement: Get settings API
The system SHALL provide an API endpoint to retrieve settings.

#### Scenario: Get single setting
- **WHEN** client sends GET /api/settings/:key
- **THEN** system SHALL return the setting value or 404 if not found

#### Scenario: Get all settings
- **WHEN** client sends GET /api/settings
- **THEN** system SHALL return all settings as an array

### Requirement: Update setting API
The system SHALL provide an API endpoint to update a setting value.

#### Scenario: Update existing setting
- **WHEN** client sends PUT /api/settings/:key with new value
- **THEN** system SHALL update the value and return the updated setting

#### Scenario: Update non-existent setting
- **WHEN** client sends PUT /api/settings/:key for a key that doesn't exist
- **THEN** system SHALL return 404 error

### Requirement: Settings UI page
The system SHALL provide a UI page for managing settings.

#### Scenario: View settings
- **WHEN** user navigates to settings page
- **THEN** system SHALL display all configurable settings with their current values

#### Scenario: Edit partial cone ratio
- **WHEN** user changes partial_cone_ratio value and clicks save
- **THEN** system SHALL update the setting and show success message
