<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Loại Chỉ
        </h1>
      </div>
      
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-sm justify-end">
          <div class="col-12 col-sm-6 col-md-5">
            <q-input
              v-model="searchQuery"
              placeholder="Tìm kiếm mã, tên, nhà cung cấp..."
              outlined
              dense
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          
          <div class="col-12 col-sm-auto">
            <q-btn
              color="primary"
              icon="add"
              label="Thêm Loại Chỉ"
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
      :rows="filteredThreadTypes"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :rows-per-page-options="[10, 25, 50, 100]"
      class="thread-type-table shadow-1"
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

      <!-- Color Column -->
      <template #body-cell-color="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-x-sm">
            <div
              v-if="props.row.color_code"
              class="color-indicator shadow-1"
              :style="{ backgroundColor: props.row.color_code }"
            />
            <span>{{ props.row.color || '---' }}</span>
          </div>
        </q-td>
      </template>

      <!-- Name Column with Inline Edit -->
      <template #body-cell-name="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <span class="q-mr-xs">{{ props.row.name }}</span>
            <q-btn
              flat
              round
              dense
              color="grey-6"
              icon="edit"
              size="xs"
              class="opacity-50"
            />
            <q-popup-edit
              v-model="props.row.name"
              auto-save
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val, initialVal) => handleInlineUpdate(props.row, 'name', val, initialVal)"
            >
              <q-input
                v-model="props.row.name"
                dense
                autofocus
                counter
                label="Tên loại chỉ"
              />
            </q-popup-edit>
          </div>
        </q-td>
      </template>

      <!-- Material Column with Inline Edit -->
      <template #body-cell-material="props">
        <q-td :props="props">
          <div class="row items-center no-wrap cursor-pointer">
            <q-badge
              outline
              color="secondary"
              class="text-capitalize"
            >
              {{ getMaterialLabel(props.row.material) }}
            </q-badge>
            <q-popup-edit
              v-model="props.row.material"
              auto-save
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val, initialVal) => handleInlineUpdate(props.row, 'material', val, initialVal)"
            >
              <q-select
                v-model="props.row.material"
                :options="materialOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                autofocus
                label="Chất liệu"
                popup-content-class="z-max"
              />
            </q-popup-edit>
          </div>
        </q-td>
      </template>

      <!-- Density Column with Inline Edit -->
      <template #body-cell-density_grams_per_meter="props">
        <q-td :props="props">
          <div class="row items-center justify-end no-wrap">
            <span class="font-mono">{{ props.value }}</span>
            <q-btn
              flat
              round
              dense
              color="grey-6"
              icon="edit"
              size="xs"
              class="q-ml-xs opacity-50"
            />
            <q-popup-edit
              v-model.number="props.row.density_grams_per_meter"
              auto-save
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val, initialVal) => handleInlineUpdate(props.row, 'density_grams_per_meter', val, initialVal)"
            >
              <q-input
                v-model.number="props.row.density_grams_per_meter"
                type="number"
                step="0.0001"
                dense
                autofocus
                label="Mật độ (g/m)"
              />
            </q-popup-edit>
          </div>
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
    <FormDialog
      v-model="formDialog.isOpen"
      :title="formDialog.mode === 'create' ? 'Thêm Loại Chỉ Mới' : 'Chỉnh Sửa Loại Chỉ'"
      :loading="loading"
      max-width="600px"
      @submit="handleSubmit"
      @cancel="closeFormDialog"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="formData.code"
            label="Mã Loại Chỉ"
            required
            :disable="formDialog.mode === 'edit'"
            placeholder="VD: P123"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="formData.name"
            label="Tên Loại Chỉ"
            required
            placeholder="VD: Polyester 40/2"
          />
        </div>
        
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="formData.color"
            label="Tên Màu"
            placeholder="VD: Trắng"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="formData.color_code"
            label="Mã Màu (HEX)"
            placeholder="#FFFFFF"
          >
            <template #append>
              <q-icon
                name="colorize"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-color v-model="formData.color_code" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>

        <div class="col-12 col-sm-6">
          <AppSelect
            v-model="formData.material"
            label="Chất Liệu"
            :options="materialOptions"
            required
            popup-content-class="z-max"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="formData.tex_number"
            label="Số Tex"
            type="number"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="formData.density_grams_per_meter"
            label="Mật độ (g/m)"
            type="number"
            required
            step="0.0001"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="formData.meters_per_cone"
            label="Mét mỗi ống (m/cone)"
            type="number"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model="formData.supplier"
            label="Nhà Cung Cấp"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="formData.reorder_level_meters"
            label="Mức tái đặt (m)"
            type="number"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="formData.lead_time_days"
            label="Thời gian giao hàng (ngày)"
            type="number"
          />
        </div>
        <div class="col-12 col-sm-6 flex items-center">
          <AppToggle
            v-model="formData.is_active"
            label="Đang hoạt động"
          />
        </div>
      </div>
    </FormDialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog
      v-model="deleteDialog.isOpen"
      persistent
    >
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar
            icon="warning"
            color="warning"
            text-color="white"
          />
          <span class="q-ml-sm text-h6">Xác nhận xóa</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Bạn có chắc chắn muốn xóa loại chỉ <strong>{{ deleteDialog.threadType?.code }} - {{ deleteDialog.threadType?.name }}</strong>?
          Thao tác này không thể hoàn tác.
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            v-close-popup
            flat
            label="Hủy"
            color="grey"
          />
          <q-btn
            v-close-popup
            unelevated
            label="Xóa"
            color="negative"
            :loading="loading"
            @click="handleDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialog.isOpen">
      <q-card
        v-if="detailDialog.threadType"
        style="width: 700px; max-width: 90vw"
      >
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Chi Tiết Loại Chỉ
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
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Mã loại chỉ
              </div>
              <div class="text-subtitle1 text-weight-medium">
                {{ detailDialog.threadType.code }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Tên loại chỉ
              </div>
              <div class="text-subtitle1 text-weight-medium">
                {{ detailDialog.threadType.name }}
              </div>
            </div>
            
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Màu sắc
              </div>
              <div class="row items-center q-gutter-x-sm">
                <div
                  v-if="detailDialog.threadType.color_code"
                  class="color-indicator shadow-1"
                  :style="{ backgroundColor: detailDialog.threadType.color_code }"
                />
                <div class="text-subtitle1">
                  {{ detailDialog.threadType.color || '---' }}
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Chất liệu
              </div>
              <div class="text-subtitle1">
                {{ getMaterialLabel(detailDialog.threadType.material) }}
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Mật độ (g/m)
              </div>
              <div class="text-subtitle1 font-mono">
                {{ detailDialog.threadType.density_grams_per_meter }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Số Tex
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.threadType.tex_number || '---' }}
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Mét mỗi ống
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.threadType.meters_per_cone ? detailDialog.threadType.meters_per_cone.toLocaleString() + ' m' : '---' }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Nhà cung cấp
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.threadType.supplier || '---' }}
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Mức tái đặt
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.threadType.reorder_level_meters.toLocaleString() }} m
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">
                Thời gian giao hàng
              </div>
              <div class="text-subtitle1">
                {{ detailDialog.threadType.lead_time_days }} ngày
              </div>
            </div>

            <div class="col-12">
              <q-separator q-my-sm />
              <div class="row justify-between items-center">
                <div>
                  <div class="text-caption text-grey-7">
                    Trạng thái
                  </div>
                  <q-badge :color="detailDialog.threadType.is_active ? 'positive' : 'negative'">
                    {{ detailDialog.threadType.is_active ? 'Hoạt động' : 'Ngừng' }}
                  </q-badge>
                </div>
                <div class="text-right">
                  <div class="text-caption text-grey-7 italic">
                    Ngày tạo: {{ new Date(detailDialog.threadType.created_at).toLocaleDateString('vi-VN') }}
                  </div>
                </div>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { type QTableColumn } from 'quasar'
