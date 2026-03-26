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
          <AppInput
            ref="weekNameInputRef"
            :model-value="modelValue"
            label="Thông tin đơn hàng*"
            dense
            hide-bottom-space
            placeholder="Nhập thông tin đơn hàng"
            @update:model-value="$emit('update:modelValue', String($event ?? ''))"
            @blur="$emit('blur:weekName')"
          />
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
import { computed, ref } from "vue";
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

function focusWeekName() {
  weekNameInputRef.value?.focus()
}

defineExpose({ focusWeekName })

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
