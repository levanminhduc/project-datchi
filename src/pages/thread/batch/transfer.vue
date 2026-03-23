<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="handleBack"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">
          Chuyển Kho Hàng Loạt
        </h1>
        <div class="text-grey-6">
          Chuyển nhiều cuộn giữa các kho
        </div>
      </div>
    </div>

    <!-- Stepper -->
    <q-stepper
      v-model="currentStep"
      color="primary"
      animated
      flat
      bordered
      class="batch-stepper"
      :vertical="$q.screen.lt.sm"
    >
      <!-- Step 1: Select Source Warehouse & Cones -->
      <q-step
        :name="1"
        title="Chọn Nguồn"
        icon="output"
        :done="currentStep > 1"
      >
        <div class="q-pa-md">
          <div class="row q-col-gutter-lg">
            <!-- Left: Source Selection -->
            <div class="col-12 col-md-6">
              <p class="text-body1 q-mb-md text-weight-medium">
                Kho nguồn:
              </p>
              <AppWarehouseSelect
                v-model="formData.from_warehouse_id"
                label="Chọn kho chuyển đi"
                required
                class="q-mb-lg"
                @update:model-value="onSourceWarehouseChange"
              />

              <q-separator class="q-my-md" />

              <p class="text-body1 q-mb-md text-weight-medium">
                Chọn cuộn theo:
              </p>
              <q-option-group
                v-model="selectionMode"
                :options="selectionModeOptions"
                color="primary"
                inline
                class="q-mb-md"
                :disable="!formData.from_warehouse_id"
              />

              <!-- By Lot -->
              <div v-if="selectionMode === 'lot' && formData.from_warehouse_id">
                <LotSelector
                  ref="lotSelectorRef"
                  v-model="formData.lot_id"
                  :warehouse-id="formData.from_warehouse_id"
                  label="Chọn lô hoặc loại chỉ"
                  :include-unassigned="true"
                  @lot-selected="onLotSelected"
                  @unassigned-selected="onUnassignedSelected"
                />
                <q-btn
                  v-if="hasSelection"
                  color="secondary"
                  :label="selectedUnassigned ? 'Thêm tất cả cuộn chưa phân lô' : 'Thêm tất cả cuộn trong lô'"
                  icon="add"
                  class="q-mt-md"
                  @click="addLotCones"
                />
              </div>

              <!-- By Scanning -->
              <div v-if="selectionMode === 'scan' && formData.from_warehouse_id">
                <q-card
                  flat
                  bordered
                  class="q-mb-md"
                >
                  <q-card-section>
                    <div class="row items-center q-mb-md">
                      <q-icon
                        name="qr_code_scanner"
                        size="sm"
                        class="q-mr-sm"
                      />
                      <span class="text-subtitle2">Quét mã QR</span>
                      <q-space />
                      <q-btn
                        :color="isScanning ? 'negative' : 'primary'"
                        :label="isScanning ? 'Dừng' : 'Quét'"
                        :icon="isScanning ? 'stop' : 'play_arrow'"
                        dense
                        @click="toggleScanner"
                      />
                    </div>
                    <div
                      v-if="isScanning"
                      class="scanner-container"
                    >
                      <QrScannerStream
                        :active="isScanning"
                        @detect="handleScan"
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <AppTextarea
                  v-model="manualInput"
                  label="Hoặc nhập thủ công"
                  hint="Mỗi mã trên một dòng"
                  rows="2"
                />
                <q-btn
                  color="secondary"
                  label="Thêm"
                  icon="add"
                  class="q-mt-sm"
                  :disable="!manualInput.trim()"
                  @click="handleManualAdd"
                />
              </div>
            </div>

            <!-- Right: Selected Cones List -->
            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="selected-list-card"
              >
                <q-card-section class="q-pb-none">
                  <div class="row items-center">
                    <span class="text-subtitle1 text-weight-medium">
                      Cuộn đã chọn ({{ coneBuffer.length }})
                    </span>
                    <q-space />
                    <q-btn
                      v-if="coneBuffer.length > 0"
                      flat
                      dense
                      color="negative"
                      label="Xóa tất cả"
                      icon="delete_sweep"
                      @click="handleClearBuffer"
                    />
                  </div>
                  <!-- Summary for invalid cones -->
                  <div
                    v-if="invalidCones.length > 0"
                    class="text-warning q-mt-sm text-body2"
                  >
                    <q-icon
                      name="warning"
                      size="xs"
                      class="q-mr-xs"
                    />
                    {{ validCones.length }}/{{ coneBuffer.length }} cuộn hợp lệ sẽ được chuyển
                  </div>
                </q-card-section>
                <q-card-section class="selected-list-container">
                  <q-list
                    v-if="coneBuffer.length > 0"
                    separator
                    dense
                  >
                    <q-item
                      v-for="(item, index) in coneBuffer"
                      :key="item.id"
                      dense
                      :class="{ 'bg-red-1': !isTransferable(item.status) }"
                    >
                      <q-item-section avatar>
                        <q-avatar
                          size="24px"
                          :color="isTransferable(item.status) ? 'info' : 'negative'"
                          text-color="white"
                        >
                          <template v-if="isTransferable(item.status)">
                            {{ index + 1 }}
                          </template>
                          <q-icon
                            v-else
                            name="warning"
                            size="14px"
                          />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-body2">
                          {{ item.cone_id }}
                        </q-item-label>
                        <q-item-label
                          caption
                          :class="isTransferable(item.status) ? 'text-positive' : 'text-negative'"
                        >
                          {{ statusLabels[item.status] || item.status }}
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
                          @click="removeFromBuffer(item)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div
                    v-else
                    class="text-center text-grey-5 q-py-xl"
                  >
                    <q-icon
                      name="inbox"
                      size="48px"
                    />
                    <div class="q-mt-sm">
                      Chưa chọn cuộn nào
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Tiếp theo"
            :disable="validCones.length === 0"
            @click="goToStep(2)"
          />
          <div
            v-if="coneBuffer.length > 0 && validCones.length === 0"
            class="text-negative text-body2 q-mt-sm"
          >
            Không có cuộn hợp lệ để chuyển
          </div>
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Select Destination -->
      <q-step
        :name="2"
        title="Chọn Đích"
        icon="input"
        :done="currentStep > 2"
      >
        <div class="q-pa-md">
          <p class="text-body1 q-mb-md">
            Chọn kho nhận hàng:
          </p>
          <AppWarehouseSelect
            v-model="formData.to_warehouse_id"
            label="Kho đích"
            required
            class="q-mb-md"
            style="max-width: 400px"
          />
          <q-banner
            v-if="formData.to_warehouse_id === formData.from_warehouse_id"
            class="bg-warning text-white q-mt-md"
            rounded
          >
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Kho đích không được trùng với kho nguồn
          </q-banner>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Xem lại"
            :disable="!isDestinationValid"
            @click="goToStep(3)"
          />
          <q-btn
            flat
            color="primary"
            label="Quay lại"
            class="q-ml-sm"
            @click="goToStep(1)"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Review & Confirm -->
      <q-step
        :name="3"
        title="Xác Nhận"
        icon="check_circle"
      >
        <div class="q-pa-md">
          <q-banner
            class="bg-info text-white q-mb-lg"
            rounded
          >
            <template #avatar>
              <q-icon name="swap_horiz" />
            </template>
            Kiểm tra thông tin trước khi xác nhận chuyển kho
          </q-banner>

          <div class="row q-col-gutter-md">
            <!-- Transfer Summary -->
            <div class="col-12 col-md-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-md"
              >
                <q-icon
                  name="output"
                  size="32px"
                  color="negative"
                />
                <div class="text-subtitle1 q-mt-sm">
                  Kho nguồn
                </div>
                <div class="text-h6 text-weight-bold">
                  {{ sourceWarehouseName }}
                </div>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-md"
              >
                <q-icon
                  name="inventory_2"
                  size="32px"
                  color="primary"
                />
                <div class="text-subtitle1 q-mt-sm">
                  Số cuộn
                </div>
                <div class="text-h6 text-weight-bold">
                  {{ validCones.length }}
                  <span
                    v-if="invalidCones.length > 0"
                    class="text-body2 text-negative"
                  >
                    ({{ invalidCones.length }} không hợp lệ)
                  </span>
                </div>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-md"
              >
                <q-icon
                  name="input"
                  size="32px"
                  color="positive"
                />
                <div class="text-subtitle1 q-mt-sm">
                  Kho đích
                </div>
                <div class="text-h6 text-weight-bold">
                  {{ destWarehouseName }}
                </div>
              </q-card>
            </div>

            <!-- Cone List Preview -->
            <div class="col-12">
              <q-card
                flat
                bordered
              >
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-medium">
                    Danh sách cuộn chuyển
                  </div>
                  <div
                    v-if="invalidCones.length > 0"
                    class="text-warning text-body2 q-mt-xs"
                  >
                    <q-icon
                      name="warning"
                      size="xs"
                      class="q-mr-xs"
                    />
                    Các cuộn không hợp lệ sẽ bị bỏ qua khi chuyển kho
                  </div>
                </q-card-section>
                <q-card-section>
                  <div class="cone-preview-grid">
                    <q-chip
                      v-for="item in coneBuffer.slice(0, 20)"
                      :key="item.id"
                      dense
                      :color="isTransferable(item.status) ? 'grey-3' : 'red-2'"
                      :text-color="isTransferable(item.status) ? 'dark' : 'negative'"
                    >
                      <q-icon
                        v-if="!isTransferable(item.status)"
                        name="warning"
                        size="12px"
                        class="q-mr-xs"
                      />
                      {{ item.cone_id }}
                      <q-tooltip>
                        {{ statusLabels[item.status] || item.status }}
                      </q-tooltip>
                    </q-chip>
                    <q-chip
                      v-if="coneBuffer.length > 20"
                      dense
                      color="info"
                      text-color="white"
                    >
                      +{{ coneBuffer.length - 20 }} cuộn khác
                    </q-chip>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Xác nhận chuyển kho"
            icon="swap_horiz"
            :loading="loading"
            @click="handleConfirm"
          />
          <q-btn
            flat
            color="primary"
            label="Quay lại"
            class="q-ml-sm"
            :disable="loading"
            @click="goToStep(2)"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>

    <!-- Success Dialog -->
    <q-dialog
      v-model="showSuccessDialog"
      persistent
    >
      <q-card style="width: 100%; max-width: 400px">
        <q-card-section class="text-center q-pt-lg">
          <q-icon
            name="check_circle"
            color="positive"
            size="64px"
          />
          <div class="text-h6 q-mt-md">
            Chuyển kho thành công!
          </div>
          <div class="text-grey-6 q-mt-sm">
            Đã chuyển {{ lastResult?.cone_count }} cuộn
          </div>
        </q-card-section>
        <q-card-actions
          align="center"
          class="q-pb-lg"
        >
          <q-btn
            color="primary"
            label="Chuyển tiếp"
            @click="handleNewBatch"
          />
          <q-btn
            flat
            color="primary"
            label="Về trang chủ"
            @click="$router.push('/thread/lots')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useBatchOperations } from '@/composables/useBatchOperations'
