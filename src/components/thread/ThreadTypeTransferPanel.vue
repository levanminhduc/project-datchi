<template>
  <div class="thread-type-transfer-panel">
    <q-select
      v-model="selectedItem"
      :options="filteredItems"
      :option-label="formatOptionLabel"
      :loading="loading"
      outlined
      label="Chọn loại chỉ"
      :disable="!warehouseId"
      use-input
      input-debounce="200"
      @filter="handleFilter"
    >
      <template #option="{ opt, itemProps }">
        <q-item v-bind="itemProps">
          <q-item-section avatar>
            <q-avatar
              size="32px"
              :style="opt.color_hex ? { backgroundColor: opt.color_hex } : { backgroundColor: '#ccc' }"
            >
              <span class="text-caption text-weight-bold text-white">
                {{ (opt.thread_code || '').substring(0, 2).toUpperCase() }}
              </span>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ opt.supplier_name }} - TEX {{ opt.tex_number }} - {{ opt.color_name }}</q-item-label>
            <q-item-label caption>
              {{ opt.transferable_count }} khả dụng / {{ opt.transferable_count + opt.reserved_count }} tổng
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #selected-item="{ opt }">
        <span v-if="opt">
          {{ opt.supplier_name }} - TEX {{ opt.tex_number }} - {{ opt.color_name }}
          <span class="text-grey-6 q-ml-xs">({{ opt.transferable_count + opt.reserved_count }} cuộn)</span>
        </span>
      </template>
    </q-select>

    <template v-if="selectedItem">
      <q-card
        flat
        bordered
        class="q-mt-md"
      >
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Khả dụng
              </div>
              <div class="text-h6 text-positive">
                {{ selectedItem.transferable_count }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Đã đặt tuần
              </div>
              <div class="text-h6 text-warning">
                {{ selectedItem.reserved_count }}
              </div>
            </div>
          </div>

          <div
            v-if="selectedItem.reserved_by_week.length > 0"
            class="q-mt-sm"
          >
            <q-chip
              v-for="w in selectedItem.reserved_by_week"
              :key="w.week_id"
              dense
              color="orange-2"
              text-color="orange-9"
              class="q-mr-xs"
            >
              {{ w.week_name }}: {{ w.count }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <div class="row items-end q-mt-md q-col-gutter-md">
        <div class="col">
          <AppInput
            v-model.number="quantity"
            type="number"
            label="Số lượng cuộn"
            :min="1"
            :max="maxQuantity"
            :hint="`Tối đa: ${maxQuantity.toLocaleString()} cuộn`"
            :rules="[
              (v: number) => v > 0 || 'Phải lớn hơn 0',
              (v: number) => v <= maxQuantity || `Tối đa ${maxQuantity.toLocaleString()}`
            ]"
          />
        </div>
        <div class="col-auto q-pb-lg">
          <q-btn
            color="primary"
            label="Thêm"
            icon="add"
            :disable="!quantity || quantity <= 0 || quantity > maxQuantity"
            @click="handleAdd"
          />
        </div>
      </div>
    </template>

    <q-card
      v-if="transferItems.length > 0"
      flat
      bordered
      class="q-mt-lg"
    >
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <span class="text-subtitle1 text-weight-medium">
            Danh sách chuyển ({{ transferItems.length }} loại — {{ totalCones.toLocaleString() }} cuộn)
          </span>
          <q-space />
          <q-btn
            flat
            dense
            color="negative"
            label="Xóa tất cả"
            icon="delete_sweep"
            @click="transferItems = []"
          />
        </div>
      </q-card-section>
      <q-list separator>
        <q-item
          v-for="(item, idx) in transferItems"
          :key="`${item.thread_type_id}-${item.color_id}`"
        >
          <q-item-section avatar>
            <q-avatar
              size="32px"
              :style="item.color_hex ? { backgroundColor: item.color_hex } : { backgroundColor: '#ccc' }"
            >
              <span class="text-caption text-weight-bold text-white">
                {{ item.tex_number }}
              </span>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ item.supplier_name }} - TEX {{ item.tex_number }} - {{ item.color_name }}
            </q-item-label>
            <q-item-label caption>
              {{ item.quantity.toLocaleString() }} cuộn
              <span
                v-if="item.include_reserved"
                class="text-warning"
              >
                ({{ (item.quantity - item.transferable_count).toLocaleString() }} từ đơn hàng)
              </span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="close"
              color="negative"
              size="sm"
              @click="removeItem(idx)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-dialog v-model="showReservedDialog">
      <q-card style="width: 100%; max-width: 420px">
        <q-card-section>
          <div class="text-h6">
            Lấy cuộn từ đơn hàng?
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p>
            Chỉ có <strong>{{ selectedItem?.transferable_count }}</strong> cuộn khả dụng.
            Lấy thêm <strong>{{ reservedNeeded }}</strong> cuộn từ đơn hàng?
          </p>
          <div v-if="affectedWeeks.length > 0">
            <p class="text-caption text-grey-7 q-mb-xs">
              Tuần bị ảnh hưởng:
            </p>
            <q-chip
              v-for="w in affectedWeeks"
              :key="w.week_id"
              dense
              color="orange-2"
              text-color="orange-9"
              class="q-mr-xs"
            >
              {{ w.week_name }}: {{ w.count }}
            </q-chip>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Hủy"
            color="grey"
            @click="showReservedDialog = false"
          />
          <q-btn
            label="Đồng ý"
            color="primary"
            @click="confirmWithReserved"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { batchService } from '@/services/batchService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { TransferableSummaryItem } from '@/types/thread/batch'

