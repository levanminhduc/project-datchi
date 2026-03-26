<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 750px; max-width: 95vw">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div>
          <div class="text-h6">
            Nhà Cung Cấp
          </div>
          <div class="text-caption text-grey-7">
            {{ threadType?.code }} - {{ threadType?.name }}
          </div>
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

      <!-- Supplier List -->
      <q-card-section>
        <q-table
          flat
          bordered
          dense
          :rows="suppliers"
          :columns="supplierColumns"
          row-key="id"
          :loading="loading"
          hide-pagination
          :rows-per-page-options="[0]"
          class="suppliers-table"
        >
          <!-- Loading -->
          <template #loading>
            <q-inner-loading showing>
              <q-spinner-dots
                size="40px"
                color="primary"
              />
            </q-inner-loading>
          </template>

          <!-- Supplier Name Column -->
          <template #body-cell-supplier="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-avatar
                  size="24px"
                  color="primary"
                  text-color="white"
                  class="q-mr-xs text-caption text-weight-bold"
                >
                  {{ getInitials(props.row.supplier?.name) }}
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

          <!-- Supplier Item Code - Inline Editable -->
          <template #body-cell-supplier_item_code="props">
            <q-td :props="props">
              <div class="row items-center no-wrap cursor-pointer">
                <span>{{ props.row.supplier_item_code || '-' }}</span>
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
                  v-model="props.row.supplier_item_code"
                  auto-save
                  buttons
                  label-set="Lưu"
                  label-cancel="Hủy"
                  @save="(val: string) => handleInlineUpdate(props.row.id, 'supplier_item_code', val)"
                >
                  <q-input
                    v-model="props.row.supplier_item_code"
                    dense
                    autofocus
                    label="Mã hàng NCC"
                    hint="Mã sản phẩm của nhà cung cấp"
                  />
                </q-popup-edit>
              </div>
            </q-td>
          </template>

          <!-- Unit Price - Inline Editable -->
          <template #body-cell-unit_price="props">
            <q-td
              :props="props"
              align="right"
            >
              <div class="row items-center justify-end no-wrap cursor-pointer">
                <span class="font-mono">
                  {{ props.row.unit_price ? formatCurrency(props.row.unit_price) : '-' }}
                </span>
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
                  v-model.number="props.row.unit_price"
                  auto-save
                  buttons
                  label-set="Lưu"
                  label-cancel="Hủy"
                  @save="(val: number) => handleInlineUpdate(props.row.id, 'unit_price', val)"
                >
                  <q-input
                    v-model.number="props.row.unit_price"
                    type="number"
                    dense
                    autofocus
                    label="Đơn giá"
                    prefix="₫"
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
              class="q-gutter-x-xs"
            >
              <q-btn
                v-if="props.row.is_active"
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="handleDeleteSupplier(props.row.id, props.row.supplier?.name || '')"
              >
                <q-tooltip>Xóa liên kết</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- No Data -->
          <template #no-data>
            <div class="full-width column items-center q-pa-lg text-grey-6">
              <q-icon
                name="store"
                size="48px"
                class="q-mb-sm"
              />
              <div>Chưa có nhà cung cấp nào được liên kết</div>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <!-- Add Supplier Form -->
      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 q-mb-sm text-grey-8">
          <q-icon
            name="add_circle"
            class="q-mr-xs"
          />
          Thêm nhà cung cấp
        </div>
        <div class="row q-col-gutter-sm">
          <!-- Row 1: Supplier selector (full width) -->
          <div class="col-12">
            <SupplierSelector
              v-model="newLink.supplier_id"
              label="Nhà cung cấp"
              dense
              :active-only="true"
              :exclude-ids="existingSupplierIds"
            />
          </div>
          <!-- Row 2: Item code, Price, Add button -->
          <div class="col-6 col-sm-5">
            <q-input
              v-model="newLink.supplier_item_code"
              label="Mã hàng NCC"
              dense
              outlined
              placeholder="VD: SP-001"
            />
          </div>
          <div class="col-6 col-sm-4">
            <q-input
              v-model.number="newLink.unit_price"
              label="Đơn giá"
              type="number"
              dense
              outlined
              prefix="₫"
              :min="0"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-btn
              color="primary"
              icon="add"
              label="Thêm"
              unelevated
              class="full-width"
              :loading="loading"
              :disable="!newLink.supplier_id"
              @click="handleAddSupplier"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
        <q-btn
          v-close-popup
          flat
          label="Đóng"
          color="grey"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useThreadTypeSuppliers, useConfirm } from '@/composables'
