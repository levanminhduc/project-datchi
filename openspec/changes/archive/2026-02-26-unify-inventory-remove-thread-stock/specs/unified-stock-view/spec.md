## ADDED Requirements

### Requirement: v_stock_summary view aggregates from thread_inventory
The system SHALL provide a `v_stock_summary` view that aggregates inventory data from `thread_inventory` instead of the removed `thread_stock` table.

#### Scenario: View returns correct aggregation
- **WHEN** `thread_inventory` has 10 cones for `thread_type_id=5, warehouse_id=1` with status `AVAILABLE` (7 full, 3 partial)
- **THEN** `v_stock_summary` SHALL return a row with `thread_type_id=5, warehouse_id=1, total_full_cones=7, total_partial_cones=3`

#### Scenario: View includes thread type and warehouse details
- **WHEN** querying `v_stock_summary`
- **THEN** each row SHALL include: `thread_type_id`, `thread_code`, `thread_name`, `thread_color` (from colors table), `warehouse_id`, `warehouse_code`, `warehouse_name`, `total_full_cones`, `total_partial_cones`, `total_equivalent_cones`

#### Scenario: View calculates equivalent cones using partial_cone_ratio
- **WHEN** a row has `total_full_cones=7, total_partial_cones=3` and `partial_cone_ratio=0.3`
- **THEN** `total_equivalent_cones` SHALL equal `7 + 3 * 0.3 = 7.9`

#### Scenario: View only counts active inventory statuses
- **WHEN** `thread_inventory` has cones with status `CONSUMED`, `WRITTEN_OFF`, or `QUARANTINE`
- **THEN** those cones SHALL NOT be included in the view aggregation
- **AND** only cones with status IN (`AVAILABLE`, `RECEIVED`, `INSPECTED`, `SOFT_ALLOCATED`, `HARD_ALLOCATED`) SHALL be counted

#### Scenario: View groups by thread_type and warehouse
- **WHEN** `thread_inventory` has cones across multiple warehouses for the same thread_type
- **THEN** `v_stock_summary` SHALL return one row per (thread_type_id, warehouse_id) combination

---

### Requirement: GET /api/stock reads from thread_inventory
The `GET /api/stock` endpoint SHALL query `thread_inventory` aggregated by (thread_type_id, warehouse_id, lot_number) instead of reading from the removed `thread_stock` table.

#### Scenario: Stock list returns aggregated data
- **WHEN** calling `GET /api/stock`
- **THEN** the response SHALL return records aggregated from `thread_inventory` with the same response shape: `{ id, thread_type_id, warehouse_id, lot_number, qty_full_cones, qty_partial_cones, received_date, notes, thread_type, warehouse }`

#### Scenario: Stock list filters work
- **WHEN** calling `GET /api/stock?thread_type_id=5&warehouse_id=1`
- **THEN** the response SHALL only include aggregated records matching both filters

---

### Requirement: GET /api/stock/summary aggregates from thread_inventory
The `GET /api/stock/summary` endpoint SHALL aggregate from `thread_inventory` instead of `thread_stock`.

#### Scenario: Summary returns correct totals
- **WHEN** calling `GET /api/stock/summary`
- **THEN** the response SHALL return `{ thread_type_id, thread_code, thread_name, total_full_cones, total_partial_cones }` aggregated from `thread_inventory` WHERE status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')

#### Scenario: Summary filters by warehouse
- **WHEN** calling `GET /api/stock/summary?warehouse_id=1`
- **THEN** the response SHALL only include cones from warehouse_id=1

---

### Requirement: POST /api/stock/deduct uses FEFO on thread_inventory
The `POST /api/stock/deduct` endpoint SHALL deduct cones from `thread_inventory` using FEFO ordering (matching Issue V2 pattern) instead of updating `thread_stock` quantities.

#### Scenario: FEFO deduction selects earliest expiry first
- **WHEN** deducting 2 full cones for thread_type_id=5
- **AND** `thread_inventory` has 3 AVAILABLE full cones: cone A (expiry 2027-01), cone B (expiry 2026-06), cone C (no expiry)
- **THEN** the system SHALL select cone B first (earliest expiry), then cone A
- **AND** update both cones' status to `HARD_ALLOCATED`

#### Scenario: Deduction returns lot-grouped results
- **WHEN** deducting 3 cones that span 2 different lots
- **THEN** the response SHALL return `deducted_from` array grouped by lot_number with qty_full and qty_partial per lot

#### Scenario: Insufficient stock returns error
- **WHEN** requesting to deduct 10 full cones but only 5 are AVAILABLE
- **THEN** the endpoint SHALL return 400 with error message including available count

#### Scenario: Warehouse filter applies to deduction
- **WHEN** deducting with `warehouse_id=1`
- **THEN** only cones in warehouse_id=1 SHALL be considered for deduction

---

### Requirement: POST /api/stock/return creates new cones in thread_inventory
The `POST /api/stock/return` endpoint SHALL create new `thread_inventory` cone records with `status='AVAILABLE'` instead of updating `thread_stock` quantities.

#### Scenario: Return creates individual cones
- **WHEN** returning `qty_full=3, qty_partial=1` for thread_type_id=5, warehouse_id=1
- **THEN** the system SHALL create:
  - 3 `thread_inventory` records with `is_partial=false, status='AVAILABLE'`
  - 1 `thread_inventory` record with `is_partial=true, status='AVAILABLE'`
  - All with auto-generated `cone_id` prefixed `RTN-`

#### Scenario: Return creates lots record
- **WHEN** returning stock with `lot_number='LOT-123'`
- **THEN** the system SHALL create or find a `lots` record matching the lot_number
- **AND** link all created cones via `lot_id`

#### Scenario: Return response maintains API contract
- **WHEN** a return is successful
- **THEN** the response SHALL include `{ success: true, data: { ... }, message: '...' }` matching existing API contract
