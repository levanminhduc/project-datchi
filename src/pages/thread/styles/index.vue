<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Mã Hàng
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Quản lý danh sách mã hàng và định mức chỉ
        </p>
      </div>
      
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-sm justify-end items-center">
          <!-- Search Input -->
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="searchQuery"
              placeholder="Tìm mã hàng, tên..."
              outlined
              dense
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          
          <!-- Fabric Type Filter -->
          <div class="col-12 col-sm-3 col-md-2">
            <q-select
              v-model="filterFabricType"
              :options="fabricTypeOptions"
              label="Loại vải"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          
          <div class="col-12 col-sm-auto">
            <q-btn
              color="primary"
              icon="add"
              label="Thêm mã hàng"
              unelevated
              class="full-width-xs"
              @click="openAddDialog"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="filteredStyles"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :rows-per-page-options="[10, 25, 50, 100]"
      class="styles-table shadow-1"
    >
      <!-- Loading Skeleton -->
      <template #loading>
        <q-inner-loading showing>
          <q-spinner-dots
            size="50px"
            color="primary"
          />
        </q-inner-loading>
      </template>

      <!-- Style Code Column with Avatar -->
      <template #body-cell-style_code="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-avatar
              size="32px"
              color="primary"
              text-color="white"
              class="q-mr-sm text-weight-bold"
            >
              {{ getInitials(props.row.style_code) }}
            </q-avatar>
            <div>
              <div class="text-weight-medium">
                {{ props.row.style_code }}
              </div>
              <div class="text-caption text-grey-6">
                {{ props.row.style_name }}
              </div>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Fabric Type Column -->
      <template #body-cell-fabric_type="props">
        <q-td
          :props="props"
          align="center"
        >
          <q-badge
            v-if="props.row.fabric_type"
            color="blue-grey"
            outline
          >
            {{ props.row.fabric_type }}
          </q-badge>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <!-- Description Column -->
      <template #body-cell-description="props">
        <q-td :props="props">
          <div
            v-if="props.row.description"
            class="ellipsis"
            style="max-width: 200px"
          >
            {{ props.row.description }}
            <q-tooltip v-if="props.row.description.length > 30">
              {{ props.row.description }}
            </q-tooltip>
          </div>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <!-- Created At Column -->
      <template #body-cell-created_at="props">
        <q-td :props="props">
          {{ formatDate(props.row.created_at) }}
        </q-td>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="props">
        <q-td
          :props="props"
          class="q-gutter-x-sm"
        >
          <q-btn
            flat
            round
            color="primary"
            icon="visibility"
            size="sm"
            @click="viewStyle(props.row.id)"
          >
            <q-tooltip>Xem chi tiết & Định mức</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            color="blue"
            icon="edit"
            size="sm"
            @click="openEditDialog(props.row)"
          >
            <q-tooltip>Chỉnh sửa</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            color="negative"
            icon="delete"
            size="sm"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Xóa</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog
      v-model="formDialog.isOpen"
      persistent
    >
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ formDialog.mode === 'create' ? 'Thêm Mã Hàng' : 'Chỉnh Sửa Mã Hàng' }}
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-card-section>
          <q-form
            class="row q-col-gutter-md"
            @submit.prevent="handleSubmit"
          >
            <!-- Style Code -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="formData.style_code"
                label="Mã hàng"
                outlined
                :disable="formDialog.mode === 'edit'"
                :rules="[(v: string) => !!v || 'Vui lòng nhập mã hàng']"
                hint="Mã định danh duy nhất"
              />
            </div>

            <!-- Style Name -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="formData.style_name"
                label="Tên mã hàng"
                outlined
                :rules="[(v: string) => !!v || 'Vui lòng nhập tên']"
              />
            </div>

            <!-- Fabric Type -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="formData.fabric_type"
                label="Loại vải"
                outlined
              />
            </div>

            <!-- Description -->
            <div class="col-12">
              <q-input
                v-model="formData.description"
                label="Mô tả"
                outlined
                type="textarea"
                rows="2"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-px-md q-pb-md"
        >
          <q-btn
            v-close-popup
            flat
            label="Hủy"
            color="grey"
          />
          <q-btn
            unelevated
            :label="formDialog.mode === 'create' ? 'Tạo' : 'Lưu'"
            color="primary"
            :loading="isLoading"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStyles } from '@/composables/thread/useStyles'
