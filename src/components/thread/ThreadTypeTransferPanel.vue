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
      </div>
    </template>

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

const TRANSFER_LIMIT = 10000

interface Props {
  warehouseId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'transfer-ready': [payload: {
    thread_type_id: number
    color_id: number
    quantity: number
    include_reserved: boolean
  }]
  'selection-cleared': []
}>()

const snackbar = useSnackbar()
const loading = ref(false)
const items = ref<TransferableSummaryItem[]>([])
const filteredItems = ref<TransferableSummaryItem[]>([])
const selectedItem = ref<TransferableSummaryItem | null>(null)
const quantity = ref(0)
const showReservedDialog = ref(false)

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

function handleFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase()
    filteredItems.value = items.value.filter(i =>
      formatOptionLabel(i).toLowerCase().includes(needle)
    )
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

function emitTransferReady(includeReserved: boolean) {
  if (!selectedItem.value || quantity.value <= 0) return
  emit('transfer-ready', {
    thread_type_id: selectedItem.value.thread_type_id,
    color_id: selectedItem.value.color_id,
    quantity: quantity.value,
    include_reserved: includeReserved
  })
}

function handleProceed() {
  if (!selectedItem.value || quantity.value <= 0) return

  if (quantity.value > selectedItem.value.transferable_count) {
    showReservedDialog.value = true
  } else {
    emitTransferReady(false)
  }
}

function confirmWithReserved() {
  showReservedDialog.value = false
  emitTransferReady(true)
}

watch(() => props.warehouseId, () => {
  selectedItem.value = null
  quantity.value = 0
  fetchSummary()
}, { immediate: true })

watch(selectedItem, () => {
  quantity.value = 0
  if (!selectedItem.value) emit('selection-cleared')
})

defineExpose({ handleProceed, quantity, selectedItem, maxQuantity })
</script>