import { useWarehouses, useConfirm, useSnackbar } from '@/composables'
import { useLots } from '@/composables/useLots'
import { QrScannerStream } from '@/components/qr'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import { inventoryService } from '@/services/inventoryService'
import LotSelector from '@/components/thread/LotSelector.vue'
import type { Lot, UnassignedThreadGroup } from '@/types/thread/lot'

const router = useRouter()
const $q = useQuasar()
const { confirm } = useConfirm()
const snackbar = useSnackbar()
const { warehouses, fetchWarehouses } = useWarehouses()
const { fetchLotCones, currentCones } = useLots()

const {
  loading,
  lastResult,
  batchTransfer
} = useBatchOperations()

// Local buffer stores id (for API), cone_id (for display), and status (for validation)
interface ConeBufferItem {
  id: number       // Database primary key - sent to API
  cone_id: string  // Barcode ID - shown in UI
  status: string   // Cone status - for transfer validation
}
const coneBuffer = ref<ConeBufferItem[]>([])

// Status constants and labels
const TRANSFERABLE_STATUSES = ['AVAILABLE', 'RECEIVED', 'INSPECTED']

const statusLabels: Record<string, string> = {
  'AVAILABLE': 'Sẵn sàng',
  'RECEIVED': 'Đã nhận',
  'INSPECTED': 'Đã kiểm tra',
  'SOFT_ALLOCATED': 'Đã đặt trước',
  'HARD_ALLOCATED': 'Đã cấp phát',
  'IN_PRODUCTION': 'Đang sản xuất',
  'PARTIAL_RETURN': 'Hoàn trả một phần',
  'PENDING_WEIGH': 'Chờ cân',
  'CONSUMED': 'Đã tiêu thụ',
  'WRITTEN_OFF': 'Đã thanh lý',
  'QUARANTINE': 'Cách ly'
}

