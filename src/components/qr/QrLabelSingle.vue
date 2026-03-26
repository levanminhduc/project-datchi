<script setup lang="ts">
/**
 * QrLabelSingle - Single label layout for printing (50x30mm)
 * Displays QR code with cone information
 */
import ConeQrCode from './ConeQrCode.vue'
import type { ConeLabelData } from '@/types/qr-label'

interface Props {
  /** Cone data for label */
  cone: ConeLabelData
  /** Show border around label */
  showBorder?: boolean
}

withDefaults(defineProps<Props>(), {
  showBorder: true,
})
</script>

<template>
  <div
    class="qr-label-single"
    :class="{ 'with-border': showBorder }"
  >
    <div class="label-content">
      <!-- QR Code -->
      <div class="qr-section">
        <ConeQrCode
          :cone-id="cone.cone_id"
          size="small"
        />
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <div class="cone-id">
          {{ cone.cone_id }}
        </div>
        <div
          v-if="cone.lot_number"
          class="info-row"
        >
          <span class="label">Lô:</span>
          <span class="value">{{ cone.lot_number }}</span>
        </div>
        <div
          v-if="cone.thread_type_code"
          class="info-row"
        >
          <span class="label">Loại:</span>
          <span class="value">{{ cone.thread_type_code }}</span>
        </div>
        <div
          v-if="cone.weight_grams"
          class="info-row"
        >
          <span class="label">KL:</span>
          <span class="value">{{ cone.weight_grams }}g</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-label-single {
  /* 50x30mm converted to pixels at 96dpi */
  width: 189px;
  height: 113px;
  padding: 4px;
  box-sizing: border-box;
  background: white;
  font-family: Arial, sans-serif;
}

.with-border {
  border: 1px solid #ccc;
  border-radius: 2px;
}

.label-content {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px;
}

.qr-section {
  flex-shrink: 0;
}

.info-section {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.cone-id {
  font-size: 11px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-row {
  display: flex;
  font-size: 9px;
  line-height: 1.3;
}

.info-row .label {
  color: #666;
  margin-right: 4px;
  flex-shrink: 0;
}

.info-row .value {
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Print styles */
@media print {
  .qr-label-single {
    /* Exact 50x30mm for print */
    width: 50mm;
    height: 30mm;
    border: none !important;
    page-break-inside: avoid;
  }

  .with-border {
    border: 0.5pt solid #ccc !important;
  }
}
</style>
