## 1. Row Click — DRAFT Redirect

- [x] 1.1 Modify `handleHistoryRowClick` in `src/pages/thread/issues/v2/index.vue` to check `row.status`: if `IssueV2Status.DRAFT`, navigate to `/thread/issues/v2?tab=create&issue=${row.id}`; otherwise navigate to `/thread/issues/v2/${row.id}` as before

## 2. Draft Loading — Query Parameter Detection

- [x] 2.1 In `onMounted` of `index.vue`, detect `route.query.issue` param: if present, parse as number, call `fetchIssue(id)`, then check `currentIssue.value.status === 'DRAFT'` — if not DRAFT, redirect to `/thread/issues/v2/${id}`; if DRAFT, set `activeTab` to `'create'` and populate `department.value` and `createdBy.value` from `currentIssue.value`
- [x] 2.2 After loading a draft issue, clean the URL by replacing the route query to remove the `issue` param (using `router.replace`) to prevent re-loading on tab switches
