## Why

The Issue V2 module currently separates "Create Issue" (`index.vue`) and "Issue History" (`history.vue`) into two separate pages/routes. Users must navigate between them via different sidebar links or URL changes. Merging them into a single tabbed page improves UX by allowing quick switching between creating new issues and viewing history, following the established pattern used in `thread/styles/[id].vue`.

## What Changes

- Merge the history table + filters (currently in `history.vue`) into `index.vue` as a second QTab panel
- Add QTabs navigation ("Tao Phieu Xuat" / "Lich Su") to `index.vue`, defaulting to the create tab
- **Delete** `src/pages/thread/issues/v2/history.vue` entirely, removing the `/thread/issues/v2/history` route
- Update `[id].vue` back-navigation links from `/thread/issues/v2/history` to `/thread/issues/v2`
- Sidebar remains unchanged (single "Xuat Kho V2" link pointing to `/thread/issues/v2`)

## Capabilities

### New Capabilities
- `issue-v2-tabbed-layout`: Tabbed layout combining create form and history table in a single page using QTabs/QTabPanels

### Modified Capabilities

## Impact

- **Frontend files**:
  - `src/pages/thread/issues/v2/index.vue` — major edit (add tabs, inline history content)
  - `src/pages/thread/issues/v2/history.vue` — deleted
  - `src/pages/thread/issues/v2/[id].vue` — minor edit (update back-to path)
- **Routes**: `/thread/issues/v2/history` route removed (auto-handled by unplugin-vue-router when file is deleted)
- **Auto-generated**: `src/typed-router.d.ts` will auto-regenerate
- **No backend changes**: No API or database modifications needed
