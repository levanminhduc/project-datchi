# UI Component Library

## Overview

Comprehensive UI component library at `src/components/ui/` wrapping Quasar Framework components with standardized props, TypeScript interfaces, and Vietnamese defaults. Addresses inconsistency and maintainability issues when using Quasar components directly.

**Implementation Status**: ~80% Complete (63/80+ components implemented)

## User Stories

### Story 1: Foundation Setup (Priority: P1) MVP COMPLETE

As a developer, I want a base folder structure and types so I can start developing components following standard patterns.

**Independent Test**: Run `npm run type-check` successfully, folder structure created completely.

**Acceptance Criteria**:
- [x] WHEN project is built, THE SYSTEM SHALL auto-import all UI components via QuasarResolver
- [x] THE SYSTEM SHALL have folder structure `src/components/ui/` with subdirectories: buttons, inputs, feedback, tables, lists, cards, dialogs, navigation, layout, media, pickers, scroll
- [x] THE SYSTEM SHALL have base types at `src/types/ui/base.ts` with BaseProps, ColorType, SizeType interfaces
- [x] WHEN developer imports from barrel file, THE SYSTEM SHALL export all components from `src/components/ui/index.ts`
- [x] THE SYSTEM SHALL have template component `AppButton.vue` as reference example

### Story 2: Core Components - Buttons (Priority: P1) MVP COMPLETE

As a developer, I want standardized button components to use throughout the application with consistent API.

**Independent Test**: Render AppButton with various variant/size, verify props work correctly.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 5 button components: AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown
- [x] WHEN using AppButton, THE SYSTEM SHALL support props: variant ('primary'|'secondary'|'danger'|'warning'|'success'|'info'), size ('xs'|'sm'|'md'|'lg'), loading, disabled, icon, iconRight, to (router-link)
- [x] WHERE label is not provided, THE SYSTEM SHALL display slot content or Vietnamese default text
- [x] WHEN loading=true, THE SYSTEM SHALL display spinner and disable button

### Story 3: Core Components - Inputs (Priority: P1) MVP PARTIAL

As a developer, I want input components with integrated validation and Vietnamese labels.

**Independent Test**: Render form with AppInput, AppSelect, verify v-model and validation rules.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL provide 10 input components: AppInput, AppSelect, AppCheckbox, AppToggle, AppSlider, AppRange, SearchInput, AppTextarea, AppFile, AppUploader
  - **8/10 implemented**: Missing AppFile, AppUploader
- [x] WHEN using AppInput, THE SYSTEM SHALL support props: type, label, placeholder, rules, errorMessage, clearable, outlined (default true)
- [x] WHEN using AppSelect, THE SYSTEM SHALL support props: options, multiple, useChips, filterFn, emptyLabel
- [x] WHERE validation fails, THE SYSTEM SHALL display error message in Vietnamese
- [x] THE SYSTEM SHALL support slots: prepend, append, before, after for all input components

### Story 4: Core Components - Feedback (Priority: P1) MVP COMPLETE (+BONUS)

As a developer, I want feedback components to display loading status and processing results.

**Independent Test**: Display AppSpinner, AppProgress with various props, verify animation.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 6 feedback components: AppSpinner, AppProgress, AppSkeleton, EmptyState, AppBanner, InnerLoading
  - **BONUS**: CircularProgress also implemented (7 total)
- [x] WHEN using EmptyState, THE SYSTEM SHALL display default message "Khong co du lieu" with appropriate icon
- [x] WHEN using AppBanner, THE SYSTEM SHALL support type ('info'|'warning'|'error'|'success') and closable

### Story 5: Data Display - Tables (Priority: P2) PARTIAL

As a developer, I want a powerful DataTable component to display and manage tabular data.

**Independent Test**: Render DataTable with mock data, verify sort, filter, pagination.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL provide 5 table components: DataTable, EditableCell, TableActions, TablePagination, TableFilter
  - **1/5 implemented**: Only DataTable done
- [x] WHEN using DataTable, THE SYSTEM SHALL support props: columns, rows, loading, pagination, selection, rowKey, filter
- [x] WHEN using selection, THE SYSTEM SHALL emit 'update:selected' event with selected rows
- [ ] WHERE pagination enabled, THE SYSTEM SHALL display TablePagination with Vietnamese labels ("Trang X / Y", "Hien thi X-Y cua Z")
  - TablePagination component not implemented (using QTable built-in)
- [ ] WHEN using TableActions, THE SYSTEM SHALL support preset actions: edit, delete, view, copy with corresponding icons
  - TableActions component not implemented

### Story 6: Data Display - Lists & Cards (Priority: P2) PARTIAL

As a developer, I want components to display data in list and card format.

**Independent Test**: Render AppList with items, verify interaction and slots.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL provide 6 list components: AppList, ListItem, AppTree, TreeNode, ExpansionItem, ExpansionList
  - **2/6 implemented**: Only AppList, ListItem done
