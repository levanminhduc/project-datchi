## Context

The Issue V2 module manages thread export slips (phiếu xuất kho) with a 3-state lifecycle: DRAFT → CONFIRMED → RETURNED. The history tab in `src/pages/thread/issues/v2/index.vue` lists all issues in a DataTable with columns: issue_code, department, line_count, status, created_at, created_by. Currently, users must click a row to navigate to the detail page (`[id].vue`) before performing any action. The project already has `useConfirm()` composable (`src/composables/useConfirm.ts`) providing `confirmWarning()` and `confirmDelete()` dialog helpers. The frontend service `issueV2Service.ts` already has a `confirm()` method but no `delete` method. The backend has no DELETE endpoint for entire issues — only for individual lines within a DRAFT issue.

## Goals / Non-Goals

**Goals:**
- Add an Actions column to the history DataTable with contextual buttons per status
- DRAFT issues: Confirm button (with warning dialog) and Delete button (with delete dialog)
- CONFIRMED issues: Return button (navigates to return page)
- RETURNED issues: no action buttons
- New backend DELETE endpoint for DRAFT issues only
- Refresh the issue list after successful confirm or delete

**Non-Goals:**
- Print/Export PDF functionality
- Duplicate/copy issue functionality
- Bulk actions (multi-select)
- Modifying the existing row-click navigation behavior

## Decisions

### 1. Actions column placement — last column
Place the Actions column as the last column in historyColumns, matching the pattern used in the lines table within `[id].vue`. The column has no sortable flag and uses `align: 'center'`.

**Alternative**: Embed actions inside the status column. Rejected because it overloads one cell and breaks column semantics.

### 2. Confirm action uses `useConfirm().confirmWarning()`
The confirm action deducts stock from inventory — this is a significant operation. Use `confirmWarning()` with a clear message explaining the consequence. After confirmation, call `issueV2Service.confirm(id)` then refresh the list.

**Alternative**: Navigate to detail page for confirm. Rejected because users explicitly want inline actions.

### 3. Delete action uses `useConfirm().confirmDelete()`
Delete is destructive and irreversible (removes issue + all lines). Use `confirmDelete()` with `persistent: true` dialog. Backend validates status === DRAFT before deleting.

### 4. Backend delete — soft vs hard delete
Use **hard delete** (actual DELETE from `thread_issue_lines` then `thread_issues`). DRAFT issues have no inventory impact (stock not yet deducted), so there's no audit trail concern. This is consistent with the existing `DELETE /:id/lines/:lineId` pattern for removing lines.

**Alternative**: Soft delete with `deleted_at` timestamp. Rejected — over-engineering for draft data that has zero inventory impact.

### 5. Delete order — lines first, then issue
Delete `thread_issue_lines` WHERE `issue_id = :id` first, then delete the `thread_issues` record. This avoids foreign key constraint violations without relying on CASCADE (which may not be configured).

### 6. Return button navigates with query parameter
The Return button navigates to `/thread/issues/v2/return` using `router.push`. The return page already has a dropdown to select an issue, so navigation is sufficient — no need to pass issue ID as query param since the page loads all confirmed issues.

**Alternative**: Pass `?issue=<id>` query param for auto-select. Could be a future enhancement but adds complexity to the return page that is out of scope.

## Risks / Trade-offs

- **[Race condition]** User confirms from list while another user edits the same DRAFT → Backend already validates status before confirm, returning 400 if not DRAFT. Mitigation: existing backend validation is sufficient.
- **[Accidental confirm]** User clicks confirm without reviewing lines → Mitigation: Warning dialog with clear message "Phiếu sẽ được xác nhận và trừ tồn kho. Bạn có chắc chắn?"
- **[Accidental delete]** User deletes wrong issue → Mitigation: Delete confirmation dialog with issue code displayed, persistent mode.
- **[Table width on mobile]** Adding a column may cause horizontal scroll → Already handled: `history-table` has `overflow-x: auto` CSS. Action buttons use icon-only (no labels) to minimize width.
