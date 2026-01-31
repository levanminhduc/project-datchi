## Context

Dự án có ~52 UI wrapper components trong `src/components/ui/` wrap Quasar components với:
- Standardized props và Vietnamese defaults
- TypeScript interfaces trong `src/types/ui/`
- Tổ chức theo folders: buttons, inputs, dialogs, feedback, navigation, layout, cards, lists, media, pickers, scroll

Trang hiện tại (`src/pages/components.vue`) có ~1200 dòng demo Quasar gốc, cần thay thế hoàn toàn.

## Goals / Non-Goals

**Goals:**
- Hiển thị tất cả 52 UI components với demo visual
- Mỗi component có props table với type, default, description
- Dễ navigate giữa các categories
- Developer có thể copy-paste usage patterns
- Maintain được dễ dàng khi thêm component mới

**Non-Goals:**
- Interactive props playground (quá phức tạp để maintain)
- Code snippet cho từng component (chỉ cần nhìn demo là hiểu)
- Business components (thread/, hardware/, offline/) - context-specific, không reusable
- Auto-generate từ TypeScript types (effort không worth it cho 52 components)

## Decisions

### 1. Layout: Tab-based categories

**Decision**: Dùng `q-tabs` để phân chia components theo category

**Rationale**: 
- 52 components trong 1 trang dài sẽ overwhelming
- Tabs cho phép focus vào từng nhóm
- Match với cách tổ chức folders trong `src/components/ui/`

**Alternatives considered**:
- Single scroll page với section anchors: Khó navigate với số lượng lớn
- Sidebar + detail view: Quá phức tạp cho internal reference page

### 2. Tab categories (10 tabs)

```
[Buttons] [Inputs] [Dialogs] [Feedback] [Navigation] [Layout] [Cards] [Lists] [Media] [Pickers/Scroll]
```

Gộp Pickers + Scroll vào 1 tab vì số lượng ít.

### 3. Component Card Structure

Mỗi component được hiển thị trong một card với:
```
┌─────────────────────────────────────────┐
│ ComponentName                           │
│ Brief description from type JSDoc       │
├─────────────────────────────────────────┤
│ DEMO                                    │
│ [Visual demo với các variants chính]    │
├─────────────────────────────────────────┤
│ PROPS TABLE                             │
│ | Prop | Type | Default | Description | │
│ |------|------|---------|-------------|│
│ | ...  | ...  | ...     | ...         | │
└─────────────────────────────────────────┘
```

### 4. Props data approach: Hardcoded

**Decision**: Hardcode props data trong component, không auto-generate

**Rationale**:
- TypeScript types đã có JSDoc comments tốt
- Việc parse và generate runtime phức tạp
- 52 components x ~10 props = manageable manually
- Dễ customize description cho Vietnamese context

### 5. Demo approach: Show key variants only

Mỗi component chỉ demo các variants quan trọng nhất:
- AppButton: 4 variants x 4 colors + loading/disabled states
- AppInput: outlined/filled + icons + validation
- Dialogs: Open demo (interactive)

Không cần demo mọi prop combination.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Hardcoded props có thể outdated | Review khi thêm component mới |
| Page quá dài để load | Lazy load tab content với `v-if` |
| Demo không đủ real-world | Focus vào common use cases |
| Maintain effort khi UI library grows | Standardize component card format |

## Component Inventory

### Buttons (5)
- AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown

### Inputs (8)
- AppInput, AppSelect, AppTextarea, AppCheckbox, AppToggle, AppSlider, AppRange, SearchInput

### Dialogs (6)
- AppDialog, FormDialog, ConfirmDialog, DeleteDialog, PopupEdit, AppMenu, AppTooltip

### Feedback (7)
- AppSpinner, CircularProgress, AppProgress, AppSkeleton, EmptyState, AppBanner, InnerLoading

### Navigation (6)
- AppTabs, TabPanel, AppStepper, StepperStep, AppPagination, AppBreadcrumbs, SidebarItem

### Layout (6)
- PageHeader, SectionHeader, AppToolbar, AppDrawer, AppSeparator, AppSpace

### Cards (5)
- AppCard, InfoCard, StatCard, AppChip, AppBadge

### Lists (2)
- AppList, ListItem

### Media (4)
- AppImage, AppVideo, AppCarousel, AppParallax

### Pickers + Scroll (9)
- DatePicker, TimePicker, ColorPicker, FilePicker, AppEditor
- ScrollArea, InfiniteScroll, VirtualScroll, Timeline, TimelineEntry, PullToRefresh
