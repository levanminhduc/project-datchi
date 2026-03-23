## 1. Add tabbed layout to index.vue

- [x] 1.1 Add QTabs with "Tao Phieu Xuat" and "Lich Su" tabs and activeTab ref defaulting to "create"
- [x] 1.2 Wrap existing create form content inside QTabPanels > QTabPanel name="create"
- [x] 1.3 Add QTabPanel name="history" with history table, filters, and pagination (inline from history.vue)
- [x] 1.4 Add imports needed for history tab (IssueV2Status, IssueV2Filters, PageHeader, DataTable, DatePicker, IssueV2StatusBadge, QTableColumn, QTableProps)
- [x] 1.5 Add history-related state and functions (localFilters, pagination, statusOptions, columns, loadData, handleRequest, handleSearch, handleClearFilters, handleRowClick)
- [x] 1.6 Add watcher on activeTab to load history data when switching to history tab

## 2. Update detail page back-navigation

- [x] 2.1 Change goBackToHistory in [id].vue from '/thread/issues/v2/history' to '/thread/issues/v2'
- [x] 2.2 Change back-to prop in PageHeader from '/thread/issues/v2/history' to '/thread/issues/v2'

## 3. Cleanup

- [x] 3.1 Delete src/pages/thread/issues/v2/history.vue
