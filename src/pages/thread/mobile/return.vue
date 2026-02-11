<template>
  <q-page
    padding
    class="mobile-return-page"
  >
    <div class="text-h5 q-mt-none q-mb-md">
      <q-icon
        name="assignment_return"
        class="q-mr-sm"
      />
      Nhập Lại Cuộn
    </div>

    <!-- Scan Section -->
    <q-card
      v-if="!scannedCone"
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          <q-icon
            name="qr_code_scanner"
            class="q-mr-xs text-primary"
          />
          Quét Mã Cuộn Cần Nhập Lại
        </div>
        <div class="row q-gutter-sm">
          <q-input
            v-model="barcodeInput"
            outlined
            dense
            placeholder="Quét hoặc nhập mã cuộn..."
            class="col scan-input"
            autofocus
            :loading="isScanning"
            @keyup.enter="handleScan"
          >
            <template #append>
              <q-icon name="qr_code_scanner" />
            </template>
          </q-input>
          <q-btn
            icon="search"
            color="primary"
            unelevated
            :loading="isScanning"
            :disable="!barcodeInput.trim()"
            @click="handleScan"
          />
        </div>
        <div class="text-caption text-grey q-mt-sm">
          Quét cuộn đã được xuất để sản xuất (trạng thái IN_PRODUCTION)
        </div>
      </q-card-section>
    </q-card>

    <!-- Return Form -->
    <q-card
      v-else
      flat
      bordered
    >
      <q-card-section>
        <!-- Header with close button -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            <q-icon
              name="circle"
              :style="{ color: scannedCone.thread_type?.color_code || '#888' }"
              class="q-mr-xs"
            />
            {{ scannedCone.cone_id }}
          </div>
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="clearScanned"
          />
        </div>

        <!-- Cone Info -->
        <div class="q-mb-md bg-grey-2 q-pa-md rounded-borders">
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Loại chỉ
              </div>
              <div class="text-weight-medium">
                {{ scannedCone.thread_type?.name || 'N/A' }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Số lô
              </div>
              <div class="text-weight-medium">
                {{ scannedCone.lot?.lot_number || 'N/A' }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Mét ban đầu
              </div>
              <div class="text-weight-bold text-primary">
                {{ (scannedCone.quantity_meters || 0).toLocaleString('vi-VN') }} m
              </div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">
                Trạng thái
              </div>
              <q-badge :color="getStatusColor(scannedCone.status)">
                {{ getStatusLabel(scannedCone.status) }}
              </q-badge>
            </div>
          </div>
        </div>

        <!-- Issue Item Info (if found) -->
        <q-banner
          v-if="issueItem"
          class="bg-blue-1 q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon
              name="info"
              color="primary"
            />
          </template>
          <div class="text-caption">
            <div>Phiếu xuất: <strong>{{ issueItem.issue_code }}</strong></div>
            <div>Bộ phận: <strong>{{ issueItem.department }}</strong></div>
            <div>Xuất ngày: <strong>{{ formatDate(issueItem.issued_at) }}</strong></div>
          </div>
        </q-banner>

        <!-- Percentage Selector -->
        <PercentageSelector
          v-model="percentage"
          :original-meters="scannedCone.quantity_meters || 0"
        />

        <!-- Notes -->
        <q-input
          v-model="notes"
          outlined
          dense
          type="textarea"
          label="Ghi chú (tùy chọn)"
          :rows="2"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-md">
        <q-space />
        <q-btn
          label="Hủy"
          flat
          color="grey"
          @click="clearScanned"
        />
        <q-btn
          label="Xác Nhận Nhập"
          color="primary"
          unelevated
          :loading="isLoading"
          :disable="!canSubmit"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>

    <!-- Recent Returns (optional) -->
    <q-card
      v-if="returns.length > 0 && !scannedCone"
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">
          Nhập lại gần đây
        </div>
        <q-list
          dense
          separator
        >
          <q-item
            v-for="ret in returns.slice(0, 5)"
            :key="ret.id"
          >
            <q-item-section avatar>
              <q-icon
                name="keyboard_return"
                color="positive"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ ret.cone_code || `Cone #${ret.cone_id}` }}</q-item-label>
              <q-item-label caption>
                {{ ret.remaining_percentage }}% - {{ ret.calculated_remaining_meters.toLocaleString('vi-VN') }}m
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>
                {{ formatDate(ret.returned_at) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
/**
 * Mobile Return Page
 * Nhập lại cuộn lẻ - Return Partial Cones
 *
 * Allows scanning cones that are in production and returning them
 * with a specified remaining percentage.
 */
import { ref, computed, onMounted } from 'vue'
import { useIssueReturns } from '@/composables/thread/useIssueReturns'
import { inventoryService } from '@/services/inventoryService'
import { useSnackbar } from '@/composables/useSnackbar'
import PercentageSelector from '@/components/thread/PercentageSelector.vue'
import type { Cone } from '@/types/thread'

// Composables
const snackbar = useSnackbar()
const { returns, createReturn, fetchReturns, isLoading } = useIssueReturns()

// Barcode input
const barcodeInput = ref('')
const isScanning = ref(false)

// Scanned cone info
const scannedCone = ref<Cone | null>(null)
const issueItem = ref<{
  id: number
  issue_code: string
  department: string
  issued_at: string
} | null>(null)

// Form state
const percentage = ref(100)
const notes = ref('')

// Computed
const canSubmit = computed(() => {
  return scannedCone.value && percentage.value > 0 && percentage.value <= 100
})

/**
 * Handle barcode scan
 */
async function handleScan() {
  if (!barcodeInput.value.trim()) return

  isScanning.value = true
  try {
    // Look up cone by barcode
    const cone = await inventoryService.getByBarcode(barcodeInput.value.trim())

    if (!cone) {
      snackbar.error('Không tìm thấy cuộn')
      return
    }

    // Check if cone is in production (issued)
    if (cone.status !== 'IN_PRODUCTION') {
      snackbar.error(`Cuộn này chưa được xuất kho (trạng thái: ${cone.status})`)
      return
    }

    scannedCone.value = cone

    // Try to find associated issue item
    // Note: This would need a backend endpoint to find issue_item by cone_id
    // For now, we'll use cone info and leave issueItem as null
    // In production, you'd call something like:
    // issueItem.value = await issueService.findIssueItemByCone(cone.id)
    issueItem.value = null

    // Reset form
    percentage.value = 100
    notes.value = ''
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Lỗi khi quét cuộn'
    snackbar.error(errorMessage)
  } finally {
    isScanning.value = false
  }
}

/**
 * Handle return submission
 */
async function handleSubmit() {
  if (!scannedCone.value) return

  // For returns without issue_item_id, we need to find it first
  // or handle via a different endpoint that can look it up by cone_id
  if (!issueItem.value) {
    snackbar.error('Không tìm thấy thông tin xuất kho của cuộn này. Vui lòng liên hệ quản lý.')
    return
  }

  const result = await createReturn({
    issue_item_id: issueItem.value.id,
    cone_id: scannedCone.value.id,
    remaining_percentage: percentage.value,
    notes: notes.value || undefined,
  })

  if (result) {
    snackbar.success('Đã nhập lại cuộn thành công')
    clearScanned()
    barcodeInput.value = ''
    await fetchReturns()
  }
}

/**
 * Clear scanned cone and reset form
 */
function clearScanned() {
  scannedCone.value = null
  issueItem.value = null
  barcodeInput.value = ''
  percentage.value = 100
  notes.value = ''
}

/**
 * Get status color for badge
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'positive',
    IN_PRODUCTION: 'warning',
    DEPLETED: 'grey',
    RETURNED: 'info',
    WRITE_OFF: 'negative',
  }
  return colors[status] || 'grey'
}

/**
 * Get status label in Vietnamese
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Khả dụng',
    IN_PRODUCTION: 'Đang sản xuất',
    DEPLETED: 'Hết',
    RETURNED: 'Đã nhập lại',
    WRITE_OFF: 'Loại bỏ',
  }
  return labels[status] || status
}

/**
 * Format date for display
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Load recent returns on mount
onMounted(async () => {
  await fetchReturns()
})
</script>

<style scoped>
.mobile-return-page {
  max-width: 600px;
  margin: 0 auto;
}

.scan-input :deep(.q-field__control) {
  height: 56px;
  font-size: 1.1rem;
}
</style>
