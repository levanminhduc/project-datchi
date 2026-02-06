## MODIFIED Requirements

### Requirement: Create style thread spec API validation

API endpoint POST `/api/style-thread-specs` SHALL accept empty or null `process_name` field to support inline edit workflow where user creates row first and fills data later.

#### Scenario: Create spec with empty process_name
- **WHEN** client sends POST `/api/style-thread-specs` with `process_name: ''` (empty string)
- **THEN** API returns 200 with created spec record
- **AND** new row is inserted into `style_thread_specs` table

#### Scenario: Create spec with null process_name
- **WHEN** client sends POST `/api/style-thread-specs` without `process_name` field
- **THEN** API returns 200 with created spec record
- **AND** `process_name` column is set to null in database

#### Scenario: Required fields still validated
- **WHEN** client sends POST `/api/style-thread-specs` without `style_id` or `supplier_id`
- **THEN** API returns 400 with validation error message
