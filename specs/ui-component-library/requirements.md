# UI Component Library

## Tổng quan

Xây dựng thư viện UI component toàn diện tại `src/components/ui/` bọc lại các component của Quasar Framework với props chuẩn hóa, TypeScript interfaces, và mặc định tiếng Việt. Giải quyết vấn đề thiếu tính nhất quán và khó bảo trì khi sử dụng trực tiếp Quasar components.

**Implementation Status**: ~80% Complete (63/80+ components implemented)

## User Stories

### Story 1: Cài đặt nền tảng (Priority: P1) 🎯 MVP ✅ COMPLETE

Là một developer, tôi muốn có cấu trúc thư mục và types cơ bản để có thể bắt đầu phát triển các components theo pattern chuẩn.

**Independent Test**: Chạy `npm run type-check` thành công, folder structure được tạo đầy đủ.

**Acceptance Criteria**:
- [x] WHEN dự án được build, THE SYSTEM SHALL auto-import tất cả UI components qua QuasarResolver
- [x] THE SYSTEM SHALL có folder structure `src/components/ui/` với các thư mục con: buttons, inputs, feedback, tables, lists, cards, dialogs, navigation, layout, media, pickers, scroll
- [x] THE SYSTEM SHALL có base types tại `src/types/ui/base.ts` với BaseProps, ColorType, SizeType interfaces
- [x] WHEN developer import từ barrel file, THE SYSTEM SHALL export tất cả components từ `src/components/ui/index.ts`
- [x] THE SYSTEM SHALL có template component `AppButton.vue` làm mẫu tham chiếu

### Story 2: Core Components - Buttons (Priority: P1) 🎯 MVP ✅ COMPLETE

Là một developer, tôi muốn có các button components chuẩn hóa để sử dụng trong toàn bộ ứng dụng với API nhất quán.

**Independent Test**: Render AppButton với các variant/size, kiểm tra props hoạt động đúng.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 5 button components: AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown
- [x] WHEN sử dụng AppButton, THE SYSTEM SHALL hỗ trợ props: variant ('primary'|'secondary'|'danger'|'warning'|'success'|'info'), size ('xs'|'sm'|'md'|'lg'), loading, disabled, icon, iconRight, to (router-link)
- [x] WHERE không truyền label, THE SYSTEM SHALL hiển thị slot content hoặc text mặc định tiếng Việt
- [x] WHEN loading=true, THE SYSTEM SHALL hiển thị spinner và disable button

### Story 3: Core Components - Inputs (Priority: P1) 🎯 MVP ⚠️ PARTIAL

Là một developer, tôi muốn có các input components với validation tích hợp và label tiếng Việt.

**Independent Test**: Render form với AppInput, AppSelect, kiểm tra v-model và validation rules.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL cung cấp 10 input components: AppInput, AppSelect, AppCheckbox, AppToggle, AppSlider, AppRange, SearchInput, AppTextarea, AppFile, AppUploader
  - ⚠️ **8/10 implemented**: Missing AppFile, AppUploader
- [x] WHEN sử dụng AppInput, THE SYSTEM SHALL hỗ trợ props: type, label, placeholder, rules, errorMessage, clearable, outlined (default true)
- [x] WHEN sử dụng AppSelect, THE SYSTEM SHALL hỗ trợ props: options, multiple, useChips, filterFn, emptyLabel
- [x] WHERE validation fails, THE SYSTEM SHALL hiển thị error message bằng tiếng Việt
- [x] THE SYSTEM SHALL hỗ trợ slots: prepend, append, before, after cho tất cả input components

### Story 4: Core Components - Feedback (Priority: P1) 🎯 MVP ✅ COMPLETE (+BONUS)

Là một developer, tôi muốn có các feedback components để thông báo trạng thái loading và kết quả xử lý.

**Independent Test**: Hiển thị AppSpinner, AppProgress với các props, kiểm tra animation.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 6 feedback components: AppSpinner, AppProgress, AppSkeleton, EmptyState, AppBanner, InnerLoading
  - ✨ **BONUS**: CircularProgress also implemented (7 total)
- [x] WHEN sử dụng EmptyState, THE SYSTEM SHALL hiển thị message mặc định "Không có dữ liệu" với icon phù hợp
- [x] WHEN sử dụng AppBanner, THE SYSTEM SHALL hỗ trợ type ('info'|'warning'|'error'|'success') và closable

### Story 5: Data Display - Tables (Priority: P2) ⚠️ PARTIAL

Là một developer, tôi muốn có DataTable component mạnh mẽ để hiển thị và quản lý dữ liệu dạng bảng.

