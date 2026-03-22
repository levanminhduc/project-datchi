## ADDED Requirements

### Requirement: Warehouse breakdown via SQL aggregation
The system SHALL provide a PostgreSQL function `fn_warehouse_breakdown` that aggregates cone inventory by warehouse for a given thread type, replacing client-side loop aggregation.

#### Scenario: Basic warehouse breakdown
- **WHEN** the function is called with a valid `p_thread_type_id`
- **THEN** it SHALL return rows grouped by `warehouse_id` with columns: `warehouse_id`, `warehouse_code`, `warehouse_name`, `locations`, `full_cones`, `partial_cones`, `partial_meters`

#### Scenario: Status filtering with defaults
- **WHEN** the function is called without `p_statuses` parameter
- **THEN** it SHALL default to statuses `['RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED']`

#### Scenario: Location aggregation
- **WHEN** cones in the same warehouse have different locations
- **THEN** the function SHALL return `string_agg(DISTINCT location, ', ')` as the locations value

#### Scenario: No matching cones
- **WHEN** no cones exist for the given thread type and statuses
- **THEN** the function SHALL return an empty result set

### Requirement: Supplier breakdown via SQL aggregation
The system SHALL provide a PostgreSQL function `fn_supplier_breakdown` that aggregates cone inventory by effective supplier for a given thread type.

#### Scenario: Supplier resolution via lot or thread type
- **WHEN** a cone has a lot with a supplier
- **THEN** the function SHALL use the lot's supplier
- **WHEN** a cone has no lot or lot has no supplier
- **THEN** the function SHALL fall back to the thread type's supplier

#### Scenario: Basic supplier breakdown
- **WHEN** the function is called with a valid `p_thread_type_id`
- **THEN** it SHALL return rows grouped by effective supplier with columns: `supplier_id`, `supplier_code`, `supplier_name`, `full_cones`, `partial_cones`, `partial_meters`

#### Scenario: Unknown supplier
- **WHEN** a cone has neither lot supplier nor thread type supplier
- **THEN** the function SHALL group it under supplier_name `'Không xác định'` with NULL supplier_id

### Requirement: Backend route uses parallel RPC calls
The BE route `/api/inventory/summary/by-cone/:threadTypeId/warehouses` SHALL call both RPC functions in parallel and return combined results in the existing response format.

#### Scenario: Parallel execution
- **WHEN** a request is made to the warehouse breakdown endpoint
- **THEN** the backend SHALL execute `fn_warehouse_breakdown` and `fn_supplier_breakdown` concurrently via `Promise.all`

#### Scenario: Response format unchanged
- **WHEN** the RPC calls complete successfully
- **THEN** the response SHALL match the existing format: `{ data: ConeWarehouseBreakdown[], supplier_breakdown: SupplierBreakdown[], error: null }`
