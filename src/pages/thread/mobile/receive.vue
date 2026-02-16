<template>
  <q-page
    padding
    class="mobile-receive-page"
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
          Quét Mã Loại Chỉ
        </div>
        <q-input
          v-model="threadTypeCode"
          outlined
          dense
          placeholder="Quét hoặc nhập mã..."
          class="scan-input"
          @keyup.enter="lookupThreadType"
        >
          <template #append>
            <q-btn
              flat
              round
              icon="search"
              @click="lookupThreadType"
            />
          </template>
        </q-input>
      </q-card-section>
      
      <!-- Selected Thread Type Info -->
      <q-card-section v-if="selectedThreadType">
        <div class="row items-center q-gutter-sm">
          <div
            class="color-dot"
            :style="{ backgroundColor: selectedThreadType.color_data?.hex_code || '#ccc' }"
          />
          <div>
            <div class="text-weight-medium">
              {{ selectedThreadType.name }}
            </div>
            <div class="text-caption text-grey-7">
              {{ selectedThreadType.code }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Quantity Section -->
    <q-card
      v-if="selectedThreadType"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          Số Lượng Cuộn
        </div>
        <div class="row items-center justify-center q-gutter-md">
          <q-btn
            round
            color="negative"
            icon="remove"
            size="lg"
            :disable="quantity <= 1"
            @click="quantity--"
          />
          <q-input
            v-model.number="quantity"
            type="number"
            outlined
            class="quantity-input text-center"
            input-class="text-h4 text-center"
          />
          <q-btn
            round
            color="positive"
            icon="add"
            size="lg"
            @click="quantity++"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Weight Section (Optional) -->
    <q-card
      v-if="selectedThreadType"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          Trọng Lượng (Tùy Chọn)
        </div>
        
        <div
          v-if="!scale.isConnected.value"
          class="row q-col-gutter-sm"
        >
          <div class="col">
            <q-btn
              outline
              color="primary"
              icon="usb"
              label="Kết Nối Cân"
              class="full-width"
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
        
        <div
          v-else
          class="scale-display text-center q-pa-md bg-grey-2 rounded-borders"
        >
          <div class="text-h3">
            {{ scale.currentWeight.value || 0 }} g
          </div>
          <q-badge :color="scale.isStable.value ? 'positive' : 'warning'">
            {{ scale.isStable.value ? 'Ổn định' : 'Đang cân...' }}
          </q-badge>
        </div>

        <div
          v-if="showManualWeight && !scale.isConnected.value"
          class="q-mt-sm"
        >
          <q-input
            v-model.number="manualWeight"
            type="number"
            label="Trọng lượng (grams)"
            outlined
            dense
            suffix="g"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Warehouse & Location -->
    <q-card
      v-if="selectedThreadType"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <AppSelect
              v-model="warehouseId"
              :options="warehouseOptions"
              label="Kho"
              dense
              use-input
              fill-input
              hide-selected
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="location"
              label="Vị trí"
              outlined
              dense
              placeholder="A1-01"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Confirm Button -->
    <q-btn
      v-if="selectedThreadType"
      color="primary"
      size="lg"
      class="full-width confirm-btn"
      icon="check"
      :label="`Nhập ${quantity} Cuộn`"
      :loading="isSubmitting"
      @click="confirmReceive"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInventory, useThreadTypes, useSnackbar, useWarehouses, useOfflineOperation } from '@/composables'
import { useScale, useScanner, useAudioFeedback } from '@/composables/hardware'
import { OfflineSyncBanner, ConflictDialog } from '@/components/offline'
import type { ThreadType } from '@/types/thread'

const { threadTypes, fetchThreadTypes } = useThreadTypes()
const { receiveStock } = useInventory()
const snackbar = useSnackbar()
const { warehouseOptions, fetchWarehouses } = useWarehouses()
const scale = useScale()
const { playBeep } = useAudioFeedback()
const offline = useOfflineOperation()

// Conflict dialog state
const showConflictDialog = ref(false)

useScanner({
  onScan: (barcode) => {
    threadTypeCode.value = barcode
    lookupThreadType()
    playBeep('scan')
  }
})

// Form state
const threadTypeCode = ref('')
const selectedThreadType = ref<ThreadType | null>(null)
const quantity = ref(1)
const warehouseId = ref(1)
const location = ref('')
const isSubmitting = ref(false)
const showManualWeight = ref(false)
const manualWeight = ref<number | null>(null)

const lookupThreadType = () => {
  if (!threadTypeCode.value) return
  
  const found = threadTypes.value.find(t => t.code === threadTypeCode.value)
  if (found) {
    selectedThreadType.value = found
    playBeep('success')
  } else {
    snackbar.error('Không tìm thấy loại chỉ')
    playBeep('error')
    selectedThreadType.value = null
  }
}

const confirmReceive = async () => {
  if (!selectedThreadType.value) return
  
  isSubmitting.value = true
  try {
    const weight = scale.isConnected.value 
      ? scale.currentWeight.value 
      : (showManualWeight.value ? manualWeight.value : null)

    const payload = {
      thread_type_id: selectedThreadType.value.id,
      warehouse_id: warehouseId.value,
      quantity_cones: quantity.value,
      weight_per_cone_grams: weight || undefined,
      location: location.value || undefined,
    }

    // Use offline-aware operation
    const result = await offline.execute({
      type: 'stock_receipt',
      onlineExecutor: () => receiveStock({ ...payload }),
      payload,
      successMessage: `Đã nhập ${quantity.value} cuộn thành công`,
      queuedMessage: 'Đã lưu thao tác nhập kho, sẽ đồng bộ khi có mạng',
    })
    
    if (result.success || result.queued) {
      playBeep('success')
      
      // Reset form
      threadTypeCode.value = ''
      selectedThreadType.value = null
      quantity.value = 1
      location.value = ''
      manualWeight.value = null
      showManualWeight.value = false
    } else {
      playBeep('error')
    }
  } catch (err) {
    playBeep('error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchThreadTypes(),
    fetchWarehouses(),
    offline.initialize(),
  ])
})
</script>

<style scoped>
.scan-input :deep(.q-field__control) {
  height: 48px;
}

.quantity-input {
  width: 120px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  height: 56px;
  font-size: 18px;
  margin-top: 24px;
}

.scale-display {
  border: 1px dashed rgba(128, 128, 128, 0.4);
}
</style>
