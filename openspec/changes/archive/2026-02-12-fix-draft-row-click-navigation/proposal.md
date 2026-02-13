## Why

Clicking a DRAFT row in the Issue V2 history table navigates to `?tab=create&issue={id}` but the page does not load the draft issue. The URL updates correctly (showing the issue ID), but because Vue Router does not re-mount the component when only query params change, `onMounted` does not re-run, so `fetchIssue()` is never called and the form stays empty/stuck on the history tab.

## What Changes

- Add a `watch` on `route.query` to detect when the `issue` query param changes after initial mount
- When a new `issue` param is detected, call `fetchIssue()`, populate form fields (`department`, `createdBy`), and switch `activeTab` to `'create'`
- Extract the shared "load draft issue" logic from `onMounted` into a reusable function used by both `onMounted` and the new watcher

## Capabilities

### New Capabilities
- `draft-row-click-nav`: Fix navigation from history table row click to draft editing form by reacting to route query param changes

### Modified Capabilities

## Impact

- `src/pages/thread/issues/v2/index.vue` — add route query watcher, extract shared draft-loading logic
