# Employee Management - Technical Design

## Architecture

```mermaid
flowchart LR
    subgraph Frontend ["Frontend (Vue 3 + Quasar)"]
        Page[employees.vue]
        Composable[useEmployees.ts]
        Service[employeeService.ts]
        API[api.ts]
    end
    
    subgraph Backend ["Backend (Hono)"]
        Routes[employees.ts routes]
        DB[supabase.ts client]
    end
    
    subgraph Database ["Database"]
        Supabase[(Supabase PostgreSQL)]
    end
    
    Page --> Composable
    Composable --> Service
    Service --> API
    API -->|HTTP| Routes
    Routes --> DB
    DB --> Supabase
```

**Data Flow**: Supabase → Hono API → Vue Service → Composable → Component

## Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| employees.vue | Main page with table, dialogs, actions | `src/pages/employees.vue` |
| useEmployees | State management, CRUD operations | `src/composables/useEmployees.ts` |
| employeeService | HTTP calls to API | `src/services/employeeService.ts` |
| api | Base fetch wrapper with error handling | `src/services/api.ts` |
| Hono server | REST API endpoints | `server/index.ts` |
| Employee routes | CRUD route handlers | `server/routes/employees.ts` |
| Supabase client | Database connection | `server/db/supabase.ts` |

## File Structure

```
server/                           # NEW - Hono backend
├── index.ts                      # Entry point, CORS, routes
├── db/
│   └── supabase.ts              # Supabase client initialization
├── routes/
│   └── employees.ts             # Employee CRUD endpoints
└── types/
    └── employee.ts              # Backend types

src/
├── pages/
│   └── employees.vue            # NEW - Employee list page
├── composables/
│   ├── index.ts                 # UPDATE - Export useEmployees
│   └── useEmployees.ts          # NEW - Employee state management
├── services/                    # NEW - API services
│   ├── api.ts                   # Base API client
│   └── employeeService.ts       # Employee API calls
└── types/
    ├── index.ts                 # UPDATE - Export employee types
    └── employee.ts              # NEW - Employee type definitions
```

## Data Models

**User-Provided Structure** (updated to match implementation):

```typescript
interface Employee {
  id: number              // Auto-increment primary key (NOT UUID/string)
  employee_id: string     // Mã Nhân Viên (UNIQUE, IMMUTABLE)
  full_name: string       // Tên Nhân Viên
  department: string      // Phòng Ban
  chuc_vu: string         // Chức Vụ (plain string, NOT enum type)
  is_active: boolean      // Trạng thái hoạt động
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}

// ChucVu options are computed dynamically from employees data
// See src/pages/employees.vue:617-620
const chucVuOptions = computed(() => {
  const positions = [...new Set(employees.value.map(e => e.chuc_vu).filter(Boolean))]
  return positions.sort().map(pos => ({ label: pos, value: pos }))
})

// No hardcoded labels - chuc_vu values are displayed as-is
// This follows the same pattern as Department dropdown
```

**Key differences from original spec**:
- `id` is `number` (auto-increment), NOT `string` (UUID)
- `chuc_vu` is `string`, NOT enum type `ChucVu`
- `is_active: boolean` field exists (was not previously documented)
- Type definitions: see `src/types/employee.ts` and `server/types/employee.ts`

**Derived Types**:

```typescript
// For create/update operations (without id, timestamps, is_active)
// See src/types/employee.ts:26-31
interface EmployeeFormData {
  employee_id: string     // Mã Nhân Viên
  full_name: string       // Tên Nhân Viên
  department: string      // Phòng Ban
  chuc_vu: string         // Chức Vụ
}

// Table column definition - follow pattern from src/types/components.ts:10-19
interface EmployeeColumn extends DataTableColumn {
  name: keyof Employee | 'actions'
  label: string  // Vietnamese labels
}

// API response wrapper
interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

## Table Columns Configuration

Follow pattern from `src/pages/components.vue:622-626`:

```typescript
const columns: EmployeeColumn[] = [
  { name: 'full_name', label: 'Tên Nhân Viên', field: 'full_name', align: 'left', sortable: true },
  { name: 'employee_id', label: 'Mã NV', field: 'employee_id', align: 'left', sortable: true },
  { name: 'department', label: 'Phòng Ban', field: 'department', align: 'left', sortable: true },
  { name: 'chuc_vu', label: 'Chức Vụ', field: 'chuc_vu', align: 'left', sortable: true },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' }
]
```

## Key Flows

### Load Employee List

```mermaid
sequenceDiagram
    participant U as User
    participant P as employees.vue
    participant C as useEmployees
    participant S as employeeService
    participant A as Hono API
    participant D as Supabase

    U->>P: Navigate to /employees
    P->>C: onMounted → fetchEmployees()
    C->>C: isLoading = true
    C->>S: getEmployees({ limit: 0 })
    S->>A: GET /api/employees?limit=0
    A->>D: SELECT * FROM employees
    D-->>A: rows[] (1630+ records)
    A-->>S: { data: employees[], total }
    S-->>C: All employees array
    C->>C: employees = data, isLoading = false
    C-->>P: reactive state updated
    P-->>U: Render q-table with virtual-scroll
