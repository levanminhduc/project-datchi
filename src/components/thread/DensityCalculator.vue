<template>
  <q-card
    flat
    bordered
    class="density-calculator"
  >
    <q-card-section>
      <div class="text-subtitle2 text-primary q-mb-sm flex items-center">
        <q-icon
          name="calculate"
          size="20px"
          class="q-mr-xs"
        />
        Công cụ tính mật độ
      </div>

      <q-tabs
        v-model="mode"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab
          name="calculate"
          label="Tính từ mẫu"
        />
        <q-tab
          name="convert"
          label="Chuyển đổi"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="mode"
        animated
      >
        <!-- Calculate Panel -->
        <q-tab-panel
          name="calculate"
          class="q-pa-md"
        >
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <app-input
                v-model.number="sampleWeight"
                type="number"
                label="Trọng lượng mẫu (g)"
                placeholder="Nhập trọng lượng"
                suffix="g"
                :readonly="readonly"
                @update:model-value="calculateDensity"
              />
            </div>
            <div class="col-12 col-sm-6">
              <app-input
                v-model.number="sampleLength"
                type="number"
                label="Chiều dài mẫu (m)"
                placeholder="Nhập chiều dài"
                suffix="m"
                :readonly="readonly"
                @update:model-value="calculateDensity"
              />
            </div>
            <div class="col-12">
              <div class="row items-center q-gutter-sm">
                <div class="col">
                  <app-input
                    v-model.number="calculatedDensity"
                    type="number"
                    label="Mật độ tính được"
                    readonly
                    filled
                    hint="Đơn vị: g/m"
                  />
                </div>
                <div
                  v-if="!readonly"
                  class="col-auto"
                >
                  <app-button
                    label="Áp dụng"
                    color="primary"
                    icon="check"
                    :disable="!calculatedDensity"
                    @click="applyDensity"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- Convert Panel -->
        <q-tab-panel
          name="convert"
          class="q-pa-md"
        >
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">
                Mật độ hiện tại: <strong>{{ modelValue || 0 }} g/m</strong>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <app-input
                v-model.number="conversionWeight"
                type="number"
                label="Nhập trọng lượng (g)"
                placeholder="Để tính chiều dài"
                suffix="g"
              />
              <div
                v-if="convertedMeters"
                class="q-mt-sm text-subtitle2"
              >
                Kết quả: <span class="text-primary">{{ formatNumber(convertedMeters) }} m</span>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <app-input
                v-model.number="conversionMeters"
                type="number"
                label="Nhập chiều dài (m)"
                placeholder="Để tính trọng lượng"
                suffix="m"
              />
              <div
                v-if="convertedWeight"
                class="q-mt-sm text-subtitle2"
              >
                Kết quả: <span class="text-primary">{{ formatNumber(convertedWeight) }} g</span>
              </div>
            </div>

            <div
              v-if="!modelValue"
              class="col-12"
            >
              <q-banner
                dense
                class="bg-orange-1 text-orange-9 rounded-borders"
              >
                <template #avatar>
                  <q-icon name="warning" />
                </template>
                Vui lòng nhập mật độ hoặc sử dụng công cụ tính để thực hiện chuyển đổi.
              </q-banner>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

interface Props {
  modelValue?: number | null // v-model for density_grams_per_meter
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const mode = ref<'calculate' | 'convert'>('calculate')

// Calculate Logic
const sampleWeight = ref<number | null>(null)
const sampleLength = ref<number | null>(null)
const calculatedDensity = ref<number | null>(null)

const calculateDensity = () => {
  if (sampleWeight.value && sampleWeight.value > 0 && sampleLength.value && sampleLength.value > 0) {
    const density = sampleWeight.value / sampleLength.value
    calculatedDensity.value = Math.round(density * 10000) / 10000 // 4 decimal places
  } else {
    calculatedDensity.value = null
  }
}

const applyDensity = () => {
  if (calculatedDensity.value) {
    emit('update:modelValue', calculatedDensity.value)
    mode.value = 'convert'
  }
}

// Conversion Logic
const conversionWeight = ref<number | null>(null)
const conversionMeters = ref<number | null>(null)

const convertedMeters = computed(() => {
  if (props.modelValue && conversionWeight.value && conversionWeight.value > 0) {
    return conversionWeight.value / props.modelValue
  }
  return null
})

const convertedWeight = computed(() => {
  if (props.modelValue && conversionMeters.value && conversionMeters.value > 0) {
    return conversionMeters.value * props.modelValue
  }
  return null
})

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(val)
}
</script>

<style scoped>
.density-calculator {
  max-width: 100%;
}
</style>
