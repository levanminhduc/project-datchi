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
        <h1 class="text-h5 q-my-none text-weight-bold">Xuất Kho Hàng Loạt</h1>
        <div class="text-grey-6">Xuất nhiều cuộn cho đơn hàng hoặc sản xuất</div>
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
    >
      <!-- Step 1: Select Warehouse & Cones -->
      <q-step
        :name="1"
        title="Chọn Cuộn"
        icon="inventory_2"
        :done="currentStep > 1"
      >
        <div class="q-pa-md">
          <div class="row q-col-gutter-lg">
            <!-- Left: Selection -->
            <div class="col-12 col-md-6">
              <p class="text-body1 q-mb-md text-weight-medium">Kho xuất:</p>
              <AppWarehouseSelect
                v-model="formData.warehouse_id"
                label="Chọn kho"
                required
                class="q-mb-lg"
                @update:model-value="onWarehouseChange"
              />

              <q-separator class="q-my-md" />

              <p class="text-body1 q-mb-md text-weight-medium">Chọn cuộn theo:</p>
              <q-option-group
                v-model="selectionMode"
                :options="selectionModeOptions"
                color="primary"
                inline
                class="q-mb-md"
                :disable="!formData.warehouse_id"
              />

              <!-- By Lot -->
              <div v-if="selectionMode === 'lot' && formData.warehouse_id">
                <LotSelector
                  v-model="selectedLotId"
                  :warehouse-id="formData.warehouse_id"
                  label="Chọn lô hàng"
                  @lot-selected="onLotSelected"
                />
                <q-btn
                  v-if="selectedLotId && selectedLot"
                  color="secondary"
                  label="Thêm tất cả cuộn khả dụng"
                  icon="add"
                  class="q-mt-md"
                  @click="addLotCones"
                />
              </div>

              <!-- By Scanning -->
              <div v-if="selectionMode === 'scan' && formData.warehouse_id">
                <q-card flat bordered class="q-mb-md">
                  <q-card-section>
                    <div class="row items-center q-mb-md">
                      <q-icon name="qr_code_scanner" size="sm" class="q-mr-sm" />
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
                    <div v-if="isScanning" class="scanner-container">
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

            <!-- Right: Selected Cones -->
            <div class="col-12 col-md-6">
              <q-card flat bordered class="selected-list-card">
                <q-card-section class="q-pb-none">
                  <div class="row items-center">
                    <span class="text-subtitle1 text-weight-medium">
                      Cuộn xuất ({{ coneBuffer.length }})
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
                </q-card-section>
                <q-card-section class="selected-list-container">
                  <q-list v-if="coneBuffer.length > 0" separator dense>
                    <q-item
                      v-for="(coneId, index) in coneBuffer"
                      :key="coneId"
                      dense
                    >
                      <q-item-section avatar>
                        <q-avatar size="24px" color="warning" text-color="white">
                          {{ index + 1 }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-body2">{{ coneId }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          flat
                          round
                          dense
                          icon="close"
                          color="negative"
                          size="sm"
                          @click="removeFromBuffer(coneId)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div v-else class="text-center text-grey-5 q-py-xl">
                    <q-icon name="inbox" size="48px" />
                    <div class="q-mt-sm">Chưa chọn cuộn nào</div>
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
            :disable="coneBuffer.length === 0"
            @click="goToStep(2)"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Recipient Info -->
      <q-step
        :name="2"
        title="Người Nhận"
        icon="person"
        :done="currentStep > 2"
      >
        <div class="q-pa-md" style="max-width: 500px">
          <p class="text-body1 q-mb-md">Thông tin người nhận:</p>
          
          <AppInput
            v-model="formData.recipient"
            label="Tên người nhận / Đơn vị"
            required
            class="q-mb-md"
          />
          
          <AppInput
            v-model="formData.reference_number"
            label="Số phiếu xuất / Mã đơn hàng"
            hint="Để trống nếu không có"
            class="q-mb-md"
          />
          
          <AppTextarea
            v-model="formData.notes"
            label="Ghi chú"
            rows="2"
          />
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Xem lại"
            :disable="!formData.recipient?.trim()"
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
          <q-banner class="bg-warning text-white q-mb-lg" rounded>
            <template #avatar>
              <q-icon name="output" />
            </template>
            Kiểm tra thông tin trước khi xác nhận xuất kho
          </q-banner>

          <div class="row q-col-gutter-md">
            <!-- Issue Info -->
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">Thông tin xuất</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Kho xuất</q-item-label>
                        <q-item-label>{{ warehouseName }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Người nhận</q-item-label>
                        <q-item-label class="text-weight-bold">{{ formData.recipient }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="formData.reference_number">
                      <q-item-section>
                        <q-item-label caption>Số tham chiếu</q-item-label>
                        <q-item-label>{{ formData.reference_number }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="formData.notes">
                      <q-item-section>
                        <q-item-label caption>Ghi chú</q-item-label>
                        <q-item-label>{{ formData.notes }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <!-- Quantity -->
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-subtitle1 text-weight-medium q-mb-md">Số lượng xuất</div>
                  <div class="text-h2 text-warning">{{ coneBuffer.length }}</div>
                  <div class="text-grey-6">cuộn</div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Cone List -->
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section class="q-pb-none">
                  <div class="text-subtitle1 text-weight-medium">Danh sách cuộn xuất</div>
                </q-card-section>
                <q-card-section>
                  <div class="cone-preview-grid">
                    <q-chip
                      v-for="coneId in coneBuffer.slice(0, 20)"
                      :key="coneId"
                      dense
                      color="grey-3"
                    >
                      {{ coneId }}
                    </q-chip>
                    <q-chip v-if="coneBuffer.length > 20" dense color="warning" text-color="white">
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
            color="warning"
            text-color="white"
            label="Xác nhận xuất kho"
            icon="output"
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
    <q-dialog v-model="showSuccessDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="text-center q-pt-lg">
          <q-icon name="check_circle" color="positive" size="64px" />
          <div class="text-h6 q-mt-md">Xuất kho thành công!</div>
          <div class="text-grey-6 q-mt-sm">
            Đã xuất {{ lastResult?.cone_count }} cuộn cho {{ formData.recipient }}
          </div>
          <div v-if="lastResult?.transaction_id" class="text-caption q-mt-xs">
            Mã giao dịch: #{{ lastResult.transaction_id }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-lg">
          <q-btn
            color="primary"
            label="In phiếu xuất"
            icon="print"
            @click="handlePrint"
          />
          <q-btn
            flat
            color="primary"
            label="Xuất tiếp"
            @click="handleNewBatch"
          />
          <q-btn
            flat
            color="grey"
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
import { useBatchOperations } from '@/composables/useBatchOperations'
import { useWarehouses, useConfirm, useSnackbar } from '@/composables'
import { useLots } from '@/composables/useLots'
import { QrScannerStream } from '@/components/qr'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import LotSelector from '@/components/thread/LotSelector.vue'
import type { Lot } from '@/types/thread/lot'

const router = useRouter()
const { confirm } = useConfirm()
const snackbar = useSnackbar()
const { warehouses, fetchWarehouses } = useWarehouses()
const { fetchLotCones, currentCones } = useLots()

const {
  loading,
  lastResult,
  batchIssue
} = useBatchOperations()

// Local buffer
const coneBuffer = ref<string[]>([])

// State
const currentStep = ref(1)
const selectionMode = ref<'lot' | 'scan'>('lot')
const isScanning = ref(false)
const manualInput = ref('')
const showSuccessDialog = ref(false)
const selectedLotId = ref<number | null>(null)
const selectedLot = ref<Lot | null>(null)

const formData = ref({
  warehouse_id: null as number | null,
  recipient: '',
  reference_number: '',
  notes: ''
})

// Options
const selectionModeOptions = [
  { label: 'Theo lô', value: 'lot' },
  { label: 'Quét/nhập', value: 'scan' }
]

// Computed
const warehouseName = computed(() => {
  const w = warehouses.value.find(w => w.id === formData.value.warehouse_id)
  return w?.name || '-'
})

// Methods
function goToStep(step: number) {
  currentStep.value = step
}

function onWarehouseChange() {
  selectedLotId.value = null
  selectedLot.value = null
  coneBuffer.value = []
}

function onLotSelected(lot: Lot | null) {
  selectedLot.value = lot
}

async function addLotCones() {
  if (!selectedLotId.value) return
  
  await fetchLotCones(selectedLotId.value)
  const coneIds = currentCones.value
    .filter(c => c.status === 'AVAILABLE')
    .map(c => c.cone_id)
  
  let added = 0
  for (const id of coneIds) {
    if (!coneBuffer.value.includes(id)) {
      coneBuffer.value.push(id)
      added++
    }
  }
  
  if (added > 0) {
    snackbar.success(`Đã thêm ${added} cuộn khả dụng`)
  } else {
    snackbar.warning('Không có cuộn khả dụng trong lô')
  }
}

function toggleScanner() {
  isScanning.value = !isScanning.value
}

function handleScan(codes: { rawValue: string }[]) {
  const firstCode = codes[0]
  if (!firstCode) return
  
  const coneId = firstCode.rawValue.trim()
  if (coneBuffer.value.includes(coneId)) {
    snackbar.warning('Đã quét rồi')
    return
  }
  
  coneBuffer.value.push(coneId)
  snackbar.success(`✓ ${coneId}`)
}

function handleManualAdd() {
  const ids = manualInput.value
    .split(/[,\n\r]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  let added = 0
  for (const id of ids) {
    if (!coneBuffer.value.includes(id)) {
      coneBuffer.value.push(id)
      added++
    }
  }
  
  if (added > 0) {
    manualInput.value = ''
    snackbar.success(`Đã thêm ${added} cuộn`)
  }
}

function removeFromBuffer(coneId: string) {
  const index = coneBuffer.value.indexOf(coneId)
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
  const result = await batchIssue({
    cone_ids: coneBuffer.value.map(id => parseInt(id, 10) || 0),
    warehouse_id: formData.value.warehouse_id!,
    recipient: formData.value.recipient,
    reference_number: formData.value.reference_number || undefined,
    notes: formData.value.notes || undefined
  })
  
  if (result) {
    showSuccessDialog.value = true
  }
}

function handlePrint() {
  // Open print dialog with issue slip
  // For now, just print the page
  window.print()
}

function handleNewBatch() {
  showSuccessDialog.value = false
  currentStep.value = 1
  coneBuffer.value = []
  selectedLotId.value = null
  selectedLot.value = null
  formData.value.recipient = ''
  formData.value.reference_number = ''
  formData.value.notes = ''
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
  max-width: 1200px;
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
</style>
