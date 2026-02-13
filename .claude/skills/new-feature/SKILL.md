# Skill: /new-feature

Hướng dẫn tạo tính năng mới cho dự án Đạt Chi - Thread Inventory Management System.

Khi user gọi `/new-feature [mô tả tính năng]`, hãy tuân thủ TOÀN BỘ hướng dẫn bên dưới.

---

## BƯỚC 0: PHÂN TÍCH YÊU CẦU

Trước khi code, hãy:
1. Diễn giải lại yêu cầu bằng tiếng Việt
2. Xác định scope: Database / Backend / Frontend / Tất cả
3. Hỏi user xác nhận trước khi bắt tay vào làm
4. Nếu tính năng có nhiều sub-features → đề xuất dùng **Tab layout**

---

## BƯỚC 1: DATABASE (Migration)

### File location
```
supabase/migrations/YYYYMMDD_ten_tinh_nang.sql
```

### Quy tắc
- Table name: `snake_case`
- LUÔN có `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: thêm `deleted_at TIMESTAMPTZ DEFAULT NULL` nếu cần
- View: prefix `v_` (ví dụ: `v_inventory_summary`)
- Function: prefix `fn_` (ví dụ: `fn_calculate_stock`)
- Trigger: `trigger_[table]_updated_at` cho auto-update `updated_at`
- ENUM type nên dùng VARCHAR với CHECK constraint hoặc PostgreSQL ENUM

### Template migration
```sql
-- ============================================================================
-- Migration: YYYYMMDD_ten_tinh_nang.sql
-- Description: Mô tả tính năng
-- Dependencies: Các table phụ thuộc
-- ============================================================================

-- TABLE
CREATE TABLE IF NOT EXISTS ten_bang (
    id SERIAL PRIMARY KEY,
    -- ... columns ...
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION fn_update_ten_bang_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ten_bang_updated_at
    BEFORE UPDATE ON ten_bang
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_ten_bang_timestamp();

-- INDEX (nếu cần)
CREATE INDEX IF NOT EXISTS idx_ten_bang_field ON ten_bang(field);
```

---

## BƯỚC 2: TYPES (Shared Types)

### Backend types
```
server/types/ten-tinh-nang.ts
```

Pattern:
```typescript
export type TenStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface TenBangRow {
  id: number
  // ... columns match DB schema
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### Frontend types
```
src/types/thread/tenTinhNang.ts
```

Pattern:
```typescript
export enum TenStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface TenBang {
  id: number
  // ... columns
  created_at: string
  updated_at: string
}

export interface CreateTenBangDTO {
  // ... fields for creation
}

export interface TenBangFilters {
  page?: number
  limit?: number
  status?: string
  from?: string
  to?: string
}

export interface TenBangListResponse {
  data: TenBang[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

Export từ `src/types/thread/index.ts`:
```typescript
export * from './tenTinhNang'
```

---

## BƯỚC 3: VALIDATION (Zod Schemas)

### File location
```
server/validation/tenTinhNang.ts
```

### Pattern
```typescript
import { z } from 'zod'

export const CreateTenBangSchema = z.object({
  field1: z.string().min(1, 'Truong nay khong duoc de trong').trim(),
  field2: z.number().int().positive('Phai la so nguyen duong'),
  optional_field: z.string().optional().nullable(),
})

export type CreateTenBangDTO = z.infer<typeof CreateTenBangSchema>

export const TenBangFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})
```

---

## BƯỚC 4: BACKEND (Hono Routes)

### File location
```
server/routes/tenTinhNang.ts
```

### Đăng ký route trong `server/index.ts`
```typescript
import tenTinhNangRouter from './routes/tenTinhNang'
app.route('/api/ten-tinh-nang', tenTinhNangRouter)
```

### Route pattern
```typescript
import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'
import { CreateTenBangSchema, TenBangFiltersSchema } from '../validation/tenTinhNang'
import type { ThreadApiResponse } from '../types/thread'