const isTransferable = (status: string) => TRANSFERABLE_STATUSES.includes(status)

const validCones = computed(() => coneBuffer.value.filter(c => isTransferable(c.status)))
const invalidCones = computed(() => coneBuffer.value.filter(c => !isTransferable(c.status)))

// State
const currentStep = ref(1)
const selectionMode = ref<'lot' | 'scan'>('lot')
const isScanning = ref(false)
const manualInput = ref('')
const showSuccessDialog = ref(false)
const selectedLot = ref<Lot | null>(null)
const selectedUnassigned = ref<UnassignedThreadGroup | null>(null)
const lotSelectorRef = ref<InstanceType<typeof LotSelector> | null>(null)

const formData = ref({
  from_warehouse_id: null as number | null,
  to_warehouse_id: null as number | null,
  lot_id: null as number | string | null
})

// Options
const selectionModeOptions = [
  { label: 'Theo lô/loại chỉ', value: 'lot' },
  { label: 'Quét/nhập', value: 'scan' }
]

// Computed
const isDestinationValid = computed(() => {
  return formData.value.to_warehouse_id !== null &&
    formData.value.to_warehouse_id !== formData.value.from_warehouse_id
})

const sourceWarehouseName = computed(() => {
  const w = warehouses.value.find(w => w.id === formData.value.from_warehouse_id)
  return w?.name || '-'
})

