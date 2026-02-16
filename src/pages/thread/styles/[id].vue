<template>
  <q-page padding>
    <!-- Header with back button -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.push('/thread/styles')"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Chi tiết Mã hàng
        </h1>
        <div
          v-if="selectedStyle"
          class="text-grey-6"
        >
          {{ selectedStyle.style_code }} - {{ selectedStyle.style_name }}
        </div>
      </div>
      <q-space />
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="row justify-center q-py-xl"
    >
      <q-spinner
        size="lg"
        color="primary"
      />
    </div>

    <!-- Content -->
    <template v-else-if="selectedStyle">
      <q-card
        flat
        bordered
      >
        <q-tabs
          v-model="activeTab"
          class="text-primary"
          align="left"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab
            name="info"
            label="Thông tin chung"
          />
          <q-tab
            name="specs"
            label="Định mức chỉ"
          />
          <q-tab
            name="colors"
            label="Định mức màu"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="activeTab"
          animated
        >
          <!-- Tab 1: Thông tin chung -->
          <q-tab-panel name="info">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.style_code"
                  label="Mã hàng"
                  outlined
                  dense
                  readonly
                  disable
                  hint="Mã hàng không thể thay đổi"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.style_name"
                  label="Tên mã hàng"
                  outlined
                  dense
                  :rules="[(val: string) => !!val || 'Vui lòng nhập tên mã hàng']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.fabric_type"
                  :options="fabricTypeOptions"
                  label="Loại vải"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.description"
                  label="Mô tả"
                  type="textarea"
                  outlined
                  dense
                  rows="3"
                />
              </div>
              <div class="col-12">
                <q-btn
                  color="primary"
                  icon="save"
                  label="Lưu thay đổi"
                  unelevated
                  :loading="isSaving"
                  @click="handleSave"
                />
              </div>
            </div>
          </q-tab-panel>

          <!-- Tab 2: Định mức chỉ -->
          <q-tab-panel name="specs">
            <div class="row q-mb-md items-center">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium">
                  Danh sách định mức chỉ
                </div>
                <div class="text-caption text-grey-6">
                  Định mức mét chỉ tiêu hao cho mỗi sản phẩm theo công đoạn
                </div>
              </div>
              <div class="col-auto row items-center q-gutter-sm">
                <q-toggle
                  v-model="addToTop"
                  label="Thêm đầu bảng"
                  dense
                  size="sm"
                  class="text-caption"
                />
                <q-btn
                  data-testid="spec-add-btn"
                  color="primary"
                  icon="add"
                  label="Thêm định mức"
                  unelevated
                  dense
                  :loading="isAddingRow"
                  @click="addEmptyRow()"
                />
              </div>
            </div>

            <q-table
              :rows="styleThreadSpecs"
              :columns="specColumns"
              row-key="id"
              flat
              bordered
              :loading="specsLoading"
              :pagination="{ rowsPerPage: 10 }"
            >
              <!-- Inline Edit: Process Name Column -->
              <template #body-cell-process_name="props">
                <q-td
                  :props="props"
                  data-testid="spec-cell-process"
                  class="cursor-pointer editable-cell"
                >
                  <q-spinner-dots
                    v-if="inlineEditLoading[getCellKey(props.row.id, 'process_name')]"
                    size="sm"
                    color="primary"
                  />
                  <template v-else>
                    <span class="cell-value">{{ props.row.process_name || '-' }}</span>
                    <q-icon
                      name="edit"
                      size="xs"
                      class="edit-hint q-ml-xs text-grey-5"
                    />
                    <q-popup-edit
                      v-slot="scope"
                      v-model="props.row.process_name"
                      buttons
                      label-set="Lưu"
                      label-cancel="Hủy"
                      @save="(val: string, initialVal: string) => handleInlineEdit(props.row.id, 'process_name', val, initialVal)"
                    >
                      <q-input
                        v-model="scope.value"
                        dense
                        autofocus
                        label="Tên công đoạn"
                        @keyup.enter="scope.set"
                      />
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>

              <!-- Inline Edit: Supplier Column (dropdown) -->
              <template #body-cell-supplier="props">
                <q-td
                  :props="props"
                  data-testid="spec-cell-supplier"
                  class="cursor-pointer editable-cell"
                >
                  <q-spinner-dots
                    v-if="inlineEditLoading[getCellKey(props.row.id, 'supplier_id')]"
                    size="sm"
                    color="primary"
                  />
                  <template v-else>
                    <span class="cell-value">{{ props.row.suppliers?.name || '-' }}</span>
                    <q-icon
                      name="edit"
                      size="xs"
                      class="edit-hint q-ml-xs text-grey-5"
                    />
                    <q-popup-edit
                      v-slot="scope"
                      v-model="props.row.supplier_id"
                      buttons
                      label-set="Lưu"
                      label-cancel="Hủy"
                      @save="(val: number | null, initialVal: number | null) => handleInlineEdit(props.row.id, 'supplier_id', val, initialVal)"
                    >
                      <q-select
                        v-model="scope.value"
                        :options="supplierOptions"
                        option-value="value"
                        option-label="label"
                        emit-value
                        map-options
                        dense
                        autofocus
                        label="Nhà cung cấp"
                        style="min-width: 200px"
                      />
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>

              <!-- Inline Edit: Tex Column (dropdown, filtered by row's supplier) -->
              <template #body-cell-tex="props">
                <q-td
                  :props="props"
                  data-testid="spec-cell-tex"
                  class="cursor-pointer editable-cell"
                >
                  <q-spinner-dots
                    v-if="inlineEditLoading[getCellKey(props.row.id, 'thread_type_id')]"
                    size="sm"
                    color="primary"
                  />
                  <template v-else>
                    <span class="cell-value">{{ props.row.thread_types?.tex_number || '-' }}</span>
                    <q-icon
                      name="edit"
                      size="xs"
                      class="edit-hint q-ml-xs text-grey-5"
                    />
                    <q-popup-edit
                      v-slot="scope"
                      v-model="props.row.thread_type_id"
                      buttons
                      label-set="Lưu"
                      label-cancel="Hủy"
                      @save="(val: number | null, initialVal: number | null) => handleInlineEdit(props.row.id, 'thread_type_id', val, initialVal)"
                    >
                      <q-select
                        v-model="scope.value"
                        :options="getTexOptionsForRow(props.row)"
                        option-value="value"
                        option-label="label"
                        emit-value
                        map-options
                        dense
                        autofocus
                        label="Tex"
                        style="min-width: 150px"
                        :disable="!props.row.supplier_id"
                        :hint="!props.row.supplier_id ? 'Chọn NCC trước' : ''"
                      />
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>

              <!-- Inline Edit: Meters Column -->
              <template #body-cell-meters="props">
                <q-td
                  :props="props"
                  data-testid="spec-cell-meters"
                  class="cursor-pointer editable-cell text-right"
                >
                  <q-spinner-dots
                    v-if="inlineEditLoading[getCellKey(props.row.id, 'meters_per_unit')]"
                    size="sm"
                    color="primary"
                  />
                  <template v-else>
                    <span class="cell-value">{{ props.row.meters_per_unit?.toFixed(2) || '-' }}</span>
                    <q-icon
                      name="edit"
                      size="xs"
                      class="edit-hint q-ml-xs text-grey-5"
                    />
                    <q-popup-edit
                      v-slot="scope"
                      v-model="props.row.meters_per_unit"
                      buttons
                      label-set="Lưu"
                      label-cancel="Hủy"
                      @save="(val: number, initialVal: number) => handleInlineEdit(props.row.id, 'meters_per_unit', val, initialVal)"
                    >
                      <q-input
                        v-model.number="scope.value"
                        type="number"
                        dense
                        autofocus
                        label="Mét/SP"
                        step="0.01"
                        @keyup.enter="scope.set"
                      />
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>

              <!-- Actions Column (delete only - edit is inline now) -->
              <template #body-cell-actions="props">
                <q-td
                  :props="props"
                  class="q-gutter-xs"
                >
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="handleDeleteSpec(props.row)"
                  >
                    <q-tooltip>Xóa</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
              <template #no-data>
                <div class="full-width row flex-center text-grey-6 q-py-lg">
                  <q-icon
                    name="info"
                    size="sm"
                    class="q-mr-sm"
                  />
                  Chưa có định mức chỉ nào được thiết lập
                </div>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- Tab 3: Định mức màu -->
          <q-tab-panel name="colors">
            <StyleColorSpecsTab
              :style-id="id"
              :specs="styleThreadSpecs"
              :thread-types="threadTypes"
              :colors="allColors"
              @go-to-specs="activeTab = 'specs'"
              @color-created="fetchColors"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <!-- Not found -->
    <div
      v-else
      class="text-center q-py-xl"
    >
      <q-icon
        name="error"
        size="xl"
        color="negative"
      />
      <p class="text-h6 text-grey-7 q-mt-md">
        Không tìm thấy mã hàng
      </p>
      <q-btn
        color="primary"
        label="Quay lại danh sách"
        unelevated
        @click="$router.push('/thread/styles')"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStyles, useStyleThreadSpecs, useConfirm, useSuppliers, useThreadTypes, useColors, useSnackbar } from '@/composables'
