<template>
  <q-page
    padding
    class="mobile-issue-page"
  >
    <!-- Offline Sync Banner -->
    <OfflineSyncBanner @show-conflicts="showConflictDialog = true" />

    <!-- Conflict Dialog -->
    <ConflictDialog v-model="showConflictDialog" />

    <!-- Mode Selection -->
    <q-btn-toggle
      v-model="mode"
      spread
      class="q-mb-md"
      toggle-color="primary"
      unelevated
      :options="[
        { label: 'Quét Đơn', value: 'allocation' },
        { label: 'Danh Sách', value: 'list' }
      ]"
    />

    <!-- Allocation Mode: Scan allocation ID -->
    <template v-if="mode === 'allocation'">
      <q-card class="q-mb-md shadow-2 border-radius-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            <q-icon
              name="assignment"
              class="q-mr-xs text-primary"
            />
            Quét Mã Đơn Phân Bổ
          </div>
          <q-input
            v-model="allocationCode"
            outlined
            dense
            placeholder="Quét mã đơn..."
            class="scan-input"
            autofocus
            @keyup.enter="lookupAllocation"
          >
            <template #append>
              <q-icon name="qr_code_scanner" />
            </template>
          </q-input>
        </q-card-section>
      </q-card>
    </template>

    <!-- List Mode: Show pending allocations -->
    <template v-else>
      <div class="text-subtitle2 q-mb-sm text-grey-8">
        Đơn chờ xuất xưởng
      </div>
      <q-list
        separator
        bordered
        class="rounded-borders q-mb-md"
      >
        <q-item
          v-for="alloc in pendingAllocations"
          :key="alloc.id"
          v-ripple
          clickable
          :class="{ 'bg-blue-1': selectedAllocation?.id === alloc.id }"
          @click="selectAllocation(alloc)"
        >
          <q-item-section>
            <q-item-label class="text-weight-bold">
              {{ alloc.order_id }}
            </q-item-label>
            <q-item-label caption>
              {{ alloc.thread_type?.name }} - {{ alloc.requested_meters }}m
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="getStatusColor(alloc.status)">
              {{ getStatusLabel(alloc.status) }}
            </q-badge>
          </q-item-section>
        </q-item>
        
        <q-item v-if="!pendingAllocations.length && !isLoading">
          <q-item-section class="text-center text-grey-6 q-pa-md">
            <q-icon
              name="inbox"
              size="32px"
              class="q-mb-xs"
            />
            <div>Không có đơn chờ xuất</div>
          </q-item-section>
        </q-item>

        <q-item v-if="isLoading">
          <q-item-section class="text-center text-grey-6 q-pa-md">
            <q-spinner-dots
              color="primary"
              size="2em"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Selected Allocation Info -->
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <q-card
        v-if="selectedAllocation"
        class="q-mb-md bg-primary-1 border-primary"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center justify-between no-wrap">
            <div class="ellipsis">
              <div class="text-h6 text-primary">
                {{ selectedAllocation.order_id }}
              </div>
              <div class="text-caption text-weight-medium">
                {{ selectedAllocation.thread_type?.name }} •
                {{ selectedAllocation.requested_meters }}m yêu cầu
              </div>
            </div>
            <q-btn
              flat
              round
              dense
              icon="close"
              color="grey-7"
              @click="selectedAllocation = null"
            />
          </div>
        </q-card-section>
        
        <!-- Allocated Cones List -->
        <q-card-section v-if="selectedAllocation.allocated_cones?.length">
          <div class="text-subtitle2 q-mb-sm row items-center">
            <q-icon
              name="list"
              class="q-mr-xs"
            />
            Cuộn đã phân bổ:
          </div>
          <q-list
            dense
            separator
            class="rounded-borders"
          >
            <q-item
              v-for="ac in selectedAllocation.allocated_cones"
              :key="ac.id"
            >
              <q-item-section avatar>
                <q-icon
                  name="inventory_2"
                  color="primary"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ ac.cone?.cone_id }}
                </q-item-label>
                <q-item-label caption>
                  {{ ac.allocated_meters }}m
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :name="issuedCones.includes(ac.cone_id) ? 'check_circle' : 'radio_button_unchecked'"
                  :color="issuedCones.includes(ac.cone_id) ? 'positive' : 'grey-4'"
                  size="24px"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </transition>

    <!-- Scan Cones Section -->
    <q-card
      v-if="selectedAllocation"
      class="q-mb-md shadow-2 border-radius-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          <q-icon
            name="qr_code_scanner"
            class="q-mr-xs text-primary"
          />
          Quét Cuộn Chỉ Để Xuất
        </div>
        <q-input
          ref="coneInputRef"
          v-model="coneBarcode"
          outlined
          dense
          placeholder="Quét mã cuộn..."
          class="scan-input"
          @keyup.enter="scanCone"
        >
          <template #append>
            <q-icon name="qr_code" />
          </template>
        </q-input>
        
        <div class="q-mt-md flex justify-between items-center">
          <div class="text-caption text-grey-7">
            Đã quét: <span class="text-weight-bold text-primary">{{ issuedCones.length }}</span> / {{ selectedAllocation.allocated_cones?.length || 0 }} cuộn
          </div>
          <q-linear-progress 
            :value="scanProgress" 
            color="primary" 
            class="q-mt-xs" 
            style="width: 60%"
            rounded
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Issue All Button -->
    <div
      v-if="selectedAllocation"
      class="q-gutter-y-sm"
    >
      <q-btn
        color="positive"
        size="lg"
        class="full-width confirm-btn shadow-3"
        icon="local_shipping"
        label="Xác Nhận Xuất Xưởng"
        :loading="isSubmitting"
        :disabled="!canIssue"
        unelevated
        @click="handleIssueAllocation"
      />
      
      <div
        v-if="!canIssue"
        class="text-caption text-negative text-center q-px-md"
      >
        Vui lòng quét đủ tất cả các cuộn chỉ đã phân bổ trước khi xuất xưởng.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAllocations, useSnackbar, useOfflineOperation } from '@/composables'
