<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      Chọn NCC để xuất Excel
    </template>

    <div style="min-width: min(420px, 80vw)">
      <div class="text-caption text-grey-7 q-mb-md">
        Mỗi NCC sẽ được xuất thành 1 file Excel riêng
      </div>

      <div class="column q-gutter-xs">
        <AppCheckbox
          v-for="group in supplierGroups"
          :key="group"
          :model-value="selected.includes(group)"
          :label="group"
          dense
          @update:model-value="toggle(group, $event)"
        />
      </div>

      <div class="text-caption text-grey-7 q-mt-md">
        Đã chọn: {{ selected.length }}/{{ supplierGroups.length }} NCC
      </div>
    </div>

    <template #actions>
      <AppButton
        flat
        label="Hủy"
        @click="emit('update:modelValue', false)"
      />
      <AppButton
        color="primary"
        :label="`Xuất ${selected.length} file`"
        :disable="selected.length === 0"
        @click="handleConfirm"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'

const props = defineProps<{
  modelValue: boolean
  supplierGroups: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [selectedGroups: string[]]
}>()

const selected = ref<string[]>([])

watch(
  () => props.modelValue,
  (v) => {
    if (v) selected.value = [...props.supplierGroups]
  },
)

function toggle(group: string, checked: boolean | any[] | null) {
  if (checked) {
    if (!selected.value.includes(group)) selected.value = [...selected.value, group]
  } else {
    selected.value = selected.value.filter((g) => g !== group)
  }
}

function handleConfirm() {
  if (selected.value.length === 0) return
  emit('confirm', [...selected.value])
  emit('update:modelValue', false)
}
</script>
