<template>
  <AppCard
    flat
    bordered
    class="q-mb-sm"
  >
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <div class="col">
          <span class="text-weight-medium">{{ entry.style_code }}</span>
          <span class="text-grey-7 q-ml-sm">{{ entry.style_name }}</span>
        </div>
        <AppButton
          flat
          round
          dense
          icon="close"
          color="negative"
          size="sm"
          @click="$emit('remove', entry.style_id, entry.po_id)"
        >
          <AppTooltip>Xóa mã hàng</AppTooltip>
        </AppButton>
      </div>

      <!-- Color entries -->
      <div
        v-if="entry.colors.length > 0"
        class="q-mb-sm"
      >
        <div
          v-for="color in entry.colors"
          :key="color.color_id"
          class="row items-center q-mb-xs q-col-gutter-sm"
        >
          <div class="col-12 col-sm-4 col-md-3 row items-center">
            <span
              class="q-mr-sm"
              :style="{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: color.hex_code,
                border: '1px solid #ccc'
              }"
            />
            <span class="text-body2">{{ color.color_name }}</span>
          </div>
          <div class="col-auto">
            <AppInput
              :model-value="color.quantity"
              type="number"
              dense
              hide-bottom-space
              label="Số lượng (SP)"
              :min="0"
              style="width: 140px"
              @update:model-value="$emit('update-quantity', entry.style_id, color.color_id, Number($event), entry.po_id)"
            />
          </div>
          <div class="col-auto">
            <AppButton
              flat
              round
              dense
              icon="remove_circle_outline"
              color="negative"
              size="sm"
              @click="$emit('remove-color', entry.style_id, color.color_id, entry.po_id)"
            />
          </div>
        </div>
      </div>

      <!-- Add color -->
      <div class="row q-col-gutter-sm items-end">
        <div class="col-12 col-sm-5 col-md-4">
          <AppSelect
            v-model="selectedColorId"
            :options="availableColors"
            label="Thêm màu"
            dense
            use-input
            fill-input
            hide-selected
            hide-bottom-space
            clearable
            option-value="value"
            option-label="label"
            emit-value
            map-options
          />
        </div>
        <div class="col-auto">
          <AppButton
            flat
            dense
            icon="add"
            color="primary"
            label="Thêm"
            :disable="!selectedColorId"
            @click="handleAddColor"
          />
        </div>
      </div>
    </q-card-section>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StyleOrderEntry } from '@/types/thread'

const props = defineProps<{
  entry: StyleOrderEntry
  colorOptions: Array<{ id: number; name: string; hex_code: string }>
}>()

const emit = defineEmits<{
  remove: [styleId: number, poId: number | null]
  'add-color': [styleId: number, color: { color_id: number; color_name: string; hex_code: string }, poId: number | null]
  'remove-color': [styleId: number, colorId: number, poId: number | null]
  'update-quantity': [styleId: number, colorId: number, quantity: number, poId: number | null]
}>()

const selectedColorId = ref<number | null>(null)

const availableColors = computed(() => {
  const usedIds = new Set(props.entry.colors.map(c => c.color_id))
  return props.colorOptions
    .filter(c => !usedIds.has(c.id))
    .map(c => ({ label: c.name, value: c.id }))
})

const handleAddColor = () => {
  if (!selectedColorId.value) return
  const color = props.colorOptions.find(c => c.id === selectedColorId.value)
  if (!color) return

  emit('add-color', props.entry.style_id, {
    color_id: color.id,
    color_name: color.name,
    hex_code: color.hex_code,
  }, props.entry.po_id)
  selectedColorId.value = null
}
</script>
