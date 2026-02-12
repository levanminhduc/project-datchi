## 1. Component Setup

- [x] 1.1 Create `src/components/thread/IssueV2StatusBadge.vue` with status-to-color mapping (DRAFT→grey, CONFIRMED→positive, RETURNED→info)

## 2. History List Page

- [x] 2.1 Create `src/pages/thread/issues/v2/history.vue` with page structure (header, filters card, table)
- [x] 2.2 Implement filters section with AppSelect (status), AppInput+DatePicker (from/to date), search button
- [x] 2.3 Implement DataTable with columns: issue_code, department, line_count, status (using IssueV2StatusBadge), created_at, created_by
- [x] 2.4 Wire up `useIssueV2.fetchIssues()` to load data on mount and filter change
- [x] 2.5 Implement row click navigation to `/thread/issues/v2/:id`
- [x] 2.6 Add "Tạo Phiếu Xuất" button linking to `/thread/issues/v2`

## 3. Detail Page

- [x] 3.1 Create `src/pages/thread/issues/v2/[id].vue` with page structure (PageHeader, info card, lines table)
- [x] 3.2 Implement header info section showing issue_code, department, created_by, created_at, status
- [x] 3.3 Implement lines table with columns: thread_name, PO/style/color, quota_cones, issued (ng+le), returned (ng+le), status indicators
- [x] 3.4 Wire up `useIssueV2.fetchIssue(id)` to load data from route param
- [x] 3.5 Implement loading state and not-found state
- [x] 3.6 Add back navigation to `/thread/issues/v2/history`

## 4. Verification

- [x] 4.1 Run `npm run type-check` and fix any TypeScript errors
- [x] 4.2 Run `npm run lint` and fix any linting issues
- [x] 4.3 Manual test: navigate to history, apply filters, click row to detail, back to history

## 5. Bug Fixes

- [x] 5.1 Fix status filter clear button (X) not working - add `@update:model-value="handleSearch"` to AppSelect
- [x] 5.2 Fix date filter format mismatch - add `convertDateFormat()` in issueV2Service.ts to convert DD/MM/YYYY → YYYY-MM-DD
- [x] 5.3 Fix row click navigation - update DataTable.vue emit signature to pass all 3 params (evt, row, index)
- [x] 5.4 Fix PageHeader back button visibility - change icon to `arrow_back` and add `color="primary"`