import StyleColorSpecsTab from '@/components/thread/StyleColorSpecsTab.vue'
import type { QTableColumn } from 'quasar'
import type { StyleThreadSpec } from '@/types/thread'

definePage({
  meta: { requiresAuth: true }
})

const route = useRoute('/thread/styles/[id]')
const router = useRouter()
const confirm = useConfirm()
const snackbar = useSnackbar()

const id = computed(() => Number(route.params.id))
const activeTab = ref('info')

// Inline edit state
const inlineEditLoading = ref<Record<string, boolean>>({})
const isAddingRow = ref(false)

// Add row position preference (localStorage)
const STORAGE_KEY = 'datchi_addRowPosition'
const addToTop = ref(false)

const getCellKey = (id: number, field: string): string => `${id}-${field}`

/**
 * Handle inline field edits via q-popup-edit
 * @param specId - Spec ID
 * @param field - Field name being edited
 * @param newValue - New value from popup edit
 * @param originalValue - Original value for rollback on error
 */
const handleInlineEdit = async (
  specId: number,
  field: 'process_name' | 'supplier_id' | 'thread_type_id' | 'meters_per_unit',
  newValue: string | number | null,
  originalValue: string | number | null
): Promise<void> => {
  // Skip if no change
  if (newValue === originalValue) return

  const cellKey = getCellKey(specId, field)
  inlineEditLoading.value[cellKey] = true

  try {
    // Optimistic update already applied by v-model
    const result = await updateSpec(specId, { [field]: newValue })

    if (!result) {
      // Revert on error - find spec and restore original value
      const spec = styleThreadSpecs.value.find(s => s.id === specId)
      if (spec) {
        ;(spec as Record<string, unknown>)[field] = originalValue
      }
    }
    // Success notification is handled by composable
  } catch {
    // Revert on error - composable already handles error notification
    const spec = styleThreadSpecs.value.find(s => s.id === specId)
    if (spec) {
      ;(spec as Record<string, unknown>)[field] = originalValue
    }
  } finally {
    inlineEditLoading.value[cellKey] = false
  }
}

