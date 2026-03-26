<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Màu Sắc
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Quản lý danh mục màu chuẩn cho loại chỉ
        </p>
      </div>
      
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-sm justify-end items-center">
          <!-- Search Input -->
          <div class="col-12 col-sm-6 col-md-4">
            <q-input
              v-model="searchQuery"
              placeholder="Tìm tên màu, mã hex..."
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
              color="primary"
              icon="add"
              label="Thêm Màu"
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
      :rows="filteredColors"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :rows-per-page-options="[10, 25, 50, 100]"
      class="colors-table shadow-1"
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

      <!-- Color Preview Column -->
      <template #body-cell-preview="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-x-sm">
            <div
              class="color-swatch shadow-1"
              :style="{ backgroundColor: props.row.hex_code }"
            />
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </div>
        </q-td>
      </template>

      <!-- Hex Code Column -->
      <template #body-cell-hex_code="props">
        <q-td :props="props">
          <code class="bg-grey-2 q-px-sm q-py-xs rounded-borders">
            {{ props.row.hex_code }}
          </code>
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
            color="teal"
            icon="local_shipping"
            size="sm"
            @click="openSuppliersDialog(props.row)"
          >
            <q-tooltip>Nhà cung cấp</q-tooltip>
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
            v-if="props.row.is_active"
            flat
            round
            color="negative"
            icon="block"
            size="sm"
            @click="confirmDeactivate(props.row)"
          >
            <q-tooltip>Ngừng sử dụng</q-tooltip>
          </q-btn>
          <q-btn
            v-else
            flat
            round
            color="positive"
            icon="check_circle"
            size="sm"
            @click="activateColor(props.row)"
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
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ formDialog.mode === 'create' ? 'Thêm Màu Mới' : 'Chỉnh Sửa Màu' }}
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
            class="q-gutter-md"
            @submit.prevent="handleSubmit"
          >
            <!-- Name -->
            <q-input
              v-model="formData.name"
              label="Tên màu"
              outlined
              :rules="[(v: string) => !!v || 'Vui lòng nhập tên màu']"
            />

            <!-- Hex Code with Color Picker -->
            <q-input
              v-model="formData.hex_code"
              label="Mã màu HEX"
              outlined
              mask="!#XXXXXX"
              :rules="[(v: string) => /^#[0-9A-Fa-f]{6}$/.test(v) || 'Mã màu không hợp lệ (VD: #FF0000)']"
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
                    <q-color
                      v-model="formData.hex_code"
                      format-model="hex"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
              <template #prepend>
                <div
                  class="color-swatch-small"
                  :style="{ backgroundColor: formData.hex_code }"
                />
              </template>
            </q-input>

            <!-- Pantone Code (Optional) -->
            <q-input
              v-model="formData.pantone_code"
              label="Mã Pantone (tùy chọn)"
              outlined
              placeholder="VD: 19-4052 TCX"
            />

            <!-- RAL Code (Optional) -->
            <q-input
              v-model="formData.ral_code"
              label="Mã RAL (tùy chọn)"
              outlined
              placeholder="VD: RAL 5002"
            />
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

    <!-- Suppliers Dialog -->
    <q-dialog
      v-model="suppliersDialog.isOpen"
      maximized
    >
      <q-card v-if="suppliersDialog.color">
        <q-card-section class="row items-center q-pb-none bg-primary text-white">
          <div class="row items-center q-gutter-x-sm">
            <div
              class="color-swatch shadow-1"
              :style="{ backgroundColor: suppliersDialog.color.hex_code }"
            />
            <div>
              <div class="text-h6">
                {{ suppliersDialog.color.name }}
              </div>
              <div class="text-caption">
                Quản lý nhà cung cấp cho màu này
              </div>
            </div>
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
            color="white"
          />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <!-- Add Supplier Section -->
          <div class="row q-col-gutter-md q-mb-lg items-end">
            <div class="col-12 col-sm-4">
              <SupplierSelector
                v-model="newLink.supplier_id"
                label="Chọn nhà cung cấp"
                :exclude-ids="linkedSupplierIds"
              />
            </div>
            <div class="col-6 col-sm-2">
              <q-input
                v-model.number="newLink.price_per_kg"
                label="Giá/kg (VND)"
                type="number"
                outlined
                dense
                :min="0"
              />
            </div>
            <div class="col-6 col-sm-2">
              <q-input
                v-model.number="newLink.min_order_qty"
                label="MOQ (kg)"
                type="number"
                outlined
                dense
                :min="1"
              />
            </div>
            <div class="col-12 col-sm-auto">
              <q-btn
                color="primary"
                icon="add"
                label="Thêm NCC"
                unelevated
                :disable="!newLink.supplier_id"
                :loading="linkLoading"
                @click="handleLinkSupplier"
              />
            </div>
          </div>

          <!-- Linked Suppliers Table -->
          <q-table
            flat
            bordered
            :rows="linkedSuppliers"
            :columns="supplierColumns"
            row-key="id"
            :loading="loadingSuppliers"
            :rows-per-page-options="[0]"
            hide-pagination
            class="shadow-1"
          >
            <template #loading>
              <q-inner-loading showing>
                <q-spinner-dots
                  size="40px"
                  color="primary"
                />
              </q-inner-loading>
            </template>

            <template #no-data>
              <div class="full-width text-center q-pa-lg text-grey-6">
                <q-icon
                  name="local_shipping"
                  size="48px"
                  class="q-mb-sm"
                />
                <div>Chưa có nhà cung cấp nào được liên kết</div>
              </div>
            </template>

            <!-- Supplier Column -->
            <template #body-cell-supplier="props">
              <q-td :props="props">
                <div class="row items-center no-wrap">
                  <q-avatar
                    size="32px"
                    color="teal"
                    text-color="white"
                    class="q-mr-sm"
                  >
                    {{ getInitials(props.row.supplier?.name || '') }}
                  </q-avatar>
                  <div>
                    <div class="text-weight-medium">
                      {{ props.row.supplier?.name }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ props.row.supplier?.code }}
                    </div>
                  </div>
                </div>
              </q-td>
            </template>

            <!-- Price Column (editable) -->
            <template #body-cell-price_per_kg="props">
              <q-td :props="props">
                <q-input
                  v-model.number="props.row.price_per_kg"
                  type="number"
                  dense
                  borderless
                  input-class="text-right"
                  :min="0"
                  suffix="₫"
                  @blur="handleUpdateLink(props.row)"
                />
              </q-td>
            </template>

            <!-- MOQ Column (editable) -->
            <template #body-cell-min_order_qty="props">
              <q-td :props="props">
                <q-input
                  v-model.number="props.row.min_order_qty"
                  type="number"
                  dense
                  borderless
                  input-class="text-right"
                  :min="1"
                  suffix="kg"
                  @blur="handleUpdateLink(props.row)"
                />
              </q-td>
            </template>

            <!-- Status Column -->
            <template #body-cell-is_active="props">
              <q-td
                :props="props"
                align="center"
              >
                <q-toggle
                  :model-value="props.row.is_active"
                  color="positive"
                  @update:model-value="toggleLinkActive(props.row, $event)"
                />
              </q-td>
            </template>

            <!-- Actions Column -->
            <template #body-cell-actions="props">
              <q-td
                :props="props"
                align="center"
              >
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="link_off"
                  size="sm"
                  @click="confirmUnlink(props.row)"
                >
                  <q-tooltip>Gỡ liên kết</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useColors } from '@/composables/thread/useColors'