```

### Inline Edit Flow (NEW)

```mermaid
sequenceDiagram
    participant U as User
    participant P as employees.vue
    participant C as useEmployees
    participant S as employeeService
    participant A as Hono API
    participant D as Supabase

    U->>P: Click on editable cell (full_name/department/chuc_vu)
    P->>P: Show q-popup-edit with current value
    U->>P: Edit value, press Enter or click save
    P->>P: Store original value, show loading on cell
    P->>C: handleInlineEdit(id, field, newValue)
    C->>S: update(id, { [field]: newValue })
    S->>A: PUT /api/employees/:id
    A->>D: UPDATE employees SET field = value
    D-->>A: updated employee
    A-->>S: { data: employee }
    S-->>C: Employee
    C->>C: Update local state
    C-->>P: Success
    P->>P: Hide loading, show success notification
    P-->>U: Cell shows new value
    
    Note over P: On Error
    P->>P: Revert to original value
    P->>P: Show error notification
```

### Create Employee

```mermaid
sequenceDiagram
    participant U as User
    participant P as employees.vue
    participant C as useEmployees
    participant S as employeeService
    participant A as Hono API
    participant D as Supabase

    U->>P: Click "Thêm nhân viên"
    P->>P: showDialog = true
    U->>P: Fill form, submit
    P->>C: createEmployee(formData)
    C->>S: create(employee)
    S->>A: POST /api/employees
    A->>D: INSERT INTO employees
    D-->>A: new employee
    A-->>S: { data: employee }
    S-->>C: Employee
    C->>C: employees.push(employee)
    C-->>P: Success
    P->>P: Close dialog, show notification
    P-->>U: "Thêm nhân viên thành công"
```

## API Endpoints

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | /api/employees | `?limit=0` | `Employee[]` | All records (limit=0 disables pagination) |
| GET | /api/employees/:id | - | `ApiResponse<Employee>` | Get single employee |
| POST | /api/employees | `EmployeeInput` | `ApiResponse<Employee>` | Create employee |
| PUT | /api/employees/:id | `Partial<EmployeeInput>` | `ApiResponse<Employee>` | Update employee (used by inline edit) |
| DELETE | /api/employees/:id | - | `ApiResponse<{success: true}>` | Delete employee |

> **Note**: Backend already supports `limit=0` for fetching all records without pagination.

### Error Response Format

```typescript
interface ErrorResponse {
  error: string      // Error message (Vietnamese for display)
  code?: string      // Error code for programmatic handling
  details?: unknown  // Additional debug info (dev only)
}
```

| HTTP Status | Meaning | Vietnamese Message |
|-------------|---------|-------------------|
| 400 | Validation error | Dữ liệu không hợp lệ |
| 404 | Employee not found | Không tìm thấy nhân viên |
| 409 | Duplicate employee_code | Mã nhân viên đã tồn tại |
| 500 | Server error | Lỗi hệ thống |

## Composable Pattern

Follow pattern from `src/composables/useLoading.ts:1-42` and `src/composables/useDialog.ts:1-28`:

```typescript
// useEmployees.ts structure
export function useEmployees() {
  // State
  const employees = ref<Employee[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 10, total: 0 })
  const searchQuery = ref('')
  
  // Dialog state (following useDialog pattern)
  const formDialog = ref({ isOpen: false, mode: 'create', data: null })
  
  // Actions
  const fetchEmployees = async () => { /* ... */ }
  const createEmployee = async (data: EmployeeInput) => { /* ... */ }
  const updateEmployee = async (id: number, data: Partial<EmployeeFormData>) => { /* ... */ }
  const deleteEmployee = async (id: number) => { /* ... */ }
  
  // Computed
  const filteredEmployees = computed(() => { /* client-side filter */ })
  
  return {
    // State
    employees,
    isLoading,
    error,
    pagination,
    searchQuery,
    formDialog,
    // Actions
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    // Computed
    filteredEmployees
  }
}
```

**Note**: The `usePositions` composable previously used for ChucVu options has been removed. ChucVu options are now computed directly in the page component from the employees array, following the same pattern as Department options.
    isLoading,
    error,
    pagination,
    searchQuery,
    formDialog,
    // Actions
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    // Computed
    filteredEmployees
  }
}
```