const destWarehouseName = computed(() => {
  const w = warehouses.value.find(w => w.id === formData.value.to_warehouse_id)
  return w?.name || '-'
})

// Methods
function goToStep(step: number) {
  currentStep.value = step
}

function onSourceWarehouseChange() {
  formData.value.lot_id = null
  selectedLot.value = null
  selectedUnassigned.value = null
  coneBuffer.value = []
}

function onLotSelected(lot: Lot | null) {
  selectedLot.value = lot
  selectedUnassigned.value = null
}

function onUnassignedSelected(group: UnassignedThreadGroup | null) {
  selectedUnassigned.value = group
  selectedLot.value = null
}

const hasSelection = computed(() => {
  return selectedLot.value !== null || selectedUnassigned.value !== null
})

async function addLotCones() {
  if (!formData.value.lot_id) return
  
  if (selectedUnassigned.value) {
    const coneIds = selectedUnassigned.value.cone_ids
    
    const fetchPromises = coneIds
      .filter(id => !coneBuffer.value.some(item => item.id === id))
      .map(id => inventoryService.getById(id).catch(() => null))
    
    const cones = await Promise.all(fetchPromises)
    
    let added = 0
    for (const cone of cones) {
      if (cone && isTransferable(cone.status)) {
        coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status })
        added++
      }
    }
    
    if (added > 0) {
      snackbar.success(`Đã thêm ${added} cuộn chưa phân lô`)
    } else {
      snackbar.info('Không có cuộn nào để thêm')
    }
    return
  }
  
  if (typeof formData.value.lot_id !== 'number') return
  
  await fetchLotCones(formData.value.lot_id)
  
  let added = 0
  let skipped = 0
  for (const cone of currentCones.value) {
    // Check if cone is already in buffer by database id
    if (!coneBuffer.value.some(item => item.id === cone.id)) {
      if (isTransferable(cone.status)) {
        coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status })
        added++
      } else {
        skipped++
      }
    }
  }
  
  if (added > 0) {
    snackbar.success(`Đã thêm ${added} cuộn hợp lệ từ lô`)
    if (skipped > 0) {
      snackbar.warning(`Bỏ qua ${skipped} cuộn không thể chuyển (đang sản xuất, đã cấp phát, v.v.)`)
    }
  } else if (skipped > 0) {
    snackbar.warning(`Không có cuộn nào hợp lệ để chuyển trong lô này`)
  } else {
    snackbar.info('Không có cuộn nào trong lô')
  }
}

