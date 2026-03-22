<script setup lang="ts">
/**
 * QrLabelGrid - Grid layout for batch printing on A4 paper
 * Arranges multiple labels in a grid for efficient printing
 */
import { computed } from 'vue'
import QrLabelSingle from './QrLabelSingle.vue'
import type { ConeLabelData, LabelGridConfig } from '@/types/qr-label'
import { DEFAULT_GRID_CONFIG } from '@/types/qr-label'

interface Props {
  /** Array of cones to print */
  cones: ConeLabelData[]
  /** Grid configuration */
  config?: LabelGridConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => DEFAULT_GRID_CONFIG,
})

// Calculate pages needed
const labelsPerPage = computed(() => props.config.columns * props.config.rows)

const pages = computed(() => {
  const result: ConeLabelData[][] = []
  for (let i = 0; i < props.cones.length; i += labelsPerPage.value) {
    result.push(props.cones.slice(i, i + labelsPerPage.value))
  }
  return result.length > 0 ? result : [[]]
})
</script>

<template>
  <div class="qr-label-grid">
    <div
      v-for="(page, pageIndex) in pages"
      :key="pageIndex"
      class="print-page"
      :style="{
        paddingTop: `${config.marginTop}mm`,
        paddingLeft: `${config.marginLeft}mm`,
      }"
    >
      <div
        class="labels-grid"
        :style="{
          gridTemplateColumns: `repeat(${config.columns}, 50mm)`,
          gap: `${config.gapY}mm ${config.gapX}mm`,
        }"
      >
        <QrLabelSingle
          v-for="(cone, index) in page"
          :key="cone.cone_id || index"
          :cone="cone"
          :show-border="true"
        />
      </div>

      <!-- Page number -->
      <div
        v-if="pages.length > 1"
        class="page-number"
      >
        Trang {{ pageIndex + 1 }} / {{ pages.length }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-label-grid {
  background: #f5f5f5;
}

.print-page {
  /* A4 size */
  width: 210mm;
  min-height: 297mm;
  background: white;
  margin: 0 auto 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  box-sizing: border-box;
}

.labels-grid {
  display: grid;
}

.page-number {
  position: absolute;
  bottom: 5mm;
  right: 10mm;
  font-size: 10px;
  color: #999;
}

/* Print styles */
@media print {
  .qr-label-grid {
    background: white;
  }

  .print-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
  }

  .print-page:last-child {
    page-break-after: auto;
  }

  .page-number {
    display: none;
  }
}
</style>
