<template>
  <q-dialog
    v-model="dialogValue"
    :persistent="persistent"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="qr-scanner-dialog">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon
            name="qr_code_scanner"
            class="q-mr-sm"
          />
          {{ title }}
        </div>
        <q-space />
        <q-btn
          v-if="!persistent"
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>

      <!-- Scanner -->
      <q-card-section class="q-pt-md">
        <QrScannerStream
          v-model="isScanning"
          :formats="formats"
          :hint="hint"
          :track="track"
          :track-color="trackColor"
          @detect="onDetect"
          @error="onError"
          @ready="onReady"
        >
          <template #overlay>
            <slot name="overlay" />
          </template>
        </QrScannerStream>

        <!-- Last detected code -->
        <div
          v-if="showResult && lastCode"
          class="q-mt-md"
        >
          <q-banner
            class="bg-positive text-white"
            rounded
          >
            <template #avatar>
              <q-icon name="check_circle" />
            </template>
            <div class="text-weight-medium">
              Đã quét thành công!
            </div>
            <div class="text-caption q-mt-xs text-white-7">
              {{ lastCode }}
            </div>
          </q-banner>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions
        v-if="$slots.actions || showActions"
        align="right"
        class="q-px-md q-pb-md"
      >
        <slot name="actions">
          <q-btn
            flat
            label="Đóng"
            color="grey-7"
            @click="close"
          />
          <q-btn
            v-if="lastCode"
            color="primary"
            label="Sử dụng mã này"
            icon="check"
            @click="confirm"
          />
        </slot>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * QrScannerDialog - Dialog wrapper for QR scanner
 * Provides a ready-to-use dialog for scanning QR codes
 */
import { ref, computed, watch } from 'vue'
import QrScannerStream from './QrScannerStream.vue'
import type { BarcodeFormat, DetectedCode, QrScannerError } from '@/types/qr'

interface Props {
  /** v-model for dialog visibility */
  modelValue?: boolean
  /** Dialog title */
  title?: string
  /** Whether dialog is persistent (no backdrop dismiss) */
  persistent?: boolean
  /** Close dialog after successful detection */
  closeOnDetect?: boolean
  /** Barcode formats to detect */
  formats?: BarcodeFormat[]
  /** Scanner hint text */
  hint?: string
  /** Show tracking outline */
  track?: boolean
  /** Track outline color */
  trackColor?: string
  /** Show detected result banner */
  showResult?: boolean
  /** Show action buttons */
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: 'Quét mã QR',
  persistent: false,
  closeOnDetect: false,
  formats: () => ['qr_code'],
  hint: 'Đặt mã QR vào khung để quét',
  track: true,
  trackColor: '#22c55e',
  showResult: true,
  showActions: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  detect: [codes: DetectedCode[]]
  confirm: [code: string]
  error: [error: QrScannerError]
  ready: []
}>()

// State
const isScanning = ref(true)
const lastCode = ref<string | null>(null)

// Computed
const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Event handlers
const onDetect = (codes: DetectedCode[]) => {
  if (codes.length > 0 && codes[0]) {
    lastCode.value = codes[0].rawValue
    emit('detect', codes)

    if (props.closeOnDetect) {
      emit('confirm', codes[0].rawValue)
      close()
    }
  }
}

const onError = (error: QrScannerError) => {
  emit('error', error)
}

const onReady = () => {
  emit('ready')
}

const close = () => {
  dialogValue.value = false
}

const confirm = () => {
  if (lastCode.value) {
    emit('confirm', lastCode.value)
    close()
  }
}

// Reset state when dialog opens
watch(dialogValue, (val) => {
  if (val) {
    lastCode.value = null
    isScanning.value = true
  }
})
</script>

<style scoped lang="scss">
.qr-scanner-dialog {
  width: 100%;
  max-width: 450px;
  min-width: 320px;
}

@media (max-width: 450px) {
  .qr-scanner-dialog {
    max-width: 100%;
    margin: 8px;
  }
}
</style>
