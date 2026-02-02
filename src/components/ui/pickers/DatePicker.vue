<script setup lang="ts">
/**
 * DatePicker - Date picker wrapper
 * Wraps QDate with Vietnamese locale defaults
 * 
 * When autoClose is true (default), selecting a date will:
 * - Emit 'update:modelValue' with the selected date
 * - Emit 'date-selected' event for parent to handle (e.g., close popup)
 */
import { computed } from 'vue'
import { useQuasar } from 'quasar'
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
  /** When true, emits 'date-selected' event after date selection for auto-close behavior */
  autoClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mask: 'DD/MM/YYYY',
  landscape: false,
  color: 'primary',
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
  defaultView: 'Calendar',
  autoClose: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  /** Emitted when a date is selected and autoClose is true - use to close popup */
  'date-selected': [value: string | null]
}>()

const $q = useQuasar()
const isDark = computed(() => props.dark ?? $q.dark.isActive)

const dateValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    const value = val ?? null
    emit('update:modelValue', value)
    // Emit date-selected for auto-close behavior when not in multiple/range mode
    if (props.autoClose && !props.multiple && !props.range) {
      emit('date-selected', value)
    }
  }
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
    v-close-popup="autoClose && !multiple && !range"
    :mask="mask"
    :locale="viLocale"
    :landscape="landscape"
    :color="color"
    :text-color="textColor"
    :dark="isDark"
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
    class="bg-surface"
    :class="{ 'dark': isDark }"
  >
    <!-- Forward slots to q-date -->
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData ?? {}"
      />
    </template>
  </q-date>
</template>