import { useScanner, useAudioFeedback } from '@/composables/hardware'
import { OfflineSyncBanner, ConflictDialog } from '@/components/offline'
import { AllocationStatus } from '@/types/thread/enums'
import type { Allocation } from '@/types/thread/allocation'

// Composables
const {
  allocations,
  isLoading,
  fetchAllocations,
  issueAllocation: issueAlloc,
} = useAllocations()
const snackbar = useSnackbar()
const { playBeep } = useAudioFeedback()
const offline = useOfflineOperation()

// Conflict dialog state
const showConflictDialog = ref(false)

// Refs
const mode = ref<'allocation' | 'list'>('list')
const allocationCode = ref('')
const selectedAllocation = ref<Allocation | null>(null)
const coneBarcode = ref('')
const issuedCones = ref<number[]>([]) // Stores cone PK IDs
const isSubmitting = ref(false)
const coneInputRef = ref<any>(null)

// Hardware Scanner Integration
useScanner({
  onScan: (barcode) => {
    if (mode.value === 'allocation' && !selectedAllocation.value) {
      allocationCode.value = barcode
      lookupAllocation()
    } else if (selectedAllocation.value) {
      coneBarcode.value = barcode
      scanCone()
    }
  }
})

// Computed
const pendingAllocations = computed(() => 
  allocations.value.filter(a => 
    a.status === AllocationStatus.SOFT || a.status === AllocationStatus.PENDING
  )
)

const scanProgress = computed(() => {
  if (!selectedAllocation.value?.allocated_cones?.length) return 0
  return issuedCones.value.length / selectedAllocation.value.allocated_cones.length
})

const canIssue = computed(() => {
  if (!selectedAllocation.value?.allocated_cones?.length) return false
  return issuedCones.value.length === selectedAllocation.value.allocated_cones.length
})

// Methods
const getStatusLabel = (status: AllocationStatus) => {
  const labels: Record<string, string> = {
    [AllocationStatus.PENDING]: 'Đang chờ',
    [AllocationStatus.SOFT]: 'Sẵn sàng',
    [AllocationStatus.HARD]: 'Đã chốt',
    [AllocationStatus.ISSUED]: 'Đã xuất',
    [AllocationStatus.CANCELLED]: 'Đã hủy',
    [AllocationStatus.WAITLISTED]: 'Chờ hàng'
  }
  return labels[status] || status
}

