<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Allocation, IssueConfirmation } from '@/types/thread'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import WeightMeterDisplay from './WeightMeterDisplay.vue'
import { QrScannerDialog } from '@/components/qr'
import { useSnackbar } from '@/composables'

interface Props {
  allocation: Allocation | null
}

const props = defineProps<Props>()

// defineModel for v-model:modelValue
const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'confirm', data: IssueConfirmation): void
}>()

const barcodeInput = ref('')
const selectedCones = ref<string[]>([])
const notes = ref('')
const showQrScanner = ref(false)

const snackbar = useSnackbar()

const totalMeters = computed(() => {
  if (!props.allocation?.allocated_cones) return 0
  return props.allocation.allocated_cones
    .filter(ac => selectedCones.value.includes(ac.cone?.cone_id || ''))
    .reduce((sum, ac) => sum + ac.allocated_meters, 0)
})

const totalWeight = computed(() => {
  if (!props.allocation?.allocated_cones) return 0
  return props.allocation.allocated_cones
    .filter(ac => selectedCones.value.includes(ac.cone?.cone_id || ''))
    .reduce((sum, ac) => sum + (ac.cone?.weight_grams || 0), 0)
})

const isFullySelected = computed(() => {
  if (!props.allocation?.allocated_cones) return false
  return selectedCones.value.length === props.allocation.allocated_cones.length
})

const addBarcode = () => {
  const code = barcodeInput.value.trim()
  if (!code) return
  addConeByCode(code)
  barcodeInput.value = ''
}

const addConeByCode = (code: string) => {
  const cone = props.allocation?.allocated_cones?.find(ac => ac.cone?.cone_id === code)
  if (cone && !selectedCones.value.includes(code)) {
    selectedCones.value.push(code)
    return true
  }
  return false
}

const handleQrConfirm = (code: string) => {
  const added = addConeByCode(code)
  if (added) {
    snackbar.success(`Đã thêm cone: ${code}`)
  } else {
    const alreadySelected = selectedCones.value.includes(code)
    if (alreadySelected) {
      snackbar.warning(`Cone ${code} đã có trong danh sách`)
    } else {
      snackbar.error(`Cone ${code} không thuộc phiếu phân bổ này`)
    }
  }
}

const removeCone = (code: string) => {
  selectedCones.value = selectedCones.value.filter(c => c !== code)
}

const selectAll = () => {
  if (!props.allocation?.allocated_cones) return
  selectedCones.value = props.allocation.allocated_cones.map(ac => ac.cone?.cone_id || '').filter(Boolean)
}

const handleConfirm = () => {
  if (!props.allocation) return
  
  emit('confirm', {
    allocation_id: props.allocation.id,
    cone_ids: selectedCones.value,
    notes: notes.value
  })
  
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  barcodeInput.value = ''
  selectedCones.value = []
  notes.value = ''
}

const onCancel = () => {
  isOpen.value = false
  resetForm()
}
</script>

