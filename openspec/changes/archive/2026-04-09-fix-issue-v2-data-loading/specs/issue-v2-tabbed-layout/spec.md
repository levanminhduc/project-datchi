## MODIFIED Requirements

### Requirement: Reload button forces full data refresh
The reload button (manual trigger) SHALL force a complete re-fetch of all data for currently selected colors, bypassing the optimization that skips already-loaded colors. The `handleLoadFormData()` function SHALL accept a `forceReload` parameter (default `false`). When `forceReload` is `true`, the function SHALL clear existing `multiColorThreadTypes` entries for the selected colors before computing which colors need loading, ensuring all selected colors are treated as new.

#### Scenario: User clicks reload with all colors already loaded
- **WHEN** user has loaded colors A, B, C and clicks the reload button
- **THEN** the system SHALL clear existing data for colors A, B, C
- **AND** re-fetch all form data (BOM, quota, issued, stock) from the server for all three colors
- **AND** display updated data

#### Scenario: Debounced/watch-triggered load does not force reload
- **WHEN** the color selection changes and triggers the debounced `handleLoadFormData()` call
- **THEN** the function SHALL be called with `forceReload = false`
- **AND** only newly selected colors SHALL be fetched (existing optimization preserved)

### Requirement: Stock refresh polling includes quota and issued data
The `POST /api/issues/v2/stock-refresh` endpoint SHALL return `quota_cones`, `base_quota_cones`, and `confirmed_issued_gross` per thread type in addition to `full_cones` and `partial_cones`. The `StockRefreshSchema` SHALL accept optional `department` (string) and `ratio` (number) fields. The frontend `refreshStockData()` function SHALL send `department` and `ratio` in the request and SHALL update all returned fields in `multiColorThreadTypes`.

#### Scenario: Polling updates quota alongside stock
- **WHEN** the 20-second polling interval fires
- **THEN** the system SHALL send a `POST /api/issues/v2/stock-refresh` request including `department` and `ratio`
- **AND** the backend SHALL compute `quota_cones` using `batchGetQuotaCones()`, `base_quota_cones` using `batchGetBaseQuotaCones()`, and `confirmed_issued_gross` using `batchGetConfirmedIssuedGross()`
- **AND** the frontend SHALL update `quota_cones`, `base_quota_cones`, `confirmed_issued_gross`, `full_cones`, and `partial_cones` for each thread type

#### Scenario: Backend quota computation fails gracefully
- **WHEN** the batch quota functions throw an error during stock refresh
- **THEN** the backend SHALL still return stock data (`full_cones`, `partial_cones`)
- **AND** quota fields SHALL be returned as `null`
- **AND** the frontend SHALL preserve existing quota values when receiving `null`

#### Scenario: Tab return triggers full stock refresh with quota
- **WHEN** user returns to the tab after being away for more than 30 seconds
- **THEN** the system SHALL call `refreshStockData()` which includes quota and issued data
- **AND** all fields SHALL be updated as in the polling scenario

### Requirement: Stock refresh uses user-selected warehouse
The `refreshStockData()` function SHALL use `selectedWarehouseId.value` (user-selected warehouse) as the primary warehouse for each item, falling back to `tt.detected_warehouse_id` only when no warehouse is selected.

#### Scenario: User has selected a specific warehouse
- **WHEN** user has selected warehouse W in the warehouse dropdown
- **AND** polling or tab-return triggers `refreshStockData()`
- **THEN** all items in the request SHALL use warehouse W as their `warehouse_id`

#### Scenario: No warehouse selected, fallback to detected
- **WHEN** no warehouse is selected (`selectedWarehouseId.value` is falsy)
- **AND** polling triggers `refreshStockData()`
- **THEN** each item SHALL use its own `tt.detected_warehouse_id` as `warehouse_id`
