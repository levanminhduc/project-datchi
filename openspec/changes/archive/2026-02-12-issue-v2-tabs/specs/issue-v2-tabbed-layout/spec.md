## ADDED Requirements

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