import { useThreadTypes, useSnackbar } from '@/composables'
import { ThreadMaterial } from '@/types/thread/enums'
import type { ThreadType, ThreadTypeFormData } from '@/types/thread/thread-type'

// Composables
const snackbar = useSnackbar()
const {
  threadTypes,
  loading,
  fetchThreadTypes,
  createThreadType,
  updateThreadType,
  deleteThreadType,
} = useThreadTypes()

// Local State
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'code',
  descending: false,
})

// Options
const materialOptions = [
  { label: 'Polyester', value: 'polyester' },
  { label: 'Cotton', value: 'cotton' },
  { label: 'Nylon', value: 'nylon' },
  { label: 'Silk', value: 'silk' },
  { label: 'Rayon', value: 'rayon' },
  { label: 'Hỗn hợp', value: 'mixed' },
]

const getMaterialLabel = (value: string) => {
  return materialOptions.find(opt => opt.value === value)?.label || value
}

// Table Configuration
const columns: QTableColumn[] = [
  {
    name: 'code',
    label: 'Mã Loại',
    field: 'code',
    align: 'left',
    sortable: true,
    required: true,
  },
  {
    name: 'name',
    label: 'Tên Loại Chỉ',
    field: 'name',
    align: 'left',
    sortable: true,
    required: true,
  },
  {
    name: 'color',
    label: 'Màu Sắc',
    field: 'color',
    align: 'left',
    sortable: true,
  },
  {
    name: 'material',
    label: 'Chất Liệu',
    field: 'material',
    align: 'left',
    sortable: true,
  },
  {
    name: 'density_grams_per_meter',
    label: 'Mật độ (g/m)',
    field: 'density_grams_per_meter',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toFixed(4),
  },
  {
    name: 'reorder_level_meters',
    label: 'Mức tái đặt (m)',
    field: 'reorder_level_meters',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toLocaleString(),
  },
  {
    name: 'is_active',
    label: 'Trạng Thái',
    field: 'is_active',
    align: 'center',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Thao Tác',
    field: 'actions',
    align: 'center',
  },
]

