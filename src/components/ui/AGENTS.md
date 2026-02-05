# src/components/ui/ - UI Component Library

Quasar Framework wrappers with standardized props and TypeScript. **66 components across 13 categories.**

## STRUCTURE

```
ui/
├── index.ts        # Barrel export (re-exports all subdirs)
├── buttons/        # AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown
├── inputs/         # AppInput, AppSelect, AppTextarea, AppCheckbox, etc. (12 files)
├── dialogs/        # AppDialog, FormDialog, ConfirmDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit
├── feedback/       # AppSpinner, AppProgress, CircularProgress, AppSkeleton, AppBanner, EmptyState, InnerLoading
├── cards/          # AppCard, StatCard, InfoCard, AppChip, AppBadge
├── navigation/     # AppTabs, TabPanel, AppStepper, StepperStep, AppPagination, AppBreadcrumbs, SidebarItem
├── tables/         # DataTable
├── layout/         # PageHeader, SectionHeader, AppToolbar, AppDrawer, AppSeparator, AppSpace
├── lists/          # AppList, ListItem
├── media/          # AppImage, AppVideo, AppCarousel, AppParallax
├── pickers/        # DatePicker, TimePicker, ColorPicker, FilePicker, AppEditor
├── scroll/         # ScrollArea, InfiniteScroll, VirtualScroll, PullToRefresh, Timeline, TimelineEntry
└── common/         # Shared utilities
```

## CONVENTIONS

### Naming
- Wrapper: `App[Name]` (AppButton, AppInput)
- Composite: `[Context][Name]` (DataTable, FormDialog)
- Item: `[Parent]Item` (ListItem, StepperStep)

### Props Pattern
```typescript
// Props interface in src/types/ui/
import type { ButtonProps } from '@/types/ui'

defineProps<ButtonProps>()
```

### Slot Forwarding
```vue
<template v-for="(_, name) in $slots" #[name]="slotData">
  <slot :name="name" v-bind="slotData" />
</template>
```

### v-model
Use `modelValue` + `update:modelValue` emit.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add input component | `inputs/` |
| Add dialog | `dialogs/` |
| Add type interface | `src/types/ui/` |

## TYPES

All interfaces in `src/types/ui/`. Re-exported from `ui/index.ts`.

## ANTI-PATTERNS

- Don't use Quasar directly in pages → use App[Name] wrappers
- Don't inline types → define in `src/types/ui/`