import { useConfirm } from '@/composables/useConfirm'
import type { Style, CreateStyleDTO, UpdateStyleDTO } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
  }
})

// Router
const router = useRouter()

// Composables
const { styles, isLoading, fetchStyles, createStyle, updateStyle, deleteStyle } = useStyles()
const { confirm } = useConfirm()

// State
const searchQuery = ref('')
const filterFabricType = ref<string | null>(null)
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'style_code',
  descending: false,
})

// Fabric type options (will be populated from data)
const fabricTypeOptions = computed(() => {
  const types = new Set<string>()
  styles.value.forEach(s => {
    if (s.fabric_type) {
      types.add(s.fabric_type)
    }
  })
  return Array.from(types).map(t => ({ label: t, value: t }))
})

// Table columns
const columns = [
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' as const, sortable: true },
  { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' as const, sortable: true },
  { name: 'fabric_type', label: 'Loại vải', field: 'fabric_type', align: 'center' as const },
  { name: 'description', label: 'Mô tả', field: 'description', align: 'left' as const },
  { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

// Helpers
function getInitials(code: string): string {
  if (!code) return '?'
  return code.substring(0, 2).toUpperCase()
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Computed
const filteredStyles = computed(() => {
  let result = styles.value

  // Filter by fabric type
  if (filterFabricType.value) {
    result = result.filter((s) => s.fabric_type === filterFabricType.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((s) =>
      s.style_code.toLowerCase().includes(query) ||
      s.style_name.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    )
  }

  return result
})

// Watchers
watch([searchQuery, filterFabricType], () => {
  pagination.value.page = 1
})

// Dialog states
const formDialog = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  id: null as number | null,
})

interface StyleFormData {
  style_code: string
  style_name: string
  fabric_type: string
  description: string
}

const defaultFormData: StyleFormData = {
  style_code: '',
  style_name: '',
  fabric_type: '',
  description: '',
}

const formData = reactive<StyleFormData>({ ...defaultFormData })

// Methods
function resetFormData() {
  Object.assign(formData, { ...defaultFormData })
}

function openAddDialog() {
  formDialog.mode = 'create'
  formDialog.id = null
  resetFormData()
  formDialog.isOpen = true
}

function openEditDialog(style: Style) {
  if (!style) {
    console.error('[styles] openEditDialog: style is null or undefined')
    return
  }
  formDialog.mode = 'edit'
  formDialog.id = style.id
  Object.assign(formData, {
    style_code: style.style_code || '',
    style_name: style.style_name || '',
    fabric_type: style.fabric_type || '',
    description: style.description || '',
  })
  formDialog.isOpen = true
}

function viewStyle(id: number) {
  router.push(`/thread/styles/${id}`)
}

async function handleSubmit() {
  if (!formData.style_code.trim() || !formData.style_name.trim()) {
    return
  }

  const data: CreateStyleDTO | UpdateStyleDTO = {
    style_code: formData.style_code.trim().toUpperCase(),
    style_name: formData.style_name.trim(),
    fabric_type: formData.fabric_type?.trim() || undefined,
    description: formData.description?.trim() || undefined,
  }

  let result: Style | null = null

  if (formDialog.mode === 'create') {
    result = await createStyle(data as CreateStyleDTO)
  } else if (formDialog.id) {
    result = await updateStyle(formDialog.id, data as UpdateStyleDTO)
  }

  if (result) {
    formDialog.isOpen = false
    resetFormData()
  }
}

async function confirmDelete(style: Style) {
  const confirmed = await confirm({
    title: `Xóa mã hàng "${style.style_code}"?`,
    message: 'Mã hàng và tất cả định mức chỉ liên quan sẽ bị xóa. Thao tác này không thể hoàn tác.',
    ok: 'Xóa',
    type: 'warning',
  })

  if (confirmed) {
    await deleteStyle(style.id)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchStyles()
})
</script>

<style scoped>
.styles-table :deep(.q-table__top) {
  padding: 0;
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
