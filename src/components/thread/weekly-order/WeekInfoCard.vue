<template>
  <AppCard flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-md">
        Thông tin đặt hàng
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <AppInput
            :model-value="modelValue"
            label="Thông tin đơn hàng*"
            dense
            hide-bottom-space
            placeholder="Nhập thông tin đơn hàng"
            @update:model-value="$emit('update:modelValue', String($event ?? ''))"
          />
        </div>
        <div class="col-12 col-sm-3">
          <AppInput
            :model-value="displayStartDate"
            label="Từ ngày"
            placeholder="DD/MM/YYYY"
            dense
            hide-bottom-space
            clearable
            @clear="$emit('update:startDate', '')"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <DatePicker
                    :model-value="displayStartDate"
                    @update:model-value="onStartDateChange"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>
        <div class="col-12 col-sm-3">
          <AppInput
            :model-value="displayEndDate"
            label="Đến ngày"
            placeholder="DD/MM/YYYY"
            dense
            hide-bottom-space
            clearable
            @clear="$emit('update:endDate', '')"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <DatePicker
                    :model-value="displayEndDate"
                    @update:model-value="onEndDateChange"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>
        <div class="col-12 col-sm-2">
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
import { computed } from "vue";
import DatePicker from "@/components/ui/pickers/DatePicker.vue";

const props = defineProps<{
  modelValue: string;
  startDate: string;
  endDate: string;
  notes: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:startDate": [value: string];
  "update:endDate": [value: string];
  "update:notes": [value: string];
}>();

// Convert YYYY-MM-DD (DB) ↔ DD/MM/YYYY (DatePicker)
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

const displayStartDate = computed(() => toDisplay(props.startDate));
const displayEndDate = computed(() => toDisplay(props.endDate));

function onStartDateChange(val: string | null) {
  emit("update:startDate", val ? toIso(val) : "");
}

function onEndDateChange(val: string | null) {
  emit("update:endDate", val ? toIso(val) : "");
}
</script>
