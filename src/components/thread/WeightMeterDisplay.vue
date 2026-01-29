<template>
  <div :class="[inline ? 'row items-center no-wrap' : 'column']">
    <!-- Primary Weight -->
    <span v-if="hasWeight" :class="sizeClass">
      {{ formatNumber(props.weightGrams!, 1) }} g
    </span>

    <!-- Separator for primary values if inline -->
    <span v-if="inline && hasWeight && hasMeters" class="text-grey-6 q-mx-xs">
      •
    </span>

    <!-- Primary Meters -->
    <span v-if="hasMeters" :class="sizeClass">
      {{ formatNumber(props.quantityMeters!, 0) }} m
    </span>

    <!-- Calculated Weight -->
    <template v-if="calculatedWeight !== null">
      <span v-if="inline" class="text-grey-6 q-mx-xs">•</span>
      <span :class="['text-grey-6', !inline ? 'text-caption' : (size === 'sm' ? 'text-caption' : 'text-caption')]">
        <template v-if="!inline">≈ </template>
        {{ formatNumber(calculatedWeight, 1) }} g
        <template v-if="!inline"> (ước tính)</template>
      </span>
    </template>

    <!-- Calculated Meters -->
    <template v-if="calculatedMeters !== null">
      <span v-if="inline" class="text-grey-6 q-mx-xs">•</span>
      <span :class="['text-grey-6', !inline ? 'text-caption' : (size === 'sm' ? 'text-caption' : 'text-caption')]">
        <template v-if="!inline">≈ </template>
        {{ formatNumber(calculatedMeters, 0) }} m
        <template v-if="!inline"> (ước tính)</template>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  weightGrams?: number | null
  quantityMeters?: number | null
  densityGramsPerMeter?: number | null
  showConversion?: boolean  // Show calculated value from the other
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean  // Display inline or stacked
}

const props = withDefaults(defineProps<Props>(), {
  weightGrams: null,
  quantityMeters: null,
  densityGramsPerMeter: null,
  showConversion: false,
  size: 'md',
  inline: false
})

const hasWeight = computed(() => props.weightGrams !== null && props.weightGrams !== undefined)
const hasMeters = computed(() => props.quantityMeters !== null && props.quantityMeters !== undefined)

const formatNumber = (val: number, decimals = 0) => {
  return val.toLocaleString('vi-VN', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })
}

const calculatedWeight = computed(() => {
  // If weight is already provided, we don't calculate it
  if (hasWeight.value) return null
  if (!props.showConversion || props.quantityMeters === null || props.quantityMeters === undefined || !props.densityGramsPerMeter) return null
  return props.quantityMeters * props.densityGramsPerMeter
})

const calculatedMeters = computed(() => {
  // If meters is already provided, we don't calculate it
  if (hasMeters.value) return null
  if (!props.showConversion || props.weightGrams === null || props.weightGrams === undefined || !props.densityGramsPerMeter || props.densityGramsPerMeter === 0) return null
  return props.weightGrams / props.densityGramsPerMeter
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-caption'
    case 'lg': return 'text-body1 text-weight-medium'
    default: return 'text-body2'
  }
})
</script>
