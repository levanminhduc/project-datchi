---
paths:
  - "src/**"
---

# Frontend Rules (Vue 3 + Quasar)

## Component Wrappers (strict)

| Never use | Always use |
|-----------|-----------|
| `q-select` | `AppSelect` (`src/components/ui/inputs/AppSelect.vue`) |
| `q-editor` | `AppEditor` (`src/components/ui/pickers/AppEditor.vue`) |
| `<input type="date">` | `DatePicker` (`src/components/ui/pickers/DatePicker.vue`) |
| `$q.dialog()` | `useConfirm()` (`src/composables/useConfirm.ts`) |

`q-input`/`q-btn`/`q-table` may be raw or wrapped (`AppInput`/`AppButton`/`DataTable`) depending on context — follow the surrounding file.

## API Calls

- Always `fetchApi()` from `@/services/api` — never raw `fetch()`. It auto-attaches the Bearer token and handles 401 refresh (single-flight).
- Allowed raw-`fetch` exceptions: offline queue replay (`useOfflineSync.ts`), SSE streaming, version check.
- Frontend NEVER talks to PostgreSQL directly — all CRUD via Hono API.

## TypeScript

- Never `as any` or `@ts-ignore` — fix types properly. Only exception: Web Serial API (`useScale.ts`, `useScanner.ts`).
- Spread reactive objects before passing to functions: `createFoo({ ...formData })`, not `createFoo(formData)`.

## Notifications

```typescript
const snackbar = useSnackbar()
snackbar.success('Lưu thành công')
snackbar.error('Không tìm thấy dữ liệu')
```

Centralized Vietnamese error messages via `getErrorMessage()`.

## File Size & Naming

| Type | Max lines |
|------|----------|
| Composables / services / utils | 200 |
| UI components | 300 |
| Pages | 500 soft, 800 needs justification |

New files: `kebab-case`. Existing camelCase files: keep as-is, no bulk renames.

## Routing, Sidebar & Page Permissions

- File-based routing (`unplugin-vue-router`): new page = new `.vue` under `src/pages/` — no manual route registration. Page layout/structure conventions: `src/pages/AGENTS.md` (responsive `col-12 col-sm-* col-md-*` is mandatory).
- **Sidebar menu is hardcoded** in `src/composables/useSidebar.ts` (`navItems`) — adding a page to the menu means adding a `NavItem` there (label Vietnamese, `o_*` outlined icon, `to` path). Sidebar items are NOT filtered by permission — access control happens at navigation time via the router guard.
- **The ~25 sidebar pages are the company's core daily workflows** — treat changes to them with extra care (see the ★ map in `src/pages/AGENTS.md`). Pages outside the sidebar are detail views (`[id].vue`), mobile warehouse pages, or internal tools reached by in-app navigation.
- **All routes require auth by default** (`src/router/guards.ts`). Public pages must set `meta.public: true`. Guard order: public → auth → ROOT bypass → `requiresRoot`/`requiresAdmin` → `permissions` (OR) → `allPermissions` (AND) → else `/forbidden`.
- Protected pages declare permissions in the SFC:

```typescript
definePage({
  meta: { requiresAuth: true, permissions: ['thread.weekly-order.view'] },
})
```

Pages without `definePage` still require login but have no permission gate — when adding a permission-sensitive page, always declare `meta.permissions`.
- Gate individual UI elements with the `v-permission` directive (`src/directives/permission.ts`): `v-permission="'thread.inventory.edit'"`, `v-permission:all="[...]"`, `.hide` modifier removes from DOM.

## Large Datasets

Server-side pagination only — never load everything into the frontend.
Flow: `DataTable @request → composable.handleTableRequest() → service.getPaginated() → Hono LIMIT/OFFSET + COUNT(*)`.
Defaults: 25 rows/page, options [10, 25, 50, 100], backend cap 100.
Reference: `src/pages/thread/inventory.vue` + `src/composables/thread/useInventory.ts`.

## Realtime & Debounce

LISTEN/NOTIFY → SSE → `EventSource` → debounced refresh 100ms. Search inputs: 300ms debounce.
Reference: `src/composables/useRealtime.ts` + `server/realtime/`.
