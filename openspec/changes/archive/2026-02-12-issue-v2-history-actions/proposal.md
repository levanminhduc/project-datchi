## Why

The Issue V2 history table (tab "Lịch Sử") currently only displays data with no inline actions. Users must click a row to navigate to the detail page before they can confirm, delete, or return an issue. Adding an Actions column with contextual buttons lets users perform common operations directly from the list, reducing clicks and improving workflow efficiency.

## What Changes

- Add an **Actions column** to the history DataTable in `src/pages/thread/issues/v2/index.vue`
- Show **Confirm button** (icon `check_circle`, color `positive`) for DRAFT issues — with a warning confirmation dialog via `useConfirm().confirmWarning()`
- Show **Delete button** (icon `delete`, color `negative`) for DRAFT issues — with a delete confirmation dialog via `useConfirm().confirmDelete()`
- Show **Return button** (icon `replay`, color `info`) for CONFIRMED issues — navigates to return page
- RETURNED issues show no action buttons
- Add a new **DELETE /api/issues/v2/:id** backend endpoint that only allows deleting DRAFT issues (deletes issue + all its lines)
- Add `deleteIssue(id)` method to `issueV2Service.ts`

## Capabilities

### New Capabilities
- `delete-draft-issue`: Backend endpoint to delete a DRAFT issue and all its lines, with status validation
- `history-action-buttons`: Frontend Actions column with contextual Confirm/Delete/Return buttons and confirmation dialogs

### Modified Capabilities

## Impact

- **Backend**: New DELETE route in `server/routes/issuesV2.ts`
- **Service**: New method in `src/services/issueV2Service.ts`
- **Frontend**: Modified `src/pages/thread/issues/v2/index.vue` — new column, button templates, handlers, confirm/delete dialogs
- **No database migration needed** — uses existing tables with standard DELETE operations
- **No breaking changes** — additive feature only
