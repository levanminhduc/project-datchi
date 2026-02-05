# src/components/thread/ - Thread Domain Components

Domain-specific Vue components for thread inventory management.

## STRUCTURE

```
thread/
├── index.ts                    # Barrel exports (30 components)
├── [Widget]Widget.vue          # Dashboard widgets
├── [Feature]Dialog.vue         # Modal dialogs
├── [Feature]Card.vue           # Info cards
└── [Feature][Type].vue         # Specialized components
```

## COMPONENTS

### Dashboard Widgets
| Component | Purpose |
|-----------|---------|
| `InventorySummaryCard` | Total stock overview |
| `StockLevelIndicator` | Min/max level bars |
| `ActiveConflictsWidget` | Conflict count + list |
| `PendingAllocationsWidget` | Allocation queue |
| `WaitlistWidget` | Waitlist items |
| `AlertsWidget` | Stock alerts |

### Operational
| Component | Purpose |
|-----------|---------|
| `StockReceiptDialog` | Receive stock form |
| `ThreadTypeFormDialog` | Create/edit thread type |
| `AllocationStatusBadge` | Status chip display |
| `WeightMeterDisplay` | Scale reading display |
| `DensityCalculator` | Weight/density calc |
| `SyncStatus` | Offline sync indicator |

## CONVENTIONS

### Naming
- Widgets: `[Feature]Widget.vue`
- Dialogs: `[Feature]Dialog.vue`
- Badges/Chips: `[Feature]Badge.vue`

### Props
Use types from `src/types/thread/`. Emit events for actions.

### Composable Usage
```typescript
const { items, loading, fetch } = useInventory()
const snackbar = useSnackbar()
```

## WHERE TO LOOK

| Task | Pattern |
|------|---------|
| Add dashboard widget | `[Feature]Widget.vue` |
| Add form dialog | `[Feature]Dialog.vue` |
| Add status indicator | `[Feature]Badge.vue` |

## TYPES

All in `src/types/thread/`. Import from `@/types/thread`.