/**
 * Add empty row to table via API
 * Creates a new spec with default values, user edits inline
 * Position (top/bottom) is controlled by addToTop preference
 */
const addEmptyRow = async (): Promise<void> => {
  if (!suppliers.value.length) {
    snackbar.warning('Chưa có nhà cung cấp. Vui lòng thêm NCC trước.')
    return
  }

  isAddingRow.value = true
  try {
    // Create with default values - first supplier, empty process name
    // Backend handles display_order based on add_to_top preference
    const defaultSupplier = suppliers.value[0]!
    const result = await createSpec({
      style_id: id.value,
      process_name: '',
      supplier_id: defaultSupplier.id,
      meters_per_unit: 0,
      add_to_top: addToTop.value,
    })

    if (result) {
      snackbar.info('Đã thêm dòng mới. Click vào ô để nhập dữ liệu.')
    }
  } catch {
    // Error notification handled by composable
  } finally {
    isAddingRow.value = false
  }
}

const supplierOptions = computed(() => 
  suppliers.value.map(s => ({ label: s.name, value: s.id }))
)

/**
 * Get tex options for inline edit based on row's supplier_id
 * Used by the inline q-popup-edit dropdown for tex column
 */
const getTexOptionsForRow = (row: StyleThreadSpec): { label: string; value: number }[] => {
  if (!row.supplier_id) return []
  return threadTypes.value
    .filter(t => t.supplier_id === row.supplier_id)
    .map(t => ({ label: `${t.tex_number}`, value: t.id }))
}
const isSaving = ref(false)