import { useConfirm } from '@/composables/useConfirm'
import { useSnackbar } from '@/composables/useSnackbar'
import { colorService, type ColorSupplierLink } from '@/services/colorService'
import SupplierSelector from '@/components/ui/inputs/SupplierSelector.vue'
import type { Color, ColorFormData } from '@/types/thread/color'

// Composables
const { colors, loading, fetchColors, createColor, updateColor, deleteColor } = useColors()
const { confirm } = useConfirm()
const snackbar = useSnackbar()

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
  { name: 'preview', label: 'Màu', field: 'name', align: 'left' as const, sortable: true },
  { name: 'hex_code', label: 'Mã HEX', field: 'hex_code', align: 'left' as const },
  { name: 'pantone_code', label: 'Pantone', field: 'pantone_code', align: 'left' as const, format: (v: string | null) => v || '-' },
  { name: 'ral_code', label: 'RAL', field: 'ral_code', align: 'left' as const, format: (v: string | null) => v || '-' },
  { name: 'is_active', label: 'Trạng thái', field: 'is_active', align: 'center' as const },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const },
]

const supplierColumns = [
  { name: 'supplier', label: 'Nhà cung cấp', field: 'supplier', align: 'left' as const },
  { name: 'price_per_kg', label: 'Giá/kg', field: 'price_per_kg', align: 'right' as const },
  { name: 'min_order_qty', label: 'MOQ', field: 'min_order_qty', align: 'right' as const },
  { name: 'is_active', label: 'Hoạt động', field: 'is_active', align: 'center' as const },
  { name: 'actions', label: '', field: 'actions', align: 'center' as const },
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
const filteredColors = computed(() => {
  let result = colors.value

  // Filter by active status
  if (filterActive.value !== null) {
    result = result.filter((c) => c.is_active === filterActive.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.hex_code.toLowerCase().includes(query) ||
      c.pantone_code?.toLowerCase().includes(query) ||
      c.ral_code?.toLowerCase().includes(query)
    )
  }

  return result
})

const linkedSupplierIds = computed(() => {
  return linkedSuppliers.value.map(link => link.supplier_id)
})

// Watchers
watch([searchQuery, filterActive], () => {
  pagination.value.page = 1
})

// Dialog state
const formDialog = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  id: null as number | null,
})

const defaultFormData: ColorFormData = {
  name: '',
  hex_code: '#000000',
  pantone_code: '',
  ral_code: '',
}

const formData = reactive<ColorFormData>({ ...defaultFormData })

