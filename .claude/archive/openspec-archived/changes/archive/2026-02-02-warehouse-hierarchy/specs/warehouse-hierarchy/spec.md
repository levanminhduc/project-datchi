## ADDED Requirements

### Requirement: Warehouse types
The system SHALL support two warehouse types: LOCATION (địa điểm/site) and STORAGE (kho lưu trữ thực tế).

#### Scenario: Only STORAGE warehouses can hold inventory
- **WHEN** user selects a warehouse for inventory operations (receive, issue, transfer)
- **THEN** only warehouses with type='STORAGE' SHALL be available for selection

#### Scenario: LOCATION serves as grouping parent
- **WHEN** displaying warehouse list
- **THEN** LOCATION type warehouses SHALL appear as group headers, not selectable for inventory

### Requirement: Warehouse parent-child relationship
The system SHALL support a two-level hierarchy where STORAGE warehouses belong to a parent LOCATION.

#### Scenario: Assign storage to location
- **WHEN** creating or editing a STORAGE warehouse
- **THEN** user SHALL be able to assign it to a parent LOCATION via parent_id

#### Scenario: Location has no parent
- **WHEN** creating a LOCATION warehouse
- **THEN** parent_id SHALL be NULL (locations are top-level only)

#### Scenario: Prevent circular references
- **WHEN** assigning parent_id
- **THEN** system SHALL reject if parent_id equals the warehouse's own id

### Requirement: Warehouse display ordering
The system SHALL display warehouses in a consistent order based on sort_order within each level.

#### Scenario: Ordered display
- **WHEN** fetching warehouses
- **THEN** results SHALL be ordered by parent_id (NULL first), then by sort_order ascending

### Requirement: API tree format response
The system SHALL provide warehouse data in tree structure format when requested.

#### Scenario: Flat list default
- **WHEN** calling GET /api/warehouses without format parameter
- **THEN** response SHALL return flat array of all warehouses (backward compatible)

#### Scenario: Tree structure on request
- **WHEN** calling GET /api/warehouses?format=tree
- **THEN** response SHALL return array of LOCATION warehouses, each with children array containing their STORAGE warehouses

### Requirement: Grouped warehouse selector UI
The system SHALL display warehouses in grouped/hierarchical format in selection components.

#### Scenario: Visual hierarchy in dropdown
- **WHEN** user opens warehouse selector dropdown
- **THEN** LOCATION names SHALL appear as group headers (bold, non-selectable)
- **AND** STORAGE names SHALL appear indented under their parent LOCATION

#### Scenario: Flat display for simple cases
- **WHEN** a component needs simple warehouse list
- **THEN** component MAY use flat list with warehouse code prefix indicating location

### Requirement: Reports group by location
The system SHALL support grouping inventory reports by LOCATION.

#### Scenario: Inventory summary by location
- **WHEN** generating inventory report with groupByLocation=true
- **THEN** report SHALL group STORAGE warehouses under their parent LOCATION
- **AND** show subtotals per LOCATION

#### Scenario: Filter by location
- **WHEN** user filters by a LOCATION
- **THEN** results SHALL include all STORAGE warehouses under that LOCATION
