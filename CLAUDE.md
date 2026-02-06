# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL SAFETY RULES (MUST READ FIRST)

**Các lệnh sau đây YÊU CẦU sự cho phép rõ ràng từ user trước khi thực hiện:**

| Lệnh nguy hiểm | Hậu quả | Yêu cầu |
|----------------|---------|---------|
| `supabase db reset` | **XÓA TOÀN BỘ DỮ LIỆU** | ❌ KHÔNG BAO GIỜ chạy tự động |
| `DROP TABLE`, `TRUNCATE` | Mất dữ liệu vĩnh viễn | ❌ Phải hỏi user trước |
| `DELETE FROM ... WHERE 1=1` | Xóa toàn bộ records | ❌ Phải hỏi user trước |
| `supabase migration repair` | Thay đổi migration history | ⚠️ Hỏi user trước |
| Force push (`git push -f`) | Mất commit history | ⚠️ Hỏi user trước |

### Quy tắc bắt buộc:

1. **KHÔNG BAO GIỜ** chạy `supabase db reset` mà không có sự đồng ý rõ ràng từ user
2. **KHÔNG BAO GIỜ** xóa dữ liệu production/development mà không backup trước
3. **LUÔN HỎI** user trước khi thực hiện bất kỳ thao tác nào có thể làm mất dữ liệu
4. **NẾU CẦN RESET** database để test, đề xuất tạo database test riêng biệt

### Trước khi chạy migration mới:

```bash
# 1. Backup dữ liệu quan trọng trước
pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres > backup.sql

# 2. Kiểm tra migration có xóa dữ liệu không
# 3. Hỏi user nếu migration có DROP/TRUNCATE/DELETE
```

---

## Code Search Rules

**CRITICAL: Always use MCP Context Engine (`augment-context-engine_codebase-retrieval`) as the PRIMARY tool for codebase search.**

| Scenario | Tool to Use |
|----------|-------------|
| Finding code by meaning/purpose | `augment-context-engine_codebase-retrieval` (FIRST CHOICE) |
| "Where is X?", "How does Y work?" | `augment-context-engine_codebase-retrieval` |
| Understanding codebase structure | `augment-context-engine_codebase-retrieval` |
| Finding exact string/identifier | `grep` or `ast_grep_search` |
| Finding all references to a symbol | `lsp_find_references` |

**Why Context Engine First:**
- Semantic search understands intent, not just keywords
- Real-time index reflects current codebase state
- Cross-language retrieval support
- Higher quality recall for complex queries

## Project Overview

**Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)** - A Vue 3 + Quasar Framework application with Hono backend and Supabase database.

### Business Domains

| Domain | Description | Key Pages |
|--------|-------------|-----------|
| **Thread Management** | Thread types, colors, suppliers master data | `/thread`, `/thread/colors`, `/thread/suppliers` |
| **Inventory** | Cone tracking, lots, warehouse locations | `/thread/inventory`, `/thread/lots` |
| **Allocations** | Soft/hard allocation workflow (FEFO) | `/thread/allocations` |
| **Recovery** | Partial cone recovery with weighing | `/thread/recovery` |
| **Batch Operations** | Receive, issue, transfer operations | `/thread/batch/*` |
| **Mobile Operations** | Mobile-optimized receive/issue with scanning | `/thread/mobile/*` |
| **Reports & Dashboard** | Analytics and reporting | `/thread/dashboard`, `/reports/*` |
| **Employee Management** | HR and personnel data | `/employees`, `/nhan-su/*` |

### Core Features

- QR/Barcode scanning for inventory operations
- Real-time updates via Supabase subscriptions
- Offline operation support with background sync
- Hardware integration (barcode scanners, electronic scales)
- Custom UI component library wrapping Quasar

## Development Commands

```bash
# Start frontend dev server (port 5173)
npm run dev

# Start backend API server (port 3000)
npm run server

# Run both frontend and backend concurrently
npm run dev:all

# Build for production (includes type-check)
npm run build

# Type checking only
npm run type-check

# Lint and auto-fix
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Frontend-Backend Data Flow

```
Supabase → Hono API → Vue Service → Composable → Component
                                         ↓
                              Real-time subscription updates
