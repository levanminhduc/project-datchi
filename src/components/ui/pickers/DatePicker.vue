<script setup lang="ts">
/**
 * DatePicker - Date picker wrapper
 * Wraps QDate with Vietnamese locale defaults
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface Props {
  modelValue?: string | null
  mask?: string
  landscape?: boolean
  color?: Color
  textColor?: string
  dark?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  readonly?: boolean
  disable?: boolean
  title?: string
  subtitle?: string
  todayBtn?: boolean
  minimal?: boolean
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  multiple?: boolean
  range?: boolean
  emitImmediately?: boolean
  defaultYearMonth?: string
  defaultView?: 'Calendar' | 'Months' | 'Years'
}

const props = withDefaults(defineProps<Props>(), {
  mask: 'DD/MM/YYYY',
  landscape: false,
  color: 'primary',
  dark: false,
  square: false,
  flat: false,
  bordered: true,
  readonly: false,
  disable: false,
  todayBtn: true,
  minimal: false,
  firstDayOfWeek: 1,
  multiple: false,
  range: false,
  emitImmediately: true,
  defaultView: 'Calendar'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const dateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? null)
})

// Vietnamese locale
const viLocale = {
  days: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  daysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthsShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']
}
</script>

<template>
  <q-date
    v-model="dateValue"
    :mask="mask"
    :locale="viLocale"
    :landscape="landscape"
    :color="color"
    :text-color="textColor"
    :dark="dark"
    :square="square"
    :flat="flat"
    :bordered="bordered"
    :readonly="readonly"
    :disable="disable"
    :title="title"
    :subtitle="subtitle"
    :today-btn="todayBtn"
    :minimal="minimal"
    :first-day-of-week="firstDayOfWeek"
    :multiple="multiple"
    :range="range"
    :emit-immediately="emitImmediately"
    :default-year-month="defaultYearMonth"
    :default-view="defaultView"
  />
</template>