const tenTinhNang = new Hono()

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

// GET / - Danh sách
tenTinhNang.get('/', async (c) => {
  try {
    const query = c.req.query()
    const filters = TenBangFiltersSchema.parse(query)

    let queryBuilder = supabase
      .from('ten_bang')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters...
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }

    // Pagination
    const offset = (filters.page - 1) * filters.limit
    queryBuilder = queryBuilder.range(offset, offset + filters.limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return c.json({
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
    })
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ success: false, error: formatZodError(err) }, 400)
    }
    return c.json({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// GET /:id - Chi tiết
tenTinhNang.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('ten_bang')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return c.json({ success: false, error: 'Không tìm thấy' }, 404)
    }

    return c.json({ success: true, data })
  } catch (err) {
    return c.json({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// POST / - Tạo mới
tenTinhNang.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateTenBangSchema.parse(body)

    const { data, error } = await supabase
      .from('ten_bang')
      .insert(validated)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    if (err instanceof ZodError) {
      return c.json({ success: false, error: formatZodError(err) }, 400)
    }
    return c.json({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// PATCH /:id - Cập nhật
tenTinhNang.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    // Validate partial update...

    const { data, error } = await supabase
      .from('ten_bang')
      .update(body)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    return c.json({ success: false, error: getErrorMessage(err) }, 500)
  }
})

// DELETE /:id - Xóa mềm
tenTinhNang.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID không hợp lệ' }, 400)
    }

    const { error } = await supabase
      .from('ten_bang')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    return c.json({ success: true, message: 'Đã xóa thành công' })
  } catch (err) {
    return c.json({ success: false, error: getErrorMessage(err) }, 500)
  }
})

export default tenTinhNang
```

### Response format LUÔN là:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": "Thông báo lỗi" }
```

---

## BƯỚC 5: SERVICE (Frontend API Client)

### File location
```
src/services/tenTinhNangService.ts
```

### Pattern
```typescript
import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  TenBang,
  CreateTenBangDTO,
  TenBangFilters,
  TenBangListResponse,
} from '@/types/thread/tenTinhNang'

const BASE = '/api/ten-tinh-nang'

function buildQueryString(filters?: TenBangFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const tenTinhNangService = {
  async list(filters?: TenBangFilters): Promise<TenBangListResponse> {
    const response = await fetchApi<ApiResponse<TenBangListResponse>>(
      `${BASE}${buildQueryString(filters)}`
    )
    if (response.error) throw new Error(response.error)
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  },

  async getById(id: number): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}`)
    if (response.error || !response.data) throw new Error(response.error || 'Không tìm thấy')
    return response.data
  },

  async create(data: CreateTenBangDTO): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Không thể tạo')
    return response.data
  },

  async update(id: number, data: Partial<TenBang>): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Không thể cập nhật')
    return response.data
  },

  async delete(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })
    if (response.error) throw new Error(response.error)
  },
}
```

---

## BƯỚC 6: COMPOSABLE (State Management)

### File location
```
src/composables/[module]/useTenTinhNang.ts
```

### Pattern
```typescript
import { ref, computed } from 'vue'
import { tenTinhNangService } from '@/services/tenTinhNangService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  TenBang,
  CreateTenBangDTO,
  TenBangFilters,
} from '@/types/thread/tenTinhNang'