```

**Stack:**
- Frontend: Vue 3 + Quasar 2 + TypeScript + Vite
- Backend: Hono (Node.js) with @hono/node-server
- Database: Supabase (PostgreSQL)
- Routing: unplugin-vue-router (file-based, auto-generated)

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | Page components with auto-routing (file name = route) |
| `src/pages/thread/` | Thread management module pages |
| `src/pages/thread/mobile/` | Mobile-optimized pages with scanning |
| `src/components/ui/` | Quasar wrapper components with standardized props |
| `src/composables/` | Vue composables for state and logic |
| `src/composables/thread/` | Thread domain composables |
| `src/composables/hardware/` | Scanner and scale integration |
| `src/services/` | API client and service layers |
| `src/types/ui/` | TypeScript interfaces for UI components |
| `src/types/thread/` | Thread domain type definitions |
| `src/utils/` | Shared utilities (error handling, etc.) |
| `server/` | Hono backend API |
| `server/routes/` | API route handlers |
| `server/db/` | Supabase client configuration |

## Key Patterns

### Error Handling Pattern

Use the shared utility from `src/utils/errorMessages.ts`:

```typescript
import { getErrorMessage, createErrorHandler } from '@/utils/errorMessages'

// Option A: Direct usage with fallback
catch (err) {
  snackbar.error(getErrorMessage(err, 'Không thể tải dữ liệu'))
}

// Option B: Domain-specific handler with custom messages
const getErrorMsg = createErrorHandler({
  duplicate: 'Mã chỉ đã tồn tại trong hệ thống',
  notFound: 'Không tìm thấy cuộn chỉ',
  validation: 'Dữ liệu không hợp lệ'
})
// Then: snackbar.error(getErrorMsg(err))
```

**Error message priority:**
1. `err.message` if it's a Vietnamese string (not generic English)
2. Custom domain messages matching error type
3. Fallback message provided

### Real-time Updates Pattern

Use `useRealtime` composable for Supabase subscriptions:

```typescript
const realtime = useRealtime()

onMounted(() => {
  realtime.subscribe(
    { table: 'thread_inventory', event: '*', schema: 'public' },
    (payload) => {
      if (payload.eventType === 'INSERT') items.value.push(payload.new)
      if (payload.eventType === 'UPDATE') updateItem(payload.new)
      if (payload.eventType === 'DELETE') removeItem(payload.old.id)
    }
  )
})
// Auto-cleanup on unmount via composable
```

### Hardware Integration

```typescript
// Barcode Scanner (keyboard wedge mode)
const { startScanning, stopScanning, lastScannedCode } = useScanner()
watch(lastScannedCode, (code) => handleScan(code))

// Electronic Scale (Web Serial API)
const { connect, disconnect, currentWeight, isConnected } = useScale()
await connect()  // Prompts user to select serial port

// Audio Feedback
const { playSuccess, playError, playWarning } = useAudioFeedback()
```

### Offline Operation Pattern

```typescript
const { queueOperation, pendingCount } = useOfflineOperation()
const { syncPending, isSyncing } = useOfflineSync()

// Queue operation when offline
if (!navigator.onLine) {
  await queueOperation('issue', { coneId, quantity })
} else {
  await issueThread(coneId, quantity)
}

// Sync when back online (usually auto-triggered)
await syncPending()
```

### UI Component Library Pattern

Components in `src/components/ui/` wrap Quasar components with:
- Standardized props and Vietnamese defaults
- TypeScript interfaces from `src/types/ui/`
- v-model:modelValue for two-way binding
- Slot forwarding via `v-for="(_, name) in $slots"`

Naming conventions:
- Wrapper: `App[Name]` (AppButton, AppInput)
- Composite: `[Context][Name]` (DataTable, FormDialog)
- Item: `[Parent]Item` (ListItem, StepperStep)

### Composable Pattern

Composables provide unified APIs wrapping Quasar plugins:

```typescript
// useSnackbar() - wraps $q.notify()
snackbar.success('Message')  // NOT $q.notify()

