# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL SAFETY RULES

| Dangerous Command           | Consequence               | Requirement             |
| --------------------------- | ------------------------- | ----------------------- |
| `supabase db reset`         | **DELETES ALL DATA**      | NEVER run automatically |
| `DROP TABLE`, `TRUNCATE`    | Permanent data loss       | Must ask user first     |
| `DELETE FROM ... WHERE 1=1` | Deletes all records       | Must ask user first     |
| `supabase migration repair` | Changes migration history | Ask user first          |
| Force push (`git push -f`)  | Lost commit history       | Ask user first          |

Before running migrations, backup first:

```bash
pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres > backup.sql
```

To apply a single migration safely:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/YYYYMMDD_name.sql
```

## Project Overview

**Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)** - Vietnamese-language business app for garment industry thread management.

**Stack:** Vue 3 + Quasar 2 + TypeScript + Vite | Hono (Node.js) backend | Supabase (PostgreSQL)

### Business Domains

| Domain              | Description                                                 | Key Routes                                       |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Thread Management   | Thread types, colors, suppliers master data                 | `/thread`, `/thread/colors`, `/thread/suppliers` |
| Inventory           | Cone tracking with dual UoM (kg + meters), lots, warehouses | `/thread/inventory`, `/thread/lots`              |
| Allocations         | Soft/hard allocation workflow (FEFO)                        | `/thread/allocations`                            |
| Recovery            | Partial cone recovery with electronic scale weighing        | `/thread/recovery`                               |
| Batch Operations    | Receive, issue, transfer with barcode scanning              | `/thread/batch/*`, `/thread/mobile/*`            |
| Thread Calculation  | Calculate thread requirements per style/PO                  | `/thread/calculation`                            |
| Weekly Ordering     | Multi-style weekly thread ordering with aggregation         | `/thread/weekly-order`                           |
| Reports & Dashboard | Analytics and reporting                                     | `/thread/dashboard`, `/reports/*`                |
| Employee Management | HR, RBAC with JWT auth                                      | `/employees`, `/nhan-su/*`                       |

## Development Commands

```bash
npm run dev        # Frontend dev server (port 5173)
npm run server     # Backend API server (port 3000)
npm run dev:all    # Both concurrently
npm run build      # Production build (includes type-check)
npm run type-check # vue-tsc only
npm run lint       # ESLint fix
```

## Architecture

```
Supabase (PostgreSQL)
    ↓
Hono API (server/, port 3000) → supabaseAdmin (bypasses RLS)
    ↓
Vue Service Layer (src/services/) → fetchApi wrapper
    ↓
Composables (src/composables/) → state + logic + notifications
    ↓
Pages/Components (src/pages/, src/components/)
    ↓
Real-time subscriptions (useRealtime) for live updates
```

### Key Directories

| Directory                    | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `server/routes/`             | 20 Hono API route files                      |
| `server/middleware/auth.ts`  | JWT verification, permission middleware      |
| `server/db/supabase.ts`      | Dual Supabase clients (anon + admin)         |
| `server/validation/`         | Zod schemas for request validation           |
| `server/utils/`              | Shared helpers (errorHelper)                 |
| `src/pages/`                 | File-based routing via unplugin-vue-router   |
| `src/components/ui/`         | 66 Quasar wrapper components (15 categories) |
| `src/components/thread/`     | 31+ domain-specific components               |
| `src/composables/`           | 41+ composables (thread, hardware, core)     |
| `src/composables/hardware/`  | Scanner, scale, audio, QR integration        |
| `src/services/`              | 23 API client services                       |
| `src/types/ui/`              | TypeScript interfaces for UI components      |
| `src/types/thread/`          | Thread domain type definitions               |
| `src/utils/errorMessages.ts` | Vietnamese error handling utility            |
| `supabase/migrations/`       | 37+ SQL migration files                      |

### Where to Add New Code

| Task             | Location                                | Notes                                 |
| ---------------- | --------------------------------------- | ------------------------------------- |
| API endpoint     | `server/routes/{domain}.ts`             | Register in `server/index.ts`         |
| Composable       | `src/composables/` or `thread/`         | Export from `index.ts`                |
| Service          | `src/services/{name}Service.ts`         | Export from `index.ts`                |
| Page             | `src/pages/{path}.vue`                  | Auto-routing, `definePage()` for meta |
| UI wrapper       | `src/components/ui/{category}/`         | `App[Name]` pattern                   |
| Domain component | `src/components/thread/`                | Feature-specific widgets              |
| Type             | `src/types/{domain}/`                   | Export from `index.ts`                |
| Migration        | `supabase/migrations/YYYYMMDD_name.sql` | Never modify existing migrations      |

## Mandatory Patterns

### UI Component Library (MUST use wrappers)

NEVER use Quasar components directly. Use the wrapper library in `src/components/ui/`:

| Category      | Components                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `buttons/`    | AppButton, IconButton, ButtonGroup, ButtonToggle, ButtonDropdown                                                           |
| `inputs/`     | AppInput, AppSelect, AppTextarea, AppCheckbox, AppToggle, SearchInput, AppWarehouseSelect, SupplierSelector, ColorSelector |
| `dialogs/`    | AppDialog, FormDialog, ConfirmDialog, DeleteDialog, AppMenu, AppTooltip, PopupEdit                                         |
| `feedback/`   | AppSpinner, AppProgress, AppSkeleton, AppBanner, EmptyState, InnerLoading                                                  |
| `cards/`      | AppCard, StatCard, InfoCard, AppChip, AppBadge                                                                             |
| `tables/`     | DataTable (wraps q-table with defaults: flat, bordered, Vietnamese labels)                                                 |
| `navigation/` | AppTabs, TabPanel, AppStepper, AppPagination, AppBreadcrumbs, SidebarItem                                                  |
| `layout/`     | PageHeader, SectionHeader, AppToolbar, AppDrawer, AppSeparator, AppSpace                                                   |
| `lists/`      | AppList, ListItem                                                                                                          |
| `media/`      | AppImage, AppVideo, AppCarousel, AppParallax                                                                               |
| `pickers/`    | DatePicker, TimePicker, ColorPicker, FilePicker, AppEditor                                                                 |
| `scroll/`     | ScrollArea, InfiniteScroll, VirtualScroll, PullToRefresh, Timeline                                                         |

Naming: `App[Name]` (wrappers), `[Context][Name]` (composites), `[Parent]Item` (items).

Note: `AppSpace` is a div spacer (height/width). For flex spacer (push content apart), use `q-space` directly.

### Composables Wrap Quasar Plugins

```typescript
useSnackbar(); // NOT $q.notify()
useConfirm(); // NOT $q.dialog()
useLoading(); // withLoading() helper
```

Composables already show success/error notifications on CRUD operations. Pages should NOT add duplicate notifications.

### Error Handling

```typescript
import { getErrorMessage, createErrorHandler } from '@/utils/errorMessages'

// Option A: Direct with fallback
catch (err) {
  snackbar.error(getErrorMessage(err, 'Không thể tải dữ liệu'))
}

// Option B: Domain-specific
const getErrorMsg = createErrorHandler({
  duplicate: 'Mã chỉ đã tồn tại',
  notFound: 'Không tìm thấy cuộn chỉ'
})
```

Priority: Vietnamese `err.message` > custom domain messages > HTTP status mapping > fallback.

### Responsive Design (Mobile First)

```vue
<div class="row q-col-gutter-md">
  <div class="col-12 col-sm-6 col-md-4">Card</div>
</div>
```

Use `$q.screen.lt.sm` for responsive logic. Never hardcode widths in px.

### File-Based Routing

`src/pages/foo.vue` → `/foo`, `src/pages/foo/[id].vue` → `/foo/:id`

```typescript
definePage({
  meta: {
    requiresAuth: true,
    permissions: ["thread.view"], // OR logic
    allPermissions: ["admin.full"], // AND logic
    roles: ["ADMIN", "MANAGER"],
    public: true, // No auth needed
  },
});
```

### API Response Structure

All endpoints return: `{ data: T | null, error: string | null, message?: string }` with Vietnamese error messages.

### Backend Validation (Zod)

New routes use Zod schemas in `server/validation/` for request validation:

```typescript
// server/validation/myDomain.ts
import { z } from 'zod'
export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc').trim(),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
})

// server/routes/myDomain.ts
import { CreateItemSchema } from '../validation/myDomain'
router.post('/', async (c) => {
  const parsed = CreateItemSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ data: null, error: parsed.error.errors[0].message }, 400)
  // ... use parsed.data
})
```

Use `server/utils/errorHelper.ts` for `getErrorMessage()` instead of defining it per route file.

### Supabase Dual Client

```typescript
// server/db/supabase.ts
supabase; // anon key - respects RLS
supabaseAdmin; // service_role key - bypasses RLS (use this for backend CRUD)
```

## Anti-Patterns

| Forbidden                           | Use Instead                                    |
| ----------------------------------- | ---------------------------------------------- |
| `q-btn`, `q-input`, `q-table` etc.  | `AppButton`, `AppInput`, `DataTable`           |
| `$q.notify()` direct                | `useSnackbar()` composable                     |
| `$q.dialog()` direct                | `useConfirm()` composable                      |
| `supabase` client in frontend       | Service → Hono API → `supabaseAdmin`           |
| `createFoo(formData)` with reactive | `createFoo({ ...formData })` (spread reactive) |
| `as any`, `@ts-ignore`              | Fix types properly                             |
| Duplicate notifications in pages    | Composables already handle CRUD notifications  |

## Auth System

JWT-based with RBAC. ROOT role returns `permissions: ["*"]` and bypasses all checks.

Permission format: `{domain}.{action}` (e.g., `employees.view`, `thread.edit`)

Key files: `server/middleware/auth.ts`, `src/composables/useAuth.ts`, `src/composables/usePermission.ts`, `src/router/guards.ts`

Test credentials: `ROOT001` / `password123` (ROOT), `NV001` / `password123` (EMPLOYEE)

### v-permission Directive

```vue
<AppButton v-permission="'employees.delete'">Delete</AppButton>
<AppButton v-permission="['employees.edit', 'employees.admin']">Edit</AppButton>
```

## Gotchas

- **dotenv**: `dotenv.config()` MUST be called before any `process.env` access in server
- **Icons**: Material Icons format only (`check_circle`, NOT `mdi-check-circle`)
- **Supabase 1000-row limit**: Use batch fetching with `.range()` loop, `limit=0` query param
- **Dynamic import errors**: Router has workaround in `src/router/index.ts` (reload page once)
- **q-popup-edit**: Store `initialVal` for API failure rollback
- **Pagination**: Watch search/filter changes to reset `page = 1`
- **Duplicate check before insert**: Return 409 with Vietnamese message, don't rely on DB constraint errors

## Environment Setup

Copy `.env.example` to `.env`:

```
PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

## Hardware Integration

```typescript
// Barcode Scanner (keyboard wedge - detects rapid keystrokes vs manual typing)
const { startScanning, stopScanning, lastScannedCode } = useScanner();

// Electronic Scale (Web Serial API)
const { connect, disconnect, currentWeight, isConnected } = useScale();

// Audio Feedback
const { playSuccess, playError, playWarning } = useAudioFeedback();
```

## Real-time & Offline

```typescript
// Real-time subscriptions (auto-cleanup on unmount)
const realtime = useRealtime();
realtime.subscribe({ table: "thread_inventory", event: "*" }, callback);

// Offline operation queue
const { queueOperation } = useOfflineOperation();
const { syncPending } = useOfflineSync();
```

## Required Skills (MUST invoke before coding)

**QUAN TRỌNG:** Trước khi viết/sửa code, PHẢI gọi skill tương ứng để đảm bảo đúng patterns.

### 4 Skill Chính (Ưu tiên cao nhất)

| Skill | PHẢI gọi khi | Ví dụ |
|---|---|---|
| `/vue-best-practices` | Viết/sửa Vue components, composables, template, TypeScript trong `.vue` files | Thêm component, fix lỗi template, refactor composable |
| `/hono-routing` | Viết/sửa API routes, middleware, validation trong `server/` | Thêm endpoint, fix API error, thêm middleware |
| `/backend-development` | Thiết kế architecture, auth flows, security review, complex API logic | Thiết kế feature mới, review security, auth changes |
| `/supabase-postgres-best-practices` | Viết queries, migrations, schema design, DB optimization | Thêm migration, tối ưu query, fix DB error |

**Quy tắc gọi skill:**
- Sửa file `.vue` → gọi `/vue-best-practices` trước
- Sửa route handlers, middleware, validation trong `server/` → gọi `/hono-routing`
- Thiết kế feature mới, auth changes, security review → gọi `/backend-development`
- Tạo API endpoint MỚI hoàn toàn → gọi cả `/hono-routing` + `/backend-development`
- Viết SQL/migration → gọi `/supabase-postgres-best-practices` trước
- Fix bug → gọi skill tương ứng với layer bị lỗi (frontend/backend/DB)
- Feature mới (full-stack) → gọi cả 3-4 skill theo thứ tự: DB → Backend → Frontend

## Agents & Teams

Use the **Augment Context Engine** (`codebase-retrieval` tool) as the primary tool for codebase searches before falling back to Glob/Grep.

### Subagents (Single-Agent Tasks)

| Task Type                         | Subagent                       |
| --------------------------------- | ------------------------------ |
| Research libraries/best practices | **research**                   |
| Explore codebase (broad search)   | **Explore**                    |
| Write/refactor code               | **senior-programmer**          |
| Review changes before commit      | **review-uncommitted-changes** |
| Debug errors                      | **debugger**                   |
| Run tests / check build           | **test-runner**                |
| Plan implementation               | **Plan**                       |

Run independent subagents **in parallel** when possible.

### Agents Team (Multi-Agent Tasks - Auto-Spawn)

**Khi nào TỰ ĐỘNG tạo Team:** Khi task yêu cầu **3+ agents đồng thời** hoặc **full-stack feature** (DB + Backend + Frontend).

**Quy tắc tạo Team:**
1. Đánh giá task complexity: nếu cần thay đổi ≥3 layers (migration, server route, service, composable, page) → **tạo Team**
2. Dùng `TeamCreate` → `TaskCreate` cho từng subtask → spawn teammates via `Task` tool với `team_name`
3. Phân chia rõ ràng: mỗi teammate nhận 1 layer/domain riêng, tránh xung đột file
4. Team lead (bạn) phối hợp qua `SendMessage` và theo dõi `TaskList`

**Team template cho full-stack feature:**

| Teammate | subagent_type | Nhiệm vụ |
|---|---|---|
| `db-agent` | senior-programmer | Migration SQL, RPC functions |
| `backend-agent` | senior-programmer | Hono routes, validation, middleware |
| `frontend-agent` | senior-programmer | Vue pages, components, composables, services |
| `reviewer` | review-uncommitted-changes | Review tất cả changes trước commit |

**Ví dụ tạo Team:**
```
1. TeamCreate({ team_name: "feature-xxx" })
2. TaskCreate cho mỗi subtask (DB, Backend, Frontend, Review)
3. Spawn teammates:
   Task({ subagent_type: "senior-programmer", team_name: "feature-xxx", name: "backend-agent", prompt: "..." })
4. Assign tasks via TaskUpdate({ owner: "backend-agent" })
5. Monitor progress via TaskList, SendMessage
6. Sau khi hoàn thành: shutdown teammates → TeamDelete
```

**Khi KHÔNG cần Team:**
- Fix bug đơn giản (1-2 files)
- Thêm component UI nhỏ
- Sửa style/CSS
- Task chỉ ảnh hưởng 1 layer → dùng single subagent

## Excel Export Pattern

All exports use **ExcelJS** (dynamic import to reduce bundle size). Pattern:

```typescript
const handleExport = async () => {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet Name");

  worksheet.columns = [{ header: "Tên cột", key: "field", width: 20 }];

  // Style header: blue background, white bold text
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1976D2" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  data.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  // Download via temporary link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `filename-${new Date().toISOString().split("T")[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

NEVER use CSV export. Always use `.xlsx` with ExcelJS for Vietnamese text support.

## Date Picker Pattern

NEVER use `<AppInput type="date">` (native HTML). Always use Quasar DatePicker with Vietnamese locale:

```vue
<AppInput
  v-model="displayDate"
  label="Từ ngày"
  placeholder="DD/MM/YYYY"
  dense
  clearable
>
  <template #append>
    <q-icon name="event" class="cursor-pointer">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
        <DatePicker v-model="displayDate" />
      </q-popup-proxy>
    </q-icon>
  </template>
</AppInput>
```

DatePicker uses `DD/MM/YYYY` format. Convert to/from `YYYY-MM-DD` (DB format) when needed.
