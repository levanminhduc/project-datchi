<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  originalMeters?: number
}

const props = withDefaults(defineProps<Props>(), {
  originalMeters: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const percentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

const calculatedMeters = computed(() => {
  return (props.originalMeters * props.modelValue) / 100
})

function select(percentage: number) {
  emit('update:modelValue', percentage)
}
</script>

<template>
  <div class="percentage-selector">
    <div class="text-subtitle2 q-mb-sm">
      Chọn phần trăm còn lại
    </div>
    <div class="row q-gutter-sm">
      <q-btn
        v-for="p in percentages"
        :key="p"
        :label="`${p}%`"
        :color="modelValue === p ? 'primary' : 'grey-4'"
        :text-color="modelValue === p ? 'white' : 'dark'"
        unelevated
        @click="select(p)"
      />
    </div>
    <div
      v-if="originalMeters > 0"
      class="q-mt-md text-body1"
    >
      Còn lại khoảng: <strong>{{ calculatedMeters.toLocaleString() }} mét</strong> ({{ modelValue }}%)
    </div>
  </div>
</template>

<style scoped>
.percentage-selector .q-btn {
  min-width: 60px;
}
</style>
