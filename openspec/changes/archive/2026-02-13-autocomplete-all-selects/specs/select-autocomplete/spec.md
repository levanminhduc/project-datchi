## ADDED Requirements

### Requirement: AppSelect with dynamic options SHALL have autocomplete search
Every AppSelect instance bound to a dynamic option set (thread types, POs, styles, colors, warehouses, suppliers, departments, materials, issue selectors) SHALL include `use-input`, `fill-input`, and `hide-selected` props to enable type-to-search filtering.

#### Scenario: User searches in a thread type select
- **WHEN** user types text into a thread type AppSelect (e.g., on inventory page, allocation page, batch receive)
- **THEN** the dropdown filters options to match the typed text

#### Scenario: User searches in a PO select
- **WHEN** user types text into a PO AppSelect (e.g., on calculation, reconciliation, weekly order pages)
- **THEN** the dropdown filters PO options to match the typed text

#### Scenario: User searches in a style/color select
- **WHEN** user types text into a Style or Color AppSelect
- **THEN** the dropdown filters to matching styles or colors

#### Scenario: User searches in a warehouse select
- **WHEN** user types text into a Warehouse AppSelect (e.g., on inventory, lots, deliveries, mobile receive pages)
- **THEN** the dropdown filters warehouse options to match the typed text

#### Scenario: Selected value displays in input field
- **WHEN** user selects an option from any autocomplete-enabled AppSelect
- **THEN** the selected option's label SHALL display as text in the input field (via `fill-input`)

### Requirement: Status, priority, and unit selects SHALL NOT have autocomplete
AppSelect instances bound to status filters, priority selectors, unit selectors (g/kg), operation type, and reason dropdowns SHALL remain as plain dropdowns without `use-input`.

#### Scenario: Status filter remains plain dropdown
- **WHEN** user clicks a status filter AppSelect
- **THEN** a plain dropdown appears without a search input field

#### Scenario: Priority select remains plain dropdown
- **WHEN** user clicks a priority AppSelect
- **THEN** a plain dropdown appears without a search input field
