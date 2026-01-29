<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import type { ThreadType } from '@/types/thread'

interface Props {
  modelValue: number | null
  threadType?: ThreadType
  unit?: 'g' | 'kg'
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'g'
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const localUnit = ref<'g' | 'kg'>(props.unit)
const inputValue = ref<number | null>(props.modelValue)

// Convert to grams for storage
const weightInGrams = computed(() => {
  if (inputValue.value === null) return null
  return localUnit.value === 'kg' ? inputValue.value * 1000 : inputValue.value
})

watch(weightInGrams, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.modelValue, (val) => {
  if (val === null) {
    inputValue.value = null
  } else {
    // Sync back but respect current local unit
    inputValue.value = localUnit.value === 'kg' ? val / 1000 : val
  }
}, { immediate: true })

const meters = computed(() => {
  if (!weightInGrams.value || !props.threadType?.density_grams_per_meter) return 0
  return Math.round(weightInGrams.value / props.threadType.density_grams_per_meter)
})

const adjust = (amount: number) => {
  const current = inputValue.value || 0
  inputValue.value = Math.max(0, current + amount)
}

const clear = () => {
  inputValue.value = null
}
</script>

<template>
  <div class="manual-weight-input">
    <div class="row q-col-gutter-sm items-start">
      <div class="col-8">
        <AppInput
          v-model.number="inputValue"
          type="number"
          label="Trọng lượng"
          outlined
          dense
          :step="localUnit === 'kg' ? 0.01 : 1"
          :min="0"
        >
          <template #append>
            <q-btn flat round dense icon="backspace" size="sm" @click="clear" />
          </template>
          <template #after>
            <div class="column q-gutter-xs">
              <q-btn dense flat icon="add" size="sm" class="bg-grey-2" @click="adjust(localUnit === 'kg' ? 0.1 : 10)" />
              <q-btn dense flat icon="remove" size="sm" class="bg-grey-2" @click="adjust(localUnit === 'kg' ? -0.1 : -10)" />
            </div>
          </template>
        </AppInput>
      </div>
      <div class="col-4">
        <AppSelect
          v-model="localUnit"
          :options="['g', 'kg']"
          dense
          outlined
          hide-bottom-space
        />
      </div>
    </div>

    <div v-if="threadType && weightInGrams" class="q-mt-xs q-px-sm">
      <div class="row justify-between items-center text-caption text-grey-8">
        <span>Tương đương:</span>
        <span class="text-weight-bold text-primary">{{ meters.toLocaleString() }} m</span>
      </div>
      <div class="text-caption text-grey-6 text-italic">
        (Mật độ: {{ threadType.density_grams_per_meter }} g/m)
      </div>
    </div>
  </div>
</template>

<style scoped>
.manual-weight-input :deep(.q-field__after) {
  padding-left: 4px;
}
</style>
