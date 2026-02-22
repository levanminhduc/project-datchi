---
name: new-fe
description: Create frontend layer (Vue types, service, composable, list/detail pages, realtime, Excel export) for the Dat Chi Thread Inventory System. Use when adding new pages or frontend features.
---

# Skill: /new-fe

Tao frontend (types + service + composable + pages) cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-fe [mo ta]`, tuan thu TOAN BO huong dan ben duoi.

---

## BUOC 1: TYPES (Frontend Types)

### File location
```
src/types/thread/tenTinhNang.ts
```

### Template
```typescript
export enum TenStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface TenBang {
  id: number
  code: string
  name: string
  status: TenStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateTenBangDTO {
  code: string
  name: string
  notes?: string
}

export interface TenBangFilters {
  page?: number
  limit?: number
  search?: string
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

Export tu `src/types/thread/index.ts`:
```typescript
export * from './tenTinhNang'
```

---

## BUOC 2: SERVICE (Frontend API Client)

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
  if (filters.search) params.append('search', filters.search)
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
    if (response.error || !response.data) throw new Error(response.error || 'Khong tim thay')
    return response.data
  },

  async create(data: CreateTenBangDTO): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the tao')
    return response.data
  },

  async update(id: number, data: Partial<TenBang>): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the cap nhat')
    return response.data
  },

  async delete(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })
    if (response.error) throw new Error(response.error)
  },

  async confirm(id: number): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}/confirm`, {
      method: 'POST',
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the xac nhan')
    return response.data
  },

  async getOptions(parentId?: number): Promise<{ id: number; name: string }[]> {
    const qs = parentId ? `?parent_id=${parentId}` : ''
    const response = await fetchApi<ApiResponse<any[]>>(`${BASE}/options${qs}`)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },
}
```

---

## BUOC 3: COMPOSABLE (State Management)

### File location
```
src/composables/[module]/useTenTinhNang.ts
```

### Pattern - Instance-level state (default)
```typescript
import { ref, computed } from 'vue'
import { tenTinhNangService } from '@/services/tenTinhNangService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { createErrorHandler } from '@/utils/errorMessages'
import type {
  TenBang,
  CreateTenBangDTO,
  TenBangFilters,
} from '@/types/thread/tenTinhNang'

const MESSAGES = {
  CREATE_SUCCESS: 'Tao thanh cong',
  UPDATE_SUCCESS: 'Cap nhat thanh cong',
  DELETE_SUCCESS: 'Xoa thanh cong',
  CONFIRM_SUCCESS: 'Xac nhan thanh cong',
}

const getErrorMessage = createErrorHandler({
  duplicate: 'Ma da ton tai',
  notFound: 'Khong tim thay',
})

export function useTenTinhNang() {
  const items = ref<TenBang[]>([])
  const currentItem = ref<TenBang | null>(null)
  const total = ref(0)
  const filters = ref<TenBangFilters>({ page: 1, limit: 20 })

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = computed(() => loading.isLoading.value)

  const fetchList = async (newFilters?: Partial<TenBangFilters>) => {
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
      snackbar.success(MESSAGES.CREATE_SUCCESS)
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
      snackbar.success(MESSAGES.UPDATE_SUCCESS)
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  const remove = async (id: number) => {
    try {
      await loading.withLoading(() => tenTinhNangService.delete(id))
      snackbar.success(MESSAGES.DELETE_SUCCESS)
      await fetchList()
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const confirm = async (id: number) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.confirm(id)
      )
      snackbar.success(MESSAGES.CONFIRM_SUCCESS)
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  return {
    items,
    currentItem,
    total,
    filters,
    isLoading,
    fetchList,
    fetchById,
    create,
    update,
    remove,
    confirm,
  }
}
```

### Pattern - Module-level shared state (cho global state nhu auth, notifications)
```typescript
const state = ref<GlobalState>({ items: [] })
let initialized = false

export function useSharedState() {
  const init = async () => {
    if (initialized) return
    initialized = true
  }

  return {
    state: computed(() => state.value),
    init,
  }
}
```

---

## BUOC 4: LIST PAGE (index.vue)

