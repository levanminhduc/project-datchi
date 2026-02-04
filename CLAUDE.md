# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
