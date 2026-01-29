<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useScale } from '@/composables/hardware/useScale'

interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'use-manual': []
}>()

const scale = useScale()

const handleConnect = async () => {
  await scale.connect()
}

const handleDisconnect = async () => {
  await scale.disconnect()
}

const handleUseManual = () => {
  emit('use-manual')
  emit('update:modelValue', false)
}
</script>

<template>
  <AppDialog
    :model-value="modelValue"
    title="Kết nối cân điện tử"
    max-width="400px"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <div class="column items-center q-gutter-md q-pa-md">
      <!-- Status Icon -->
      <div class="status-indicator">
        <q-icon
          :name="scale.isConnected.value ? 'sensors' : 'sensors_off'"
          :color="scale.isConnected.value ? 'positive' : 'grey-5'"
          size="64px"
        />
        <q-badge
          floating
          :color="scale.isConnected.value ? 'positive' : 'negative'"
          rounded
        />
      </div>

      <!-- Status Text -->
      <div class="text-center">
        <div class="text-h6">
          {{ scale.isConnected.value ? 'Đã kết nối' : 'Chưa kết nối' }}
        </div>
        <div v-if="scale.error.value" class="text-caption text-negative q-mt-xs">
          {{ scale.error.value }}
        </div>
        <div v-else class="text-caption text-grey-7">
          {{ scale.isConnected.value ? 'Đang nhận dữ liệu từ cân qua cổng Serial' : 'Vui lòng chọn cổng để kết nối với cân USB' }}
        </div>
      </div>

      <!-- Scale Display -->
      <q-card v-if="scale.isConnected.value" flat bordered class="full-width bg-grey-2">
        <q-card-section class="text-center">
          <div class="text-caption text-grey-7">Trọng lượng hiện tại</div>
          <div class="row justify-center items-end q-gutter-xs">
            <span class="text-h3 text-mono">
              {{ scale.currentWeight.value !== null ? scale.currentWeight.value.toFixed(1) : '---.-' }}
            </span>
            <span class="text-h6 text-grey-7 q-mb-xs">g</span>
          </div>
          <q-chip
            v-if="scale.isStable.value"
            dense
            color="positive"
            text-color="white"
            icon="check"
            label="Ổn định"
          />
          <q-chip
            v-else
            dense
            color="amber"
            text-color="black"
            icon="sync"
            label="Đang cân..."
          />
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <div class="column full-width q-gutter-sm">
        <AppButton
          v-if="!scale.isConnected.value"
          label="Chọn cổng & Kết nối"
          color="primary"
          icon="usb"
          :loading="scale.isConnecting.value"
          @click="handleConnect"
        />
        <AppButton
          v-else
          label="Ngắt kết nối"
          color="negative"
          variant="outlined"
          @click="handleDisconnect"
        />
        
        <div class="text-center q-mt-sm">
          <q-btn
            flat
            no-caps
            color="primary"
            label="Sử dụng nhập tay (Fallback)"
            @click="handleUseManual"
          />
        </div>
      </div>
    </div>

    <template #footer-actions>
      <AppButton
        flat
        label="Đóng"
        @click="emit('update:modelValue', false)"
      />
    </template>
  </AppDialog>
</template>

<style scoped>
.status-indicator {
  position: relative;
  display: inline-block;
}
.text-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>
