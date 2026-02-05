# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-05
**Commit:** 53ed868
**Branch:** main

## OVERVIEW

Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ). Vue 3 + Quasar + Hono + Supabase. Vietnamese-language business app.

## STRUCTURE

```
project-datchi/
├── server/           # Hono API backend (port 3000)
│   ├── routes/       # 14 API route files
│   ├── db/           # Supabase clients (anon + admin)
│   └── middleware/   # Auth JWT verification
├── src/
│   ├── components/
│   │   ├── thread/   # 30 domain components (widgets, dialogs)
│   │   ├── ui/       # Quasar wrappers (13 subdirs, 66 components)
│   │   ├── qr/       # QR scanning components
│   │   └── hardware/ # Scanner/scale integration
│   ├── composables/  # 34 composables (state + logic)
│   │   ├── thread/   # Domain: inventory, allocations, recovery
│   │   └── hardware/ # Scanner, scale, audio feedback
│   ├── services/     # 16 API clients (fetchApi pattern)
│   ├── pages/        # 31 pages, file-based routing (unplugin-vue-router)
│   │   └── thread/   # 9 pages + batch/ + mobile/ subdirs
│   └── types/        # 30 TypeScript files (ui/, thread/, auth/)
└── supabase/         # 28 migrations, seed data
```

## CODEBASE SEARCH (MCP Context Engine)

**LUÔN sử dụng `augment-context-engine_codebase-retrieval` làm công cụ TÌM KIẾM CHÍNH.**

```typescript
// Khi cần tìm code, class, function, hoặc hiểu codebase:
augment-context-engine_codebase-retrieval({
  directory_path: "D:\\HoaThoDienBan\\VueJS\\project-datchi",
  information_request: "Mô tả chi tiết những gì cần tìm"
})
```

| Tình huống | Dùng Tool |
|------------|-----------|
| Không biết file nằm ở đâu | `codebase-retrieval` ✅ |
| Tìm hiểu cách code hoạt động | `codebase-retrieval` ✅ |
| Tìm pattern/convention trong project | `codebase-retrieval` ✅ |
| Tìm CHÍNH XÁC một string/identifier | `grep` hoặc `ast_grep_search` |
| Đã biết file, cần đọc nội dung | `read` |

**Ví dụ query tốt:**
- "Tìm cách xử lý authentication trong project này"
- "Composables nào liên quan đến inventory?"
- "API endpoint nào xử lý thread allocations?"

**KHÔNG dùng bash grep/find** cho semantic code search → luôn ưu tiên `codebase-retrieval`.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `server/routes/{domain}.ts` | Follow existing Hono pattern |
| New composable | `src/composables/` or `/thread/` | Export from index.ts |
| New service | `src/services/{name}Service.ts` | Export from index.ts |
| New page | `src/pages/{path}.vue` | Auto-routing, definePage() for meta |
| New UI wrapper | `src/components/ui/{category}/` | App[Name] pattern |
| Thread component | `src/components/thread/` | Domain-specific widgets |
| Add type | `src/types/{domain}/` | Export from index.ts |
| Database change | `supabase/migrations/` | Timestamp-prefix naming |

## CONVENTIONS

### API Response Structure
```typescript
{ data: T | null, error: string | null, message?: string }
```
Vietnamese error messages. Always include both data and error fields.

### Composables Wrap Quasar
```typescript
// DO: Use composables
const snackbar = useSnackbar()
snackbar.success('Message')

// DON'T: Direct Quasar access
$q.notify({ message: 'Message' })
```

### UI Components (BẮT BUỘC sử dụng thư viện có sẵn)

**TRƯỚC KHI CODE: Tìm hiểu components có sẵn trong `src/components/ui/`**

```typescript
// Dùng codebase-retrieval để tìm component phù hợp:
augment-context-engine_codebase-retrieval({
  directory_path: "D:\\HoaThoDienBan\\VueJS\\project-datchi",
  information_request: "Tìm UI component cho [mục đích cụ thể]"
})
```

**Thư viện UI có sẵn (66 components):**
| Category | Components |
|----------|------------|
| `buttons/` | AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown |
| `inputs/` | AppInput, AppSelect, AppTextarea, AppCheckbox, AppToggle, AppSlider, AppRange, SearchInput, AppWarehouseSelect, SupplierSelector, ColorSelector |
| `dialogs/` | AppDialog, FormDialog, ConfirmDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit |
| `feedback/` | AppSpinner, AppProgress, CircularProgress, AppSkeleton, AppBanner, EmptyState, InnerLoading |
| `cards/` | AppCard, StatCard, InfoCard, AppChip, AppBadge |
| `tables/` | DataTable |
| `navigation/` | AppTabs, TabPanel, AppStepper, StepperStep, AppPagination, AppBreadcrumbs, SidebarItem |
| `layout/` | PageHeader, SectionHeader, AppToolbar, AppDrawer, AppSeparator, AppSpace |
| `lists/` | AppList, ListItem |
| `media/` | AppImage, AppVideo, AppCarousel, AppParallax |
| `pickers/` | DatePicker, TimePicker, ColorPicker, FilePicker, AppEditor |
| `scroll/` | ScrollArea, InfiniteScroll, VirtualScroll, PullToRefresh, Timeline, TimelineEntry |

