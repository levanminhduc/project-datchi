<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { useScanner } from '@/composables/hardware/useScanner'
import { useAudioFeedback } from '@/composables/hardware/useAudioFeedback'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Mã vạch',
  placeholder: 'Quét hoặc nhập mã vạch...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'scan': [value: string]
}>()

const { playBeep } = useAudioFeedback()
const isManualMode = ref(false)
const inputRef = ref<any>(null)

const handleScan = (barcode: string) => {
  emit('update:modelValue', barcode)
  emit('scan', barcode)
  playBeep('scan')
}

const { isScanning } = useScanner({
  onScan: handleScan
})

const onInputSubmit = () => {
  if (props.modelValue) {
    emit('scan', props.modelValue)
    playBeep('success')
  }
}

const toggleManual = () => {
  isManualMode.value = !isManualMode.value
  if (isManualMode.value) {
    setTimeout(() => {
      inputRef.value?.focus()
    }, 100)
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="barcode-scan-field">
    <AppInput
      ref="inputRef"
      :model-value="modelValue"
      :label="label"
      :placeholder="placeholder"
      :outlined="true"
      :loading="isScanning"
      :input-class="isScanning ? 'scanning-glow' : ''"
      @update:model-value="val => emit('update:modelValue', val as string)"
      @keyup.enter="onInputSubmit"
    >
      <template #prepend>
        <q-icon
          :name="isManualMode ? 'keyboard' : 'qr_code_scanner'"
          :color="isScanning ? 'primary' : 'grey-7'"
        />
      </template>

      <template #append>
        <div class="row items-center no-wrap">
          <q-btn
            v-if="modelValue"
            flat
            round
            dense
            icon="close"
            size="sm"
            @click="handleClear"
          />
          <q-separator
            vertical
            class="q-mx-sm"
          />
          <q-btn
            flat
            round
            dense
            :icon="isManualMode ? 'sensors' : 'keyboard'"
            size="sm"
            :color="isManualMode ? 'primary' : 'grey-7'"
            @click="toggleManual"
          >
            <q-tooltip>{{ isManualMode ? 'Chuyển sang chế độ Quét' : 'Chuyển sang chế độ Nhập tay' }}</q-tooltip>
          </q-btn>
        </div>
      </template>
    </AppInput>
    
    <div
      v-if="!isManualMode"
      class="text-caption text-grey-6 q-mt-xs q-px-sm row items-center"
    >
      <q-spinner-dots
        v-if="isScanning"
        size="12px"
        class="q-mr-xs"
      />
      <span>{{ isScanning ? 'Đang nhận tín hiệu...' : 'Sẵn sàng quét mã' }}</span>
    </div>
  </div>
</template>

<style scoped>
.barcode-scan-field :deep(.q-field__control) {
  transition: all 0.3s ease;
}

.scanning-glow :deep(.q-field__control) {
  box-shadow: 0 0 10px rgba(var(--q-primary), 0.5);
  border-color: var(--q-primary);
}

.barcode-scan-field :deep(.q-field__prepend) {
  padding-right: 8px;
}
</style>
