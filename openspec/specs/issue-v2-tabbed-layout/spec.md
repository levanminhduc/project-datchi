### Requirement: Tabbed layout for Issue V2 page
The Issue V2 page (`/thread/issues/v2`) SHALL display two tabs: "Tao Phieu Xuat" (Create Issue) and "Lich Su" (History), using QTabs and QTabPanels components.

#### Scenario: Default tab on page load
- **WHEN** user navigates to `/thread/issues/v2` without query params
- **THEN** the "Tao Phieu Xuat" tab SHALL be active by default

#### Scenario: Open history tab via query param
- **WHEN** user navigates to `/thread/issues/v2?tab=history`
- **THEN** the "Lich Su" tab SHALL be active
- **AND** history data SHALL be loaded immediately

#### Scenario: Switching to history tab
- **WHEN** user clicks the "Lich Su" tab
- **THEN** the history panel SHALL be displayed with the issues table and filters
- **AND** issue history data SHALL be loaded (if not already loaded)

#### Scenario: Switching back to create tab
- **WHEN** user is on the "Lich Su" tab and clicks "Tao Phieu Xuat"
- **THEN** the create form SHALL be displayed with its current state preserved

### Requirement: History tab contains full history functionality
The "Lich Su" tab panel SHALL contain all functionality currently in `history.vue`: status filter, date range filters, search button, clear button, paginated DataTable with issue list, and row click navigation to detail page.

#### Scenario: Filtering issues by status
- **WHEN** user selects a status filter in the history tab
- **AND** clicks "Tim kiem"
- **THEN** the issues table SHALL display only issues matching the selected status

#### Scenario: Clicking an issue row
- **WHEN** user clicks a row in the history table
- **THEN** user SHALL be navigated to `/thread/issues/v2/:id` (detail page)

### Requirement: History route removed
The route `/thread/issues/v2/history` SHALL no longer exist. The `history.vue` file SHALL be deleted.

#### Scenario: Accessing old history URL
- **WHEN** user navigates to `/thread/issues/v2/history`
- **THEN** the route SHALL NOT resolve (standard 404 / route-not-found behavior from unplugin-vue-router)

### Requirement: Detail page back-navigation updated
The detail page (`[id].vue`) SHALL navigate back to `/thread/issues/v2?tab=history` so the user returns to the history tab.

#### Scenario: Going back from detail page
- **WHEN** user clicks the back button on the issue detail page
- **THEN** user SHALL be navigated to `/thread/issues/v2?tab=history`
- **AND** the history tab SHALL be active with data loaded

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