## CORS Configuration

Frontend runs on port 5173 (Vite dev server), backend on port 3000.

```typescript
// server/index.ts
import { cors } from 'hono/cors'

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type']
}))
```

## Supabase Connection

```typescript
// server/db/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || '...'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Supabase Client Pattern

The backend uses dual Supabase clients:

| Client | Key | Purpose |
|--------|-----|---------|
| `supabase` | `ANON_KEY` | For frontend-like operations (respects RLS) |
| `supabaseAdmin` | `SERVICE_ROLE_KEY` | For backend CRUD operations (bypasses RLS) |

**Important**: `supabaseAdmin` bypasses all Row Level Security policies. Only use for server-side operations. Never expose to frontend.

**Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for frontend
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend (keep secret)

## Error Handling

### Backend (Hono)
```typescript
// Wrap all handlers with try-catch
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Lỗi hệ thống' }, 500)
})
```

### Frontend (Service Layer)
```typescript
// src/services/api.ts
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Lỗi không xác định')
  }
  
  return response.json()
}
```

## Responsive Breakpoints

Follow Quasar responsive design. Table adapts:
- **Mobile (< 600px)**: Stack layout, hide less important columns
- **Tablet (600-1024px)**: Show all columns, compact spacing
- **Desktop (> 1024px)**: Full layout with actions

```vue
<!-- employees.vue -->
<q-table
  :columns="$q.screen.lt.sm ? mobileColumns : columns"
  :dense="$q.screen.lt.md"
/>
```

## Virtual Scroll Configuration (NEW)

For handling 1630+ employee records efficiently, replace pagination with Quasar's virtual scroll.

### Q-Table Virtual Scroll Setup

```vue
<q-table
  flat
  bordered
  virtual-scroll
  :virtual-scroll-sticky-size-start="48"
  :rows="filteredEmployees"
  :columns="visibleColumns"
  row-key="id"
  :loading="loading"
  style="height: calc(100vh - 200px)"
  class="employee-table"
>
```

### Configuration Details

| Property | Value | Purpose |
|----------|-------|---------|
| `virtual-scroll` | true | Enable virtual scrolling |
| `virtual-scroll-sticky-size-start` | 48 | Header row height in px |
| `style="height: calc(100vh - 200px)"` | dynamic | Viewport-based height for better UX |
| `:rows-per-page-options="[0]"` | disable | Hide pagination (show all rows) |

### Performance Considerations

- **Initial Load**: Fetches all 1630 records in single API call (~1s with limit=0)
- **Memory**: ~500KB for 1630 records in memory (acceptable)
- **Render**: Only visible rows rendered (~10-15 at a time)
- **Scroll**: 60fps smooth scrolling with virtualization
- **Search**: Client-side filtering on full dataset (instant with computed)

## Inline Editing with q-popup-edit (NEW)

Enable rapid editing of employee fields directly in table cells.

### Editable Fields

| Field | Column Name | Editable | Component |
|-------|-------------|----------|-----------|
| full_name | Tên Nhân Viên | Yes | q-popup-edit |
| department | Phòng Ban | Yes | q-popup-edit |
| chuc_vu | Chức Vụ | Yes | q-popup-edit |
| employee_id | Mã NV | No | Read-only |
| actions | Thao Tác | N/A | Buttons |

### Template Slot Pattern

```vue
<!-- Inline edit for full_name -->
<template #body-cell-full_name="props">
  <q-td :props="props" class="cursor-pointer">
    {{ props.row.full_name }}
    <q-popup-edit
      v-model="props.row.full_name"
      v-slot="scope"
      buttons
      label-set="Lưu"
      label-cancel="Hủy"
      @save="(val, initialVal) => handleInlineEdit(props.row.id, 'full_name', val, initialVal)"
    >
      <q-input
        v-model="scope.value"
        dense
        autofocus
        @keyup.enter="scope.set"
      />
    </q-popup-edit>
    <q-icon name="edit" size="xs" class="q-ml-xs text-grey-5" />
  </q-td>
</template>
```

### handleInlineEdit Method Specification

```typescript
/**
 * Handle inline field edits via q-popup-edit
 * @param id - Employee ID
 * @param field - Field name being edited (full_name, department, chuc_vu)
 * @param newValue - New value from popup edit
 * @param originalValue - Original value for rollback on error
 */
