<template>
  <AppCard
    flat
    bordered
  >
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-md">
        Thông tin đặt hàng
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-5">
          <div class="week-info-name-input">
            <AppInput
              ref="weekNameInputRef"
              :model-value="modelValue"
              aria-label="Thông tin đơn hàng tuần"
              dense
              hide-bottom-space
              @update:model-value="$emit('update:modelValue', String($event ?? ''))"
              @focus="weekNameFocused = true"
              @blur="onWeekNameBlur"
            />
            <Transition
              name="rotating-placeholder"
              mode="out-in"
            >
              <span
                v-if="shouldShowWeekNamePlaceholder"
                :key="rotatingWeekNamePlaceholder"
                class="week-info-name-input__placeholder"
              >
                {{ rotatingWeekNamePlaceholder }}
              </span>
            </Transition>
          </div>
        </div>
        <div class="col-12 col-sm-3">
          <AppInput
            :model-value="displayDeliveryDate"
            label="Ngày giao hàng"
            placeholder="DD/MM/YYYY"
            dense
            hide-bottom-space
            clearable
            @clear="$emit('update:deliveryDate', '')"
          >
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <DatePicker
                    :model-value="displayDeliveryDate"
                    @update:model-value="onDeliveryDateChange"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>
        <div class="col-12 col-sm-4">
          <slot name="actions" />
        </div>
      </div>
      <div class="row q-mt-sm">
        <div class="col-12">
          <AppInput
            :model-value="notes"
            label="Ghi chú"
            dense
            hide-bottom-space
            @update:model-value="$emit('update:notes', String($event ?? ''))"
          />
        </div>
      </div>
    </q-card-section>
  </AppCard>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import DatePicker from "@/components/ui/pickers/DatePicker.vue";
import type { QInput } from 'quasar'

const props = defineProps<{
  modelValue: string;
  deliveryDate: string;
  notes: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:deliveryDate": [value: string];
  "update:notes": [value: string];
  "blur:weekName": [];
}>();

const weekNameInputRef = ref<QInput | null>(null)
const weekNameFocused = ref(false)
const weekNamePlaceholders = ['Nhập thông tin đơn hàng', 'Nhập thông tin tuần hàng']
const weekNamePlaceholderIndex = ref(0)
const rotatingWeekNamePlaceholder = computed(() => weekNamePlaceholders[weekNamePlaceholderIndex.value])
const shouldShowWeekNamePlaceholder = computed(() => props.modelValue.length === 0 && !weekNameFocused.value)
let weekNamePlaceholderTimer: ReturnType<typeof setInterval> | null = null

function focusWeekName() {
  weekNameInputRef.value?.focus()
}

defineExpose({ focusWeekName })

function rotateWeekNamePlaceholder() {
  weekNamePlaceholderIndex.value = (weekNamePlaceholderIndex.value + 1) % weekNamePlaceholders.length
}

function onWeekNameBlur() {
  weekNameFocused.value = false
  emit('blur:weekName')
}

onMounted(() => {
  weekNamePlaceholderTimer = setInterval(rotateWeekNamePlaceholder, 2400)
})

onUnmounted(() => {
  if (weekNamePlaceholderTimer) {
    clearInterval(weekNamePlaceholderTimer)
  }
})

function toDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function toIso(displayDate: string): string {
  if (!displayDate) return "";
  const [d, m, y] = displayDate.split("/");
  return `${y}-${m}-${d}`;
}

const displayDeliveryDate = computed(() => toDisplay(props.deliveryDate));

function onDeliveryDateChange(val: string | null) {
  emit("update:deliveryDate", val ? toIso(val) : "");
}
</script>

<style scoped>
.week-info-name-input {
  position: relative;
}

.week-info-name-input__placeholder {
  color: rgba(0, 0, 0, 0.54);
  font-size: 14px;
  left: 12px;
  line-height: 20px;
  max-width: calc(100% - 24px);
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  right: 12px;
  text-overflow: ellipsis;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
}

:global(.body--dark) .week-info-name-input__placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.rotating-placeholder-enter-active,
.rotating-placeholder-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.rotating-placeholder-enter-from {
  opacity: 0;
  transform: translateY(calc(-50% + 6px));
}

.rotating-placeholder-leave-to {
  opacity: 0;
  transform: translateY(calc(-50% - 6px));
}

@media (prefers-reduced-motion: reduce) {
  .rotating-placeholder-enter-active,
  .rotating-placeholder-leave-active {
    transition: none;
  }
}
</style>
