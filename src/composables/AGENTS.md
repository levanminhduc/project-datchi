# src/composables/ - Vue Composables

State and logic layer. Wraps Quasar plugins, provides domain logic.

## STRUCTURE

```
composables/
├── index.ts             # Barrel exports (34 composables)
├── use[Name].ts         # Core composables
├── thread/              # Domain: inventory, allocations, recovery
│   └── use[Domain].ts
└── hardware/            # Scanner, scale, audio feedback
    └── use[Device].ts
```

## CONVENTIONS

### Composable Structure
```typescript
export function useFeature() {
  const items = ref<Item[]>([])
  const loading = ref(false)
  
  const fetchItems = async () => { ... }
  const createItem = async (data: CreateDTO) => { ... }
  
  return { items, loading, fetchItems, createItem }
}
```

### Quasar Plugin Wrappers
| Direct Quasar | Use Composable |
|---------------|----------------|
| `$q.notify()` | `useSnackbar()` |
| `$q.dialog()` | `useConfirm()` |
| `$q.loading` | `useLoading()` |

### Auto-Notification
Composables handle success/error notifications. Pages should NOT add duplicate calls.

## WHERE TO LOOK

| Task | File |
|------|------|
| Toast notifications | `useSnackbar.ts` |
| Confirmation dialog | `useConfirm.ts` |
| Loading state | `useLoading.ts` |
| Real-time updates | `useRealtime.ts` |
| Offline support | `useOfflineSync.ts`, `useOfflineOperation.ts` |
| Scanner integration | `hardware/useScanner.ts` |
| Scale integration | `hardware/useScale.ts` |

## EXPORTS

All composables exported from `index.ts`. Import from `@/composables`.

## ANTI-PATTERNS

- Don't use `$q.notify()` directly → `useSnackbar()`
- Don't duplicate notifications in pages (composables already notify)
