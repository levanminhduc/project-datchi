<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="flex items-center q-mb-lg">
      <q-icon
        name="qr_code_scanner"
        size="32px"
        color="primary"
        class="q-mr-sm"
      />
      <h1 class="text-h4 text-weight-bold q-my-none">
        QR Code Scanner Demo
      </h1>
    </div>

    <!-- Tab Navigation -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
      no-caps
    >
      <q-tab
        name="dialog"
        icon="crop_free"
        label="Scanner Dialog"
      />
      <q-tab
        name="inline"
        icon="videocam"
        label="Inline Scanner"
      />
      <q-tab
        name="history"
        icon="history"
        label="Lịch sử quét"
      />
    </q-tabs>

    <q-separator />

    <!-- Tab Panels -->
    <q-tab-panels
      v-model="activeTab"
      animated
      class="q-mt-md"
    >
      <!-- Dialog Scanner Tab -->
      <q-tab-panel name="dialog">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <q-card bordered>
              <q-card-section>
                <div class="text-h6">
                  Quét mã QR bằng Dialog
                </div>
                <div class="text-body2 text-grey-7 q-mt-sm">
                  Mở dialog camera để quét mã QR. Phù hợp cho các tác vụ nhanh.
                </div>
              </q-card-section>

              <q-card-section>
                <q-btn
                  color="primary"
                  icon="qr_code_scanner"
                  label="Mở Scanner"
                  size="lg"
                  @click="showScannerDialog = true"
                />
              </q-card-section>

              <q-card-section v-if="dialogResult">
                <q-banner
                  class="bg-positive text-white"
                  rounded
                >
                  <template #avatar>
                    <q-icon name="check_circle" />
                  </template>
                  <div class="text-weight-medium">
                    Kết quả từ Dialog
                  </div>
                  <div class="text-caption q-mt-xs">
                    {{ dialogResult }}
                  </div>
                </q-banner>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card bordered>
              <q-card-section>
                <div class="text-h6">
                  Tùy chọn Dialog
                </div>
              </q-card-section>

              <q-card-section>
                <div class="q-gutter-md">
                  <q-toggle
                    v-model="dialogOptions.closeOnDetect"
                    label="Tự động đóng khi quét thành công"
                  />
                  <q-toggle
                    v-model="dialogOptions.persistent"
                    label="Persistent (không đóng khi click ngoài)"
                  />
                  <q-toggle
                    v-model="dialogOptions.showResult"
                    label="Hiển thị kết quả trong dialog"
                  />
                  <q-toggle
                    v-model="dialogOptions.track"
                    label="Vẽ khung quanh mã QR"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Scanner Dialog -->
        <QrScannerDialog
          v-model="showScannerDialog"
          :close-on-detect="dialogOptions.closeOnDetect"
          :persistent="dialogOptions.persistent"
          :show-result="dialogOptions.showResult"
          :track="dialogOptions.track"
          @confirm="onDialogConfirm"
          @detect="onDetect"
        />
      </q-tab-panel>

      <!-- Inline Scanner Tab -->
      <q-tab-panel name="inline">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-8">
            <q-card bordered>
              <q-card-section>
                <div class="text-h6">
                  Inline QR Scanner
                </div>
                <div class="text-body2 text-grey-7 q-mt-sm">
                  Scanner được nhúng trực tiếp vào trang.
                </div>
              </q-card-section>

              <q-card-section>
                <div class="row q-gutter-sm q-mb-md">
                  <q-btn
                    :color="isInlineScanning ? 'negative' : 'positive'"
                    :icon="isInlineScanning ? 'stop' : 'play_arrow'"
                    :label="isInlineScanning ? 'Dừng' : 'Bắt đầu'"
                    @click="isInlineScanning = !isInlineScanning"
                  />
                  <q-btn
                    outline
                    color="grey-7"
                    icon="delete"
                    label="Xóa lịch sử"
                    @click="clearHistory"
                  />
                </div>

                <QrScannerStream
                  v-model="isInlineScanning"
                  :track="true"
                  hint="Đưa mã QR vào khung hình"
                  @detect="onInlineDetect"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card bordered>
              <q-card-section>
                <div class="text-h6">
                  Kết quả quét
                </div>
              </q-card-section>

              <q-card-section v-if="inlineResult">
                <q-banner
                  class="bg-info text-white"
                  rounded
                >
                  <template #avatar>
                    <q-icon name="qr_code" />
                  </template>
                  <div class="text-weight-medium">
                    Mã vừa quét
                  </div>
                  <div
                    class="text-caption q-mt-xs"
                    style="word-break: break-all"
                  >
                    {{ inlineResult }}
                  </div>
                </q-banner>

                <div class="q-mt-md">
                  <q-btn
                    v-if="isUrl(inlineResult)"
                    color="primary"
                    icon="open_in_new"
                    label="Mở link"
                    class="full-width"
                    @click="openUrl(inlineResult)"
                  />
                  <q-btn
                    outline
                    color="grey-7"
                    icon="content_copy"
                    label="Sao chép"
                    class="full-width q-mt-sm"
                    @click="copyToClipboard(inlineResult)"
                  />
                </div>
              </q-card-section>

              <q-card-section v-else>
                <div class="text-center text-grey-6 q-py-lg">
                  <q-icon
                    name="qr_code_scanner"
                    size="48px"
                  />
                  <div class="q-mt-md">
                    Chưa có mã nào được quét
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- History Tab -->
      <q-tab-panel name="history">
        <q-card bordered>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">
                Lịch sử quét mã QR
              </div>
              <q-space />
              <q-btn
                v-if="scanHistory.length > 0"
                flat
                color="negative"
                icon="delete_sweep"
                label="Xóa tất cả"
                @click="clearHistory"
              />
            </div>
          </q-card-section>

          <q-card-section v-if="scanHistory.length === 0">
            <div class="text-center text-grey-6 q-py-xl">
              <q-icon
                name="history"
                size="64px"
              />
              <div class="text-h6 q-mt-md">
                Chưa có lịch sử quét
              </div>
              <div class="text-body2 q-mt-sm">
                Các mã QR bạn quét sẽ được lưu ở đây
              </div>
            </div>
          </q-card-section>

          <q-list
            v-else
            separator
          >
            <q-item
              v-for="(item, index) in scanHistory"
              :key="index"
              clickable
              @click="copyToClipboard(item.value)"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="getTypeColor(item.type)"
                  text-color="white"
                  size="40px"
                >
                  <q-icon :name="getTypeIcon(item.type)" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label
                  lines="1"
                  style="word-break: break-all"
                >
                  {{ item.value }}
                </q-item-label>
                <q-item-label caption>
                  {{ item.type }} • {{ formatTime(item.timestamp) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-if="item.type === 'URL'"
                    flat
                    round
                    dense
                    icon="open_in_new"
                    @click.stop="openUrl(item.value)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="content_copy"
                    @click.stop="copyToClipboard(item.value)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click.stop="removeFromHistory(index)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSnackbar } from '@/composables'
import { QrScannerDialog, QrScannerStream } from '@/components/qr'
import type { DetectedCode } from '@/types/qr'

// State
const activeTab = ref('dialog')
const showScannerDialog = ref(false)
const isInlineScanning = ref(false)
const dialogResult = ref<string | null>(null)
const inlineResult = ref<string | null>(null)

const snackbar = useSnackbar()

// Dialog options
const dialogOptions = reactive({
  closeOnDetect: true,
  persistent: false,
  showResult: true,
  track: true,
})

// History
interface HistoryItem {
  value: string
  type: 'URL' | 'Text' | 'Email' | 'Phone'
  timestamp: Date
}

const scanHistory = ref<HistoryItem[]>([])

// Helpers
const isUrl = (text: string): boolean => {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

const isEmail = (text: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}

const isPhone = (text: string): boolean => {
  return /^[\d\s+()-]{8,}$/.test(text)
}

const detectType = (value: string): HistoryItem['type'] => {
  if (isUrl(value)) return 'URL'
  if (isEmail(value)) return 'Email'
  if (isPhone(value)) return 'Phone'
  return 'Text'
}

const getTypeIcon = (type: HistoryItem['type']): string => {
  const icons: Record<HistoryItem['type'], string> = {
    URL: 'link',
    Email: 'email',
    Phone: 'phone',
    Text: 'text_fields',
  }
  return icons[type]
}

const getTypeColor = (type: HistoryItem['type']): string => {
  const colors: Record<HistoryItem['type'], string> = {
    URL: 'blue',
    Email: 'purple',
    Phone: 'green',
    Text: 'grey',
  }
  return colors[type]
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Event handlers
const addToHistory = (value: string) => {
  const type = detectType(value)
  scanHistory.value.unshift({
    value,
    type,
    timestamp: new Date(),
  })

  // Keep only last 100 entries
  if (scanHistory.value.length > 100) {
    scanHistory.value = scanHistory.value.slice(0, 100)
  }
}

const onDialogConfirm = (code: string) => {
  dialogResult.value = code
  addToHistory(code)
  snackbar.success(`Đã quét: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`)
}

const onDetect = (codes: DetectedCode[]) => {
  console.log('Detected codes:', codes)
}

const onInlineDetect = (codes: DetectedCode[]) => {
  if (codes.length > 0 && codes[0]) {
    const value = codes[0].rawValue

    // Avoid duplicate rapid scans
    if (value !== inlineResult.value) {
      inlineResult.value = value
      addToHistory(value)

      // Vibrate feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }

      snackbar.success('Đã quét thành công!')
    }
  }
}

const clearHistory = () => {
  scanHistory.value = []
  dialogResult.value = null
  inlineResult.value = null
  snackbar.info('Đã xóa lịch sử')
}

const removeFromHistory = (index: number) => {
  scanHistory.value.splice(index, 1)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    snackbar.success('Đã sao chép vào clipboard')
  } catch {
    snackbar.error('Không thể sao chép')
  }
}

const openUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped lang="scss">
.q-tab-panel {
  padding-left: 0;
  padding-right: 0;
}
</style>
