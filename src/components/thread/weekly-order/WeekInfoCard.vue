<template>
  <AppCard flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-md">Thông tin tuần</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <AppInput
            :model-value="modelValue"
            label="Tên tuần *"
            dense
            hide-bottom-space
            placeholder="VD: Tuần 7 - 2026"
            @update:model-value="$emit('update:modelValue', $event)"
          />
        </div>
        <div class="col-12 col-sm-3">
          <AppInput
            :model-value="startDate"
            type="date"
            label="Từ ngày"
            dense
            hide-bottom-space
            @update:model-value="$emit('update:startDate', $event)"
          />
        </div>
        <div class="col-12 col-sm-3">
          <AppInput
            :model-value="endDate"
            type="date"
            label="Đến ngày"
            dense
            hide-bottom-space
            @update:model-value="$emit('update:endDate', $event)"
          />
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
            @update:model-value="$emit('update:notes', $event)"
          />
        </div>
      </div>
    </q-card-section>
  </AppCard>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  startDate: string
  endDate: string
  notes: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  'update:notes': [value: string]
}>()
</script>