- [x] THE SYSTEM SHALL provide 5 card components: AppCard, InfoCard, StatCard, AppBadge, AppChip
- [x] WHEN using AppCard, THE SYSTEM SHALL support slots: header, default, actions with default styling
- [x] WHEN using StatCard, THE SYSTEM SHALL display title, value, trend (up/down), comparison with previous value

### Story 7: Dialogs & Overlays (Priority: P2) COMPLETE

As a developer, I want dialog components with common confirm/delete patterns.

**Independent Test**: Call useConfirm().confirm(), verify dialog displays and returns Promise.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 7 overlay components: AppDialog, ConfirmDialog, FormDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit
- [x] WHEN using ConfirmDialog, THE SYSTEM SHALL display title, message, confirmText, cancelText with Vietnamese defaults
- [x] WHEN using DeleteDialog, THE SYSTEM SHALL display warning message and require confirmation text
- [x] THE SYSTEM SHALL provide useConfirm() composable wrapping $q.dialog()
  - API: confirm(), confirmWarning(), confirmDelete()
- [x] THE SYSTEM SHALL provide useSnackbar() composable wrapping $q.notify()
  - API: show(), success(), error(), warning(), info(), loading()
- [x] THE SYSTEM SHALL provide useDialog<T>() composable for generic dialog state management
  - API: isOpen, data, open(payload?), close(), toggle()
  - Typed payloads with generic <T> support
- [x] THE SYSTEM SHALL provide useLoading() composable for count-based loading state
  - API: isLoading, loadingCount, start(), stop(), reset(), withLoading(fn)
  - Count-based for concurrent loading operations
- [x] THE SYSTEM SHALL provide useDarkMode() composable for theme switching
  - API: preference, setMode(mode), toggle(), isDark(), init()
  - Modes: 'auto' | 'light' | 'dark' with localStorage persistence
- [x] THE SYSTEM SHALL provide useSidebar() composable for global sidebar state
  - API: isOpen (v-model compatible), navItems, toggle(), open(), close()
  - Shared state across components (module-level ref)

### Story 8: Navigation & Layout (Priority: P2) COMPLETE

As a developer, I want navigation and layout components to build consistent UI.

**Independent Test**: Render AppTabs, AppBreadcrumbs, verify navigation works.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 7 navigation components: AppTabs, TabPanel, AppBreadcrumbs, AppPagination, AppStepper, StepperStep, SidebarItem
  - **SidebarItem**: Recursive navigation item with expansion support, uses `@/types/navigation` (NavItem type)
- [x] THE SYSTEM SHALL provide 6 layout components: AppToolbar, AppSeparator, AppSpace, PageHeader, SectionHeader, AppDrawer
- [x] WHEN using PageHeader, THE SYSTEM SHALL display title, subtitle, breadcrumbs, and action slot
- [x] WHEN using AppStepper, THE SYSTEM SHALL support horizontal/vertical layout with step validation

### Story 9: Media & Pickers (Priority: P3) COMPLETE

As a developer, I want media and picker components for advanced functionality.

**Independent Test**: Render DatePicker, ColorPicker, verify value binding.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 4 media components: AppCarousel, AppImage, AppVideo, AppParallax
- [x] THE SYSTEM SHALL provide 5 picker components: DatePicker, TimePicker, ColorPicker, AppEditor, FilePicker
- [x] WHEN using DatePicker, THE SYSTEM SHALL display calendar with Vietnamese locale and format "DD/MM/YYYY"
- [x] WHEN using TimePicker, THE SYSTEM SHALL support 24h format (default) or 12h format

### Story 10: Scroll & Advanced (Priority: P3) COMPLETE

As a developer, I want scroll and advanced components for better UX.

**Independent Test**: Render VirtualScroll with 1000+ items, verify performance.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL provide 6 scroll components: ScrollArea, VirtualScroll, InfiniteScroll, PullToRefresh, Timeline, TimelineEntry
- [x] WHEN using VirtualScroll, THE SYSTEM SHALL render efficiently with large datasets (1000+ items) without lag
- [x] WHEN using InfiniteScroll, THE SYSTEM SHALL emit 'load' event when scrolling to threshold with debounce

### Story 11: Documentation & Cleanup (Priority: P3) PARTIAL

As a developer, I want documentation and demo pages to reference usage.

**Independent Test**: Access /components, view all component demos organized by category.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL split pages/components.vue into separate demo sections
  - **Current state**: 1237 lines in single file, needs splitting
  - **Sections identified** (8 total):
    1. Section 1: Navigation & Actions (lines 16-131)
    2. Section 2: Form Controls (lines 132-335)
    3. Section 3: Data Display (lines 336-466)
    4. Section 4: Feedback (lines 467-604)
    5. Section 5: Containment (lines 605-739)
    6. Section 6: Selection & Tabs (lines 740-886)
    7. Section 7: Navigation (lines 887-978)
    8. Section 8: Layout & Others (lines 979-end)