// Suppliers dialog state
const suppliersDialog = reactive({
  isOpen: false,
  color: null as Color | null,
})

const linkedSuppliers = ref<ColorSupplierLink[]>([])
const loadingSuppliers = ref(false)
const linkLoading = ref(false)
const newLink = reactive({
  supplier_id: null as number | null,
  price_per_kg: null as number | null,
  min_order_qty: null as number | null,
})

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

function openEditDialog(color: Color) {
  formDialog.mode = 'edit'
  formDialog.id = color.id
  Object.assign(formData, {
    name: color.name,
    hex_code: color.hex_code,
    pantone_code: color.pantone_code || '',
    ral_code: color.ral_code || '',
  })
  formDialog.isOpen = true
}

async function handleSubmit() {
  if (!formData.name.trim() || !formData.hex_code) {
    return
  }

  const data: ColorFormData = {
    name: formData.name.trim(),
    hex_code: formData.hex_code.toUpperCase(),
    pantone_code: formData.pantone_code?.trim() || undefined,
    ral_code: formData.ral_code?.trim() || undefined,
  }

  let result: Color | null = null

  if (formDialog.mode === 'create') {
    result = await createColor(data)
  } else if (formDialog.id) {
    result = await updateColor(formDialog.id, data)
  }

  if (result) {
    formDialog.isOpen = false
    resetFormData()
  }
}

async function confirmDeactivate(color: Color) {
  const confirmed = await confirm({
    title: `Ngừng sử dụng màu "${color.name}"?`,
    message: 'Màu này sẽ không còn khả dụng trong các form nhập liệu.',
    ok: 'Ngừng sử dụng',
    type: 'warning',
  })

  if (confirmed) {
    await deleteColor(color.id)
  }
}

async function activateColor(color: Color) {
  await updateColor(color.id, { is_active: true } as ColorFormData & { is_active: boolean })
}

// Suppliers dialog methods
async function openSuppliersDialog(color: Color) {
  suppliersDialog.color = color
  suppliersDialog.isOpen = true
  await loadLinkedSuppliers()
}

async function loadLinkedSuppliers() {
  if (!suppliersDialog.color) return
  
  loadingSuppliers.value = true
  try {
    linkedSuppliers.value = await colorService.getSuppliers(suppliersDialog.color.id)
  } catch (err) {
    snackbar.error('Lỗi khi tải danh sách nhà cung cấp')
    console.error(err)
  } finally {
    loadingSuppliers.value = false
  }
}

function resetNewLink() {
  newLink.supplier_id = null
  newLink.price_per_kg = null
  newLink.min_order_qty = null
}

async function handleLinkSupplier() {
  if (!suppliersDialog.color || !newLink.supplier_id) return

  linkLoading.value = true
  try {
    await colorService.linkSupplier(
      suppliersDialog.color.id,
      newLink.supplier_id,
      newLink.price_per_kg ?? undefined,
      newLink.min_order_qty ?? undefined
    )
    snackbar.success('Đã liên kết nhà cung cấp')
    resetNewLink()
    await loadLinkedSuppliers()
  } catch (err) {
    snackbar.error((err as Error).message || 'Lỗi khi liên kết nhà cung cấp')
  } finally {
    linkLoading.value = false
  }
}

async function handleUpdateLink(link: ColorSupplierLink) {
  if (!suppliersDialog.color) return

  try {
    await colorService.updateLink(suppliersDialog.color.id, link.id, {
      price_per_kg: link.price_per_kg,
      min_order_qty: link.min_order_qty,
    })
  } catch {
    snackbar.error('Lỗi khi cập nhật thông tin')
    await loadLinkedSuppliers() // Reload to revert
  }
}

async function toggleLinkActive(link: ColorSupplierLink, isActive: boolean) {
  if (!suppliersDialog.color) return

  try {
    await colorService.updateLink(suppliersDialog.color.id, link.id, {
      is_active: isActive,
    })
    link.is_active = isActive
    snackbar.success(isActive ? 'Đã kích hoạt' : 'Đã ngừng kích hoạt')
  } catch {
    snackbar.error('Lỗi khi cập nhật trạng thái')
  }
}

async function confirmUnlink(link: ColorSupplierLink) {
  const confirmed = await confirm({
    title: `Gỡ liên kết "${link.supplier?.name}"?`,
    message: 'Nhà cung cấp này sẽ không còn liên kết với màu này.',
    ok: 'Gỡ liên kết',
    type: 'warning',
  })

  if (confirmed && suppliersDialog.color) {
    try {
      await colorService.unlinkSupplier(suppliersDialog.color.id, link.id)
      snackbar.success('Đã gỡ liên kết nhà cung cấp')
      await loadLinkedSuppliers()
    } catch {
      snackbar.error('Lỗi khi gỡ liên kết')
    }
  }
}

// Lifecycle
onMounted(async () => {
  await fetchColors()
})
</script>

<style scoped>
.colors-table :deep(.q-table__top) {
  padding: 0;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.color-swatch-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