const getStatusColor = (status: AllocationStatus) => {
  const colors: Record<string, string> = {
    [AllocationStatus.PENDING]: 'orange',
    [AllocationStatus.SOFT]: 'blue',
    [AllocationStatus.HARD]: 'indigo',
    [AllocationStatus.ISSUED]: 'positive',
    [AllocationStatus.CANCELLED]: 'grey',
    [AllocationStatus.WAITLISTED]: 'purple'
  }
  return colors[status] || 'grey'
}

const lookupAllocation = () => {
  if (!allocationCode.value) return

  const found = allocations.value.find(a => 
    a.order_id.toLowerCase() === allocationCode.value.toLowerCase() ||
    a.order_reference?.toLowerCase() === allocationCode.value.toLowerCase()
  )

  if (found) {
    if (found.status !== AllocationStatus.SOFT && found.status !== AllocationStatus.PENDING) {
      snackbar.warning(`Đơn này đang ở trạng thái ${getStatusLabel(found.status)}`)
      playBeep('error')
    } else {
      selectAllocation(found)
      playBeep('success')
    }
  } else {
    snackbar.error('Không tìm thấy đơn phân bổ')
    playBeep('error')
  }
  
  allocationCode.value = ''
}

const selectAllocation = (alloc: Allocation) => {
  selectedAllocation.value = alloc
  issuedCones.value = []
  
  // Focus cone input on next tick
  nextTick(() => {
    coneInputRef.value?.focus()
  })
}

const scanCone = () => {
  if (!selectedAllocation.value?.allocated_cones?.length) {
    coneBarcode.value = ''
    return
  }
  
  const barcode = coneBarcode.value.trim()
  if (!barcode) return

  // Find the cone in the allocated list
  const ac = selectedAllocation.value.allocated_cones.find(
    item => item.cone?.cone_id.toLowerCase() === barcode.toLowerCase()
  )
  
  if (ac) {
    if (issuedCones.value.includes(ac.cone_id)) {
      snackbar.info('Cuộn này đã được quét')
      playBeep('scan')
    } else {
      issuedCones.value.push(ac.cone_id)
      playBeep('success')
    }
  } else {
    snackbar.warning('Cuộn này không thuộc đơn phân bổ hiện tại')
    playBeep('error')
  }
  
  coneBarcode.value = ''
}

const handleIssueAllocation = async () => {
  if (!selectedAllocation.value) return
  
  if (!canIssue.value) {
    snackbar.warning('Vui lòng quét đủ số lượng cuộn trước khi xuất xưởng')
    return
  }
  
  isSubmitting.value = true
  try {
    const allocationId = selectedAllocation.value.id
    const payload = {
      allocation_id: allocationId,
      cone_ids: issuedCones.value,
    }

    // Use offline-aware operation
    const result = await offline.execute({
      type: 'issue',
      onlineExecutor: () => issueAlloc(allocationId),
      payload,
      successMessage: 'Đã xuất xưởng thành công',
      queuedMessage: 'Đã lưu thao tác xuất xưởng, sẽ đồng bộ khi có mạng',
    })

    if (result.success || result.queued) {
      playBeep('success')
      
      // Reset state after success
      selectedAllocation.value = null
      issuedCones.value = []
      
      // Refresh list
      await fetchAllocations({ status: AllocationStatus.SOFT })
    } else {
      playBeep('error')
    }
  } catch (err) {
    playBeep('error')
  } finally {
    isSubmitting.value = false
  }
}

// Initialization
onMounted(async () => {
  await Promise.all([
    fetchAllocations({ status: AllocationStatus.SOFT }),
    offline.initialize(),
  ])
})
</script>

<style scoped>
.mobile-issue-page {
  max-width: 600px;
  margin: 0 auto;
}

.scan-input :deep(.q-field__control) {
  height: 56px;
  font-size: 1.1rem;
}

.confirm-btn {
  height: 64px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 12px;
}

.bg-primary-1 {
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.border-primary {
  border: 1px solid rgba(var(--q-primary-rgb), 0.2);
}

.border-radius-md {
  border-radius: 12px;
}

.border-grey-3 {
  border: 1px solid rgba(128, 128, 128, 0.3);
}
</style>
