## Context

The Issue V2 module has two separate pages: `index.vue` (create issue form) and `history.vue` (issue history table with filters). These live at `/thread/issues/v2` and `/thread/issues/v2/history` respectively. The `[id].vue` detail page links back to the history route.

The project already uses QTabs/QTabPanels in `thread/styles/[id].vue` for multi-section layouts. This change applies the same pattern to unify create + history into a single tabbed page.

The project uses `unplugin-vue-router` for file-based routing — deleting `history.vue` automatically removes the route.

## Goals / Non-Goals

**Goals:**
- Combine create form and history table into a single page with tab navigation
- Follow the existing QTabs pattern from `thread/styles/[id].vue`
- Default to "Create" tab when navigating to `/thread/issues/v2`
- Remove the orphaned `/thread/issues/v2/history` route cleanly

**Non-Goals:**
- Refactoring the create form or history table logic (keep existing logic intact)
- Adding new features to either the create form or history view
- Changing backend API or database schema
- Modifying other Issue V2 pages (return.vue stays untouched)

## Decisions

### 1. Inline history content into index.vue (vs. extracting a component)

**Decision**: Move history content directly into `index.vue` as a tab panel, rather than extracting it into a separate component.

**Rationale**: The history content (filters + DataTable) is only used in this one place. Creating a separate component adds an abstraction layer with no reuse benefit. The `index.vue` file is already large (~865 lines), but both sections are distinct enough within tab panels.

**Alternative considered**: Extract `IssueV2HistoryPanel.vue` component — rejected because it would be a single-use component adding unnecessary indirection.

### 2. Tab state management via ref with query param support

**Decision**: Use `ref` initialized from `route.query.tab` — defaults to `'create'` unless `?tab=history` is present.

**Rationale**: Allows the detail page to navigate back to the history tab via query param, while keeping the default experience unchanged. `onMounted` checks if `activeTab` is already `'history'` and loads data immediately.

### 3. Back-navigation from detail page

**Decision**: Change `[id].vue` back-to to `/thread/issues/v2?tab=history`. The user lands on the history tab they were browsing.

**Rationale**: Users navigate to detail from the history list, so returning to history is the expected UX. The query param approach is minimal — only one param, read once on mount.

## Risks / Trade-offs

- **Large file size**: `index.vue` will grow from ~865 lines to ~1050+ lines by inlining history content → Acceptable since content is clearly separated by tab panels. Future refactoring can extract components if needed.
- **History tab doesn't auto-load on create tab**: History data only loads when switching to the history tab → Better performance since we avoid unnecessary API calls on page load. Use a watcher on `activeTab` to trigger `loadData()` when switching to history.
- **Back-navigation UX**: Going back from `[id].vue` lands on history tab via `?tab=history` query param → Natural UX flow.