// Computed Data
const filteredThreadTypes = computed(() => {
  if (!searchQuery.value.trim()) {
    return threadTypes.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return threadTypes.value.filter((type) =>
    type.code.toLowerCase().includes(query) ||
    type.name.toLowerCase().includes(query) ||
    type.supplier?.toLowerCase().includes(query) ||
    type.color?.toLowerCase().includes(query)
  )
})

// Watchers
watch(searchQuery, () => {
  pagination.value.page = 1
})

// Dialog States
const formDialog = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  id: null as number | null,
})

const deleteDialog = reactive({
  isOpen: false,
  threadType: null as ThreadType | null,
})

const detailDialog = reactive({
  isOpen: false,
  threadType: null as ThreadType | null,
})

// Form Data
const formData = reactive<ThreadTypeFormData>({
  code: '',
  name: '',
  color: '',
  color_code: '',
  material: ThreadMaterial.POLYESTER,
  tex_number: undefined,
  density_grams_per_meter: 0,
  meters_per_cone: undefined,
  supplier: '',
  reorder_level_meters: 1000,
  lead_time_days: 7,
  is_active: true,
})

// Lifecycle
onMounted(async () => {
  await fetchThreadTypes()
})

// Methods
const openAddDialog = () => {
  formDialog.mode = 'create'
  formDialog.id = null
  resetFormData()
  formDialog.isOpen = true
}

const openEditDialog = (type: ThreadType) => {
  formDialog.mode = 'edit'
  formDialog.id = type.id
  Object.assign(formData, {
    code: type.code,
    name: type.name,
    color: type.color || '',
    color_code: type.color_code || '',
    material: type.material,
    tex_number: type.tex_number,
    density_grams_per_meter: type.density_grams_per_meter,
    meters_per_cone: type.meters_per_cone,
    supplier: type.supplier || '',
    reorder_level_meters: type.reorder_level_meters,
    lead_time_days: type.lead_time_days,
    is_active: type.is_active,
  })
  formDialog.isOpen = true
}

const resetFormData = () => {
  Object.assign(formData, {
    code: '',
    name: '',
    color: '',
    color_code: '',
    material: ThreadMaterial.POLYESTER,
    tex_number: undefined,
    density_grams_per_meter: 0,
    meters_per_cone: undefined,
    supplier: '',
    reorder_level_meters: 1000,
    lead_time_days: 7,
    is_active: true,
  })
}

const closeFormDialog = () => {
  formDialog.isOpen = false
  resetFormData()
}

const handleSubmit = async () => {
  if (!formData.code.trim() || !formData.name.trim() || formData.density_grams_per_meter <= 0) {
    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc và mật độ hợp lệ')
    return
  }

  let result: ThreadType | null = null

  if (formDialog.mode === 'create') {
    result = await createThreadType({ ...formData })
  } else if (formDialog.id) {
    result = await updateThreadType(formDialog.id, { ...formData })
  }

  if (result) {
    closeFormDialog()
  }
}

const handleInlineUpdate = async (row: ThreadType, field: keyof ThreadTypeFormData, val: any, initialVal: any) => {
  if (val === initialVal) return

  // Create a copy of the row with the updated value for calculation/payload
  const updatedData = { ...row, [field]: val }
  
  // Prepare payload based on ThreadTypeFormData
  const payload: ThreadTypeFormData = {
    code: updatedData.code,
    name: updatedData.name,
    color: updatedData.color || undefined,
    color_code: updatedData.color_code || undefined,
    material: updatedData.material,
    tex_number: updatedData.tex_number || undefined,
    density_grams_per_meter: updatedData.density_grams_per_meter,
    meters_per_cone: updatedData.meters_per_cone || undefined,
    supplier: updatedData.supplier || undefined,
    reorder_level_meters: updatedData.reorder_level_meters,
    lead_time_days: updatedData.lead_time_days,
    is_active: updatedData.is_active,
  }

  const success = await updateThreadType(row.id, payload)
  if (!success) {
    // Revert value on failure
    row[field] = initialVal as never
  }
}

const confirmDelete = (type: ThreadType) => {
  deleteDialog.threadType = type
  deleteDialog.isOpen = true
}

const handleDelete = async () => {
  if (deleteDialog.threadType) {
    const success = await deleteThreadType(deleteDialog.threadType.id)
    if (success) {
      deleteDialog.isOpen = false
      deleteDialog.threadType = null
    }
  }
}

const openDetailDialog = (type: ThreadType) => {
  detailDialog.threadType = type
  detailDialog.isOpen = true
}

const editFromDetail = () => {
  if (detailDialog.threadType) {
    const type = { ...detailDialog.threadType }
    detailDialog.isOpen = false
    openEditDialog(type)
  }
}
</script>

<style scoped lang="scss">
.thread-type-table {
  :deep(.q-table__top) {
    padding: 0;
  }
}

.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.opacity-50 {
  opacity: 0.5;
}

.font-mono {
  font-family: monospace;
}
</style>
