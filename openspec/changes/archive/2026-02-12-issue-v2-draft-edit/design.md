## Context

The Issue V2 module in `src/pages/thread/issues/v2/index.vue` has two tabs: "Tạo Phiếu Xuất" (create) and "Lịch Sử" (history). The create tab contains a full form workflow: create issue → select PO/Style/Color → load thread types → enter quantities → add lines → confirm. The history tab lists all issues in a DataTable. Currently, clicking any history row navigates to `[id].vue`, a read-only detail page.

The composable `useIssueV2` manages `currentIssue` state. When `currentIssue` is set (via `createIssue` or `fetchIssue`), the `hasIssue` computed becomes true, which the template uses to toggle between the "create new" form and the "issue loaded" editing view. This means loading a draft issue via `fetchIssue` will automatically show the editing UI — no template changes needed for the core form display.

Local state variables (`department`, `createdBy`, `selectedPoId`, etc.) are populated during issue creation but not when loading an existing issue. These need to be populated from the fetched issue data.

## Goals / Non-Goals

**Goals:**
- DRAFT issues clicked from history load into the create tab for continued editing (adding lines, confirming)
- Reuse the existing form and composable — minimal code changes
- Populate `department` and `createdBy` from the loaded draft issue data

**Non-Goals:**
- Editing issue metadata (department, created_by) after creation
- Loading PO/Style/Color selection from existing lines (user selects fresh each time to add new lines)
- Changing the `[id].vue` detail page
- Modifying CONFIRMED/RETURNED row click behavior

## Decisions

### 1. Navigation: query params on index.vue vs. separate edit route

Use query params `?tab=create&issue=<id>` on `index.vue`. This avoids creating a new route/page and reuses the existing create tab entirely.

**Alternative**: New route `/thread/issues/v2/edit/:id`. Rejected — duplicates the entire create form with no benefit. The form already handles the "issue loaded" state via `hasIssue`.

### 2. Draft detection in row click handler

Check `row.status === IssueV2Status.DRAFT` in `handleHistoryRowClick`. DRAFT → navigate to create tab with issue param. All other statuses → navigate to `[id].vue` as before.

### 3. Populating local state from fetched issue

After `fetchIssue(id)` succeeds, set `department.value` and `createdBy.value` from `currentIssue.value`. These fields display in the header but are read-only for loaded drafts (the issue was already created). The PO/Style/Color selectors remain empty — the user picks them to load new thread types for adding lines.

### 4. Clearing state when switching away

When the user navigates away from an edit session (e.g., clicks "Phiếu Mới" or switches to history tab), call `clearIssue()` and reset local state. The existing `handleNewIssue` function already does this.

## Risks / Trade-offs

- **[URL sharing]** If a user shares a URL with `?issue=<id>` and the issue is no longer DRAFT (was confirmed), the page should handle this gracefully → Mitigation: After fetching, check status is DRAFT; if not, redirect to `[id].vue` detail page instead.
- **[Browser back]** User loads draft, then presses back → goes to history, which is expected behavior. No special handling needed.
- **[Stale data]** Two users editing same draft simultaneously → Existing pattern: backend validates on addLine/confirm. No additional mitigation needed for this scope.
