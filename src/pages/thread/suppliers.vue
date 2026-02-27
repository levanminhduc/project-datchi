<template>
  <router-view v-slot="{ Component }">
    <component
      :is="Component"
      v-if="Component"
    />
    <q-page
      v-else
      padding
    >
      <!-- Page Header -->
      <div class="row q-col-gutter-md q-mb-lg items-center">
        <div class="col-12 col-md-4">
          <h1 class="text-h5 q-my-none text-weight-bold text-primary">
            Quản Lý Nhà Cung Cấp
          </h1>
          <p class="text-caption text-grey-7 q-mb-none">
            Quản lý danh sách nhà cung cấp nguyên vật liệu
          </p>
        </div>
      
        <div class="col-12 col-md-8">
          <div class="row q-col-gutter-sm justify-end items-center">
            <!-- Search Input -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model="searchQuery"
                placeholder="Tìm tên, mã, liên hệ..."
                outlined
                dense
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          
            <!-- Status Filter -->
            <div class="col-12 col-sm-3 col-md-2">
              <q-select
                v-model="filterActive"
                :options="activeOptions"
                label="Trạng thái"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
          
            <div class="col-12 col-sm-auto">
              <q-btn
                color="secondary"
                icon="upload"
                label="Import NCC-Tex"
                outline
                class="full-width-xs"
                @click="router.push('/thread/suppliers/import-tex')"
              />
            </div>

            <div class="col-12 col-sm-auto">
              <q-btn
                color="primary"
                icon="add"
                label="Thêm NCC"
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
        :rows="filteredSuppliers"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50, 100]"
        class="suppliers-table shadow-1"
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

        <!-- Name Column with Avatar -->
        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="32px"
                color="primary"
                text-color="white"
                class="q-mr-sm text-weight-bold"
              >
                {{ getInitials(props.row.name) }}
              </q-avatar>
              <div>
                <div class="text-weight-medium">
                  {{ props.row.name }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ props.row.code }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Contact Column -->
        <template #body-cell-contact="props">
          <q-td :props="props">
            <div v-if="props.row.contact_name || props.row.phone">
              <div v-if="props.row.contact_name">
                {{ props.row.contact_name }}
              </div>
              <div
                v-if="props.row.phone"
                class="text-caption text-grey-7"
              >
                <q-icon
                  name="phone"
                  size="xs"
                  class="q-mr-xs"
                />
                {{ props.row.phone }}
              </div>
            </div>
            <span
              v-else
              class="text-grey-5"
            >-</span>
          </q-td>
        </template>

        <!-- Lead Time Column -->
        <template #body-cell-lead_time_days="props">
          <q-td
            :props="props"
            align="center"
          >
            <q-badge
              color="blue-grey"
              outline
            >
              {{ props.row.lead_time_days }} ngày
            </q-badge>
          </q-td>
        </template>

        <!-- Status Column -->
        <template #body-cell-is_active="props">
          <q-td
            :props="props"
            align="center"
          >
            <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
              {{ props.row.is_active ? 'Hoạt động' : 'Ngừng' }}
            </q-badge>
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
              @click="openDetailDialog(props.row)"
            >
              <q-tooltip>Xem chi tiết</q-tooltip>
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
              color="purple"
              icon="palette"
              size="sm"
              @click="router.push(`/thread/suppliers/import-colors?supplier_id=${props.row.id}`)"
            >
              <q-tooltip>Import Màu</q-tooltip>
            </q-btn>
            <q-btn
              v-if="props.row.is_active"
              flat
              round
              color="negative"
              icon="block"
              size="sm"
              @click="confirmDeactivate(props.row)"
            >
              <q-tooltip>Ngừng hợp tác</q-tooltip>
            </q-btn>
            <q-btn
              v-else
              flat
              round
              color="positive"
              icon="check_circle"
              size="sm"
              @click="activateSupplier(props.row)"
            >
              <q-tooltip>Kích hoạt lại</q-tooltip>
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
              {{ formDialog.mode === 'create' ? 'Thêm Nhà Cung Cấp' : 'Chỉnh Sửa Nhà Cung Cấp' }}
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
              <!-- Code -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formData.code"
                  label="Mã nhà cung cấp"
                  outlined
                  :disable="formDialog.mode === 'edit'"
                  :rules="[(v: string) => !!v || 'Vui lòng nhập mã']"
                  hint="Mã định danh duy nhất"
                />
              </div>

              <!-- Name -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formData.name"
                  label="Tên nhà cung cấp"
                  outlined
                  :rules="[(v: string) => !!v || 'Vui lòng nhập tên']"
                />
              </div>

              <!-- Contact Name -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formData.contact_name"
                  label="Người liên hệ"
                  outlined
                />
              </div>

              <!-- Phone -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formData.phone"
                  label="Số điện thoại"
                  outlined
                  mask="#### ### ###"
                />
              </div>

              <!-- Email -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formData.email"
                  label="Email"
                  outlined
                  type="email"
                />
              </div>

              <!-- Lead Time -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="formData.lead_time_days"
                  label="Thời gian giao hàng (ngày)"
                  outlined
                  type="number"
                  :min="1"
                />
              </div>

              <!-- Address -->
              <div class="col-12">
                <q-input
                  v-model="formData.address"
                  label="Địa chỉ"
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
              :loading="loading"
              @click="handleSubmit"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Detail Dialog -->
      <q-dialog v-model="detailDialog.isOpen">
        <q-card
          v-if="detailDialog.supplier"
          style="width: 500px; max-width: 90vw"
        >
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">
              Chi Tiết Nhà Cung Cấp
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

          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <div class="row items-center q-mb-md">
                  <q-avatar
                    size="48px"
                    color="primary"
                    text-color="white"
                    class="q-mr-md text-h6 text-weight-bold"
                  >
                    {{ getInitials(detailDialog.supplier.name) }}
                  </q-avatar>
                  <div>
                    <div class="text-h6">
                      {{ detailDialog.supplier.name }}
                    </div>
                    <div class="text-caption text-grey-7">
                      {{ detailDialog.supplier.code }}
                    </div>
                  </div>
                  <q-space />
                  <q-badge
                    :color="detailDialog.supplier.is_active ? 'positive' : 'negative'"
                    class="q-ml-sm"
                  >
                    {{ detailDialog.supplier.is_active ? 'Hoạt động' : 'Ngừng' }}
                  </q-badge>
                </div>
              </div>

              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">
                  Người liên hệ
                </div>
                <div class="text-subtitle1">
                  {{ detailDialog.supplier.contact_name || '-' }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">
                  Số điện thoại
                </div>
                <div class="text-subtitle1">
                  {{ detailDialog.supplier.phone || '-' }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">
                  Email
                </div>
                <div class="text-subtitle1">
                  {{ detailDialog.supplier.email || '-' }}
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">
                  Thời gian giao hàng
                </div>
                <div class="text-subtitle1">
                  {{ detailDialog.supplier.lead_time_days }} ngày
                </div>
              </div>
              <div class="col-12">
                <div class="text-caption text-grey-7">
                  Địa chỉ
                </div>
                <div class="text-subtitle1">
                  {{ detailDialog.supplier.address || '-' }}
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-actions
            align="right"
            class="q-px-md q-pb-md"
          >
            <q-btn
              flat
              label="Chỉnh sửa"
              color="primary"
              icon="edit"
              @click="editFromDetail"
            />
            <q-btn
              v-close-popup
              unelevated
              label="Đóng"
              color="grey"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </router-view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSuppliers } from '@/composables/thread/useSuppliers'
import { useConfirm } from '@/composables/useConfirm'
import type { Supplier, SupplierFormData } from '@/types/thread/supplier'

// Composables
const router = useRouter()
const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
const { confirm } = useConfirm()

// State
const searchQuery = ref('')
const filterActive = ref<boolean | null>(null)
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'name',
  descending: false,
})

