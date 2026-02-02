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
          Nhập Kho Hàng Loạt
        </h1>
        <div class="text-grey-6">
          Nhập nhiều cuộn vào kho cùng lúc
        </div>
      </div>
    </div>

    <!-- Stepper -->
    <q-stepper
      ref="stepperRef"
      v-model="currentStep"
      color="primary"
      animated
      flat
      bordered
      class="batch-stepper"
      :vertical="$q.screen.lt.sm"
    >
      <!-- Step 1: Select Warehouse -->
      <q-step
        :name="1"
        title="Chọn Kho"
        icon="warehouse"
        :done="currentStep > 1"
      >
        <div class="q-pa-md">
          <p class="text-body1 q-mb-md">
            Chọn kho nhận hàng:
          </p>
          <AppWarehouseSelect
            v-model="formData.warehouse_id"
            label="Kho nhập hàng"
            required
            class="q-mb-md"
            style="max-width: 400px"
          />
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Tiếp theo"
            :disable="!formData.warehouse_id"
            @click="goToStep(2)"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Select or Create Lot -->
      <q-step
        :name="2"
        title="Lô Hàng"
        icon="inventory_2"
        :done="currentStep > 2"
      >
        <div class="q-pa-md">
          <q-option-group
            v-model="lotMode"
            :options="lotModeOptions"
            color="primary"
            inline
            class="q-mb-lg"
          />

          <!-- Existing Lot -->
          <div
            v-if="lotMode === 'existing'"
            class="q-mb-md"
            style="max-width: 500px"
          >
            <LotSelector
              v-model="formData.lot_id"
              :warehouse-id="formData.warehouse_id"
              label="Chọn lô có sẵn"
              required
              @lot-selected="onLotSelected"
            />
          </div>

          <!-- New Lot -->
          <div
            v-else
            class="row q-col-gutter-md"
            style="max-width: 700px"
          >
            <div class="col-12 col-sm-6">
              <AppInput
                v-model="formData.lot_number"
                label="Mã lô mới"
                required
                hint="Mã định danh duy nhất"
              />
            </div>
            <div class="col-12 col-sm-6">
              <AppSelect
                v-model="formData.thread_type_id"
                :options="threadTypeOptions"
                label="Loại chỉ"
                required
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6">
              <AppInput
                v-model="formData.supplier"
                label="Nhà cung cấp"
              />
            </div>
            <div class="col-12 col-sm-6">
              <DatePicker
                v-model="formData.production_date"
                label="Ngày sản xuất"
              />
            </div>
            <div class="col-12 col-sm-6">
              <DatePicker
                v-model="formData.expiry_date"
                label="Ngày hết hạn"
              />
            </div>
            <div class="col-12">
              <AppTextarea
                v-model="formData.notes"
                label="Ghi chú"
                rows="2"
              />
            </div>
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            label="Tiếp theo"
            :disable="!isLotStepValid"
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

      <!-- Step 3: Scan/Enter Cones -->
      <q-step
        :name="3"
        title="Quét Cuộn"
        icon="qr_code_scanner"
        :done="currentStep > 3"
      >
        <div class="q-pa-md">
          <div class="row q-col-gutter-lg">
            <!-- Left: Scanner & Input -->
            <div class="col-12 col-md-6">
              <!-- QR Scanner -->
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
                    <span class="text-subtitle1 text-weight-medium">Quét mã QR</span>
                    <q-space />
                    <q-btn
                      :color="isScanning ? 'negative' : 'primary'"
                      :label="isScanning ? 'Dừng' : 'Bắt đầu'"
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
                  <div
                    v-else
                    class="scanner-placeholder bg-grey-2 rounded-borders"
                  >
                    <q-icon
                      name="qr_code_2"
                      size="64px"
                      color="grey-5"
                    />
                    <div class="text-grey-6 q-mt-sm">
                      Nhấn "Bắt đầu" để quét
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Manual Entry -->
              <q-card
                flat
                bordered
              >
                <q-card-section>
                  <div class="row items-center q-mb-md">
                    <q-icon
                      name="keyboard"
                      size="sm"
                      class="q-mr-sm"
                    />
                    <span class="text-subtitle1 text-weight-medium">Nhập thủ công</span>
                  </div>
                  <AppTextarea
                    v-model="manualInput"
                    label="Nhập mã cuộn"
                    hint="Mỗi mã trên một dòng hoặc ngăn cách bằng dấu phẩy"
                    rows="3"
                  />
                  <q-btn
                    color="secondary"
                    label="Thêm vào danh sách"
                    icon="add"
                    class="q-mt-sm"
                    :disable="!manualInput.trim()"
                    @click="handleManualAdd"
                  />
                </q-card-section>
              </q-card>
            </div>

            <!-- Right: Scanned List -->
            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="scanned-list-card"
              >
                <q-card-section class="q-pb-none">
                  <div class="row items-center">
                    <span class="text-subtitle1 text-weight-medium">
                      Danh sách cuộn ({{ bufferCount }})
                    </span>
                    <q-space />
                    <q-btn
                      v-if="hasBuffer"
                      flat
                      dense
                      color="negative"
                      label="Xóa tất cả"
                      icon="delete_sweep"
                      @click="handleClearBuffer"
                    />
                  </div>
                </q-card-section>
                <q-card-section class="scanned-list-container">
                  <q-list
                    v-if="hasBuffer"
                    separator
                    dense
                  >
                    <q-item
                      v-for="(coneId, index) in coneBuffer"
                      :key="coneId"
                      dense
                    >
                      <q-item-section avatar>
                        <q-avatar
                          size="24px"
                          color="primary"
                          text-color="white"
                        >
                          {{ index + 1 }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-body2 text-weight-medium">
                          {{ coneId }}
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
                          @click="removeFromBuffer(coneId)"
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
                      Chưa có cuộn nào
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
            label="Xem lại"
            :disable="!hasBuffer"
            @click="goToStep(4)"
          />
          <q-btn
            flat
            color="primary"
            label="Quay lại"
            class="q-ml-sm"
            @click="goToStep(2)"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 4: Review & Confirm -->
      <q-step
        :name="4"
        title="Xác Nhận"
        icon="check_circle"
      >
        <div class="q-pa-md">
          <q-banner
            class="bg-positive text-white q-mb-lg"
            rounded
          >
            <template #avatar>
              <q-icon name="info" />
            </template>
            Kiểm tra thông tin trước khi xác nhận nhập kho
          </q-banner>

          <div class="row q-col-gutter-md">
            <!-- Summary Cards -->
            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
              >
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    Thông tin lô
                  </div>
                  <q-list dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>
                          Kho
                        </q-item-label>
                        <q-item-label>{{ selectedWarehouseName }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>
                          Mã lô
                        </q-item-label>
                        <q-item-label>{{ lotDisplayName }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="lotMode === 'new'">
                      <q-item-section>
                        <q-item-label caption>
                          Loại chỉ
                        </q-item-label>
                        <q-item-label>{{ selectedThreadTypeName }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="formData.supplier">
                      <q-item-section>
                        <q-item-label caption>
                          Nhà cung cấp
                        </q-item-label>
                        <q-item-label>{{ formData.supplier }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
              >
                <q-card-section>
                  <div class="text-subtitle1 text-weight-medium q-mb-md">
                    Số lượng
                  </div>
                  <div class="text-center">
                    <div class="text-h2 text-primary">
                      {{ bufferCount }}
                    </div>
                    <div class="text-grey-6">
                      cuộn sẽ được nhập kho
                    </div>
                  </div>
                </q-card-section>
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
                    Danh sách cuộn
                  </div>
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
                    <q-chip
                      v-if="bufferCount > 20"
                      dense
                      color="primary"
                      text-color="white"
                    >
                      +{{ bufferCount - 20 }} cuộn khác
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
            label="Xác nhận nhập kho"
            icon="check"
            :loading="loading"
            @click="handleConfirm"
          />
          <q-btn
            flat
            color="primary"
            label="Quay lại"
            class="q-ml-sm"
            :disable="loading"
            @click="goToStep(3)"
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
            Nhập kho thành công!
          </div>
          <div class="text-grey-6 q-mt-sm">
            Đã nhập {{ lastResult?.cone_count }} cuộn vào kho
          </div>
          <div
            v-if="lastResult?.transaction_id"
            class="text-caption q-mt-xs"
          >
            Mã giao dịch: #{{ lastResult.transaction_id }}
          </div>
        </q-card-section>
        <q-card-actions
          align="center"
          class="q-pb-lg"
        >
          <q-btn
            color="primary"
            label="Nhập tiếp"
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
import { useThreadTypes, useWarehouses, useConfirm } from '@/composables'
import { QrScannerStream } from '@/components/qr'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import LotSelector from '@/components/thread/LotSelector.vue'
import type { Lot } from '@/types/thread/lot'

const router = useRouter()
const $q = useQuasar()
const { confirm } = useConfirm()
const { threadTypes, fetchThreadTypes } = useThreadTypes()
const { warehouses, fetchWarehouses } = useWarehouses()

const {
  coneBuffer,
  bufferCount,
  hasBuffer,
  loading,
  lastResult,
  addToBuffer,
  addMultipleToBuffer,
  parseInput,
  removeFromBuffer,
  clearBuffer,
  batchReceive
} = useBatchOperations()

// State
const stepperRef = ref()
const currentStep = ref(1)
const lotMode = ref<'existing' | 'new'>('new')
const isScanning = ref(false)
const manualInput = ref('')
const showSuccessDialog = ref(false)
const selectedLot = ref<Lot | null>(null)

const formData = ref({
  warehouse_id: null as number | null,
  lot_id: null as number | null,
  lot_number: '',
  thread_type_id: null as number | null,
  supplier: '',
  production_date: null as string | null,
  expiry_date: null as string | null,
  notes: ''
})

// Options
const lotModeOptions = [
  { label: 'Tạo lô mới', value: 'new' },
  { label: 'Chọn lô có sẵn', value: 'existing' }
]

const threadTypeOptions = computed(() =>
  threadTypes.value.map(t => ({
    label: `${t.name} (${t.code})`,
    value: t.id
  }))
)

// Computed
const isLotStepValid = computed(() => {
  if (lotMode.value === 'existing') {
    return !!formData.value.lot_id
  }
  return !!formData.value.lot_number && !!formData.value.thread_type_id
})

const selectedWarehouseName = computed(() => {
  const w = warehouses.value.find(w => w.id === formData.value.warehouse_id)
  return w?.name || '-'
})

const selectedThreadTypeName = computed(() => {
  const t = threadTypes.value.find(t => t.id === formData.value.thread_type_id)
  return t?.name || '-'
})

const lotDisplayName = computed(() => {
  if (lotMode.value === 'existing' && selectedLot.value) {
    return selectedLot.value.lot_number
  }
  return formData.value.lot_number || '-'
})

// Methods
function goToStep(step: number) {
  currentStep.value = step
}

function onLotSelected(lot: Lot | null) {
  selectedLot.value = lot
}

function toggleScanner() {
  isScanning.value = !isScanning.value
}

function handleScan(codes: { rawValue: string }[]) {
  const firstCode = codes[0]
  if (!firstCode) return
  addToBuffer(firstCode.rawValue)
}

function handleManualAdd() {
  const ids = parseInput(manualInput.value)
  const added = addMultipleToBuffer(ids)
  if (added > 0) {
    manualInput.value = ''
  }
}

async function handleClearBuffer() {
  const confirmed = await confirm({
    title: 'Xóa tất cả?',
    message: 'Bạn có chắc muốn xóa tất cả cuộn đã quét?',
    type: 'warning'
  })
  if (confirmed) {
    clearBuffer()
  }
}

async function handleConfirm() {
  const request: Parameters<typeof batchReceive>[0] = {
    warehouse_id: formData.value.warehouse_id!,
    thread_type_id: formData.value.thread_type_id!
  }

  if (lotMode.value === 'existing') {
    request.lot_id = formData.value.lot_id!
    // Get thread_type_id from selected lot
    if (selectedLot.value) {
      request.thread_type_id = selectedLot.value.thread_type_id
    }
  } else {
    request.lot_number = formData.value.lot_number
    if (formData.value.production_date) request.production_date = formData.value.production_date
    if (formData.value.expiry_date) request.expiry_date = formData.value.expiry_date
    if (formData.value.supplier) request.supplier = formData.value.supplier
    if (formData.value.notes) request.notes = formData.value.notes
  }

  const result = await batchReceive(request)
  if (result) {
    showSuccessDialog.value = true
  }
}

function handleNewBatch() {
  showSuccessDialog.value = false
  currentStep.value = 3
  // Keep warehouse and lot selection
}

async function handleBack() {
  if (hasBuffer.value) {
    const confirmed = await confirm({
      title: 'Rời trang?',
      message: 'Danh sách cuộn đã quét sẽ bị mất. Bạn có chắc?',
      type: 'warning'
    })
    if (!confirmed) return
  }
  router.back()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchThreadTypes(), fetchWarehouses()])
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
  max-width: 320px;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-placeholder {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scanned-list-card {
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.scanned-list-container {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.cone-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