**Independent Test**: Render DataTable với mock data, kiểm tra sort, filter, pagination.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL cung cấp 5 table components: DataTable, EditableCell, TableActions, TablePagination, TableFilter
  - ⚠️ **1/5 implemented**: Only DataTable done
- [x] WHEN sử dụng DataTable, THE SYSTEM SHALL hỗ trợ props: columns, rows, loading, pagination, selection, rowKey, filter
- [x] WHEN sử dụng selection, THE SYSTEM SHALL emit 'update:selected' event với rows được chọn
- [ ] WHERE pagination enabled, THE SYSTEM SHALL hiển thị TablePagination với label tiếng Việt ("Trang X / Y", "Hiển thị X-Y của Z")
  - ⚠️ TablePagination component not implemented (using QTable built-in)
- [ ] WHEN sử dụng TableActions, THE SYSTEM SHALL hỗ trợ preset actions: edit, delete, view, copy với icons tương ứng
  - ⚠️ TableActions component not implemented

### Story 6: Data Display - Lists & Cards (Priority: P2) ⚠️ PARTIAL

Là một developer, tôi muốn có components hiển thị dữ liệu dạng list và card.

**Independent Test**: Render AppList với items, kiểm tra interaction và slots.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL cung cấp 6 list components: AppList, ListItem, AppTree, TreeNode, ExpansionItem, ExpansionList
  - ⚠️ **2/6 implemented**: Only AppList, ListItem done
- [x] THE SYSTEM SHALL cung cấp 5 card components: AppCard, InfoCard, StatCard, AppBadge, AppChip
- [x] WHEN sử dụng AppCard, THE SYSTEM SHALL hỗ trợ slots: header, default, actions với styling mặc định
- [x] WHEN sử dụng StatCard, THE SYSTEM SHALL hiển thị title, value, trend (up/down), comparison với value trước đó

### Story 7: Dialogs & Overlays (Priority: P2) ✅ COMPLETE

Là một developer, tôi muốn có dialog components với pattern confirm/delete phổ biến.

**Independent Test**: Gọi useConfirm().confirm(), kiểm tra dialog hiển thị và trả về Promise.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 7 overlay components: AppDialog, ConfirmDialog, FormDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit
- [x] WHEN sử dụng ConfirmDialog, THE SYSTEM SHALL hiển thị title, message, confirmText, cancelText với mặc định tiếng Việt
- [x] WHEN sử dụng DeleteDialog, THE SYSTEM SHALL hiển thị warning message và require confirmation text
- [x] THE SYSTEM SHALL cung cấp useConfirm() composable wrap $q.dialog()
  - API: confirm(), confirmWarning(), confirmDelete()
- [x] THE SYSTEM SHALL cung cấp useSnackbar() composable wrap $q.notify()
  - API: show(), success(), error(), warning(), info(), loading()
- [x] THE SYSTEM SHALL cung cấp useDialog<T>() composable for generic dialog state management
  - API: isOpen, data, open(payload?), close(), toggle()
  - Typed payloads with generic <T> support
- [x] THE SYSTEM SHALL cung cấp useLoading() composable for count-based loading state
  - API: isLoading, loadingCount, start(), stop(), reset(), withLoading(fn)
  - Count-based for concurrent loading operations
- [x] THE SYSTEM SHALL cung cấp useDarkMode() composable for theme switching
  - API: preference, setMode(mode), toggle(), isDark(), init()
  - Modes: 'auto' | 'light' | 'dark' with localStorage persistence
- [x] THE SYSTEM SHALL cung cấp useSidebar() composable for global sidebar state
  - API: isOpen (v-model compatible), navItems, toggle(), open(), close()
  - Shared state across components (module-level ref)

### Story 8: Navigation & Layout (Priority: P2) ✅ COMPLETE

Là một developer, tôi muốn có navigation và layout components để xây dựng UI nhất quán.

**Independent Test**: Render AppTabs, AppBreadcrumbs, kiểm tra navigation hoạt động.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 7 navigation components: AppTabs, TabPanel, AppBreadcrumbs, AppPagination, AppStepper, StepperStep, SidebarItem
  - ✨ **SidebarItem**: Recursive navigation item with expansion support, uses `@/types/navigation` (NavItem type)
- [x] THE SYSTEM SHALL cung cấp 6 layout components: AppToolbar, AppSeparator, AppSpace, PageHeader, SectionHeader, AppDrawer
- [x] WHEN sử dụng PageHeader, THE SYSTEM SHALL hiển thị title, subtitle, breadcrumbs, và action slot
- [x] WHEN sử dụng AppStepper, THE SYSTEM SHALL hỗ trợ horizontal/vertical layout với step validation