**Quy tắc:**
- ❌ KHÔNG tự tạo component mới nếu đã có sẵn
- ❌ KHÔNG dùng Quasar components trực tiếp (`q-btn`, `q-input`) → dùng wrappers (`AppButton`, `AppInput`)
- ✅ Kiểm tra thư viện TRƯỚC khi code
- ✅ Nếu cần component mới → thêm vào `src/components/ui/`

**Naming conventions:**
- Wrapper: `App[Name]` (AppButton, AppInput)
- Composite: `[Context][Name]` (DataTable, FormDialog)
- Item: `[Parent]Item` (ListItem, StepperStep)
- Slots: Forward via `v-for="(_, name) in $slots"`
- Types: Interface in `src/types/ui/`

### File-Based Routing
- `src/pages/foo.vue` → `/foo`
- `src/pages/foo/index.vue` → `/foo`
- `src/pages/foo/[id].vue` → `/foo/:id`
- Route meta: `definePage({ meta: { requiresAuth: true } })`

### Responsive Design (BẮT BUỘC)

**MỌI giao diện PHẢI responsive cho tất cả thiết bị.**

**Quasar Breakpoints:**
| Breakpoint | Width | Class prefix |
|------------|-------|--------------|
| xs | < 600px | `col-xs-*` |
| sm | ≥ 600px | `col-sm-*` |
| md | ≥ 1024px | `col-md-*` |
| lg | ≥ 1440px | `col-lg-*` |
| xl | ≥ 1920px | `col-xl-*` |

**Pattern chuẩn - Mobile First:**
```vue
<!-- Luôn bắt đầu với col-12, sau đó responsive lên -->
<div class="row q-col-gutter-md">
  <div class="col-12 col-sm-6 col-md-4">Card 1</div>
  <div class="col-12 col-sm-6 col-md-4">Card 2</div>
  <div class="col-12 col-sm-6 col-md-4">Card 3</div>
</div>
```

**Responsive Logic với $q.screen:**
```typescript
import { useQuasar } from 'quasar'
const $q = useQuasar()

// Ẩn/hiện theo breakpoint
:vertical="$q.screen.lt.sm"    // vertical khi < 600px
v-if="$q.screen.gt.xs"         // ẩn trên mobile

// Computed responsive
const isMobile = computed(() => $q.screen.lt.md)
```

**Visibility Classes:**
| Class | Hiển thị khi |
|-------|-------------|
| `gt-xs` | > xs (≥600px) |
| `gt-sm` | > sm (≥1024px) |
| `lt-sm` | < sm (<600px) |
| `lt-md` | < md (<1024px) |

**Quy tắc:**
- ✅ LUÔN test trên mobile (xs), tablet (sm/md), desktop (lg+)
- ✅ Form fields: `col-12 col-sm-6` (full trên mobile, 2 cột trên tablet+)
- ✅ Cards/Stats: `col-12 col-sm-6 col-md-3` (1→2→4 cột)
- ✅ Sidebar + Content: `col-12 col-md-3` + `col-12 col-md-9`
- ❌ KHÔNG hardcode width cố định (px) → dùng responsive classes

### Error Handling
```typescript
import { getErrorMessage } from '@/utils/errorMessages'
catch (err) {
  snackbar.error(getErrorMessage(err, 'Fallback message'))
}
```

## ANTI-PATTERNS (THIS PROJECT)

| ❌ Forbidden | ✅ Use Instead |
|--------------|----------------|
| `$q.notify()` direct | `useSnackbar()` composable |
| `$q.dialog()` direct | `useConfirm()` composable |
| `supabase` in frontend | Service → Hono API → `supabaseAdmin` |
| Duplicate notifications | Composables already notify on CRUD |
| `createEmployee(formData)` | `createEmployee({ ...formData })` (spread reactive) |
| `as any`, `@ts-ignore` | Fix types properly |

## UNIQUE STYLES

### Vietnamese Defaults
- All user-facing messages in Vietnamese
- Error messages prioritize Vietnamese over English

### Supabase Dual Client
```typescript
// server/db/supabase.ts
supabase      // anon key, respects RLS
supabaseAdmin // service_role, bypasses RLS (backend only)
```

### Large Dataset Batch Fetching
Supabase 1000-row limit. Backend uses `.range(offset, offset+BATCH_SIZE-1)` loop.

### Real-time Subscriptions
```typescript
const realtime = useRealtime()
realtime.subscribe({ table: 'thread_inventory', event: '*' }, callback)
// Auto-cleanup on unmount
```

## COMMANDS

```bash
npm run dev        # Frontend (5173)
npm run server     # Backend (3000)
npm run dev:all    # Both concurrently
npm run build      # Prod build (includes type-check)
npm run type-check # vue-tsc only
npm run lint       # ESLint fix
```

## NOTES

### Critical Safety
- NEVER run `supabase db reset` without explicit user consent
- Backup before migrations with DROP/TRUNCATE
- Check migration content for data-destructive operations

### Gotchas
- `dotenv.config()` MUST be called before `process.env` access in server
- Icons: Material format only (`check_circle`, not `mdi-check-circle`)
- Dynamic import errors: Router has workaround for Vite failures
- Pagination: Watch search/filter changes to reset `page = 1`

### Auth System
- JWT-based with refresh tokens
- ROOT role returns `permissions: ["*"]`
- Permission format: `{domain}.{action}` (e.g., `employees.view`)
- Route protection: `definePage({ meta: { requiresAuth: true, permissions: ['...'] } })`

---
*See CLAUDE.md for comprehensive patterns. This file is for quick reference.*