// useConfirm() - wraps $q.dialog()
const confirmed = await confirm('Are you sure?')

// useLoading() - manages loading state
const data = await loading.withLoading(async () => fetchData())
```

**Important:** Composables already show notifications on CRUD success/error. Pages should NOT add duplicate notifications.

## Thread Management Module

### Data Model

```
ThreadType (Loại chỉ)
  ├── ThreadColor (Màu chỉ)
  ├── Supplier (Nhà cung cấp)
  └── ThreadInventory (Tồn kho)
        ├── Lot (Lô hàng)
        ├── Warehouse (Kho)
        └── Allocation (Phân bổ)
              └── Recovery (Thu hồi)
```

### Key Workflows

| Workflow | Description | Composable |
|----------|-------------|------------|
| **Receive** | Nhập kho cuộn chỉ mới | `useBatchOperations` |
| **Issue** | Xuất chỉ cho sản xuất (FEFO) | `useBatchOperations` |
| **Transfer** | Chuyển kho nội bộ | `useBatchOperations` |
| **Allocate** | Phân bổ mềm → cứng | `useAllocations` |
| **Recover** | Thu hồi cuộn dư, cân trọng lượng | `useRecovery` |
| **Stocktake** | Kiểm kê với quét liên tục | Page-level |

### QR/Barcode Features

- **Lookup**: Scan to find cone in inventory
- **Issue**: Continuous scanning for batch issue
- **Stocktake**: Dedicated page at `/thread/stocktake`
- **Label Printing**: 50x30mm single or A4 batch (5x10 grid)

## Critical Patterns and Gotchas

### Environment Variables

Backend requires `dotenv.config()` before accessing `process.env`:
```typescript
import dotenv from 'dotenv'
dotenv.config()  // Must be before any process.env access
```

Frontend uses `VITE_` prefix (`import.meta.env.VITE_API_URL`).

### Supabase Dual Client Pattern

```typescript
// server/db/supabase.ts
supabase      // anon key - respects RLS
supabaseAdmin // service_role key - bypasses RLS (backend only)
```

Use `supabaseAdmin` for backend CRUD operations. Never expose to frontend.

### API Response Structure

All API responses use: `{ data, error, message }` with Vietnamese error messages.

### Quasar-Specific Patterns

1. **Icons**: Use Material Icons format only (`check_circle`, not `mdi-check-circle`)

2. **$q.notify() undefined handling**: Use conditional spread to avoid overriding defaults:
   ```typescript
   $q.notify({
     message,
     type,
     ...(color && { color }),  // Only include if defined
   })
   ```

3. **q-popup-edit rollback**: Store original value for API failure revert:
   ```typescript
   @save="(val, initialVal) => handler(val, initialVal)"
   ```

4. **Responsive columns**: Use `$q.screen.lt.sm` to switch column arrays for mobile/desktop

5. **Pagination reset**: Watch search/filter changes to reset `page = 1`

### Vue Reactive Objects to API

Always spread reactive objects before passing to API functions:
```typescript
createEmployee({ ...formData })  // NOT createEmployee(formData)
```

### Supabase Large Dataset Fetching

Supabase limits responses to 1000 rows. Use batch fetching:
```typescript
// Use limit=0 query param to trigger batch fetch on backend
// Backend loops with .range(offset, offset + BATCH_SIZE - 1)
```

### Duplicate Check Before Insert

Check for existing records with unique fields before insert, return 409 with Vietnamese message instead of relying on database constraint errors.

### Dynamic Import Error Workaround

Router includes workaround for Vite dynamic import failures (see `src/router/index.ts`):
```typescript
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    location.assign(to.fullPath)  // Reload page once
  }
})
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```
PORT=3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Type Definitions

| Category | Location |
|----------|----------|
| Employee types | `src/types/employee.ts`, `server/types/employee.ts` |
| Thread domain | `src/types/thread/*.ts` (thread-type, inventory, allocation, recovery, lot, color, supplier, batch, enums) |
| UI components | `src/types/ui/*.ts` (base, buttons, inputs, dialogs, etc.) |
| Utilities | `src/utils/errorMessages.ts` (error handling) |
| Auto-generated | `src/typed-router.d.ts`, `src/components.d.ts` |

## Composables Reference

### Core Composables

| Composable | Purpose |
|------------|---------|
| `useSnackbar` | Toast notifications (wraps $q.notify) |
| `useConfirm` | Confirmation dialogs (wraps $q.dialog) |
| `useLoading` | Loading state management |
| `useDialog` | Generic dialog management |
| `useDarkMode` | Theme switching |
| `useSidebar` | Navigation sidebar state |

### Thread Domain Composables

| Composable | Purpose |
|------------|---------|
| `useThreadTypes` | Thread type CRUD |
| `useInventory` | Inventory queries and mutations |
| `useAllocations` | Allocation workflow |
| `useRecovery` | Recovery workflow with weighing |
| `useDashboard` | Dashboard analytics |
| `useColors` | Thread colors master data |
| `useSuppliers` | Suppliers master data |
| `useBatchOperations` | Receive/Issue/Transfer |
| `useConeSummary` | Cone weight and status summary |
| `useConflicts` | Allocation conflict resolution |

### Hardware Composables

| Composable | Purpose |
|------------|---------|
| `useScanner` | Keyboard wedge barcode scanner |
| `useScale` | Web Serial API for scales |
| `useAudioFeedback` | Audio cues for operations |
| `useQrScanner` | Camera-based QR scanning |

### Infrastructure Composables

| Composable | Purpose |
|------------|---------|
| `useRealtime` | Supabase real-time subscriptions |
| `useOfflineOperation` | Queue ops when offline |
| `useOfflineSync` | Sync queued operations |

### Auth Composables

| Composable | Purpose |
|------------|---------|
| `useAuth` | Auth state, login/logout, token management |
| `usePermission` | Permission checking helpers for templates |

## Authentication & Authorization System

### Overview

JWT-based authentication with role-based access control (RBAC). Employees login with `employee_id` + `password`.

### Architecture

```
Login Request → Hono API → Verify Password → Generate JWT → Return Tokens
                              ↓
Protected Request → Auth Middleware → Verify JWT → Attach User → Route Handler
                              ↓
Frontend → Router Guard → Check Auth State → Allow/Redirect
```

### Database Tables (Migration: `20240101000025_auth_permissions.sql`)

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions (ROOT, ADMIN, MANAGER, etc.) |
| `permissions` | Permission definitions (employees.view, thread.edit, etc.) |
| `role_permissions` | Many-to-many: roles ↔ permissions |
| `employee_roles` | Many-to-many: employees ↔ roles |
| `employee_permissions` | Direct permissions for employees |
| `refresh_tokens` | Stored refresh tokens for rotation |

### Key Files

| File | Purpose |
|------|---------|
| `server/routes/auth.ts` | Auth API endpoints (login, refresh, me, permissions) |
| `server/middleware/auth.ts` | JWT verification middleware |
| `src/services/authService.ts` | Frontend auth API client |
| `src/composables/useAuth.ts` | Shared auth state (user, tokens, permissions) |
| `src/composables/usePermission.ts` | Template helpers (hasPermission, hasRole, etc.) |
| `src/router/guards.ts` | Route protection guards |
| `src/pages/login.vue` | Login page UI |
| `src/directives/permission.ts` | v-permission directive |

### Environment Variables (Required in `.env`)

```bash
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### API Endpoints

```bash
POST /api/auth/login          # Login with employee_id + password
POST /api/auth/refresh        # Refresh access token
GET  /api/auth/me             # Get current user info (protected)
GET  /api/auth/permissions    # Get user permissions (protected)
POST /api/auth/logout         # Logout and invalidate refresh token
POST /api/auth/change-password # Change password (protected)
```

### Test Credentials

| Employee ID | Password | Role | Notes |
|-------------|----------|------|-------|
| ROOT001 | password123 | ROOT | Bypasses all permissions (returns `["*"]`) |
| NV001 | password123 | EMPLOYEE | Standard employee |

### Frontend Usage

#### Protecting Routes (in page component)

```typescript
// src/pages/some-page.vue
definePage({
  meta: {
    requiresAuth: true,                    // Require login
    permissions: ['employees.view'],       // Optional: require specific permissions
    roles: ['ADMIN', 'MANAGER'],          // Optional: require specific roles
  }
})
```

#### Using Auth Composable

```typescript
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, login, logout, permissions } = useAuth()

// Login
await login(employeeId, password)

// Check auth state
if (isAuthenticated.value) {
  console.log(user.value?.full_name)
}

// Logout
await logout()
```

#### Using Permission Composable

```typescript
import { usePermission } from '@/composables/usePermission'

const { hasPermission, hasRole, hasAnyPermission, isRoot } = usePermission()

// In template
<q-btn v-if="hasPermission('employees.create')">Add Employee</q-btn>
<q-btn v-if="hasRole('ADMIN')">Admin Action</q-btn>
<q-btn v-if="isRoot">Dangerous Action</q-btn>
```

#### Using v-permission Directive

```vue
<!-- Hide element if no permission -->
<q-btn v-permission="'employees.delete'">Delete</q-btn>

<!-- Multiple permissions (any) -->
<q-btn v-permission="['employees.edit', 'employees.admin']">Edit</q-btn>
```

### Permission Naming Convention

```
{domain}.{action}

Examples:
- employees.view, employees.create, employees.edit, employees.delete
- thread.view, thread.create, thread.edit, thread.delete
- inventory.view, inventory.adjust
- reports.view, reports.export
```

### ROOT Role Special Behavior

- ROOT role returns `permissions: ["*"]`
- `hasPermission()` always returns `true` for ROOT
- Use `isRoot` check for dangerous operations

### Setting Employee Passwords

```typescript
import bcrypt from 'bcrypt'

// Generate hash
const hash = await bcrypt.hash('password123', 10)

// Update in database
UPDATE employees 
SET password_hash = '$2b$10$...',
    must_change_password = true
WHERE employee_id = 'NV001';
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid token" | Check JWT_SECRET matches between restarts |
| "Token expired" | Frontend should auto-refresh, check refresh token logic |
| "Permission denied" | Check employee has role/permission in database |
| Login fails | Verify password_hash exists and bcrypt compare works |

## OpenSpec Subagents (Explore Mode)

When in **Explore Mode** (planning, researching, analyzing before implementation), use OpenSpec subagents instead of direct tools.

### RULE: Subagent Delegation in Explore Mode

| Instead of... | Use this subagent |
|---------------|-------------------|
| codebase-retrieval, grep, glob, file search | **openspec-codebase-analyzer** |
| web-search, web-fetch for docs/libraries/topics | **openspec-researcher** |
| Manual UI/UX planning for build/edit/fix UI tasks | **openspec-ui-ux-pro-max** |
| Reading and analyzing log files | **openspec-log-analyzer** |

### When to Use Each Subagent

**openspec-codebase-analyzer**
- User asks to understand existing code
- User asks to find where something is implemented
- User asks about code patterns, dependencies, or architecture
- Before implementing any feature (understand context first)

**openspec-researcher**
- User asks about a library, framework, or technology
- User needs documentation or best practices
- User wants to compare solutions or find alternatives
- User asks "how to do X" that requires external knowledge

**openspec-ui-ux-pro-max**
- User plans to build, edit, or fix UI components
- User needs design decisions (colors, layout, typography)
- User asks about UX improvements or accessibility
- Before implementing any UI-related task

**openspec-log-analyzer**
- User provides log files or error outputs
- User asks to debug or find root cause of issues
- User needs to understand what happened from logs

### Important Notes

1. All subagents are READ-ONLY - they analyze and recommend, never modify files
2. Output specs are stored in:
   - `<workspace>/openspec/specs/` - Approved specifications
   - `<workspace>/openspec/changes/` - Work in progress
3. After Explore Mode, switch to Implementation Mode to execute recommendations
