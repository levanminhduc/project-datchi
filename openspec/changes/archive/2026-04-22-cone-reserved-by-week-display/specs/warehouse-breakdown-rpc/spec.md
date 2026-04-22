## MODIFIED Requirements

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
