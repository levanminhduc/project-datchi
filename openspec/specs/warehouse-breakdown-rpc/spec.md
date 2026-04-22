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
The BE route `/api/inventory/summary/by-cone/:threadTypeId/warehouses` SHALL accept an optional `warehouse_id` query parameter. The route's behavior depends on whether `warehouse_id` is provided:

- **Unfiltered path (no `warehouse_id`):** the route SHALL call both `fn_warehouse_breakdown` and `fn_supplier_breakdown` concurrently via `Promise.all`, returning the combined result in the existing response format. This path is unchanged from current behavior.
- **Filtered path (`warehouse_id` provided):** the route SHALL call `fn_warehouse_breakdown` (then keep only the row for that warehouse) and SHALL re-derive `supplier_breakdown` from `thread_inventory` filtered by `thread_type_id + color_id + warehouse_id` joined to `thread_types → suppliers`. The route SHALL NOT call `fn_supplier_breakdown` on this path. The two queries MAY run concurrently via `Promise.all`.

#### Scenario: Parallel execution (unfiltered)
- **WHEN** a request is made without `warehouse_id`
- **THEN** the backend SHALL execute `fn_warehouse_breakdown` and `fn_supplier_breakdown` concurrently via `Promise.all`

#### Scenario: Response format unchanged
- **WHEN** the calls complete successfully (filtered or unfiltered)
- **THEN** the response SHALL match the existing format: `{ data: ConeWarehouseBreakdown[], supplier_breakdown: SupplierBreakdown[], error: null }`

#### Scenario: Optional warehouse_id filter
- **WHEN** the request includes a `warehouse_id` query parameter
- **THEN** the response `data` SHALL contain at most one warehouse entry matching that id (obtained by filtering the row-per-warehouse output of `fn_warehouse_breakdown`; this is lossless because each row already aggregates a single warehouse)
- **AND** the `supplier_breakdown` SHALL be re-derived for that warehouse only — the route SHALL NOT reuse the cross-warehouse `fn_supplier_breakdown` output; instead it SHALL compute supplier totals by querying `thread_inventory` filtered by `thread_type_id`, `color_id`, and `warehouse_id`, joined to `thread_types → suppliers`, then aggregated per `supplier_id` at app layer (or via a dedicated warehouse-scoped RPC if added later)
- **AND** the re-derived `supplier_breakdown` SHALL preserve the SAME aggregation semantics as `fn_supplier_breakdown` (same status set considered, same metrics — `full_cones`, `partial_cones`, `partial_meters` — same `deleted_at IS NULL` filter, same color matching) — the ONLY difference SHALL be the warehouse scoping
- **AND** the returned supplier totals SHALL reflect only cones physically inside that warehouse (no cross-warehouse leakage)

#### Scenario: Warehouse filter omitted
- **WHEN** no `warehouse_id` query parameter is supplied
- **THEN** the route SHALL behave exactly as before, returning all warehouses