// Composables
const {
  selectedStyle,
  isLoading,
  fetchStyleById,
  updateStyle,
} = useStyles()

const {
  styleThreadSpecs,
  isLoading: specsLoading,
  fetchStyleThreadSpecs,
  deleteSpec,
  createSpec,
  updateSpec,
} = useStyleThreadSpecs()

const { colors: allColors, fetchColors } = useColors()

const { suppliers, fetchSuppliers } = useSuppliers()
const { threadTypes, fetchThreadTypes } = useThreadTypes()

// Form state
const form = ref({
  style_code: '',
  style_name: '',
  fabric_type: null as string | null,
  description: '',
})

// Fabric type options
const fabricTypeOptions = [
  { label: 'Cotton', value: 'Cotton' },
  { label: 'Polyester', value: 'Polyester' },
  { label: 'Blend', value: 'Blend' },
  { label: 'Khác', value: 'Other' },
]

// Table columns for specs
const specColumns: QTableColumn[] = [
  {
    name: 'process_name',
    label: 'Công đoạn',
    field: 'process_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'supplier',
    label: 'NCC',
    field: (row) => row.suppliers?.name,
    align: 'left',
    sortable: true,
  },
  {
    name: 'tex',
    label: 'Tex',
    field: (row) => row.thread_types?.tex_number,
    align: 'left',
    sortable: true,
  },
  {
    name: 'meters',
    label: 'Mét/SP',
    field: 'meters_per_unit',
    align: 'right',
    sortable: true,
  },
  // Notes column hidden - not in Excel spec from user
  {
    name: 'actions',
    label: 'Thao tác',
    field: 'actions',
    align: 'center',
  },
]

// Initialize form when style is loaded
watch(selectedStyle, (style) => {
  if (style) {
    form.value = {
      style_code: style.style_code,
      style_name: style.style_name,
      fabric_type: style.fabric_type,
      description: style.description || '',
    }
  }
}, { immediate: true })



// Load data on mount
onMounted(async () => {
  // Load add row position preference from localStorage
  const savedPosition = localStorage.getItem(STORAGE_KEY)
  addToTop.value = savedPosition === 'top'

  if (isNaN(id.value)) {
    router.push('/thread/styles')
    return
  }

  await Promise.all([
    fetchStyleById(id.value),
    fetchStyleThreadSpecs({ style_id: id.value }),
    fetchSuppliers(),
    fetchThreadTypes(),
    fetchColors(),
  ])
})

// Watch addToTop and persist to localStorage
watch(addToTop, (value) => {
  localStorage.setItem(STORAGE_KEY, value ? 'top' : 'bottom')
})

// Save style info
const handleSave = async () => {
  if (!form.value.style_name) {
    return
  }

  isSaving.value = true
  await updateStyle(id.value, {
    style_name: form.value.style_name,
    fabric_type: form.value.fabric_type || undefined,
    description: form.value.description || undefined,
  })
  isSaving.value = false
}

// Delete spec
const handleDeleteSpec = async (spec: StyleThreadSpec) => {
  const confirmed = await confirm.confirmDelete({
    itemName: spec.process_name,
  })

  if (confirmed) {
    await deleteSpec(spec.id)
    await fetchStyleThreadSpecs({ style_id: id.value })
  }
}
</script>

<style scoped>
/* Inline edit styles */
.editable-cell:hover .edit-hint {
  opacity: 1 !important;
}
.edit-hint {
  opacity: 0;
  transition: opacity 0.2s;
}
</style>
