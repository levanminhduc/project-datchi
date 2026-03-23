<script setup lang="ts">
/**
 * DatePicker - Date picker wrapper
 * Wraps QDate with Vietnamese locale defaults
 *
 * When autoClose is true (default), selecting a date will close the popup.
 * Navigating months/years will NOT close the popup.
 *
 * Uses QDate's @update:model-value event with reason parameter to distinguish
 * between day selection (close) vs month/year navigation (keep open).
 */
import { computed, getCurrentInstance } from 'vue'
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
  'date-selected': [value: string | null]
}>()

const $q = useQuasar()
const isDark = computed(() => props.dark ?? $q.dark.isActive)

const instance = getCurrentInstance()

const closeParentPopup = () => {
  if (!instance) return

  let parent = instance.parent
  while (parent) {
    const proxy = parent.proxy as { hide?: () => void } | null
    if (proxy && typeof proxy.hide === 'function' && parent.type.name === 'QPopupProxy') {
      proxy.hide()
      return
    }
    parent = parent.parent
  }
}

const handleDateUpdate = (value: string | null, reason: string, _details: unknown) => {
  const isDaySelection = reason === 'add-day' || reason === 'remove-day'

  // Only update model when user selects a day, not when navigating months/years
  if (isDaySelection) {
    emit('update:modelValue', value)

    if (props.autoClose && !props.multiple && !props.range) {
      emit('date-selected', value)
      setTimeout(closeParentPopup, 0)
    }
  }
}

const viLocale = {
  days: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  daysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthsShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']
}
</script>

<template>
  <q-date
    :model-value="modelValue"
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
    @update:model-value="handleDateUpdate"
  >
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
