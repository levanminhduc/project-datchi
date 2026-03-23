## Why

The Issue V2 module (`thread/issues/v2`) currently only has pages for creating new issues (`index.vue`) and returning items (`return.vue`). Users cannot view the history of issued tickets or see details of a specific issue. The backend APIs (`GET /api/issues/v2` for list and `GET /api/issues/v2/:id` for detail) already exist and are fully functional, but there are no frontend pages to consume them.

## What Changes

- Add `history.vue` page to display a paginated list of all Issue V2 tickets with filters (status, date range, department)
- Add `[id].vue` page to display full details of a single issue including all line items
- Add `IssueV2StatusBadge.vue` component to display issue status (DRAFT, CONFIRMED, RETURNED) with appropriate colors
- Integrate with existing `useIssueV2` composable which already has `fetchIssues()` and `fetchIssue(id)` methods

## Capabilities

### New Capabilities

- `issue-v2-history-list`: List page showing all Issue V2 tickets with filtering, pagination, and navigation to detail view
- `issue-v2-history-detail`: Detail page showing single issue information with all line items and computed fields

### Modified Capabilities

(none - no existing specs are being modified)

## Impact

- **New files**:
  - `src/pages/thread/issues/v2/history.vue`
  - `src/pages/thread/issues/v2/[id].vue`
  - `src/components/thread/IssueV2StatusBadge.vue`
- **Reused components**: AppButton, AppSelect, AppInput, DatePicker, DataTable, PageHeader, AppBadge
- **Existing APIs used**: `GET /api/issues/v2`, `GET /api/issues/v2/:id`
- **Existing services**: `issueV2Service.list()`, `issueV2Service.getById()`
- **No backend changes required**
