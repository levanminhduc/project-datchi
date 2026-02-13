## Context

The Issue V2 page (`src/pages/thread/issues/v2/index.vue`) is a single-component page with two tabs: "Create" and "History". When a user clicks a DRAFT row in the history table, `handleHistoryRowClick` calls `router.push('/thread/issues/v2?tab=create&issue={id}')`. Since this is the same route with different query params, Vue Router does not re-mount the component, so `onMounted` (which contains the draft-loading logic) does not fire again.

Current draft-loading logic lives exclusively in `onMounted`:
1. Reads `route.query.issue`
2. Calls `fetchIssue(issueId)`
3. Sets `department`, `createdBy` from the result
4. Switches `activeTab` to `'create'`

There is no `watch` on route query params, so navigating within the same component via query changes has no effect.

## Goals / Non-Goals

**Goals:**
- Clicking a DRAFT row in history SHALL load the draft issue into the create form
- The fix SHALL reuse existing `fetchIssue` and form population logic
- Navigation SHALL work both on initial page load (via URL) and in-page (via row click)

**Non-Goals:**
- Refactoring the tab system or component splitting
- Changing the CONFIRMED row click behavior (already navigates to detail page)
- Adding new API endpoints or backend changes

## Decisions

**Decision 1: Watch `route.query.issue` instead of re-mounting**

Extract the "load draft from query" logic into a standalone async function. Call it from both `onMounted` and a new `watch(()=> route.query.issue)`.

Rationale: Minimal change, avoids adding `:key="route.fullPath"` to the router-view (which would cause full re-mounts and lose all component state on any query change).

## Risks / Trade-offs

- [Watcher fires on initial mount too] → Use `{ immediate: false }` since `onMounted` already handles the initial case, or remove the duplicate logic from `onMounted` and use `{ immediate: true }` on the watcher instead. The cleaner approach is to replace the `onMounted` logic with an immediate watcher.