// Options
const activeOptions = [
  { label: 'Hoạt động', value: true },
  { label: 'Ngừng', value: false },
]

// Table columns
const columns = [
  { name: 'name', label: 'Nhà cung cấp', field: 'name', align: 'left' as const, sortable: true },
  { name: 'contact', label: 'Liên hệ', field: 'contact_name', align: 'left' as const },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, format: (v: string | null) => v || '-' },
  { name: 'lead_time_days', label: 'Giao hàng', field: 'lead_time_days', align: 'center' as const, sortable: true },
  { name: 'is_active', label: 'Trạng thái', field: 'is_active', align: 'center' as const },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

// Helpers
function getInitials(name: string): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Computed
const filteredSuppliers = computed(() => {
  let result = suppliers.value

  // Filter by active status
  if (filterActive.value !== null) {
    result = result.filter((s) => s.is_active === filterActive.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.contact_name?.toLowerCase().includes(query) ||
      s.phone?.includes(query) ||
      s.email?.toLowerCase().includes(query)
    )
  }

  return result
})

// Watchers
watch([searchQuery, filterActive], () => {
  pagination.value.page = 1
})

// Dialog states
const formDialog = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  id: null as number | null,
})

const detailDialog = reactive({
  isOpen: false,
  supplier: null as Supplier | null,
})