function toggleScanner() {
  isScanning.value = !isScanning.value
}

async function handleScan(codes: { rawValue: string }[]) {
  const firstCode = codes[0]
  if (!firstCode) return
  
  const scannedConeId = firstCode.rawValue.trim()
  
  // Check if already in buffer by cone_id
  if (coneBuffer.value.some(item => item.cone_id === scannedConeId)) {
    snackbar.warning('Đã quét rồi')
    return
  }
  
  // Look up the cone by barcode to get database id
  try {
    const cone = await inventoryService.getByBarcode(scannedConeId)
    
    // Verify cone is in the selected source warehouse
    if (cone.warehouse_id !== formData.value.from_warehouse_id) {
      snackbar.error(`Cuộn ${scannedConeId} không thuộc kho nguồn đã chọn`)
      return
    }
    
    coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status })
    snackbar.success(`✓ ${scannedConeId}`)
  } catch {
    snackbar.error(`Không tìm thấy cuộn: ${scannedConeId}`)
  }
}

async function handleManualAdd() {
  const ids = manualInput.value
    .split(/[,\n\r]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  let added = 0
  let errors: string[] = []
  
  for (const scannedConeId of ids) {
    // Skip if already in buffer
    if (coneBuffer.value.some(item => item.cone_id === scannedConeId)) {
      continue
    }
    
    try {
      const cone = await inventoryService.getByBarcode(scannedConeId)
      
      // Verify cone is in the selected source warehouse
      if (cone.warehouse_id !== formData.value.from_warehouse_id) {
        errors.push(`${scannedConeId} không thuộc kho nguồn`)
        continue
      }
      
      coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status })
      added++
    } catch {
      errors.push(scannedConeId)
    }
  }
  
  if (added > 0) {
    manualInput.value = ''
    snackbar.success(`Đã thêm ${added} cuộn`)
  }
  
  if (errors.length > 0) {
    snackbar.error(`Không tìm thấy: ${errors.join(', ')}`)
  }
}

function removeFromBuffer(item: ConeBufferItem) {
  const index = coneBuffer.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    coneBuffer.value.splice(index, 1)
  }
}

async function handleClearBuffer() {
  const confirmed = await confirm({
    title: 'Xóa tất cả?',
    message: 'Bạn có chắc muốn xóa tất cả cuộn đã chọn?',
    type: 'warning'
  })
  if (confirmed) {
    coneBuffer.value = []
  }
}

async function handleConfirm() {
  // Only send valid (transferable) cones to API
  const coneIds = validCones.value.map(item => item.id)
  
  if (coneIds.length === 0) {
    snackbar.error('Không có cuộn hợp lệ để chuyển')
    return
  }
  
  const result = await batchTransfer({
    cone_ids: coneIds,
    from_warehouse_id: formData.value.from_warehouse_id!,
    to_warehouse_id: formData.value.to_warehouse_id!
  })
  
  if (result) {
    showSuccessDialog.value = true
    coneBuffer.value = []
  }
}

function handleNewBatch() {
  showSuccessDialog.value = false
  currentStep.value = 1
  formData.value.lot_id = null
  selectedLot.value = null
  selectedUnassigned.value = null
}

async function handleBack() {
  if (coneBuffer.value.length > 0) {
    const confirmed = await confirm({
      title: 'Rời trang?',
      message: 'Danh sách cuộn đã chọn sẽ bị mất. Bạn có chắc?',
      type: 'warning'
    })
    if (!confirmed) return
  }
  router.back()
}

// Lifecycle
onMounted(async () => {
  await fetchWarehouses()
})

onBeforeUnmount(() => {
  isScanning.value = false
})
</script>

<style scoped>
.batch-stepper {
  width: 100%;
  max-width: 100%;
}

.scanner-container {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.selected-list-card {
  height: 100%;
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.selected-list-container {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.cone-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Ensure proper stepper content overflow on resize */
:deep(.q-stepper__content) {
  overflow-x: auto;
}
</style>
