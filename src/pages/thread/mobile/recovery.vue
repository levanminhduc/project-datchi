<template>
  <q-page
    padding
    class="mobile-recovery-page"
  >
    <!-- Offline Sync Banner -->
    <OfflineSyncBanner @show-conflicts="showConflictDialog = true" />

    <!-- Conflict Dialog -->
    <ConflictDialog v-model="showConflictDialog" />

    <!-- Scan Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          <q-icon
            name="qr_code_scanner"
            class="q-mr-xs"
          />
          Quét Mã Cuộn Hoàn Trả
        </div>
        <q-input
          v-model="coneBarcode"
          outlined
          dense
          placeholder="Quét mã cuộn..."
          class="scan-input"
          @keyup.enter="handleInitiateReturn"
        >
          <template #append>
            <q-btn
              flat
              round
              icon="search"
              @click="handleInitiateReturn"
            />
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <!-- Active Recovery Info -->
    <q-card
      v-if="activeRecovery"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <div
            class="color-dot"
            :style="{ backgroundColor: activeRecovery.cone?.thread_type?.color_code || '#ccc' }"
          />
          <div class="col">
            <div class="text-weight-medium">
              {{ activeRecovery.cone?.cone_id }}
            </div>
            <div class="text-caption">
              {{ activeRecovery.cone?.thread_type?.name }} •
              Gốc: {{ formatNumber(activeRecovery.original_meters) }}m
            </div>
          </div>
          <q-badge :color="getStatusColor(activeRecovery.status)">
            {{ getStatusLabel(activeRecovery.status) }}
          </q-badge>
        </div>
      </q-card-section>
    </q-card>

    <!-- Weighing Section -->
    <q-card
      v-if="activeRecovery && needsWeighing"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          <q-icon
            name="scale"
            class="q-mr-xs"
          />
          Cân Cuộn Chỉ
        </div>

        <!-- Scale Connection -->
        <div
          v-if="!scale.isConnected.value"
          class="row q-col-gutter-sm q-mb-md"
        >
          <div class="col">
            <q-btn
              outline
              color="primary"
              icon="usb"
              label="Kết Nối Cân"
              class="full-width"
              :loading="scale.isConnecting.value"
              @click="scale.connect()"
            />
          </div>
          <div class="col">
            <q-btn
              outline
              color="grey"
              icon="edit"
              label="Nhập Tay"
              class="full-width"
              @click="showManualWeight = true"
            />
          </div>
        </div>

        <!-- Scale Display -->
        <div
          v-else
          class="scale-display text-center q-pa-lg rounded-borders q-mb-md"
          style="background: rgba(128, 128, 128, 0.08)"
        >
          <div class="text-h2 text-weight-bold">
            {{ scale.currentWeight.value || 0 }}
          </div>
          <div class="text-subtitle1">
            grams
          </div>
          <q-badge
            :color="scale.isStable.value ? 'positive' : 'warning'"
            class="q-mt-sm"
          >
            {{ scale.isStable.value ? 'Ổn định' : 'Đang cân...' }}
          </q-badge>
        </div>

        <!-- Manual Weight Input -->
        <q-input
          v-if="showManualWeight && !scale.isConnected.value"
          v-model.number="manualWeight"
          type="number"
          label="Nhập trọng lượng (grams)"
          outlined
          class="q-mb-md"
          suffix="g"
        />

        <!-- Calculated Values -->
        <div
          v-if="currentWeight"
          class="q-pa-md rounded-borders"
          style="background: rgba(128, 128, 128, 0.08)"
        >
          <div class="row q-col-gutter-md">
            <div class="col-6 text-center">
              <div class="text-caption text-grey-7">
                Còn lại
              </div>
              <div class="text-h5 text-positive">
                {{ formatNumber(calculatedMeters) }}m
              </div>
            </div>
            <div class="col-6 text-center">
              <div class="text-caption text-grey-7">
                Đã dùng
              </div>
              <div class="text-h5 text-negative">
                {{ formatNumber(calculatedConsumption) }}m
              </div>
            </div>
          </div>
        </div>

        <!-- Weigh Button -->
        <q-btn
          color="primary"
          size="lg"
          class="full-width q-mt-md"
          icon="scale"
          label="Xác Nhận Trọng Lượng"
          :disable="!currentWeight || (scale.isConnected.value && !scale.isStable.value)"
          :loading="isWeighing"
          @click="handleWeightSubmit"
        />
      </q-card-section>
    </q-card>

    <!-- Confirmation Section -->
    <q-card
      v-if="activeRecovery && activeRecovery.status === RecoveryStatus.WEIGHED"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Kết Quả Cân
        </div>
        
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label caption>
                Trọng lượng
              </q-item-label>
              <q-item-label>{{ activeRecovery.returned_weight_grams }}g</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>
                Mét còn lại
              </q-item-label>
              <q-item-label class="text-positive">
                {{ formatNumber(activeRecovery.remaining_meters) }}m
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>
                Đã tiêu thụ
              </q-item-label>
              <q-item-label class="text-negative">
                {{ formatNumber(activeRecovery.consumed_meters) }}m
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section class="row q-col-gutter-sm">
        <!-- Write-off if < 50g -->
        <div
          v-if="(activeRecovery.returned_weight_grams || 0) < 50"
          class="col-12"
        >
          <q-banner class="bg-orange-1 text-orange-9 q-mb-sm">
            <template #avatar>
              <q-icon name="warning" />
            </template>
            Trọng lượng dưới 50g. Đề xuất loại bỏ.
          </q-banner>
        </div>
        
        <div class="col">
          <q-btn
            v-if="(activeRecovery.returned_weight_grams || 0) >= 50"
            color="positive"
            size="lg"
            class="full-width"
            icon="check_circle"
            label="Xác Nhận Nhập Kho"
            :loading="isConfirming"
            @click="handleConfirmRecovery"
          />
        </div>
        <div
          v-if="(activeRecovery.returned_weight_grams || 0) < 50"
          class="col"
        >
          <q-btn
            color="negative"
            size="lg"
            class="full-width"
            icon="delete"
            label="Loại Bỏ"
            @click="showWriteOffDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Pending Recoveries List -->
    <q-card v-if="!activeRecovery && pendingRecoveries.length">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          Chờ Xử Lý
        </div>
      </q-card-section>
      <q-list separator>
        <q-item
          v-for="recovery in pendingRecoveries"
          :key="recovery.id"
          clickable
          @click="selectRecovery(recovery)"
        >
          <q-item-section>
            <q-item-label>{{ recovery.cone?.cone_id }}</q-item-label>
            <q-item-label caption>
              {{ recovery.cone?.thread_type?.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="getStatusColor(recovery.status)">
              {{ getStatusLabel(recovery.status) }}
            </q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Write-off Dialog -->
    <q-dialog
      v-model="showWriteOffDialog"
      persistent
    >
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center">
          <q-icon
            name="warning"
            color="negative"
            size="24px"
            class="q-mr-sm"
          />
          <span class="text-h6">Loại Bỏ Cuộn Chỉ</span>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="writeOffReason"
            label="Lý do"
            outlined
            autofocus
          />
          <q-input
            v-model="approvedBy"
            label="Người phê duyệt (Quản lý)"
            outlined
            class="q-mt-sm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            label="Hủy"
          />
          <q-btn
            flat
            label="Xác Nhận Loại Bỏ"
            color="negative"
            :disable="!writeOffReason || !approvedBy"
            @click="handleWriteOffSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRecovery, useSnackbar, useOfflineOperation } from '@/composables'
import { useScanner, useScale, useAudioFeedback } from '@/composables/hardware'
import { OfflineSyncBanner, ConflictDialog } from '@/components/offline'
import { RecoveryStatus } from '@/types/thread/enums'
import type { Recovery } from '@/types/thread'

const {
  recoveries,
  fetchRecoveries,
  initiateReturn,
  weighCone,
  confirmRecovery,
  writeOffCone,
} = useRecovery()
const snackbar = useSnackbar()
const scale = useScale()
const { playBeep } = useAudioFeedback()
const offline = useOfflineOperation()

// Conflict dialog state
const showConflictDialog = ref(false)

useScanner({
  onScan: (barcode) => {
    coneBarcode.value = barcode
    handleInitiateReturn()
    playBeep('scan')
  }
})

const coneBarcode = ref('')
const activeRecovery = ref<Recovery | null>(null)
const showManualWeight = ref(false)
const manualWeight = ref<number | null>(null)
const isWeighing = ref(false)
const isConfirming = ref(false)
const showWriteOffDialog = ref(false)
const writeOffReason = ref('')
const approvedBy = ref('')

const pendingRecoveries = computed(() =>
  recoveries.value.filter(r =>
    r.status === RecoveryStatus.INITIATED ||
    r.status === RecoveryStatus.PENDING_WEIGH ||
    r.status === RecoveryStatus.WEIGHED
  )
)

const needsWeighing = computed(() =>
  activeRecovery.value?.status === RecoveryStatus.INITIATED ||
  activeRecovery.value?.status === RecoveryStatus.PENDING_WEIGH
)

const currentWeight = computed(() =>
  scale.isConnected.value ? scale.currentWeight.value : manualWeight.value
)

const calculatedMeters = computed(() => {
  if (!currentWeight.value || !activeRecovery.value?.cone?.thread_type?.density_grams_per_meter) {
    return 0
  }
  return (currentWeight.value - (activeRecovery.value.tare_weight_grams || 0)) / activeRecovery.value.cone.thread_type.density_grams_per_meter
})

const calculatedConsumption = computed(() => {
  if (!activeRecovery.value?.original_meters) return 0
  return activeRecovery.value.original_meters - calculatedMeters.value
})

const formatNumber = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '0'
  return val.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
}

const getStatusColor = (status: RecoveryStatus) => {
  const colors: Record<string, string> = {
    [RecoveryStatus.INITIATED]: 'info',
    [RecoveryStatus.PENDING_WEIGH]: 'warning',
    [RecoveryStatus.WEIGHED]: 'blue',
    [RecoveryStatus.CONFIRMED]: 'positive',
    [RecoveryStatus.WRITTEN_OFF]: 'negative',
    [RecoveryStatus.REJECTED]: 'grey',
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: RecoveryStatus) => {
  const labels: Record<string, string> = {
    [RecoveryStatus.INITIATED]: 'Đã khởi tạo',
    [RecoveryStatus.PENDING_WEIGH]: 'Chờ cân',
    [RecoveryStatus.WEIGHED]: 'Đã cân',
    [RecoveryStatus.CONFIRMED]: 'Đã xác nhận',
    [RecoveryStatus.WRITTEN_OFF]: 'Đã loại bỏ',
    [RecoveryStatus.REJECTED]: 'Từ chối',
  }
  return labels[status] || status
}

const handleInitiateReturn = async () => {
  if (!coneBarcode.value) return
  
  const payload = { cone_id: coneBarcode.value }

  // Use offline-aware operation
  const result = await offline.execute({
    type: 'recovery',
    onlineExecutor: () => initiateReturn(payload),
    payload,
    successMessage: 'Đã tạo yêu cầu hoàn trả',
    queuedMessage: 'Đã lưu yêu cầu hoàn trả, sẽ đồng bộ khi có mạng',
  })

  if (result.success && result.data) {
    activeRecovery.value = result.data as Recovery
    playBeep('success')
  } else if (result.queued) {
    playBeep('success')
    snackbar.info('Yêu cầu hoàn trả đã được lưu offline')
  } else {
    playBeep('error')
  }
  coneBarcode.value = ''
}

const selectRecovery = (recovery: Recovery) => {
  activeRecovery.value = recovery
}

const handleWeightSubmit = async () => {
  if (!activeRecovery.value || !currentWeight.value) return
  
  isWeighing.value = true
  try {
    const payload = {
      recovery_id: activeRecovery.value.id,
      weight_grams: currentWeight.value,
    }

    // Use offline-aware operation
    const result = await offline.execute({
      type: 'recovery',
      onlineExecutor: () => weighCone(activeRecovery.value!.id, { weight_grams: currentWeight.value! }),
      payload,
      successMessage: 'Đã lưu trọng lượng',
      queuedMessage: 'Đã lưu trọng lượng, sẽ đồng bộ khi có mạng',
    })

    if (result.success && result.data) {
      activeRecovery.value = result.data as Recovery
      playBeep('success')
    } else if (result.queued) {
      playBeep('success')
    }
  } finally {
    isWeighing.value = false
  }
}

const handleConfirmRecovery = async () => {
  if (!activeRecovery.value) return
  
  isConfirming.value = true
  try {
    const payload = {
      recovery_id: activeRecovery.value.id,
      action: 'confirm',
    }

    // Use offline-aware operation
    const result = await offline.execute({
      type: 'recovery',
      onlineExecutor: () => confirmRecovery(activeRecovery.value!.id),
      payload,
      successMessage: 'Đã xác nhận nhập kho thành công',
      queuedMessage: 'Đã lưu xác nhận, sẽ đồng bộ khi có mạng',
    })

    if (result.success || result.queued) {
      playBeep('success')
      activeRecovery.value = null
      await fetchRecoveries()
    }
  } finally {
    isConfirming.value = false
  }
}

const handleWriteOffSubmit = async () => {
  if (!activeRecovery.value) return
  
  const payload = {
    recovery_id: activeRecovery.value.id,
    action: 'write_off',
    reason: writeOffReason.value,
    approved_by: approvedBy.value,
  }

  // Use offline-aware operation
  const result = await offline.execute({
    type: 'recovery',
    onlineExecutor: () => writeOffCone(activeRecovery.value!.id, {
      reason: writeOffReason.value,
      approved_by: approvedBy.value,
    }),
    payload,
    successMessage: 'Đã loại bỏ cuộn chỉ thành công',
    queuedMessage: 'Đã lưu yêu cầu loại bỏ, sẽ đồng bộ khi có mạng',
  })
  
  if (result.success || result.queued) {
    playBeep('success')
    showWriteOffDialog.value = false
    activeRecovery.value = null
    await fetchRecoveries()
  }
}

onMounted(async () => {
  await Promise.all([
    fetchRecoveries(),
    offline.initialize(),
  ])
})
</script>

<style scoped>
.scan-input :deep(.q-field__control) {
  height: 48px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.scale-display {
  border: 2px dashed #ccc;
}
</style>
