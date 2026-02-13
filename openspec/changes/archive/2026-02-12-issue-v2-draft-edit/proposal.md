## Why

When users click on a DRAFT issue row in the history tab, they are navigated to a read-only detail page (`[id].vue`) that only shows issue information and lines. They cannot continue adding lines or editing the draft. Users must go back and start from scratch, which is inefficient. By loading the DRAFT issue into the existing create form on `index.vue`, users can seamlessly continue editing their draft — adding more lines, reviewing existing ones, and eventually confirming.

## What Changes

- Modify `handleHistoryRowClick` to route DRAFT issues to the create tab with `?tab=create&issue=<id>` instead of navigating to `[id].vue`
- Add logic in `index.vue` to detect the `issue` query parameter on mount, fetch the draft issue, and populate the form state (`department`, `createdBy`) from the loaded issue
- CONFIRMED and RETURNED issues continue navigating to `[id].vue` as before (read-only detail)

## Capabilities

### New Capabilities
- `draft-edit-redirect`: Route DRAFT issue row clicks to the create tab with the issue loaded, enabling users to continue editing a draft issue using the existing form

### Modified Capabilities

## Impact

- **Frontend**: Modified `src/pages/thread/issues/v2/index.vue` — changed row click behavior, added query param detection and draft loading logic
- **No backend changes** — uses existing `fetchIssue` / `getById` API
- **No database changes**
- **No breaking changes** — CONFIRMED/RETURNED issues retain existing behavior
