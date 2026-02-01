<template>
  <div class="qr-scanner-stream">
    <!-- Camera Stream -->
    <qrcode-stream
      v-if="!error"
      :formats="formats"
      :paused="!isActive"
      :constraints="cameraConstraints"
      :track="trackFunction"
      @detect="onDetect"
      @error="onError"
      @camera-on="onCameraOn"
      @camera-off="onCameraOff"
    >
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="qr-scanner-loading"
      >
        <q-spinner
          color="white"
          size="48px"
        />
        <div class="text-white q-mt-md">
          Đang khởi động camera...
        </div>
      </div>

      <!-- Scan frame overlay -->
      <div
        v-else
        class="qr-scanner-overlay"
      >
        <div class="qr-scanner-frame">
          <div class="corner corner-tl" />
          <div class="corner corner-tr" />
          <div class="corner corner-bl" />
          <div class="corner corner-br" />
        </div>
        <div class="qr-scanner-hint">
          {{ hint }}
        </div>
      </div>

      <!-- Custom overlay slot -->
      <slot name="overlay" />
    </qrcode-stream>

    <!-- Error state -->
    <div
      v-if="error"
      class="qr-scanner-error"
    >
      <q-icon
        name="error_outline"
        size="48px"
        color="negative"
      />
      <div class="text-h6 q-mt-md text-negative">
        Lỗi Camera
      </div>
      <div class="text-body2 q-mt-sm text-grey-7">
        {{ errorMessage }}
      </div>
      <q-btn
        class="q-mt-lg"
        color="primary"
        label="Thử lại"
        icon="refresh"
        @click="retry"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * QrScannerStream - Camera stream QR scanner component
 * Wraps vue-qrcode-reader's QrcodeStream with Quasar styling
 */
import { ref, computed, watch } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import type { BarcodeFormat, DetectedCode, QrScannerError } from '@/types/qr'

interface Props {
  /** Barcode formats to detect */
  formats?: BarcodeFormat[]
  /** Whether scanner is active */
  modelValue?: boolean
  /** Custom camera constraints */
  constraints?: MediaTrackConstraints
  /** Hint text to display */
  hint?: string
  /** Whether to draw tracking outline on detected codes */
  track?: boolean
  /** Track outline color */
  trackColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => ['qr_code'],
  modelValue: true,
  hint: 'Đặt mã QR vào khung để quét',
  track: true,
  trackColor: '#22c55e',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  detect: [codes: DetectedCode[]]
  error: [error: QrScannerError]
  ready: []
}>()

// State
const isLoading = ref(true)
const error = ref<QrScannerError | null>(null)

// Computed
const isActive = computed(() => props.modelValue && !error.value)

const cameraConstraints = computed(() => ({
  facingMode: 'environment',
  ...props.constraints,
}))

const errorMessage = computed(() => {
  if (!error.value) return ''

  const messages: Record<string, string> = {
    NotAllowedError: 'Bạn cần cấp quyền truy cập camera để quét mã QR',
    NotFoundError: 'Không tìm thấy camera trên thiết bị này',
    NotSupportedError: 'Trình duyệt không hỗ trợ quét mã QR',
    NotReadableError: 'Camera đang được sử dụng bởi ứng dụng khác',
    OverconstrainedError: 'Camera không đáp ứng yêu cầu cấu hình',
    SecurityError: 'Cần kết nối HTTPS để sử dụng camera',
    StreamApiNotSupportedError: 'Trình duyệt không hỗ trợ API camera',
  }

  return messages[error.value.name] || error.value.message || 'Đã xảy ra lỗi không xác định'
})

/**
 * Track function to draw outline around detected codes
 */
const trackFunction = computed(() => {
  if (!props.track) return undefined

  return (detectedCodes: DetectedCode[], ctx: CanvasRenderingContext2D) => {
    for (const code of detectedCodes) {
      if (code.cornerPoints && code.cornerPoints.length >= 4) {
        const first = code.cornerPoints[0]
        const rest = code.cornerPoints.slice(1)

        if (!first) continue

        ctx.strokeStyle = props.trackColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(first.x, first.y)
        for (const point of rest) {
          ctx.lineTo(point.x, point.y)
        }
        ctx.lineTo(first.x, first.y)
        ctx.stroke()
      }
    }
  }
})

// Event handlers
const onDetect = (codes: DetectedCode[]) => {
  emit('detect', codes)
}

const onError = (err: QrScannerError) => {
  error.value = err
  isLoading.value = false
  emit('error', err)
}

const onCameraOn = () => {
  isLoading.value = false
  error.value = null
  emit('ready')
}

const onCameraOff = () => {
  isLoading.value = true
}

const retry = () => {
  error.value = null
  isLoading.value = true
  emit('update:modelValue', true)
}

// Reset error when modelValue changes to true
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      error.value = null
    }
  }
)
</script>

<style scoped lang="scss">
.qr-scanner-stream {
  position: relative;
  width: 100%;
  min-height: 300px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.qr-scanner-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1;
}

.qr-scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.qr-scanner-frame {
  position: relative;
  width: 200px;
  height: 200px;

  .corner {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 3px solid #22c55e;
  }

  .corner-tl {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
  }

  .corner-tr {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
  }

  .corner-bl {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
  }

  .corner-br {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
  }
}

.qr-scanner-hint {
  margin-top: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  border-radius: 4px;
}

.qr-scanner-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 24px;
  text-align: center;
}
</style>
