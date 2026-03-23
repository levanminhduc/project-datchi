## MODIFIED Requirements

### Requirement: Form data endpoint returns unique thread types
The `/api/issues/v2/form-data` endpoint SHALL return a deduplicated list of thread types based on `thread_type_id`.

#### Scenario: Multiple specs with same thread type
- **WHEN** a style+color combination has multiple `style_color_thread_specs` records with the same `thread_type_id`
- **THEN** the API SHALL return only one entry per unique `thread_type_id`
- **AND** the entry SHALL include `thread_code`, `thread_name`, `quota_cones`, `stock_available_full`, `stock_available_partial`

#### Scenario: No specs found
- **WHEN** no `style_color_thread_specs` records exist for the given style+color
- **THEN** the API SHALL return an empty `thread_types` array
- **AND** the response SHALL still be successful with `success: true`

### Requirement: Frontend initializes line inputs after data loads
The Issue V2 page SHALL initialize `lineInputs` object only after thread data is successfully loaded.

#### Scenario: Successful data load
- **WHEN** `loadFormData()` returns thread types
- **THEN** the page SHALL create `lineInputs` entries for each thread type using the returned data directly
- **AND** each entry SHALL have `full: 0`, `partial: 0`, `notes: ''`, `validation: null`

#### Scenario: Data load failure
- **WHEN** `loadFormData()` fails or returns null
- **THEN** the page SHALL NOT attempt to initialize `lineInputs`
- **AND** the page SHALL display an error message to the user

### Requirement: Template handles missing line inputs gracefully
The Issue V2 page template SHALL handle cases where `lineInputs[thread_type_id]` is undefined.

#### Scenario: Line input not yet initialized
- **WHEN** the template renders a thread type row before `lineInputs` is initialized
- **THEN** the template SHALL NOT crash
- **AND** input fields SHALL show default values or be disabled

#### Scenario: Line input exists
- **WHEN** `lineInputs[thread_type_id]` exists
- **THEN** the template SHALL bind to `.full`, `.partial`, `.notes`, `.validation` normally
