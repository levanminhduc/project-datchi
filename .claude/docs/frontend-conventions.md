---
description: Vue 3 component wrappers, composables, fetchApi, TypeScript rules, UI language
---

# Frontend Conventions

## Component Wrappers (Strict)

These MUST use the wrapper — never the raw Quasar component:

| Never use | Always use | Location |
|-----------|-----------|----------|
| `q-select` | `AppSelect` | `src/components/ui/inputs/AppSelect.vue` |
| `q-editor` | `AppEditor` | `src/components/ui/pickers/AppEditor.vue` |
| `<input type="date">` | `DatePicker` | `src/components/ui/pickers/DatePicker.vue` |
| `$q.dialog()` | `useConfirm()` | `src/composables/useConfirm.ts` |

Either acceptable (context-dependent):

| Quasar | Wrapper | Use raw when |
|--------|---------|-------------|
| `q-input` | `AppInput` | Search field with icon slot |
| `q-btn` | `AppButton` | Inline actions |
| `q-table` | `DataTable` | Simple tables, no advanced filtering |

## API Calls

Always use `fetchApi()`, never raw `fetch()`:

```typescript
import { fetchApi } from '@/services/api'
const data = await fetchApi<ThreadType[]>('/api/thread-types')
```

`fetchApi()` auto-attaches Bearer token and handles 401 refresh (single-flight).

Exceptions where raw `fetch` is allowed: offline queue replay (`useOfflineSync.ts`), SSE streaming, version check.

## Toast Notifications

```typescript
const snackbar = useSnackbar()
snackbar.success('Lưu thành công')
snackbar.error('Không tìm thấy dữ liệu')
```

## TypeScript Rules

- Never use `as any` or `@ts-ignore` — fix types properly
- Exception: Web Serial API (`useScale.ts`, `useScanner.ts`) — no official types
- When passing reactive object to function: spread first
  ```typescript
  await createFoo({ ...formData })   // ✅
  await createFoo(formData)          // ❌ reactive proxy
  ```

## UI Language

All user-facing text MUST be Vietnamese:
- Success: `"Lưu thành công"`, `"Xóa thành công"`
- Error: `"Không tìm thấy dữ liệu"`, `"Lỗi hệ thống"`
- Validation: `"Vui lòng nhập tên"`, `"Số lượng phải lớn hơn 0"`
- Buttons, labels, headers, toasts: Vietnamese

## Composable Utilities

| Composable | Purpose |
|-----------|---------|
| `useLoading()` | Loading state + `withLoading()` wrapper |
| `useSnackbar()` | Toast notifications |
| `useConfirm()` | Confirmation dialogs |
| `getErrorMessage()` | Centralized Vietnamese error messages |

## File Size Limits

| Type | Max lines |
|------|----------|
| Composables / services / utils | 200 |
| UI components | 300 |
| Pages / route handlers | 500 (soft), 800 needs justification |

## File Naming

- New files: `kebab-case` (`use-thread-allocation-fefo.ts`)
- Existing camelCase files: keep as-is, do not bulk rename

## Large Dataset Pattern

Server-side pagination — never load all data into frontend.

```
DataTable @request → composable.handleTableRequest()
→ service.getPaginated({ page, pageSize, sortBy, descending })
→ Hono: SQL with LIMIT/OFFSET + COUNT(*) for total
```

Defaults: 25 rows/page, options [10, 25, 50, 100], backend cap 100.

Reference: `src/pages/thread/inventory.vue` + `src/composables/thread/useInventory.ts`

## Realtime

LISTEN/NOTIFY (PostgreSQL) → SSE stream → frontend EventSource → debounced refresh (100ms).
Search: 300ms debounce.
Reference: `src/composables/useRealtime.ts` + `server/realtime/`