export function useTenTinhNang() {
  const items = ref<TenBang[]>([])
  const currentItem = ref<TenBang | null>(null)
  const total = ref(0)
  const filters = ref<TenBangFilters>({})
  const error = ref<string | null>(null)

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = computed(() => loading.isLoading.value)

  const fetchList = async (newFilters?: TenBangFilters) => {
    try {
      if (newFilters) filters.value = { ...filters.value, ...newFilters }
      const result = await loading.withLoading(() =>
        tenTinhNangService.list(filters.value)
      )
      items.value = result.data
      total.value = result.total
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const fetchById = async (id: number) => {
    try {
      currentItem.value = await loading.withLoading(() =>
        tenTinhNangService.getById(id)
      )
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const create = async (data: CreateTenBangDTO) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.create(data)
      )
      snackbar.success('Tạo thành công')
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  const update = async (id: number, data: Partial<TenBang>) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.update(id, data)
      )
      snackbar.success('Cập nhật thành công')
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  const remove = async (id: number) => {
    try {
      await loading.withLoading(() => tenTinhNangService.delete(id))
      snackbar.success('Xóa thành công')
      await fetchList()
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  return {
    items,
    currentItem,
    total,
    filters,
    isLoading,
    error,
    fetchList,
    fetchById,
    create,
    update,
    remove,
  }
}
```

---

## BƯỚC 7: FRONTEND PAGE

### File location (file-based routing với unplugin-vue-router)
```
src/pages/[module]/ten-tinh-nang.vue        → Route: /[module]/ten-tinh-nang
src/pages/[module]/ten-tinh-nang/index.vue  → Route: /[module]/ten-tinh-nang
src/pages/[module]/ten-tinh-nang/[id].vue   → Route: /[module]/ten-tinh-nang/:id
```

### Page Structure Template

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTenTinhNang } from '@/composables/[module]/useTenTinhNang'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { PageHeader } from '@/components/ui/layout'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { QTableColumn } from 'quasar'

const router = useRouter()
const snackbar = useSnackbar()
const { confirmDelete } = useConfirm()

const {
  items,
  total,
  filters,
  isLoading,
  fetchList,
  create,
  update,
  remove,
} = useTenTinhNang()

// === TAB (nếu có nhiều tính năng con) ===
const activeTab = ref('main') // 'main' | 'history' | 'settings' ...

// === COLUMNS ===
const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: 'Tên', field: 'name', align: 'left', sortable: true },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'center' },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
]

// === DIALOG STATE ===
const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formData = ref({
  name: '',
  // ... other fields
})

// === METHODS ===
const openCreateDialog = () => {
  formMode.value = 'create'
  formData.value = { name: '' }
  showFormDialog.value = true
}

const openEditDialog = (item: any) => {
  formMode.value = 'edit'
  formData.value = { ...item }
  showFormDialog.value = true
}

const handleSubmit = async () => {
  if (formMode.value === 'create') {
    const result = await create(formData.value)
    if (result) {
      showFormDialog.value = false
      await fetchList()
    }
  } else {
    const result = await update(formData.value.id, formData.value)
    if (result) {
      showFormDialog.value = false
      await fetchList()
    }
  }
}

const handleDelete = async (item: any) => {
  const confirmed = await confirmDelete(
    `Bạn có chắc muốn xóa "${item.name}"?`
  )
  if (confirmed) {
    await remove(item.id)
  }
}

const handleRequest = (props: any) => {
  const { page, rowsPerPage } = props.pagination
  fetchList({ page, limit: rowsPerPage })
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <q-page padding>
    <!-- ==================== HEADER ==================== -->
    <PageHeader
      title="Tiêu Đề Trang"
      subtitle="Mô tả ngắn gọn"
    >
      <template #actions>
        <AppButton
          color="primary"
          icon="add"
          label="Thêm Mới"
          unelevated
          @click="openCreateDialog"
        />
      </template>
    </PageHeader>

    <!-- ==================== MAIN CONTENT ==================== -->
    <q-card flat bordered>

      <!-- TAB HEADER (nếu có nhiều tính năng) -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="main" label="Chính" icon="list" />
        <q-tab name="history" label="Lịch Sử" icon="history" />
      </q-tabs>

      <q-separator />

      <!-- TAB PANELS -->
      <q-tab-panels v-model="activeTab" animated>
        <!-- Panel: Main -->
        <q-tab-panel name="main">

          <!-- FILTERS -->
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-12 col-sm-4 col-md-3">
              <AppInput
                v-model="filters.search"
                label="Tìm kiếm"
                dense
                clearable
                @update:model-value="fetchList"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <AppSelect
                v-model="filters.status"
                label="Trạng thái"
                :options="statusOptions"
                dense
                clearable
                emit-value
                map-options
                @update:model-value="fetchList"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <DatePicker
                v-model="filters.from"
                label="Từ ngày"
                dense
              />
            </div>
          </div>

          <!-- DATA TABLE -->
          <DataTable
            :rows="items"
            :columns="columns"
            row-key="id"
            :loading="isLoading"
            :pagination="{
              page: filters.page || 1,
              rowsPerPage: filters.limit || 20,
              rowsNumber: total,
            }"
            @request="handleRequest"
          >
            <!-- Custom column slots -->
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.status === 'CONFIRMED' ? 'positive' : 'warning'"
                  :label="props.row.status"
                />
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap justify-center q-gutter-xs">
                  <q-btn
                    flat round dense size="sm"
                    icon="edit" color="primary"
                    @click.stop="openEditDialog(props.row)"
                  >
                    <q-tooltip>Sửa</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat round dense size="sm"
                    icon="delete" color="negative"
                    @click.stop="handleDelete(props.row)"
                  >
                    <q-tooltip>Xóa</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </DataTable>
        </q-tab-panel>

        <!-- Panel: History -->
        <q-tab-panel name="history">
          <!-- Nội dung tab lịch sử -->
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ==================== FORM DIALOG ==================== -->
    <q-dialog v-model="showFormDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ formMode === 'create' ? 'Thêm Mới' : 'Chỉnh Sửa' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <AppInput
              v-model="formData.name"
              label="Tên *"
              :rules="[(v: string) => !!v || 'Không được để trống']"
            />
            <!-- ... thêm fields ... -->
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Hủy" v-close-popup />
          <AppButton
            color="primary"
            :label="formMode === 'create' ? 'Tạo' : 'Cập Nhật'"
            unelevated
            :loading="isLoading"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
```

---

## QUY TẮC BẮT BUỘC

### UI Components - PHẢI dùng
| Component | Thay cho | Import |
|-----------|----------|--------|
| `AppInput` | `q-input` | `@/components/ui/inputs/AppInput.vue` |
| `AppSelect` | `q-select` | `@/components/ui/inputs/AppSelect.vue` |
| `AppButton` | `q-btn` (chính) | `@/components/ui/buttons/AppButton.vue` |
| `DataTable` | `q-table` | `@/components/ui/tables/DataTable.vue` |
| `DatePicker` | `input[type=date]` | `@/components/ui/pickers/DatePicker.vue` |
| `PageHeader` | Custom header | `@/components/ui/layout` |
| `AppCard` | `q-card` (tùy case) | `@/components/ui/cards` |

> **Ngoại lệ**: `q-btn` flat/round/dense cho action icons trong table rows thì dùng trực tiếp (vì AppButton dành cho buttons chính có label).

### Header Pattern
MỌI trang PHẢI có `PageHeader` với:
- `title`: Tiêu đề trang (bắt buộc)
- `subtitle`: Mô tả ngắn (tùy chọn)
- `showBack` + `backTo`: Nút quay lại cho trang chi tiết/con
- Slot `#actions`: Nút hành động chính (Thêm mới, Export...)

### Tab Layout Pattern
Khi trang có **≥2 tính năng con** (ví dụ: Tạo + Lịch sử):
```vue
<q-tabs v-model="activeTab" dense align="left" narrow-indicator>
  <q-tab name="tab1" label="Tab 1" icon="icon1" />
  <q-tab name="tab2" label="Tab 2" icon="icon2" />
</q-tabs>
<q-separator />
<q-tab-panels v-model="activeTab" animated>
  <q-tab-panel name="tab1">...</q-tab-panel>
  <q-tab-panel name="tab2">...</q-tab-panel>
</q-tab-panels>
```

Hỗ trợ tab từ URL query:
```typescript
const route = useRoute()
const activeTab = ref(route.query.tab === 'history' ? 'history' : 'main')
```

### Nút Thao Tác Pattern
Trong table rows, luôn dùng pattern:
```vue
<template #body-cell-actions="props">
  <q-td :props="props">
    <div class="row no-wrap justify-center q-gutter-xs">
      <q-btn flat round dense size="sm" icon="visibility" color="info"
        @click.stop="handleView(props.row)">
        <q-tooltip>Xem</q-tooltip>
      </q-btn>
      <q-btn flat round dense size="sm" icon="edit" color="primary"
        @click.stop="handleEdit(props.row)">
        <q-tooltip>Sửa</q-tooltip>
      </q-btn>
      <q-btn flat round dense size="sm" icon="delete" color="negative"
        @click.stop="handleDelete(props.row)">
        <q-tooltip>Xóa</q-tooltip>
      </q-btn>
    </div>
  </q-td>
</template>
```

### Định dạng ngày tháng - LUÔN DD/MM/YYYY
Mọi ngày tháng hiển thị trên UI PHẢI theo format **DD/MM/YYYY** (chuẩn Việt Nam).

**Helper function** — define trong mỗi page (hoặc utils nếu dùng nhiều):
```typescript
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
```

**Hoặc dùng Quasar date util:**
```typescript
import { date } from 'quasar'
const formatted = date.formatDate(dateStr, 'DD/MM/YYYY')
const formattedWithTime = date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
```

**Áp dụng trong table column:**
```vue
<template #body-cell-created_at="props">
  <q-td :props="props">
    {{ formatDate(props.row.created_at) }}
  </q-td>
</template>
```

**KHÔNG dùng:**
- `toLocaleDateString()` (output không nhất quán giữa các browser)
- `YYYY-MM-DD` (format ISO, chỉ dùng cho API/DB)
- `MM/DD/YYYY` (format Mỹ, không phải chuẩn VN)
- `input[type="date"]` → dùng `DatePicker` component (đã format DD/MM/YYYY sẵn)

### Thông báo - PHẢI tiếng Việt
```typescript
snackbar.success('Tạo thành công')
snackbar.error('Không thể tạo. Vui lòng thử lại')
snackbar.warning('Vui lòng điền đầy đủ thông tin')
```

### API - KHÔNG BAO GIỜ gọi Supabase trực tiếp từ Frontend
```
Frontend → fetchApi() → Hono API → supabaseAdmin → PostgreSQL
```

### Không thêm comment trong code
Code phải tự giải thích. Không thêm `//`, `/* */` hay docstring trừ khi thực sự cần thiết.

### Error Handling - dùng getErrorMessage()
LUÔN dùng utility có sẵn thay vì xử lý error thủ công:
```typescript
import { getErrorMessage } from '@/utils/errorMessages'

try {
  await someOperation()
} catch (err) {
  snackbar.error(getErrorMessage(err))
}
```

### Confirmation Dialogs - dùng useConfirm()
Khi cần xác nhận từ user (xóa, hành động nguy hiểm):
```typescript
import { useConfirm } from '@/composables/useConfirm'

const { confirmDelete, confirmWarning } = useConfirm()

const handleDelete = async (item: TenBang) => {
  const confirmed = await confirmDelete(item.name)
  if (!confirmed) return
  await remove(item.id)
}

const handleDangerAction = async () => {
  const confirmed = await confirmWarning('Hành động này không thể hoàn tác')
  if (!confirmed) return
  // ...
}
```

### Real-time Subscriptions - useRealtime()
Nếu tính năng cần cập nhật real-time (dashboard, danh sách live):
```typescript
import { useRealtime } from '@/composables/useRealtime'

const { subscribe, unsubscribeAll } = useRealtime()

onMounted(() => {
  subscribe({
    table: 'ten_bang',
    event: '*',
    filter: 'deleted_at=is.null',
  }, (payload) => {
    fetchList()
  })
})

onUnmounted(() => {
  unsubscribeAll()
})
```

### Route Guards - definePage meta
MỌI trang PHẢI có `definePage` để khai báo permissions:
```typescript
definePage({
  meta: {
    title: 'Tên Trang',
    permissions: ['module.action'],
  }
})
```

Các meta options:
```typescript
{
  public: true,                     // Không cần đăng nhập
  requiresAuth: true,               // Cần đăng nhập (default)
  requiresAdmin: true,              // Chỉ admin/root
  permissions: ['perm1', 'perm2'],  // OR logic (có 1 trong các quyền)
  allPermissions: ['p1', 'p2'],     // AND logic (phải có TẤT CẢ quyền)
  title: 'Tên hiển thị',
}
```

### Server-Side Pagination - @request handler
Khi dùng DataTable với dữ liệu lớn, PHẢI dùng server-side pagination:
```typescript
import type { QTableProps } from 'quasar'

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const handleRequest = async (props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) => {
  const { page, rowsPerPage } = props.pagination
  await fetchList({ page, limit: rowsPerPage })
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.rowsNumber = total.value
}
```

Template:
```vue
<DataTable
  v-model:pagination="pagination"
  :rows="items"
  :columns="columns"
  :loading="isLoading"
  row-key="id"
  @request="handleRequest"
/>
```

### Debounced Search - useDebounceFn
Khi có ô tìm kiếm, LUÔN debounce để tránh spam API:
```typescript
import { useDebounceFn } from '@vueuse/core'

const searchQuery = ref('')

const debouncedSearch = useDebounceFn(() => {
  fetchList({ search: searchQuery.value, page: 1 })
}, 300)

watch(searchQuery, () => debouncedSearch())
```

### Excel Export - ExcelJS
Khi tính năng cần xuất Excel, dùng dynamic import:
```typescript
const exportExcel = async () => {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Tên Sheet')

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên', key: 'name', width: 30 },
  ]

  items.value.forEach((item) => sheet.addRow(item))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ten-file-${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
```

Nút export trong PageHeader:
```vue
<template #actions>
  <AppButton outline color="positive" icon="file_download" label="Xuất Excel" @click="exportExcel" />
  <AppButton color="primary" icon="add" label="Thêm Mới" @click="openCreateDialog" />
</template>
```

### DatePicker Popup Pattern
Khi dùng DatePicker kết hợp input, dùng popup pattern:
```vue
<AppInput v-model="filters.from" label="Từ ngày" dense readonly>
  <template #append>
    <q-icon name="event" class="cursor-pointer">
      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
        <DatePicker v-model="filters.from" />
      </q-popup-proxy>
    </q-icon>
  </template>
</AppInput>
```

### Empty State - DataTable
DataTable hỗ trợ slot `#empty-action` cho trạng thái rỗng:
```vue
<DataTable ...>
  <template #empty-action>
    <AppButton color="primary" label="Tạo Mới" icon="add" @click="openCreateDialog" />
  </template>
</DataTable>
```

### Responsive Grid
LUÔN dùng responsive breakpoints:
```vue
<div class="row q-col-gutter-md">
  <!-- Full → Half → Third → Quarter -->
  <div class="col-12 col-sm-6 col-md-4 col-lg-3">...</div>
</div>
```

Filters toolbar pattern:
```vue
<div class="row q-col-gutter-sm q-mb-md">
  <div class="col-12 col-sm-4 col-md-3">
    <AppInput v-model="searchQuery" label="Tìm kiếm" dense clearable />
  </div>
  <div class="col-12 col-sm-4 col-md-3">
    <AppSelect v-model="filters.status" label="Trạng thái" dense clearable emit-value map-options :options="statusOptions" />
  </div>
  <div class="col-12 col-sm-4 col-md-3">
    <AppInput v-model="filters.from" label="Từ ngày" dense readonly>
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <DatePicker v-model="filters.from" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </AppInput>
  </div>
</div>
```

### Status Badge Pattern
Khi hiển thị trạng thái trong table, dùng color mapping:
```typescript
const statusColors: Record<string, string> = {
  DRAFT: 'grey',
  CONFIRMED: 'positive',
  CANCELLED: 'negative',
  PENDING: 'warning',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
}
```

```vue
<template #body-cell-status="props">
  <q-td :props="props">
    <q-badge
      :color="statusColors[props.row.status] || 'grey'"
      :label="statusLabels[props.row.status] || props.row.status"
    />
  </q-td>
</template>
```

### Form Validation Rules
Dùng `:rules` prop cho AppInput/AppSelect:
```vue
<AppInput
  v-model="formData.name"
  label="Tên *"
  :rules="[
    (v: string) => !!v || 'Không được để trống',
    (v: string) => v.length >= 2 || 'Tối thiểu 2 ký tự',
  ]"
/>

<AppInput
  v-model="formData.quantity"
  label="Số lượng *"
  type="number"
  :rules="[
    (v: number) => v > 0 || 'Phải lớn hơn 0',
  ]"
/>
```

### Number Formatting - chuẩn VN
Số lượng và tiền tệ hiển thị theo format Việt Nam:
```typescript
function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('vi-VN') + ' đ'
}
```

---

## BƯỚC 8: CHECKLIST TRƯỚC KHI HOÀN THÀNH

### Database & Backend
- [ ] Migration có `created_at`, `updated_at`, trigger
- [ ] Types frontend + backend khớp nhau
- [ ] Zod validation cho mọi input từ client
- [ ] Route đã đăng ký trong `server/index.ts`
- [ ] Service dùng `fetchApi()`, không dùng `fetch()` trực tiếp

### Frontend - State
- [ ] Composable có `useSnackbar()`, `useLoading()`
- [ ] Error handling dùng `getErrorMessage()` utility
- [ ] Xóa/hành động nguy hiểm dùng `useConfirm()`
- [ ] Search input có debounce (300ms)
- [ ] Real-time nếu cần (useRealtime)

### Frontend - UI
- [ ] Page có `PageHeader` với title + actions
- [ ] Dùng `AppInput`, `AppSelect`, `AppButton`, `DatePicker`
- [ ] Tab layout nếu có ≥2 tính năng con
- [ ] Action buttons trong table theo pattern chuẩn (flat round dense)
- [ ] Status badge với color mapping nếu có trạng thái
- [ ] DataTable có `#empty-action` slot
- [ ] Server-side pagination với `@request` handler
- [ ] Responsive grid (`col-12 col-sm-6 col-md-4`)
- [ ] DatePicker dùng popup pattern (icon + q-popup-proxy)
- [ ] Form validation dùng `:rules` prop

### Quy tắc chung
- [ ] Mọi thông báo bằng tiếng Việt
- [ ] Ngày tháng hiển thị đúng DD/MM/YYYY (không dùng toLocaleDateString)
- [ ] Số lượng format theo chuẩn VN (toLocaleString('vi-VN'))
- [ ] `definePage` meta có permissions phù hợp
- [ ] Không có comment thừa trong code
- [ ] File-based routing đúng (unplugin-vue-router)
- [ ] Excel export dùng ExcelJS (nếu cần xuất dữ liệu)

---

## THỨ TỰ THỰC HIỆN

```
1. Migration SQL        → Database schema
2. Types                → Shared type definitions
3. Validation           → Zod schemas
4. Backend Route        → Hono API + đăng ký trong index.ts
5. Service              → Frontend API client
6. Composable           → State management
7. Page                 → Vue page với đầy đủ UI
8. Test thủ công        → Verify full flow
```

Khi dùng multi-agent (task ảnh hưởng ≥3 layers):
- **db-agent**: Bước 1
- **backend-agent**: Bước 2, 3, 4
- **frontend-agent**: Bước 5, 6, 7