import SupplierSelector from '@/components/ui/inputs/SupplierSelector.vue'
import type { ThreadType } from '@/types/thread/thread-type'
import type { LinkSupplierFormData } from '@/types/thread/thread-type-supplier'

interface Props {
  modelValue: boolean
  threadType: ThreadType | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': []
}>()

// Composables
const {
  suppliers,
  loading,
  fetchSuppliers,
  linkSupplier,
  updateLink,
  deleteLink,
  reset,
} = useThreadTypeSuppliers()
const { confirm } = useConfirm()

// Form state for adding new supplier
const newLink = reactive<LinkSupplierFormData>({
  supplier_id: null as number | null,
  supplier_item_code: '',
  unit_price: undefined,
})

// Table columns
const supplierColumns = [
  {
    name: 'supplier',
    label: 'Nhà cung cấp',
    field: (row: { supplier?: { name: string } }) => row.supplier?.name,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'supplier_item_code',
    label: 'Mã hàng NCC',
    field: 'supplier_item_code',
    align: 'left' as const,
  },
  {
    name: 'unit_price',
    label: 'Đơn giá',
    field: 'unit_price',
    align: 'right' as const,
  },
  {
    name: 'is_active',
    label: 'Trạng thái',
    field: 'is_active',
    align: 'center' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'center' as const,
    style: 'width: 60px',
  },
]

// Computed: Get existing supplier IDs to exclude from selector
const existingSupplierIds = computed(() => {
  return suppliers.value.map((s) => s.supplier_id)
})

// Helpers
function getInitials(name?: string): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatCurrency(value: number): string {
  return `₫${value.toLocaleString('vi-VN')}`
}

function resetNewLinkForm() {
  newLink.supplier_id = null
  newLink.supplier_item_code = ''
  newLink.unit_price = undefined
}

// Watch for dialog open
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.threadType?.id) {
      reset()
      await fetchSuppliers(props.threadType.id)
    } else if (!isOpen) {
      resetNewLinkForm()
    }
  }
)

// Handlers
async function handleAddSupplier() {
  if (!props.threadType?.id || !newLink.supplier_id) return

  const result = await linkSupplier(props.threadType.id, {
    supplier_id: newLink.supplier_id,
    supplier_item_code: newLink.supplier_item_code || undefined,
    unit_price: newLink.unit_price || undefined,
  })

  if (result) {
    resetNewLinkForm()
    emit('updated')
  }
}

async function handleInlineUpdate(
  id: number,
  field: 'supplier_item_code' | 'unit_price',
  value: string | number | null
) {
  await updateLink(id, { [field]: value || undefined })
  emit('updated')
}

async function handleDeleteSupplier(id: number, supplierName: string) {
  const confirmed = await confirm({
    title: 'Xóa liên kết nhà cung cấp?',
    message: `Bạn có chắc muốn xóa liên kết với nhà cung cấp "${supplierName}"?`,
    ok: 'Xóa',
    type: 'warning',
  })

  if (confirmed) {
    const success = await deleteLink(id)
    if (success) {
      emit('updated')
    }
  }
}
</script>

<style scoped lang="scss">
.suppliers-table {
  :deep(.q-table__top) {
    padding: 0;
  }
}

.opacity-50 {
  opacity: 0.5;
}

.font-mono {
  font-family: monospace;
}
</style>
