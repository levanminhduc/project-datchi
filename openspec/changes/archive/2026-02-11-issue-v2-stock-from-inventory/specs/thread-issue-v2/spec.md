## MODIFIED Requirements

### Requirement: Stock availability query uses thread_inventory
The `getStockAvailability()` function SHALL query the `thread_inventory` table instead of `thread_stock` to get available cone counts.

#### Scenario: Get stock for a thread type with available cones
- **WHEN** `getStockAvailability(threadTypeId)` is called
- **THEN** it SHALL query `thread_inventory` table
- **AND** filter by `thread_type_id = threadTypeId`
- **AND** filter by `status = 'AVAILABLE'`
- **AND** count rows where `is_partial = false` as `full_cones`
- **AND** count rows where `is_partial = true` as `partial_cones`
- **AND** return `{ full_cones: number, partial_cones: number }`

#### Scenario: Get stock for a thread type with no available cones
- **WHEN** `getStockAvailability(threadTypeId)` is called
- **AND** no rows exist in `thread_inventory` with `status = 'AVAILABLE'` for that thread type
- **THEN** it SHALL return `{ full_cones: 0, partial_cones: 0 }`

#### Scenario: Get stock filtered by warehouse
- **WHEN** `getStockAvailability(threadTypeId, warehouseId)` is called with optional warehouse ID
- **THEN** it SHALL also filter by `warehouse_id = warehouseId`