const TRANSFER_LIMIT = 20000

export interface TransferItem {
  thread_type_id: number
  color_id: number
  quantity: number
  include_reserved: boolean
  supplier_name: string
  tex_number: string
  color_name: string
  color_hex: string | null
  transferable_count: number
  reserved_count: number
}

interface Props {
  warehouseId: number | null
}

const props = defineProps<Props>()

const snackbar = useSnackbar()
const loading = ref(false)
const items = ref<TransferableSummaryItem[]>([])
const filteredItems = ref<TransferableSummaryItem[]>([])
const selectedItem = ref<TransferableSummaryItem | null>(null)
const quantity = ref(0)
const showReservedDialog = ref(false)
const transferItems = ref<TransferItem[]>([])

const totalCones = computed(() =>
  transferItems.value.reduce((sum, i) => sum + i.quantity, 0)
)

const maxQuantity = computed(() => {
  if (!selectedItem.value) return 0
  const total = selectedItem.value.transferable_count + selectedItem.value.reserved_count
  return Math.min(total, TRANSFER_LIMIT)
})

const reservedNeeded = computed(() => {
  if (!selectedItem.value) return 0
  return Math.max(0, quantity.value - selectedItem.value.transferable_count)
})

const affectedWeeks = computed(() => {
  if (!selectedItem.value) return []
  return selectedItem.value.reserved_by_week
})

function formatOptionLabel(item: TransferableSummaryItem) {
  return `${item.supplier_name} - TEX ${item.tex_number} - ${item.color_name}`
}

function isInBuffer(item: TransferableSummaryItem) {
  return transferItems.value.some(
    i => i.thread_type_id === item.thread_type_id && i.color_id === item.color_id
  )
}

function handleFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    const available = items.value.filter(i => !isInBuffer(i))
    if (!val) {
      filteredItems.value = available
      return
    }
    const terms = val.toLowerCase().split(/\s+/).filter(Boolean)
    filteredItems.value = available.filter(i => {
      const fields = [
        i.supplier_name,
        i.tex_number,
        i.color_name,
        i.thread_code,
        i.thread_name
      ].map(f => (f || '').toLowerCase())
      return terms.every(term => fields.some(f => f.includes(term)))
    })
  })
}

async function fetchSummary() {
  if (!props.warehouseId) {
    items.value = []
    selectedItem.value = null
    return
  }

  loading.value = true
  try {
    items.value = await batchService.getTransferableSummary(props.warehouseId)
    filteredItems.value = [...items.value]
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải danh sách loại chỉ')
  } finally {
    loading.value = false
  }
}

function addToBuffer(includeReserved: boolean) {
  if (!selectedItem.value || quantity.value <= 0) return
  transferItems.value.push({
    thread_type_id: selectedItem.value.thread_type_id,
    color_id: selectedItem.value.color_id,
    quantity: quantity.value,
    include_reserved: includeReserved,
    supplier_name: selectedItem.value.supplier_name,
    tex_number: selectedItem.value.tex_number,
    color_name: selectedItem.value.color_name,
    color_hex: selectedItem.value.color_hex,
    transferable_count: selectedItem.value.transferable_count,
    reserved_count: selectedItem.value.reserved_count
  })
  selectedItem.value = null
  quantity.value = 0
}

function handleAdd() {
  if (!selectedItem.value || quantity.value <= 0) return

  if (isInBuffer(selectedItem.value)) {
    snackbar.warning('Loại chỉ này đã có trong danh sách')
    return
  }

  if (quantity.value > selectedItem.value.transferable_count) {
    showReservedDialog.value = true
  } else {
    addToBuffer(false)
  }
}

function confirmWithReserved() {
  showReservedDialog.value = false
  addToBuffer(true)
}

function removeItem(idx: number) {
  transferItems.value.splice(idx, 1)
}

watch(() => props.warehouseId, () => {
  selectedItem.value = null
  quantity.value = 0
  transferItems.value = []
  fetchSummary()
}, { immediate: true })

watch(selectedItem, () => {
  quantity.value = 0
})

defineExpose({ transferItems, totalCones })
</script>