### File location (file-based routing voi unplugin-vue-router)
```
src/pages/[module]/ten-tinh-nang/index.vue  -> Route: /[module]/ten-tinh-nang
```

### Template
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTenTinhNang } from '@/composables/[module]/useTenTinhNang'
import { usePermission } from '@/composables/usePermission'
import { PageHeader } from '@/components/ui/layout'
import SearchInput from '@/components/ui/inputs/SearchInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import IconButton from '@/components/ui/buttons/IconButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import DeleteDialog from '@/components/ui/dialogs/DeleteDialog.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { QTableColumn, QTableProps } from 'quasar'
import { date } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['ten_tinh_nang.view'],
    title: 'Tieu De Trang',
  }
})

const { can } = usePermission()
const canCreate = can('ten_tinh_nang.create')
const canEdit = can('ten_tinh_nang.edit')
const canDelete = can('ten_tinh_nang.delete')

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

const searchQuery = ref('')
const activeTab = ref('main')

const statusOptions = [
  { value: 'DRAFT', label: 'Nhap' },
  { value: 'CONFIRMED', label: 'Da xac nhan' },
  { value: 'CANCELLED', label: 'Da huy' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'grey',
  CONFIRMED: 'positive',
  CANCELLED: 'negative',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Nhap',
  CONFIRMED: 'Da xac nhan',
  CANCELLED: 'Da huy',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return date.formatDate(dateStr, 'DD/MM/YYYY')
}

const columns: QTableColumn[] = [
  { name: 'code', label: 'Ma', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Ten', field: 'name', align: 'left', sortable: true },
  { name: 'status', label: 'Trang thai', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngay tao', field: 'created_at', align: 'center' },
  { name: 'actions', label: 'Thao tac', field: 'actions', align: 'center' },
]

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formData = ref({ id: 0, code: '', name: '', notes: '' })

const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: number; name: string } | null>(null)

const openCreateDialog = () => {
  formMode.value = 'create'
  formData.value = { id: 0, code: '', name: '', notes: '' }
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

const openDeleteDialog = (item: any) => {
  deleteTarget.value = { id: item.id, name: item.name }
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  await remove(deleteTarget.value.id)
  showDeleteDialog.value = false
  deleteTarget.value = null
}

const handleRequest = async (props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) => {
  const { page, rowsPerPage } = props.pagination
  await fetchList({ page, limit: rowsPerPage })
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.rowsNumber = total.value
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Tieu De Trang"
      subtitle="Mo ta ngan gon"
    >
      <template #actions>
        <AppButton
          v-if="canCreate.value"
          color="primary"
          icon="add"
          label="Them Moi"
          @click="openCreateDialog"
        />
      </template>
    </PageHeader>

    <q-card flat bordered>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="main" label="Danh sach" icon="list" />
        <q-tab name="history" label="Lich su" icon="history" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="main">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-12 col-sm-4 col-md-3">
              <SearchInput
                v-model="searchQuery"
                @update:model-value="(v) => fetchList({ search: v, page: 1 })"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <AppSelect
                v-model="filters.status"
                label="Trang thai"
                :options="statusOptions"
                dense
                clearable
                @update:model-value="() => fetchList({ page: 1 })"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <AppInput v-model="filters.from" label="Tu ngay" dense readonly>
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

          <DataTable
            v-model:pagination="pagination"
            :rows="items"
            :columns="columns"
            row-key="id"
            :loading="isLoading"
            @request="handleRequest"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="statusColors[props.row.status] || 'grey'"
                  :label="statusLabels[props.row.status] || props.row.status"
                />
              </q-td>
            </template>

            <template #body-cell-created_at="props">
              <q-td :props="props">
                {{ formatDate(props.row.created_at) }}
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap justify-center q-gutter-xs">
                  <q-btn
                    v-if="canEdit.value"
                    flat round dense size="sm"
                    icon="edit" color="primary"
                    @click.stop="openEditDialog(props.row)"
                  >
                    <q-tooltip>Sua</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="canDelete.value"
                    flat round dense size="sm"
                    icon="delete" color="negative"
                    @click.stop="openDeleteDialog(props.row)"
                  >
                    <q-tooltip>Xoa</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>

            <template #empty-action>
              <AppButton
                v-if="canCreate.value"
                color="primary"
                label="Tao Moi"
                icon="add"
                @click="openCreateDialog"
              />
            </template>
          </DataTable>
        </q-tab-panel>

        <q-tab-panel name="history">
          <!-- Noi dung tab lich su -->
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <FormDialog
      v-model="showFormDialog"
      :title="formMode === 'create' ? 'Them Moi' : 'Chinh Sua'"
      :submit-text="formMode === 'create' ? 'Tao' : 'Cap Nhat'"
      :loading="isLoading"
      @submit="handleSubmit"
    >
      <div class="q-gutter-md">
        <AppInput
          v-model="formData.code"
          label="Ma *"
          :rules="[(v: string) => !!v || 'Khong duoc de trong']"
          :disable="formMode === 'edit'"
        />
        <AppInput
          v-model="formData.name"
          label="Ten *"
          :rules="[(v: string) => !!v || 'Khong duoc de trong']"
        />
        <AppInput
          v-model="formData.notes"
          label="Ghi chu"
          type="textarea"
          autogrow
        />
      </div>
    </FormDialog>

    <DeleteDialog
      v-model="showDeleteDialog"
      :item-name="deleteTarget?.name"
      :loading="isLoading"
      @confirm="handleDelete"
    />
  </q-page>
</template>
```

---

## BUOC 5: DETAIL PAGE ([id].vue)

### File location
```
src/pages/[module]/ten-tinh-nang/[id].vue  -> Route: /[module]/ten-tinh-nang/:id
```

### Template
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTenTinhNang } from '@/composables/[module]/useTenTinhNang'
import { PageHeader } from '@/components/ui/layout'
import { date } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['ten_tinh_nang.view'],
    title: 'Chi Tiet',
  }
})

const route = useRoute()
const itemId = computed(() => Number(route.params.id))

const { currentItem, isLoading, fetchById } = useTenTinhNang()

const activeTab = ref('info')

const statusColors: Record<string, string> = {
  DRAFT: 'grey',
  CONFIRMED: 'positive',
  CANCELLED: 'negative',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Nhap',
  CONFIRMED: 'Da xac nhan',
  CANCELLED: 'Da huy',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
}

onMounted(() => {
  fetchById(itemId.value)
})
</script>

<template>
  <q-page padding>
    <PageHeader
      :title="`Chi tiet: ${currentItem?.name || ''}`"
      showBack
      backTo="/[module]/ten-tinh-nang"
    >
      <template #actions>
        <q-badge
          v-if="currentItem"
          :color="statusColors[currentItem.status]"
          :label="statusLabels[currentItem.status]"
          class="text-body2 q-pa-sm"
        />
      </template>
    </PageHeader>

    <q-card flat bordered v-if="currentItem">
      <q-tabs v-model="activeTab" align="left" active-color="primary" narrow-indicator dense>
        <q-tab name="info" label="Thong tin" icon="info" />
        <q-tab name="history" label="Lich su" icon="history" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="info">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ma</div>
              <div class="text-body1">{{ currentItem.code }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ten</div>
              <div class="text-body1">{{ currentItem.name }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ngay tao</div>
              <div class="text-body1">{{ formatDate(currentItem.created_at) }}</div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="history">
          <!-- Audit log / change history -->
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-inner-loading :showing="isLoading" />
  </q-page>
</template>
```

---

## BUOC 6: REALTIME (neu can)

```typescript
import { useRealtime } from '@/composables/useRealtime'
import { onMounted, onUnmounted } from 'vue'

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

---

## BUOC 7: EXCEL EXPORT (neu can)

```typescript
const exportExcel = async () => {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Ten Sheet')

  sheet.columns = [
    { header: 'Ma', key: 'code', width: 15 },
    { header: 'Ten', key: 'name', width: 30 },
    { header: 'Trang thai', key: 'status', width: 15 },
    { header: 'Ngay tao', key: 'created_at', width: 15 },
  ]

  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  items.value.forEach((item) => {
    sheet.addRow({
      ...item,
      status: statusLabels[item.status] || item.status,
      created_at: formatDate(item.created_at),
    })
  })

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

Nut export trong PageHeader:
```vue
<template #actions>
  <AppButton variant="outlined" color="positive" icon="file_download" label="Xuat Excel" @click="exportExcel" />
  <AppButton color="primary" icon="add" label="Them Moi" @click="openCreateDialog" />
</template>
```

---

## UI COMPONENTS - PHAI dung

| Component | Thay cho | Import |
|-----------|----------|--------|
| `AppInput` | `q-input` | `@/components/ui/inputs/AppInput.vue` |
| `AppSelect` | `q-select` | `@/components/ui/inputs/AppSelect.vue` |
| `AppButton` | `q-btn` (chinh) | `@/components/ui/buttons/AppButton.vue` |
| `DataTable` | `q-table` | `@/components/ui/tables/DataTable.vue` |
| `DatePicker` | `input[type=date]` | `@/components/ui/pickers/DatePicker.vue` |
| `PageHeader` | Custom header | `@/components/ui/layout` |
| `FormDialog` | `q-dialog` (form) | `@/components/ui/dialogs/FormDialog.vue` |
| `DeleteDialog` | `q-dialog` (xoa) | `@/components/ui/dialogs/DeleteDialog.vue` |
| `SearchInput` | `AppInput` (tim kiem) | `@/components/ui/inputs/SearchInput.vue` |
| `IconButton` | `q-btn` (icon only) | `@/components/ui/buttons/IconButton.vue` |

> **Ngoai le**: `q-btn` flat/round/dense cho action icons trong table rows thi dung truc tiep (vi AppButton danh cho buttons chinh co label).

### AppInput props chinh
`modelValue, type, label, placeholder, outlined=true, dense, disable, readonly, required, clearable, debounce, autofocus, autogrow, maxlength, mask, loading, rules, errorMessage`
- `required=true` tu dong them rule "Truong nay la bat buoc"
- Slots: `append`, `prepend`, `before`, `after`

### AppSelect props chinh
`modelValue, options, optionValue='value', optionLabel='label', multiple, outlined=true, dense, disable, clearable, useInput, useChips, emitValue=true, mapOptions=true, loading, required, rules`
- `required=true` tu dong them rule "Vui long chon mot muc"
- Built-in filtering khi co `useInput`

### AppButton props chinh
`color='primary', size='md', variant='filled'|'flat'|'outlined'|'text', loading, disable, icon, iconRight, label, type='button', round, dense, block, noCaps=true`

### DataTable props chinh
`rows, columns, rowKey='id', loading, filter, pagination, selected, selection='none', rowsPerPageOptions=[10,25,50,100], emptyIcon='inbox', emptyTitle='Khong co du lieu'`
- Emits: `update:pagination`, `update:selected`, `request`, `rowClick`
- Slots: tat ca q-table slots + `#empty-action`

---

## QUY TAC CHUNG

### Cascading Selects Pattern
```typescript
watch(selectedParentId, async (newId) => {
  selectedChildId.value = null
  childOptions.value = []
  if (!newId) return
  const data = await service.getOptions(newId)
  childOptions.value = data.map(d => ({ value: d.id, label: d.name }))
})
```

### Thong bao - PHAI tieng Viet
```typescript
snackbar.success('Tao thanh cong')
snackbar.error('Khong the tao. Vui long thu lai')
snackbar.warning('Vui long dien day du thong tin')
```

### Dinh dang ngay thang - LUON DD/MM/YYYY
```typescript
import { date } from 'quasar'
const formatted = date.formatDate(dateStr, 'DD/MM/YYYY')
const formattedWithTime = date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
```

### So luong format - chuan VN
```typescript
value.toLocaleString('vi-VN')
value.toLocaleString('vi-VN') + ' d'
```

### Error Handling - dung getErrorMessage()
```typescript
import { getErrorMessage } from '@/utils/errorMessages'
snackbar.error(getErrorMessage(err))
```

### Confirmation - dung useConfirm()
```typescript
const { confirmDelete, confirmWarning } = useConfirm()
const confirmed = await confirmDelete(item.name)
```

### Permissions - dung usePermission()
```typescript
const { can, canAny, isAdmin } = usePermission()
const canEdit = can('resource.edit')
```

### API - KHONG BAO GIO goi Supabase truc tiep tu Frontend
```
Frontend -> fetchApi() -> Hono API -> supabaseAdmin -> PostgreSQL
```

### File structure conventions
```
src/composables/
  useXxx.ts              # generic composables
  thread/useXxx.ts       # domain composables
  index.ts               # barrel export

src/services/
  api.ts                 # fetchApi base
  xxxService.ts          # domain services
  index.ts               # barrel export

src/types/
  ui/                    # component prop types
  thread/                # domain types
  auth/                  # auth types
  index.ts               # barrel export

src/pages/
  [module]/              # domain pages
    ten-tinh-nang/
      index.vue          # list page
      [id].vue           # detail page

src/components/
  ui/                    # reusable UI components
    inputs/              # AppInput, AppSelect, SearchInput
    buttons/             # AppButton
    tables/              # DataTable
    dialogs/             # FormDialog, ConfirmDialog
    feedback/            # EmptyState
    layout/              # PageHeader
    pickers/             # DatePicker
    navigation/          # AppTabs, AppBreadcrumbs
  thread/                # domain-specific components
```

---

## MULTI-AGENT FE PARALLELIZATION

Khi task FE phuc tap, co the chia lam 2 agent:

| Agent | Nhiem vu | Files |
|-------|----------|-------|
| `fe-core` | Types + Service + Composable | `src/types/`, `src/services/`, `src/composables/` |
| `fe-page` | Pages + Realtime + Excel | `src/pages/`, components |

### Dependency ordering
```
fe-core (Types + Service + Composable) → HOAN THANH TRUOC
    ↓
fe-page (Pages, Realtime, Excel) → CHI BAT DAU SAU KHI fe-core xong
```

**Ly do:** Pages import tu composable, composable import tu service, service import tu types. Neu fe-page chay truoc khi fe-core xong → loi import.

**Khi nao chia:** Chi khi co >=3 pages hoac task FE co >=5 subtasks. Task don gian dung 1 agent.

---

## CHECKLIST TRUOC KHI HOAN THANH

### State
- [ ] Composable dung `useLoading().withLoading()` (KHONG manual loading)
- [ ] Error handling dung `getErrorMessage()` utility
- [ ] Xoa/hanh dong nguy hiem dung `useConfirm()`
- [ ] Search dung `SearchInput` component (built-in debounce 300ms)
- [ ] Service dung `fetchApi()`, method `PUT` cho update
- [ ] Service dung `buildQueryString()` helper

### UI
- [ ] `definePage` meta co permissions phu hop
- [ ] Page co `PageHeader` voi title + actions
- [ ] Dung `AppInput`, `AppSelect`, `AppButton`, `DatePicker`
- [ ] Tab layout neu co >=2 tinh nang con
- [ ] Action buttons trong table: `q-btn flat round dense size="sm"` + `q-tooltip`
- [ ] Status badge voi color mapping
- [ ] DataTable co `#empty-action` slot
- [ ] Server-side pagination voi `@request` handler + `v-model:pagination`
- [ ] Responsive grid (`col-12 col-sm-6 col-md-4`)
- [ ] DatePicker dung popup pattern (icon + q-popup-proxy)
- [ ] Form validation dung `:rules` prop
- [ ] Permission checks: `v-if="canEdit.value"` cho action buttons
- [ ] Detail page co back button (`showBack` + `backTo`)

### Quy tac chung
- [ ] Moi thong bao (success, error, toast) bang tieng Viet
- [ ] Ngay thang format `DD/MM/YYYY` (dung `date.formatDate` tu quasar)
- [ ] So luong format `toLocaleString('vi-VN')`
- [ ] Khong co comment thua trong code
- [ ] File-based routing dung (unplugin-vue-router)
- [ ] Excel export dung ExcelJS (neu can xuat du lieu)
