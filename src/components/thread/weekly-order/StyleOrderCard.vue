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

      <!-- PO Quantity Info Bar -->
      <div
        v-if="poQuantity != null"
        class="q-mb-sm"
      >
        <div class="row items-center q-gutter-x-md text-caption">
          <span class="text-grey-8">
            Đã đặt: <strong>{{ alreadyOrdered || 0 }}</strong> / {{ poQuantity }} SP
          </span>
          <span class="text-grey-8">
            Tuần này: <strong>{{ currentTotal }}</strong> SP
          </span>
          <span :class="isWarning ? 'text-warning text-weight-bold' : 'text-positive'">
            Còn lại: <strong>{{ remaining }}</strong> SP
          </span>
        </div>

        <q-banner
          v-if="isWarning"
          dense
          rounded
          class="bg-orange-1 text-warning q-mt-xs"
        >
          <template #avatar>
            <q-icon
              name="warning"
              color="warning"
              size="sm"
            />
          </template>
          Sắp đạt giới hạn SL PO (còn {{ remaining }} SP)
        </q-banner>
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
              :max="getMaxForColor(color.color_id)"
              style="width: 140px"
              @update:model-value="handleQuantityChange(color.color_id, Number($event))"
              @keydown="(e: KeyboardEvent) => clampOnKeydown(e, color.color_id, color.quantity)"
              @paste="(e: ClipboardEvent) => clampOnPaste(e, color.color_id)"
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

const props = withDefaults(defineProps<{
  entry: StyleOrderEntry
  colorOptions: Array<{ id: number; name: string; hex_code: string }>
  poQuantity?: number | null
  alreadyOrdered?: number
}>(), {
  poQuantity: null,
  alreadyOrdered: 0,
})

const emit = defineEmits<{
  remove: [styleId: number, poId: number | null]
  'add-color': [styleId: number, color: { color_id: number; color_name: string; hex_code: string }, poId: number | null]
  'remove-color': [styleId: number, colorId: number, poId: number | null]
  'update-quantity': [styleId: number, colorId: number, quantity: number, poId: number | null]
}>()

const selectedColorId = ref<number | null>(null)

const currentTotal = computed(() =>
  props.entry.colors.reduce((sum, c) => sum + c.quantity, 0)
)

const maxAllowed = computed(() =>
  props.poQuantity != null ? props.poQuantity - (props.alreadyOrdered || 0) : null
)

const remaining = computed(() =>
  maxAllowed.value != null ? maxAllowed.value - currentTotal.value : 0
)

const isOverLimit = computed(() =>
  maxAllowed.value != null && remaining.value < 0
)

const isWarning = computed(() =>
  maxAllowed.value != null && remaining.value >= 0 && maxAllowed.value > 0 && remaining.value <= maxAllowed.value * 0.1
)

const getMaxForColor = (colorId: number) => {
  if (maxAllowed.value == null) return undefined
  const othersTotal = props.entry.colors
    .filter((c) => c.color_id !== colorId)
    .reduce((sum, c) => sum + c.quantity, 0)
  return Math.max(0, maxAllowed.value - othersTotal)
}

const clampOnKeydown = (e: KeyboardEvent, colorId: number, currentValue: number) => {
  const max = getMaxForColor(colorId)
  if (max == null) return

  if (e.key === 'ArrowUp' && currentValue >= max) {
    e.preventDefault()
    return
  }

  const isDigit = /^[0-9]$/.test(e.key)
  if (!isDigit) return

  const input = e.target as HTMLInputElement
  const selStart = input.selectionStart ?? input.value.length
  const selEnd = input.selectionEnd ?? input.value.length
  const before = input.value.slice(0, selStart)
  const after = input.value.slice(selEnd)
  const projected = parseInt(before + e.key + after, 10)

  if (!isNaN(projected) && projected > max) {
    e.preventDefault()
    if (parseInt(input.value, 10) !== max) {
      input.value = String(max)
      emit('update-quantity', props.entry.style_id, colorId, max, props.entry.po_id)
    }
  }
}

const clampOnPaste = (e: ClipboardEvent, colorId: number) => {
  const max = getMaxForColor(colorId)
  if (max == null) return

  const pasted = e.clipboardData?.getData('text') ?? ''
  const val = parseInt(pasted, 10)
  if (!isNaN(val) && val > max) {
    e.preventDefault()
    const input = e.target as HTMLInputElement
    input.value = String(max)
    emit('update-quantity', props.entry.style_id, colorId, max, props.entry.po_id)
  }
}

const handleQuantityChange = (colorId: number, rawQty: number) => {
  let qty = Math.max(0, rawQty)
  const max = getMaxForColor(colorId)
  if (max != null) {
    qty = Math.min(qty, max)
  }
  emit('update-quantity', props.entry.style_id, colorId, qty, props.entry.po_id)
}

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
