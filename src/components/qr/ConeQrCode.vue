<script setup lang="ts">
/**
 * ConeQrCode - Generate and display QR code from cone_id
 * Uses qrcode library to generate QR as data URL
 */
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import type { QrCodeSize } from '@/types/qr-label'
import { QR_SIZE_MAP } from '@/types/qr-label'

interface Props {
  /** Cone ID to encode in QR */
  coneId: string
  /** Size variant */
  size?: QrCodeSize
  /** Show cone_id text below QR */
  showText?: boolean
  /** Custom width override (px) */
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showText: false,
  width: undefined,
})

const qrDataUrl = ref<string>('')
const error = ref<string | null>(null)
const loading = ref(false)

const computedSize = () => {
  if (props.width) return props.width
  return QR_SIZE_MAP[props.size]
}

const generateQR = async () => {
  if (!props.coneId) {
    qrDataUrl.value = ''
    return
  }

  loading.value = true
  error.value = null

  try {
    qrDataUrl.value = await QRCode.toDataURL(props.coneId, {
      width: computedSize(),
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (err) {
    error.value = 'Không thể tạo mã QR'
    console.error('QR generation error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(generateQR)
watch(() => props.coneId, generateQR)
watch(() => props.size, generateQR)
watch(() => props.width, generateQR)
</script>

<template>
  <div class="cone-qr-code">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="qr-placeholder"
      :style="{ width: `${computedSize()}px`, height: `${computedSize()}px` }"
    >
      <q-spinner
        color="primary"
        size="24px"
      />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error || !coneId"
      class="qr-placeholder qr-error"
      :style="{ width: `${computedSize()}px`, height: `${computedSize()}px` }"
    >
      <q-icon
        name="qr_code_2"
        size="32px"
        color="grey-5"
      />
    </div>

    <!-- QR Code -->
    <template v-else>
      <img
        :src="qrDataUrl"
        :alt="`QR: ${coneId}`"
        class="qr-image"
        :width="computedSize()"
        :height="computedSize()"
      >
      <div
        v-if="showText"
        class="qr-text text-caption text-center"
      >
        {{ coneId }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.cone-qr-code {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

.qr-error {
  background: #fafafa;
}

.qr-image {
  display: block;
}

.qr-text {
  margin-top: 4px;
  font-family: monospace;
  font-size: 11px;
  color: #666;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
