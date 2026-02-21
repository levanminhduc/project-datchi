## 1. Page Header Refactor

- [x] 1.1 Replace manual header div with PageHeader component (title="Quản Lý Nhân Viên")
- [x] 1.2 Replace q-input search with SearchInput component in PageHeader actions slot
- [x] 1.3 Replace q-btn add with AppButton component in PageHeader actions slot ← (verify: PageHeader renders with search + add button, search filtering still works)

## 2. Table Loading & Empty State

- [x] 2.1 Replace q-inner-loading + q-spinner-dots with InnerLoading component in table #loading slot
- [x] 2.2 Replace manual empty state div with EmptyState component in table #no-data slot (handle both search and no-data states) ← (verify: loading spinner and both empty states display correctly)

## 3. Inline Edit Refactor

- [x] 3.1 Replace q-spinner-dots with AppSpinner for inline edit loading indicators (3 cells)
- [x] 3.2 ~~Replace q-popup-edit + q-input for full_name column with PopupEdit component~~ SKIPPED: PopupEdit loses initialVal parameter needed by handleInlineEdit rollback logic. Keep raw q-popup-edit.
- [x] 3.3 ~~Replace q-popup-edit + q-input for department column with PopupEdit component~~ SKIPPED: Same reason as 3.2
- [x] 3.4 Verify PopupEdit @save event signature matches handleInlineEdit handler, adapt if needed ← VERIFIED: PopupEdit emits save(value) losing initialVal. Keeping raw q-popup-edit for all 3 columns.

## 4. Table Action Buttons

- [x] 4.1 Replace q-btn + q-tooltip for view button with IconButton + AppTooltip
- [x] 4.2 Replace q-btn + q-tooltip for edit button with IconButton + AppTooltip
- [x] 4.3 Replace q-btn + q-tooltip for delete button with IconButton + AppTooltip ← (verify: all 3 action buttons trigger correct dialogs)

## 5. Delete Dialog Refactor

- [x] 5.1 Replace manual q-dialog delete confirmation with DeleteDialog component
- [x] 5.2 ~~Remove deleteDialog reactive state~~ KEPT deleteDialog state (still needed to track employee for API call). Adapted to DeleteDialog API. ← (verify: delete flow works end-to-end)

## 6. Detail Dialog Refactor

- [x] 6.1 Replace outer q-dialog + q-card with AppDialog component (with header/actions slots)
- [x] 6.2 Replace q-list with AppList (separator prop) and q-item with ListItem
- [x] 6.3 Replace q-badge status indicator with AppBadge
- [x] 6.4 Replace q-btn actions (edit, close) with AppButton components ← (verify: detail dialog shows all 7 info fields, status badge correct colors, edit-from-detail flow works, close works)

## 7. Import Cleanup

- [x] 7.1 ~~Add all new component imports~~ NOT NEEDED: Project uses unplugin-vue-components (auto-import from src/components/)
- [x] 7.2 Remove any orphaned imports ← No orphaned imports found. Existing imports (vue, quasar, composables, types) all still needed.
