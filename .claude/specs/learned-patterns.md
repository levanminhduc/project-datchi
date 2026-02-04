# Learned Patterns

Patterns discovered during implementation that should be followed consistently.

---

## 2026-02-02 Responsive Layout

**Context**: Fixing responsive design issues with sidebar open/close behavior
**Pattern**: Avoid fixed `max-width` values (e.g., `max-width: 1200px`) for page containers when using Quasar's drawer layout. Use `width: 100%; max-width: 100%` instead to allow content to properly adapt when sidebar opens/closes.
**Reason**: Quasar's layout system (`view="hHh Lpr fFf"`) automatically adjusts the page container width when drawer opens/closes. Fixed max-width values prevent the content from properly filling the available space, causing layout issues.

---

## 2026-02-02 Overflow Handling

**Context**: Ensuring tables and stepper content adapt to container width changes
**Pattern**: Add `:deep(.q-stepper__content) { overflow-x: auto; }` for stepper pages and `:deep(.q-table__middle) { overflow-x: auto; }` for table pages to handle horizontal overflow gracefully when sidebar state changes.
**Reason**: When sidebar opens, the available width decreases. Without proper overflow handling, content may get cut off or cause horizontal scroll on the entire page.

---

## 2026-02-03 Tab View Data Consistency

**Context**: Fixing data discrepancy between "Tổng Hợp" (Summary) and "Chi Tiết" (Detail) tab views
**Pattern**: When a page has multiple tab views showing the same underlying data (e.g., summary vs detail view), always refresh data when switching tabs. Don't use `if (data.length === 0)` checks which cause stale cache issues.
**Reason**: Using `data.length === 0` to prevent unnecessary fetches causes the summary view to show stale data when the user adds new records, then switches tabs. The condition passes only on first load, so subsequent tab switches show outdated cached data.

---

## 2026-02-03 Refresh Related Views on Data Mutation

**Context**: After receiving new stock, summary view showed outdated data
**Pattern**: When a mutation affects multiple views (e.g., receiving stock updates both detail and summary views), refresh ALL affected views in parallel using `Promise.all()`. Don't refresh just the current view.
**Reason**: If user receives stock while on detail view, then switches to summary, the summary cache is stale. By refreshing both views on mutation, data stays consistent regardless of which view the user switches to.

---

## 2026-02-04 Vue Event Handler Timing with v-model

**Context**: Clearing AppSelect filter didn't refresh data with cleared value
**Pattern**: When using `@update:model-value` on v-model bound components to trigger side effects (API calls), always use `await nextTick()` before reading the reactive state. The event handler fires BEFORE v-model updates the reactive object.
**Reason**: Vue's v-model update and event emission happen in a specific order. The `@update:model-value` event fires first, then v-model binding updates the ref/reactive object. If handler reads the reactive state immediately, it gets the OLD value.

---
