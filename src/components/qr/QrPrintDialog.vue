<script setup lang="ts">
/**
 * QrPrintDialog - Dialog for previewing and printing QR labels
 * Supports single and batch printing with selection
 */
import { ref, computed, watch } from 'vue'
import QrLabelSingle from './QrLabelSingle.vue'
import QrLabelGrid from './QrLabelGrid.vue'
import type { ConeLabelData } from '@/types/qr-label'

interface Props {
  /** v-model for dialog visibility */
  modelValue: boolean
  /** Cones to print */
  cones: ConeLabelData[]
  /** Dialog title */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'In nhãn QR',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// State
const selectedConeIds = ref<Set<string>>(new Set())
const printMode = ref<'single' | 'grid'>('grid')

// Computed
const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isSingleCone = computed(() => props.cones.length === 1)

const selectedCones = computed(() => {
  if (isSingleCone.value) return props.cones
  return props.cones.filter(c => selectedConeIds.value.has(c.cone_id))
})

const allSelected = computed(() => 
  selectedConeIds.value.size === props.cones.length
)

// Methods
const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedConeIds.value.clear()
  } else {
    selectedConeIds.value = new Set(props.cones.map(c => c.cone_id))
  }
}

const toggleCone = (coneId: string) => {
  if (selectedConeIds.value.has(coneId)) {
    selectedConeIds.value.delete(coneId)
  } else {
    selectedConeIds.value.add(coneId)
  }
  // Trigger reactivity
  selectedConeIds.value = new Set(selectedConeIds.value)
}

const handlePrint = () => {
  window.print()
}

const close = () => {
  dialogValue.value = false
}

// Initialize selection when dialog opens
watch(dialogValue, (val) => {
  if (val) {
    selectedConeIds.value = new Set(props.cones.map(c => c.cone_id))
    printMode.value = props.cones.length > 1 ? 'grid' : 'single'
  }
})
</script>

<template>
  <q-dialog
    v-model="dialogValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="print-dialog-card">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none print-hide">
        <div class="text-h6">
          <q-icon
            name="print"
            class="q-mr-sm"
          />
          {{ title }}
        </div>
        <q-space />

        <!-- Print mode toggle (only for multiple cones) -->
        <q-btn-toggle
          v-if="!isSingleCone"
          v-model="printMode"
          :options="[
            { value: 'grid', label: 'Lưới A4', icon: 'grid_view' },
            { value: 'single', label: 'Từng nhãn', icon: 'crop_portrait' },
          ]"
          dense
          flat
          toggle-color="primary"
          class="q-mr-md"
        />

        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>

      <!-- Selection panel (for multiple cones) -->
      <q-card-section
        v-if="!isSingleCone"
        class="q-pt-sm print-hide"
      >
        <div class="row items-center q-gutter-sm">
          <q-checkbox
            :model-value="allSelected"
            label="Chọn tất cả"
            dense
            @update:model-value="toggleSelectAll"
          />
          <q-chip
            dense
            color="primary"
            text-color="white"
          >
            {{ selectedCones.length }} / {{ cones.length }} nhãn
          </q-chip>
        </div>

        <!-- Cone selection list -->
        <div class="selection-list q-mt-sm">
          <q-chip
            v-for="cone in cones"
            :key="cone.cone_id"
            :outline="!selectedConeIds.has(cone.cone_id)"
            :color="selectedConeIds.has(cone.cone_id) ? 'primary' : 'grey-5'"
            :text-color="selectedConeIds.has(cone.cone_id) ? 'white' : 'grey-8'"
            clickable
            dense
            class="q-mr-xs q-mb-xs"
            @click="toggleCone(cone.cone_id)"
          >
            {{ cone.cone_id }}
          </q-chip>
        </div>
      </q-card-section>

      <q-separator class="print-hide" />

      <!-- Preview area -->
      <q-card-section class="preview-area">
        <div
          v-if="selectedCones.length === 0"
          class="text-center text-grey-6 q-pa-xl"
        >
          <q-icon
            name="print_disabled"
            size="64px"
          />
          <div class="q-mt-md">
            Chọn ít nhất một nhãn để in
          </div>
        </div>

        <!-- Single label preview -->
        <div
          v-else-if="isSingleCone || printMode === 'single'"
          class="single-preview"
        >
          <QrLabelSingle
            v-for="cone in selectedCones"
            :key="cone.cone_id"
            :cone="cone"
            class="q-mb-md"
          />
        </div>

        <!-- Grid preview -->
        <QrLabelGrid
          v-else
          :cones="selectedCones"
        />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions
        align="right"
        class="q-px-md q-pb-md print-hide"
      >
        <q-btn
          flat
          label="Đóng"
          color="grey-7"
          @click="close"
        />
        <q-btn
          :disable="selectedCones.length === 0"
          color="primary"
          label="In"
          icon="print"
          @click="handlePrint"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.print-dialog-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-area {
  flex: 1;
  overflow: auto;
  background: #f0f0f0;
}

.single-preview {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.selection-list {
  max-height: 80px;
  overflow-y: auto;
}

/* Print styles */
@media print {
  .print-hide {
    display: none !important;
  }

  .print-dialog-card {
    box-shadow: none;
  }

  .preview-area {
    background: white;
    overflow: visible;
  }
}
</style>
