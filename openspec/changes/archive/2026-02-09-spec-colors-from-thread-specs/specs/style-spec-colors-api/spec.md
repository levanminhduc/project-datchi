## ADDED Requirements

### Requirement: Spec-colors API endpoint
The system SHALL provide an endpoint `GET /api/styles/:id/spec-colors` that returns unique colors from `style_color_thread_specs` for a given style. Each color SHALL appear exactly once regardless of how many thread specs reference it.

#### Scenario: Style with configured spec-colors
- **WHEN** `GET /api/styles/3/spec-colors` is called and style 3 has thread specs with color "Xanh Dương" configured
- **THEN** the response SHALL be `{ data: [{ id: 5, name: "Xanh Dương", hex_code: "#2563EB" }], error: null }`

#### Scenario: Style with no spec-colors configured
- **WHEN** `GET /api/styles/99/spec-colors` is called and style 99 has no `style_color_thread_specs` records
- **THEN** the response SHALL be `{ data: [], error: null }`

#### Scenario: Invalid style ID
- **WHEN** `GET /api/styles/abc/spec-colors` is called with a non-numeric ID
- **THEN** the response SHALL be `{ data: null, error: "ID không hợp lệ" }` with HTTP 400

### Requirement: Weekly order color dropdown uses spec-colors
The color options dropdown for a style entry in the weekly order page SHALL display only colors that have thread specifications configured via `style_color_thread_specs`, fetched from the `spec-colors` API endpoint.

#### Scenario: Style with spec-colors shows only configured colors
- **WHEN** a PO item has SKU colors "Trắng" and "Xanh Dương", but only "Xanh Dương" has thread specs configured
- **THEN** the "Thêm màu" dropdown shows only "Xanh Dương"

#### Scenario: Style with no spec-colors shows empty dropdown
- **WHEN** a style has no thread spec color configurations
- **THEN** the "Thêm màu" dropdown shows no options

#### Scenario: Colors are cached per style
- **WHEN** the same style appears in the weekly order and its spec-colors have already been fetched
- **THEN** the system SHALL use the cached result without making another API call