const defaultFormData: SupplierFormData = {
  code: '',
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  lead_time_days: 7,
}

const formData = reactive<SupplierFormData>({ ...defaultFormData })

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

function openEditDialog(supplier: Supplier) {
  if (!supplier) {
    console.error('[suppliers] openEditDialog: supplier is null or undefined')
    return
  }
  formDialog.mode = 'edit'
  formDialog.id = supplier.id
  Object.assign(formData, {
    code: supplier.code || '',
    name: supplier.name || '',
    contact_name: supplier.contact_name || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    lead_time_days: supplier.lead_time_days ?? 7,
  })
  formDialog.isOpen = true
}

function openDetailDialog(supplier: Supplier) {
  detailDialog.supplier = supplier
  detailDialog.isOpen = true
}

function editFromDetail() {
  if (detailDialog.supplier) {
    const supplier = { ...detailDialog.supplier }
    detailDialog.isOpen = false
    openEditDialog(supplier)
  }
}

async function handleSubmit() {
  if (!formData.code.trim() || !formData.name.trim()) {
    return
  }

  const data: SupplierFormData = {
    code: formData.code.trim().toUpperCase(),
    name: formData.name.trim(),
    contact_name: formData.contact_name?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    email: formData.email?.trim() || undefined,
    address: formData.address?.trim() || undefined,
    lead_time_days: formData.lead_time_days || 7,
  }

  let result: Supplier | null = null

  if (formDialog.mode === 'create') {
    result = await createSupplier(data)
  } else if (formDialog.id) {
    result = await updateSupplier(formDialog.id, data)
  }

  if (result) {
    formDialog.isOpen = false
    resetFormData()
  }
}

async function confirmDeactivate(supplier: Supplier) {
  const confirmed = await confirm({
    title: `Ngừng hợp tác với "${supplier.name}"?`,
    message: 'Nhà cung cấp này sẽ không còn khả dụng trong các form nhập liệu.',
    ok: 'Ngừng hợp tác',
    type: 'warning',
  })

  if (confirmed) {
    await deleteSupplier(supplier.id)
  }
}

async function activateSupplier(supplier: Supplier) {
  await updateSupplier(supplier.id, { is_active: true } as any)
}

// Lifecycle
onMounted(async () => {
  await fetchSuppliers()
})
</script>

<style scoped>
.suppliers-table :deep(.q-table__top) {
  padding: 0;
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