const handleInlineEdit = async (
  id: number,
  field: 'full_name' | 'department' | 'chuc_vu',
  newValue: string,
  originalValue: string
): Promise<void> => {
  // Skip if no change
  if (newValue === originalValue) return
  
  // Optimistic update already applied by v-model
  const result = await updateEmployee(id, { [field]: newValue })
  
  if (!result) {
    // Revert on error - find employee and restore original value
    const emp = employees.value.find(e => e.id === id)
    if (emp) {
      emp[field] = originalValue
    }
  }
}
```

### Loading State per Cell

Track which cells are currently saving:

```typescript
// State for tracking inline edit loading
const inlineEditLoading = ref<Record<string, boolean>>({})

// Generate key for loading state
const getCellKey = (id: number, field: string) => `${id}-${field}`

// In handleInlineEdit
inlineEditLoading.value[getCellKey(id, field)] = true
try {
  await updateEmployee(id, { [field]: newValue })
} finally {
  inlineEditLoading.value[getCellKey(id, field)] = false
}
```

### Visual Indicator

```vue
<q-td :props="props" class="cursor-pointer">
  <q-spinner-dots 
    v-if="inlineEditLoading[getCellKey(props.row.id, 'full_name')]"
    size="sm"
  />
  <template v-else>
    {{ props.row.full_name }}
    <!-- popup-edit here -->
  </template>
</q-td>
```

## Vietnamese Labels Reference

| Field | Database Column | Vietnamese Label |
|-------|-----------------|------------------|
| Name | full_name | Tên Nhân Viên |
| Code | employee_id | Mã NV |
| Department | department | Phòng Ban |
| Position | chuc_vu | Chức Vụ |
| Status | is_active | Trạng Thái |
| Actions | - | Thao tác |
| Add | - | Thêm nhân viên |
| Edit | - | Sửa |
| Delete | - | Xóa |
| Search | - | Tìm kiếm |
| Confirm | - | Xác nhận |
| Cancel | - | Hủy |
| Active | - | Đang hoạt động |
| Inactive | - | Ngừng hoạt động |

## Detail Dialog

Employee details are displayed in a modal dialog when user clicks on a table row.

**Implementation**: `src/pages/employees.vue:350-540`

### Dialog Structure

```mermaid
flowchart TD
    subgraph DetailDialog["Detail Dialog"]
        Header["Header: Mã NV badge"]
        Section1["Employee Info Section"]
        Section2["Timestamps Section"]
        Actions["Action Buttons"]
    end
    
    Section1 --> FieldID["employee_id - Mã Nhân Viên"]
    Section1 --> FieldName["full_name - Tên Nhân Viên"]
    Section1 --> FieldDept["department - Phòng Ban"]
    Section1 --> FieldPos["chuc_vu - Chức Vụ"]
    Section1 --> FieldActive["is_active - Trạng Thái"]
    
    Section2 --> Created["created_at - Ngày tạo"]
    Section2 --> Updated["updated_at - Cập nhật lần cuối"]
    
    Actions --> EditBtn["Sửa - opens edit dialog"]
    Actions --> CloseBtn["Đóng - closes dialog"]
```

### Fields Displayed

| Field | Icon | Display Format |
|-------|------|----------------|
| employee_id | badge | Badge with primary color |
| full_name | person | Plain text |
| department | business | Plain text or "Chưa xác định" |
| chuc_vu | work | Raw value (no label mapping) |
| is_active | check_circle/cancel | Color-coded chip (positive/negative) |
| created_at | event | formatDateTime() |
| updated_at | update | formatDateTime() |

### State Management

```typescript
// src/pages/employees.vue:725-728
interface DetailDialogState {
  isOpen: boolean
  employee: Employee | null
}

const detailDialog = reactive<DetailDialogState>({
  isOpen: false,
  employee: null,
})
```

## Department Dropdown with new-value-mode

The department dropdown supports adding new values that don't exist in the current list.

**Implementation**: `src/pages/employees.vue:276-289`

### Configuration

```vue
<AppSelect
  v-model="formData.department"
  label="Phòng Ban"
  :options="filteredDepartmentOptions"
  use-input
  new-value-mode="add-unique"
  clearable
  @filter="filterDepartments"