- [ ] THE SYSTEM SHALL migrate DarkModeToggle.vue into ui/common/
  - Still in `src/components/`
- [x] THE SYSTEM SHALL consolidate all types into src/types/ui/ with barrel exports
- [ ] THE SYSTEM SHALL have JSDoc comments for all public props and methods

### Story 12: AppSelect Behavior Prop Fix (Priority: P1) MVP - Bug Fix COMPLETE

As a developer using AppSelect component, I want the dropdown popup to open consistently regardless of use-input prop value, so that users can always access the options list.

**Independent Test**: Render AppSelect with `use-input=false`, click on it, verify popup opens in dialog mode.

**Acceptance Criteria**:
- [x] WHEN user clicks on AppSelect with use-input=false, THE SYSTEM SHALL open popup in dialog mode
- [x] WHEN user clicks on AppSelect with use-input=true, THE SYSTEM SHALL open popup and maintain existing search behavior
- [x] WHEN behavior prop is set to 'menu', THE SYSTEM SHALL display popup as menu dropdown
- [x] WHEN behavior prop is set to 'dialog', THE SYSTEM SHALL display popup as dialog overlay
- [x] WHEN behavior prop is not specified, THE SYSTEM SHALL default to 'menu' mode

**Root Cause**: When `use-input=false`, QSelect's default behavior mode can fail to trigger popup on click. Explicitly setting `behavior='dialog'` resolves this.

**Files Modified**:
- `src/types/ui/inputs.ts` - Added `behavior?: 'menu' | 'dialog'` prop (line 97-98)
- `src/components/ui/inputs/AppSelect.vue` - Added `:behavior` binding (line 26) and default (line 81)

**Filter Handler Auto-Update Fix (2026-01-30)**

- [x] WHEN use-input=true AND parent has @filter handler THEN emit filter event to parent for handling
- [x] WHEN use-input=true AND parent has NO @filter handler THEN auto-call update() to show all options immediately
- [x] THE SYSTEM SHALL use useAttrs() to detect parent filter handler presence
- [x] THE SYSTEM SHALL NOT require parent components to handle @filter event when not using filtering

**Root Cause (Filter Issue)**: `@filter` handler always emitted event without calling `update()`. When parent doesn't handle it, QSelect waits forever → infinite loading spinner.

**Solution**: Smart `handleFilter` function that:
1. Checks for parent handler via `attrs.onFilter`
2. Emits to parent if handler exists
3. Auto-calls `update()` if no parent handler

**Files Modified**:
- `src/components/ui/inputs/AppSelect.vue`:
  - Added `useAttrs` import
  - Added `const attrs = useAttrs()`
  - Created `handleFilter` function (lines 127-139)
  - Changed template from inline emit to `@filter="handleFilter"`

## Non-Functional Requirements

### Performance
- [ ] THE SYSTEM SHALL tree-shake unused components (bundle size < 200KB for core components)
- [ ] THE SYSTEM SHALL lazy-load heavy components (Editor, Carousel) when needed

### Developer Experience
- [ ] THE SYSTEM SHALL provide TypeScript autocomplete for all props
- [ ] THE SYSTEM SHALL have consistent naming: App[ComponentName] pattern
- [ ] THE SYSTEM SHALL have default props suitable for common use cases

### Maintainability
- [ ] THE SYSTEM SHALL have consistent wrapper pattern across components
- [ ] THE SYSTEM SHALL have separation of concerns: types, components, composables

## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Prefix convention | `App` | Avoids conflict with Quasar Q- prefix, clearly app component | `Base`, `Custom`, no prefix |
| Default outlined | `true` | Matches current design pattern in project | filled, standout |
| Vietnamese defaults | Yes | Project target audience is Vietnamese users | English, no defaults |
| TypeScript strict | Yes | Project uses strict mode | Loose types |
| QuasarResolver | Add to vite config | Enable auto-import Quasar components | Manual imports |
| AppSelect default behavior | `'menu'` | Menu mode aligns with Quasar defaults for standard dropdown UX on desktop | `'dialog'` (alternative for mobile/nested dialogs) |

## Out of Scope

- Unit tests for all components (will add later in separate Story)
- Storybook integration
- Complex component theming system
- Comprehensive accessibility audit
- Mobile-specific components
- Behavior prop interaction with mobile devices (uses Quasar native mobile handling)
- Custom popup positioning beyond Quasar's behavior modes
- Popup animation customization

## Implementation Notes

**Last Synced**: 2026-01-30
**Status**: Synced from implementation analysis

### Sync Update Summary
- Added SidebarItem to navigation components (63 total)
- Documented all 6 composables: useDialog, useLoading, useDarkMode, useSidebar, useConfirm, useSnackbar
- Updated Story 11 with components.vue split analysis (1237 lines, 8 sections)
- Added Story 12: AppSelect behavior prop fix (completed 2026-01-29)
- Added Story 12 Filter Handler Auto-Update Fix (completed 2026-01-30)
