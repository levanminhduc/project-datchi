## 1. Backend — Delete Draft Issue Endpoint

- [x] 1.1 Add DELETE `/:id` route in `server/routes/issuesV2.ts` that validates issue exists and status is DRAFT, deletes all `thread_issue_lines` for the issue, then deletes the `thread_issues` record, returning `{ success: true, data: { id, issue_code } }`
- [x] 1.2 Add `deleteIssue(id: number)` method to `src/services/issueV2Service.ts` that calls `DELETE /api/issues/v2/:id` via `fetchApi`

## 2. Frontend — History Actions Column

- [x] 2.1 Add `actions` column to `historyColumns` array in `src/pages/thread/issues/v2/index.vue` as the last column with `label: 'Thao Tác'`, `align: 'center'`, not sortable
- [x] 2.2 Add `#body-cell-actions` template slot in the history DataTable with conditional buttons: Confirm + Delete for DRAFT, Return for CONFIRMED, empty for RETURNED
- [x] 2.3 Implement `handleConfirmFromList(issue)` handler: show `confirmWarning()` dialog, call `issueV2Service.confirm(id)`, show success snackbar, refresh list
- [x] 2.4 Implement `handleDeleteFromList(issue)` handler: show `confirmDelete()` dialog with issue code, call `issueV2Service.deleteIssue(id)`, show success snackbar, refresh list
- [x] 2.5 Implement `handleReturnFromList()` handler: navigate to `/thread/issues/v2/return` via `router.push`
- [x] 2.6 Add `@click.stop` on all action buttons to prevent triggering row-click navigation
- [x] 2.7 Import `useConfirm` composable and `IssueV2Status` enum if not already imported
