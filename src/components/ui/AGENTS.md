# src/components/ui/ - UI Component Library

Quasar Framework wrappers with standardized props and TypeScript.

## STRUCTURE

```
ui/
├── index.ts        # Barrel export (re-exports all subdirs)
├── buttons/        # AppButton, AppIconButton
├── inputs/         # AppInput, AppSelect, AppDatePicker (12 files)
├── dialogs/        # AppDialog, AppConfirmDialog
├── feedback/       # AppSpinner, AppProgress, AppAlert
├── navigation/     # AppBreadcrumbs, AppTabs
├── tables/         # AppTable, DataTable
├── cards/          # AppCard, StatCard
├── layout/         # AppContainer, AppGrid
├── lists/          # AppList, ListItem
├── media/          # AppAvatar, AppImage
├── pickers/        # DatePicker, ColorPicker
└── scroll/         # AppScrollArea
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
