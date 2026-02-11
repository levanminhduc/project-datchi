<script setup lang="ts">
/**
 * Issue Request Detail Page
 * Chi tiết phiếu xuất kho sản xuất
 *
 * Shows issue request info, manages cones, and handles returns
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useIssueRequests } from '@/composables/thread/useIssueRequests'
import { useIssueItems } from '@/composables/thread/useIssueItems'
import { useIssueReturns } from '@/composables/thread/useIssueReturns'
import { useSnackbar } from '@/composables'
import QuotaWarning from '@/components/thread/QuotaWarning.vue'
import IssueItemList from '@/components/thread/IssueItemList.vue'
import ReturnForm from '@/components/thread/ReturnForm.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { QrScannerDialog } from '@/components/qr'
import { IssueRequestStatus, type IssueItem, type IssueReturn, type CreateIssueReturnDTO } from '@/types/thread/issue'

const route = useRoute('/thread/issues/[id]')
const router = useRouter()
const $q = useQuasar()
const snackbar = useSnackbar()

// Get ID from route params
const issueId = computed(() => Number(route.params.id as string))

// Composables
const {
  currentRequest,
  quotaInfo,
  isLoading: loadingRequest,
  fetchRequest,
  checkQuota,
  cancelRequest,
  updateNotes,
} = useIssueRequests()

const {
  items,
  isLoading: loadingItems,
  addItem,
  removeItem,
  setItems,
} = useIssueItems()

const {
  returns,
  isLoading: loadingReturns,
  fetchReturns,
  createReturn,
} = useIssueReturns()

// Local state
const activeTab = ref<'items' | 'returns'>('items')
const showAddConeDialog = ref(false)
const showReturnDialog = ref(false)
const showQrScanner = ref(false)
const barcodeInput = ref('')
const selectedItemForReturn = ref<IssueItem | null>(null)

// Computed
const isReadonly = computed(() =>
  currentRequest.value?.status === IssueRequestStatus.COMPLETED ||
  currentRequest.value?.status === IssueRequestStatus.CANCELLED
)

const canAddCones = computed(() =>
  currentRequest.value?.status === IssueRequestStatus.PENDING ||
  currentRequest.value?.status === IssueRequestStatus.PARTIAL
)

const progressPercent = computed(() => {
  if (!currentRequest.value) return 0
  const { issued_meters, requested_meters } = currentRequest.value
  if (!requested_meters) return 0
  return Math.min(100, Math.round((issued_meters / requested_meters) * 100))
})

// Status styling
const statusColor = (status: IssueRequestStatus) => {
  switch (status) {
    case IssueRequestStatus.PENDING: return 'grey'
    case IssueRequestStatus.PARTIAL: return 'warning'
    case IssueRequestStatus.COMPLETED: return 'positive'
    case IssueRequestStatus.CANCELLED: return 'negative'
    default: return 'grey'
  }
}

const statusLabel = (status: IssueRequestStatus) => {
  switch (status) {
    case IssueRequestStatus.PENDING: return 'Chờ xuất'
    case IssueRequestStatus.PARTIAL: return 'Đang xuất'
    case IssueRequestStatus.COMPLETED: return 'Hoàn thành'
    case IssueRequestStatus.CANCELLED: return 'Đã hủy'
    default: return status
  }
}

// Load data
async function loadData() {
  await fetchRequest(issueId.value)
  if (currentRequest.value) {
    setItems(currentRequest.value.items || [])

    // Check quota for this combination
    await checkQuota(
      currentRequest.value.po_id,
      currentRequest.value.style_id,
      currentRequest.value.color_id,
      currentRequest.value.thread_type_id
    )
  }
}

// Add cone by barcode
async function handleAddCone() {
  const code = barcodeInput.value.trim()
  if (!code) {
    snackbar.warning('Vui long nhap ma cuon')
    return
  }

  // TODO: Look up cone_id from barcode/code
  // For now, assume code is cone_id
  const coneId = parseInt(code, 10)
  if (isNaN(coneId)) {
    snackbar.error('Ma cuon khong hop le')
    return
  }

  const result = await addItem(issueId.value, { cone_id: coneId })
  if (result) {
    barcodeInput.value = ''
    await loadData() // Refresh to get updated totals
  }
}

// QR scan handler
function handleQrScan(code: string) {
  barcodeInput.value = code
  showQrScanner.value = false
  handleAddCone()
}

// Remove cone
async function handleRemoveCone(item: IssueItem) {
  $q.dialog({
    title: 'Xac nhan',
    message: `Ban co chac muon go cuon ${item.cone_code || item.cone_id} khoi phieu xuat?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await removeItem(issueId.value, item.id)
    await loadData()
  })
}

// Open return dialog
function openReturnDialog(item: IssueItem) {
  selectedItemForReturn.value = item
  showReturnDialog.value = true
}

// Submit return
async function handleReturnSubmit(data: CreateIssueReturnDTO) {
  const result = await createReturn(data)
  if (result) {
    showReturnDialog.value = false
    selectedItemForReturn.value = null
    await loadData()
  }
}

// Cancel request
function handleCancelRequest() {
  $q.dialog({
    title: 'Xac nhan huy',
    message: 'Ban co chac muon huy phieu xuat nay? Thao tac nay khong the hoan tac.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await cancelRequest(issueId.value)
    if (success) {
      router.push('/thread/issues')
    }
  })
}

// Load returns when tab changes
watch(activeTab, async (tab) => {
  if (tab === 'returns') {
    await fetchReturns(issueId.value)
  }
})

// Format date helper
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('vi-VN')
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('vi-VN')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.back()"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">
          {{ currentRequest?.issue_code || 'Chi tiết phiếu xuất' }}
        </h1>
        <div
          v-if="currentRequest"
          class="text-grey-6"
        >
          {{ currentRequest.po_number }} - {{ currentRequest.style_code }}
        </div>
      </div>
      <q-space />
      <q-badge
        v-if="currentRequest"
        :color="statusColor(currentRequest.status)"
        :label="statusLabel(currentRequest.status)"
        class="text-body2 q-pa-sm"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="loadingRequest"
      class="row justify-center q-py-xl"
    >
      <q-spinner
        size="lg"
        color="primary"
      />
    </div>

    <!-- Content -->
    <template v-else-if="currentRequest">
      <!-- Request Info Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Basic Info -->
        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Thông tin phiếu
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    PO
                  </div>
                  <div class="text-body1">
                    {{ currentRequest.po_number }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Mã hàng
                  </div>
                  <div class="text-body1">
                    {{ currentRequest.style_code }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Màu
                  </div>
                  <div class="text-body1 row items-center no-wrap q-gutter-xs">
                    <div
                      v-if="currentRequest.color_hex"
                      class="color-swatch"
                      :style="{ backgroundColor: currentRequest.color_hex }"
                    />
                    <span>{{ currentRequest.color_name }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Loại chỉ
                  </div>
                  <div class="text-body1">
                    {{ currentRequest.thread_type_name }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Bộ phận
                  </div>
                  <div class="text-body1">
                    {{ currentRequest.department }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-6">
                    Ngày tạo
                  </div>
                  <div class="text-body1">
                    {{ formatDate(currentRequest.created_at) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Quota & Progress -->
        <div class="col-12 col-md-6">
          <q-card
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                Tiến độ xuất kho
              </div>
              <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-4">
                  <div class="text-caption text-grey-6">
                    Định mức
                  </div>
                  <div class="text-body1 text-weight-medium">
                    {{ currentRequest.quota_meters.toLocaleString() }} m
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-caption text-grey-6">
                    Yêu cầu
                  </div>
                  <div class="text-body1">
                    {{ currentRequest.requested_meters.toLocaleString() }} m
                  </div>
                </div>
                <div class="col-4">
                  <div class="text-caption text-grey-6">
                    Đã xuất
                  </div>
                  <div class="text-body1 text-primary text-weight-medium">
                    {{ currentRequest.issued_meters.toLocaleString() }} m
                  </div>
                </div>
              </div>

              <q-linear-progress
                :value="progressPercent / 100"
                :color="progressPercent >= 100 ? 'positive' : 'primary'"
                size="24px"
                rounded
                class="q-mb-sm"
              >
                <div class="absolute-full flex flex-center">
                  <q-badge
                    color="white"
                    text-color="dark"
                    :label="`${progressPercent}%`"
                  />
                </div>
              </q-linear-progress>

              <!-- Quota Warning -->
              <QuotaWarning
                v-if="quotaInfo"
                :quota="quotaInfo"
                :requested-meters="currentRequest.requested_meters"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Notes -->
      <q-card
        v-if="currentRequest.notes"
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="text-subtitle2 text-grey-7">
            Ghi chú
          </div>
          <div class="text-body1">
            {{ currentRequest.notes }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabs: Items vs Returns -->
      <q-card
        flat
        bordered
      >
        <q-tabs
          v-model="activeTab"
          align="left"
          class="text-primary"
          indicator-color="primary"
        >
          <q-tab
            name="items"
            label="Cuộn đã xuất"
            icon="inventory_2"
          />
          <q-tab
            name="returns"
            label="Cuộn nhập lại"
            icon="assignment_return"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="activeTab"
          animated
        >
          <!-- Items Panel -->
          <q-tab-panel name="items">
            <!-- Add Cone Section -->
            <div
              v-if="canAddCones"
              class="row q-gutter-sm q-mb-md"
            >
              <AppInput
                v-model="barcodeInput"
                label="Mã cuộn / Barcode"
                placeholder="Nhập hoặc quét mã cuộn..."
                class="col"
                @keyup.enter="handleAddCone"
              />
              <AppButton
                icon="qr_code_scanner"
                color="primary"
                outline
                @click="showQrScanner = true"
              >
                <q-tooltip>Quét QR</q-tooltip>
              </AppButton>
              <AppButton
                label="Thêm cuộn"
                icon="add"
                color="primary"
                :loading="loadingItems"
                @click="handleAddCone"
              />
            </div>

            <!-- Items List -->
            <IssueItemList
              :items="items"
              :readonly="isReadonly"
              :loading="loadingItems"
              @remove="handleRemoveCone"
            />

            <!-- Return Button for each item -->
            <div
              v-if="items.length > 0 && !isReadonly"
              class="q-mt-md"
            >
              <div class="text-subtitle2 text-grey-7 q-mb-sm">
                Nhập lại cuộn lẻ
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  v-for="item in items"
                  :key="item.id"
                  :label="`Nhập lại ${item.cone_code || item.cone_id}`"
                  icon="assignment_return"
                  size="sm"
                  color="secondary"
                  outline
                  @click="openReturnDialog(item)"
                />
              </div>
            </div>
          </q-tab-panel>

          <!-- Returns Panel -->
          <q-tab-panel name="returns">
            <q-table
              :rows="returns"
              :columns="[
                { name: 'cone_code', label: 'Mã Cuộn', field: 'cone_code', align: 'left' },
                { name: 'original_meters', label: 'Mét Gốc', field: 'original_meters', align: 'right', format: (v: number) => v.toLocaleString() },
                { name: 'remaining_percentage', label: '% Còn Lại', field: 'remaining_percentage', align: 'center', format: (v: number) => `${v}%` },
                { name: 'calculated_remaining_meters', label: 'Mét Nhập', field: 'calculated_remaining_meters', align: 'right', format: (v: number) => v.toLocaleString() },
                { name: 'returned_at', label: 'Thời Gian', field: 'returned_at', align: 'left', format: (v: string) => formatDateTime(v) },
                { name: 'notes', label: 'Ghi Chú', field: 'notes', align: 'left' },
              ]"
              row-key="id"
              :loading="loadingReturns"
              flat
              bordered
              :pagination="{ rowsPerPage: 10 }"
            >
              <template #no-data>
                <div class="text-center q-pa-lg text-grey">
                  Chưa có cuộn nào được nhập lại
                </div>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <!-- Action Buttons -->
      <div
        v-if="!isReadonly"
        class="row justify-end q-mt-lg q-gutter-sm"
      >
        <AppButton
          label="Hủy Phiếu"
          icon="cancel"
          color="negative"
          outline
          @click="handleCancelRequest"
        />
      </div>
    </template>

    <!-- Not Found -->
    <div
      v-else
      class="text-center q-pa-xl text-grey"
    >
      <q-icon
        name="search_off"
        size="64px"
        class="q-mb-md"
      />
      <div class="text-h6">
        Không tìm thấy phiếu xuất
      </div>
      <AppButton
        label="Quay lại danh sách"
        icon="arrow_back"
        class="q-mt-md"
        @click="router.push('/thread/issues')"
      />
    </div>

    <!-- QR Scanner Dialog -->
    <QrScannerDialog
      v-model="showQrScanner"
      title="Quét mã QR Cuộn"
      :formats="['qr_code', 'code_128', 'ean_13']"
      hint="Đưa mã QR hoặc barcode của cuộn chỉ vào khung"
      @confirm="handleQrScan"
    />

    <!-- Return Dialog -->
    <q-dialog
      v-model="showReturnDialog"
      persistent
    >
      <ReturnForm
        v-if="selectedItemForReturn"
        :issue-item-id="selectedItemForReturn.id"
        :cone-id="selectedItemForReturn.cone_id"
        :cone-code="selectedItemForReturn.cone_code || String(selectedItemForReturn.cone_id)"
        :original-meters="selectedItemForReturn.quantity_meters"
        :loading="loadingReturns"
        @submit="handleReturnSubmit"
        @cancel="showReturnDialog = false"
      />
    </q-dialog>
  </q-page>
</template>

<style scoped>
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