### Story 9: Media & Pickers (Priority: P3) ✅ COMPLETE

Là một developer, tôi muốn có media và picker components cho các chức năng nâng cao.

**Independent Test**: Render DatePicker, ColorPicker, kiểm tra value binding.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 4 media components: AppCarousel, AppImage, AppVideo, AppParallax
- [x] THE SYSTEM SHALL cung cấp 5 picker components: DatePicker, TimePicker, ColorPicker, AppEditor, FilePicker
- [x] WHEN sử dụng DatePicker, THE SYSTEM SHALL hiển thị calendar với locale tiếng Việt và format "DD/MM/YYYY"
- [x] WHEN sử dụng TimePicker, THE SYSTEM SHALL hỗ trợ format 24h (mặc định) hoặc 12h

### Story 10: Scroll & Advanced (Priority: P3) ✅ COMPLETE

Là một developer, tôi muốn có scroll và advanced components cho UX tốt hơn.

**Independent Test**: Render VirtualScroll với 1000+ items, kiểm tra performance.

**Acceptance Criteria**:
- [x] THE SYSTEM SHALL cung cấp 6 scroll components: ScrollArea, VirtualScroll, InfiniteScroll, PullToRefresh, Timeline, TimelineEntry
- [x] WHEN sử dụng VirtualScroll, THE SYSTEM SHALL render efficiently với dataset lớn (1000+ items) mà không lag
- [x] WHEN sử dụng InfiniteScroll, THE SYSTEM SHALL emit 'load' event khi scroll đến threshold với debounce

### Story 11: Documentation & Cleanup (Priority: P3) ⚠️ PARTIAL

Là một developer, tôi muốn có documentation và demo pages để tham khảo cách sử dụng.

**Independent Test**: Truy cập /components, xem được tất cả component demos được tổ chức theo category.

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL split pages/components.vue thành các demo sections riêng biệt
  - ⚠️ **Current state**: 1237 lines in single file, needs splitting
  - **Sections identified** (8 total):
    1. Section 1: Navigation & Actions (lines 16-131)
    2. Section 2: Form Controls (lines 132-335)
    3. Section 3: Data Display (lines 336-466)
    4. Section 4: Feedback (lines 467-604)
    5. Section 5: Containment (lines 605-739)
    6. Section 6: Selection & Tabs (lines 740-886)
    7. Section 7: Navigation (lines 887-978)
    8. Section 8: Layout & Others (lines 979-end)
- [ ] THE SYSTEM SHALL migrate DarkModeToggle.vue vào ui/common/
  - ⚠️ Still in `src/components/`
- [x] THE SYSTEM SHALL consolidate tất cả types vào src/types/ui/ với barrel exports
- [ ] THE SYSTEM SHALL có JSDoc comments cho tất cả public props và methods

## Non-Functional Requirements

### Performance
- [ ] THE SYSTEM SHALL tree-shake unused components (bundle size < 200KB cho core components)
- [ ] THE SYSTEM SHALL lazy-load heavy components (Editor, Carousel) khi cần

### Developer Experience
- [ ] THE SYSTEM SHALL cung cấp TypeScript autocomplete cho tất cả props
- [ ] THE SYSTEM SHALL có consistent naming: App[ComponentName] pattern
- [ ] THE SYSTEM SHALL có default props phù hợp với use case phổ biến

### Maintainability
- [ ] THE SYSTEM SHALL có pattern wrapper nhất quán giữa các components
- [ ] THE SYSTEM SHALL có separation of concerns: types, components, composables

## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Prefix convention | `App` | Tránh conflict với Quasar Q- prefix, rõ ràng là app component | `Base`, `Custom`, không prefix |
| Default outlined | `true` | Match design pattern hiện tại trong project | filled, standout |
| Vietnamese defaults | Yes | Project target audience là Vietnamese users | English, no defaults |
| TypeScript strict | Yes | Project đang dùng strict mode | Loose types |
| QuasarResolver | Add to vite config | Enable auto-import Quasar components | Manual imports |

## Out of Scope

- Unit tests cho tất cả components (sẽ thêm sau ở Story riêng)
- Storybook integration
- Component theming system phức tạp
- Accessibility audit toàn diện
- Mobile-specific components

## Implementation Notes

**Last Synced**: 2026-01-28  
**Status**: Synced from implementation analysis

### Sync Update Summary
- Added SidebarItem to navigation components (63 total)
- Documented all 6 composables: useDialog, useLoading, useDarkMode, useSidebar, useConfirm, useSnackbar
- Updated Story 11 with components.vue split analysis (1237 lines, 8 sections)