/>
```

### Behavior

| Feature | Description |
|---------|-------------|
| Dynamic options | Computed from existing employees' departments |
| Type-ahead search | `use-input` enables filtering as user types |
| Add new values | `new-value-mode="add-unique"` allows creating new departments |
| Filter function | `filterDepartments()` filters options based on input |

### Options Source

```typescript
// src/pages/employees.vue:611-614
const departmentOptions = computed(() => {
  const departments = [...new Set(employees.value.map(e => e.department).filter(Boolean))]
  return departments.sort().map(dept => ({ label: dept, value: dept }))
})
```

## ChucVu (Position) Dropdown - Dynamic Options

The ChucVu dropdown follows the exact same pattern as Department - options are computed dynamically from existing employee data.

**Implementation**: `src/pages/employees.vue:291-301` (form), `src/pages/employees.vue:194-207` (inline edit)

### Configuration

```vue
<!-- In form dialog -->
<AppSelect
  v-model="formData.chuc_vu"
  label="Chức Vụ"
  :options="chucVuOptions"
  clearable
/>

<!-- In inline edit popup -->
<q-select
  v-model="scope.value"
  :options="chucVuOptions"
  option-value="value"
  option-label="label"
  emit-value
  map-options
/>
```

### Behavior

| Feature | Description |
|---------|-------------|
| Dynamic options | Computed from existing employees' chuc_vu values |
| No hardcoded list | Options are data-driven from employees table |
| Same pattern as Department | Uses identical extraction logic |
| No separate API | No dependency on usePositions or /unique-positions endpoint |

### Options Source

```typescript
// src/pages/employees.vue:617-620
const chucVuOptions = computed(() => {
  const positions = [...new Set(employees.value.map(e => e.chuc_vu).filter(Boolean))]
  return positions.sort().map(pos => ({ label: pos, value: pos }))
})
```

### Key Changes from Previous Implementation

| Aspect | OLD | NEW |
|--------|-----|-----|
| Data source | usePositions composable + API | Computed from employees array |
| API dependency | GET /api/employees/unique-positions | None - no separate API call |
| Options type | Hardcoded list (quan_ly, nhan_vien, truong_phong) | Dynamic from database |
| Initialization | fetchPositions() in onMounted | Reactive computed property |
| Pattern | Separate logic from Department | Identical pattern to Department |
```

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| CORS errors | Configure CORS middleware from start |
| Type mismatch frontend/backend | Shared types in both locations |
| Supabase connection failure | Environment variable fallbacks |
| Slow API responses | Loading states, timeout handling |
| XSS in user input | Quasar sanitizes by default |
| **NEW** Large dataset performance | Virtual scroll renders only visible rows |
| **NEW** Memory with 1630+ records | ~500KB acceptable, use computed for filtering |
| **NEW** Inline edit race conditions | Loading state per cell, optimistic update with rollback |
| **NEW** Inline edit data loss | Store original value, revert on API failure |

## Test Strategy

- **Unit**: Test useEmployees composable in isolation
- **Integration**: Test employeeService with mock API
- **E2E**: Test full CRUD flow on employees page
- **NEW** Virtual scroll: Verify smooth scrolling with 1630 records
- **NEW** Inline edit: Test save/cancel/error rollback scenarios

## Implementation Notes

### API Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Request timeout | 10 seconds | Using AbortController |
| Timeout error code | 408 | Request Timeout |
| Health endpoint | `/health` | Server monitoring |

### Additional Composable Methods

Beyond the spec, these methods were added for convenience:

| Method | Description |
|--------|-------------|
| `selectEmployee(id)` | Select an employee for editing/viewing |
| `getEmployeeById(id)` | Fetch single employee details |

### Error Code Reference

| HTTP Status | Error Code | Vietnamese Message |
|-------------|------------|-------------------|
| 400 | VALIDATION_ERROR | Dữ liệu không hợp lệ |
| 404 | NOT_FOUND | Không tìm thấy nhân viên |
| 408 | TIMEOUT | Yêu cầu quá thời gian. Vui lòng thử lại |
| 409 | DUPLICATE | Mã nhân viên đã tồn tại |
| 500 | SERVER_ERROR | Lỗi hệ thống |

### Spec Sync (2026-01-29)

| Change | Old Value | New Value |
|--------|-----------| ----------|
| Employee.id type | `string` (UUID) | `number` (auto-increment) |
| Employee.chuc_vu type | `ChucVu` (enum) | `string` (plain) |
| is_active field | Not documented | `boolean` field added |
| Detail Dialog | Not documented | Full section added |
| Department dropdown | Not documented | `new-value-mode="add-unique"` documented |
| **ChucVu dropdown source** | **Hardcoded options** | **Computed from employees.chuc_vu** |
| **ChucVu API dependency** | **usePositions + /unique-positions** | **None - computed locally** |
| **ChucVu pattern** | **Separate implementation** | **Same as Department dropdown** |