<template>
  <FormDialog
    v-model="isOpen"
    title="Xác nhận xuất chỉ cho sản xuất"
    max-width="600px"
    @submit="handleConfirm"
    @cancel="onCancel"
  >
    <div
      v-if="allocation"
      class="q-gutter-y-md"
    >
      <!-- Allocation Summary -->
      <div class="bg-blue-1 q-pa-md rounded-borders border-blue">
        <div class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold text-blue-9">
            LSX: {{ allocation.order_id }}
          </div>
          <q-chip
            color="blue-9"
            text-color="white"
            dense
            size="sm"
          >
            {{ allocation.thread_type?.code }}
          </q-chip>
        </div>
        <div class="row q-mt-sm text-body2">
          <div class="col-6">
            <span class="text-grey-7">Yêu cầu:</span> 
            <span class="text-weight-medium q-ml-xs">{{ allocation.requested_meters.toLocaleString() }} m</span>
          </div>
          <div class="col-6">
            <span class="text-grey-7">Đã phân bổ:</span>
            <span class="text-weight-medium q-ml-xs text-primary">{{ allocation.allocated_meters.toLocaleString() }} m</span>
          </div>
        </div>
      </div>

      <!-- Barcode Input -->
      <div class="barcode-section">
        <div class="text-subtitle2 q-mb-xs flex items-center">
          <q-icon
            name="qr_code_scanner"
            class="q-mr-xs"
            color="primary"
          />
          Quét mã vạch Cone
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input
              v-model="barcodeInput"
              placeholder="Nhập hoặc quét mã vạch..."
              outlined
              dense
              @keyup.enter="addBarcode"
            >
              <template #append>
                <q-btn
                  icon="add"
                  flat
                  dense
                  color="primary"
                  @click="addBarcode"
                />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn
              icon="qr_code_scanner"
              color="primary"
              unelevated
              dense
              class="full-height"
              style="min-width: 44px;"
              @click="showQrScanner = true"
            >
              <q-tooltip>Quét QR bằng camera</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div class="row justify-end q-mt-xs">
          <q-btn 
            label="Chọn tất cả" 
            size="sm" 
            flat 
            color="primary" 
            no-caps 
            dense
            @click="selectAll"
          />
        </div>
      </div>

      <!-- Selected Cones List -->
      <div class="cones-list-section">
        <div class="text-subtitle2 q-mb-sm flex items-center justify-between">
          <span>Danh sách Cone đã chọn ({{ selectedCones.length }}/{{ allocation.allocated_cones?.length || 0 }})</span>
          <q-icon
            v-if="isFullySelected"
            name="check_circle"
            color="positive"
            size="xs"
          />
        </div>
        
        <q-list
          bordered
          separator
          class="rounded-borders overflow-hidden"
          style="max-height: 200px; overflow-y: auto;"
        >
          <template v-if="allocation.allocated_cones && allocation.allocated_cones.length > 0">
            <q-item
              v-for="ac in allocation.allocated_cones"
              :key="ac.id"
              dense
            >
              <q-item-section side>
                <q-checkbox 
                  v-model="selectedCones" 
                  :val="ac.cone?.cone_id" 
                  size="sm"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ ac.cone?.cone_id }}
                </q-item-label>
                <q-item-label caption>
                  Lô: {{ ac.cone?.lot_number || 'N/A' }} | {{ ac.allocated_meters.toLocaleString() }} m
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  icon="close"
                  size="xs"
                  flat
                  round
                  dense
                  color="grey-6"
                  @click="removeCone(ac.cone?.cone_id || '')"
                />
              </q-item-section>
            </q-item>
          </template>
          <q-item
            v-else
            dense
            class="text-grey-6 italic text-center q-pa-md"
          >
            <q-item-section>Chưa có cone nào được phân bổ</q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Totals -->
      <div class="row q-col-gutter-sm">
        <div class="col-12">
          <WeightMeterDisplay 
            :meters="totalMeters" 
            :weight="totalWeight"
            bordered
            padding
            class="bg-grey-1"
          />
        </div>
      </div>

      <!-- Notes -->
      <AppTextarea
        v-model="notes"
        label="Ghi chú xuất kho"
        placeholder="Ví dụ: Tình trạng bao bì, người nhận..."
        rows="2"
      />
    </div>
  </FormDialog>

  <!-- QR Scanner Dialog -->
  <QrScannerDialog
    v-model="showQrScanner"
    title="Quét mã QR Cone"
    :formats="['qr_code', 'code_128', 'ean_13']"
    hint="Đưa mã QR hoặc barcode của cuộn chỉ vào khung"
    :close-on-detect="false"
    @confirm="handleQrConfirm"
  />
</template>

<style scoped>
.border-blue {
  border: 1px solid #bbdefb;
}

.rounded-borders {
  border-radius: 8px;
}

.cones-list-section {
  min-height: 100px;
}
</style>
