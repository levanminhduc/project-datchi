<template>
  <q-page
    padding
    class="mobile-issue-scan-page"
  >
    <!-- Header -->
    <q-card
      v-if="currentRequest"
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section class="q-pb-none">
        <div class="text-h6">
          {{ currentRequest.issue_code }}
        </div>
        <div class="text-caption">
          {{ currentRequest.po_number }} | {{ currentRequest.style_code }} | {{ currentRequest.color_name }}
        </div>
        <div class="text-caption">
          Bộ phận: {{ currentRequest.department }}
        </div>
      </q-card-section>
      <q-card-section>
        <QuotaWarning :quota="quotaInfo" />
      </q-card-section>
    </q-card>

    <!-- Loading state -->
    <div
      v-else-if="isLoadingRequest"
      class="text-center q-pa-lg"
    >
      <q-spinner-dots
        color="primary"
        size="40px"
      />
      <div class="q-mt-sm text-grey">
        Đang tải thông tin phiếu xuất...
      </div>
    </div>

    <!-- Error state -->
    <q-banner
      v-else-if="!issueId"
      class="bg-negative text-white q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="error" />
      </template>
      Không tìm thấy mã phiếu xuất. Vui lòng quay lại và chọn phiếu xuất.
    </q-banner>

    <!-- Barcode Input -->
    <q-card
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
          Quét Mã Cuộn
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
            @keyup.enter="handleManualSubmit"
          >
            <template #append>
              <q-icon name="qr_code_scanner" />
            </template>
          </q-input>
          <q-btn
            icon="add"
            color="primary"
            unelevated
            :loading="isScanning"
            :disable="!barcodeInput.trim()"
            @click="handleManualSubmit"
          />
        </div>

        <!-- Over-limit notes (show when needed) -->
        <q-input
          v-if="quotaInfo?.is_over_quota || showOverLimitInput"
          v-model="overLimitNotes"
          outlined
          dense
          label="Lý do vượt định mức *"
          class="q-mt-sm"
          type="textarea"
          :rows="2"
        />
      </q-card-section>
    </q-card>

    <!-- Items List -->
    <IssueItemList
      :items="items"
      :loading="isLoading"
      @remove="handleRemoveItem"
    />

    <!-- Summary -->
    <q-card
      v-if="items.length > 0"
      flat
      bordered
      class="q-mt-md bg-primary text-white"
    >
      <q-card-section>
        <div class="row justify-between items-center">
          <div class="text-subtitle1">
            <q-icon
              name="inventory_2"
              class="q-mr-xs"
            />
            Số cuộn: {{ items.length }}
          </div>
          <div class="text-h6">
            Tổng: {{ totalMeters.toLocaleString('vi-VN') }} m
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
/**
 * Mobile Issue Scan Page
 * Quét mã cuộn để xuất kho - Barcode scanning for cone issuance
 *
 * Allows scanning cones by barcode to add to an issue request.
 * Supports quota checking and over-limit notes.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIssueRequests } from '@/composables/thread/useIssueRequests'
import { useIssueItems } from '@/composables/thread/useIssueItems'
import { inventoryService } from '@/services/inventoryService'
import { useSnackbar } from '@/composables/useSnackbar'
import IssueItemList from '@/components/thread/IssueItemList.vue'
import QuotaWarning from '@/components/thread/QuotaWarning.vue'
import type { IssueItem } from '@/types/thread/issue'

const route = useRoute()
const snackbar = useSnackbar()

// Issue ID from route params - cast to any to bypass TypeScript union check
const issueId = computed((): number | null => {
  const params = route.params as { id?: string }
  return params.id ? Number(params.id) : null
})

// Composables
const { currentRequest, quotaInfo, fetchRequest, checkQuota, isLoading: isLoadingRequest } = useIssueRequests()
const { items, totalMeters, addItem, removeItem, setItems, isLoading, hasCone } = useIssueItems()

// Barcode input state
const barcodeInput = ref('')
const isScanning = ref(false)
const overLimitNotes = ref('')
const showOverLimitInput = ref(false)

// Load request on mount
onMounted(async () => {
  if (issueId.value) {
    await fetchRequest(issueId.value)
    if (currentRequest.value) {
      setItems(currentRequest.value.items || [])
      // Check quota for the issue request
      if (
        currentRequest.value.po_id &&
        currentRequest.value.style_id &&
        currentRequest.value.color_id &&
        currentRequest.value.thread_type_id
      ) {
        await checkQuota(
          currentRequest.value.po_id,
          currentRequest.value.style_id,
          currentRequest.value.color_id,
          currentRequest.value.thread_type_id
        )
      }
    }
  }
})

/**
 * Handle barcode scan/input
 * Looks up cone by barcode and adds to issue items
 */
async function handleBarcodeScan(barcode: string) {
  if (!barcode.trim() || !issueId.value) return

  isScanning.value = true
  try {
    // Look up cone by barcode
    const cone = await inventoryService.getByBarcode(barcode.trim())

    if (!cone) {
      snackbar.error('Không tìm thấy cuộn')
      return
    }

    // Check if cone is available
    if (cone.status !== 'AVAILABLE') {
      snackbar.error(`Cuộn này không khả dụng (trạng thái: ${cone.status})`)
      return
    }

    // Check if cone already added
    if (hasCone(cone.id)) {
      snackbar.info('Cuộn này đã được thêm vào phiếu')
      return
    }

    // Check if cone thread type matches (if request has specific thread type)
    if (currentRequest.value?.thread_type_id && cone.thread_type_id !== currentRequest.value.thread_type_id) {
      snackbar.error('Loại chỉ không khớp với phiếu xuất')
      return
    }

    // Check quota
    const willExceedQuota =
      quotaInfo.value?.is_over_quota ||
      (quotaInfo.value && totalMeters.value + cone.quantity_meters > quotaInfo.value.remaining_meters)

    if (willExceedQuota) {
      showOverLimitInput.value = true
      if (!overLimitNotes.value.trim()) {
        snackbar.warning('Vui lòng nhập lý do vượt định mức trước khi thêm cuộn')
        return
      }
    }

    // Add item to issue request
    await addItem(issueId.value, {
      cone_id: cone.id,
      over_limit_notes: willExceedQuota ? overLimitNotes.value : undefined,
    })

    // Clear input after success
    barcodeInput.value = ''
    if (!quotaInfo.value?.is_over_quota) {
      overLimitNotes.value = ''
      showOverLimitInput.value = false
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Lỗi khi thêm cuộn'
    snackbar.error(errorMessage)
  } finally {
    isScanning.value = false
  }
}

/**
 * Handle manual barcode submission
 */
function handleManualSubmit() {
  handleBarcodeScan(barcodeInput.value)
}

/**
 * Handle removing an item from the list
 */
async function handleRemoveItem(item: IssueItem) {
  if (!issueId.value) return
  await removeItem(issueId.value, item.id)
}
</script>

<style scoped>
.mobile-issue-scan-page {
  max-width: 600px;
  margin: 0 auto;
}

.scan-input :deep(.q-field__control) {
  height: 56px;
  font-size: 1.1rem;
}
</style>
