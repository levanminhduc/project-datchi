<template>
  <AppCard
    flat
    bordered
    class="q-mb-md"
  >
    <q-card-section>
      <!-- PO Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-subtitle2 text-weight-bold text-primary">
            PO: {{ po.po_number }}
          </div>
          <div
            v-if="po.customer_name"
            class="text-caption text-grey-7"
          >
            {{ po.customer_name }}
          </div>
        </div>
        <AppButton
          flat
          round
          dense
          icon="delete_outline"
          color="negative"
          size="sm"
          @click="$emit('remove-po', po.id)"
        >
          <AppTooltip>Xóa PO</AppTooltip>
        </AppButton>
      </div>

      <!-- Add style from PO items -->
      <div class="row q-col-gutter-sm q-mb-md items-end">
        <div class="col-12 col-sm-6 col-md-4">
          <AppSelect
            v-model="selectedStyleId"
            :options="availableStyleOptions"
            label="Thêm mã hàng từ PO"
            dense
            use-input
            fill-input
            hide-selected
            hide-bottom-space
            clearable
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{ (po.items?.length ?? 0) === 0 ? 'PO chưa có mã hàng' : 'Đã thêm hết mã hàng' }}
                </q-item-section>
              </q-item>
            </template>
          </AppSelect>
        </div>
        <div class="col-auto">
          <AppButton
            color="primary"
            icon="add"
            label="Thêm"
            dense
            :disable="!selectedStyleId"
            @click="handleAddStyle"
          />
        </div>
        <div class="col-auto">
          <AppButton
            flat
            dense
            icon="playlist_add"
            color="secondary"
            label="Thêm tất cả"
            :disable="availableStyleOptions.length === 0"
            @click="handleAddAllStyles"
          />
        </div>
      </div>

      <!-- Style cards within this PO -->
      <StyleOrderCard
        v-for="entry in poEntries"
        :key="`${entry.po_id}_${entry.style_id}`"
        :entry="entry"
        :color-options="getColorOptionsForStyle(entry.style_id)"
        @remove="(styleId, poId) => $emit('remove-style', styleId, poId)"
        @add-color="(styleId, color, poId) => $emit('add-color', styleId, color, poId)"
        @remove-color="(styleId, colorId, poId) => $emit('remove-color', styleId, colorId, poId)"
        @update-quantity="(styleId, colorId, qty, poId) => $emit('update-quantity', styleId, colorId, qty, poId)"
      />

      <EmptyState
        v-if="poEntries.length === 0"
        icon="style"
        title="Chưa chọn mã hàng"
        subtitle="Chọn mã hàng từ danh sách PO items bên trên"
        icon-color="grey-4"
        class="q-py-sm"
      />
    </q-card-section>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import StyleOrderCard from './StyleOrderCard.vue'
import type { StyleOrderEntry, PurchaseOrderWithItems } from '@/types/thread'
import { styleService } from '@/services/styleService'

const props = defineProps<{
  po: PurchaseOrderWithItems
  entries: StyleOrderEntry[]
}>()

const emit = defineEmits<{
  'remove-po': [poId: number]
  'add-style': [style: { id: number; style_code: string; style_name: string; po_id: number; po_number: string }]
  'remove-style': [styleId: number, poId: number | null]
  'add-color': [styleId: number, color: { color_id: number; color_name: string; hex_code: string }, poId: number | null]
  'remove-color': [styleId: number, colorId: number, poId: number | null]
  'update-quantity': [styleId: number, colorId: number, quantity: number, poId: number | null]
}>()

const selectedStyleId = ref<number | null>(null)

// Cache spec-colors per style_id
const specColorsCache = ref(new Map<number, Array<{ id: number; name: string; hex_code: string }>>())

// Fetch spec-colors for a style and store in cache
const fetchSpecColors = async (styleId: number) => {
  if (specColorsCache.value.has(styleId)) return
  try {
    const colors = await styleService.getSpecColors(styleId)
    specColorsCache.value.set(styleId, colors)
  } catch (err) {
    console.error(`Error fetching spec colors for style ${styleId}:`, err)
    specColorsCache.value.set(styleId, [])
  }
}

// Filter entries that belong to this PO
const poEntries = computed(() => {
  return props.entries.filter((e) => e.po_id === props.po.id)
})

// Style options from PO items that haven't been added yet
const availableStyleOptions = computed(() => {
  if (!props.po.items) return []
  const addedStyleIds = new Set(poEntries.value.map((e) => e.style_id))
  return props.po.items
    .filter((item) => !addedStyleIds.has(item.style_id))
    .filter((item) => item.style)
    .map((item) => ({
      label: `${item.style!.style_code} - ${item.style!.style_name} (SL: ${item.quantity})`,
      value: item.style_id,
    }))
})

/**
 * Get color options for a specific style (from spec-colors cache)
 */
const getColorOptionsForStyle = (styleId: number): Array<{ id: number; name: string; hex_code: string }> => {
  return specColorsCache.value.get(styleId) || []
}

// Watch poEntries to fetch spec-colors for new styles
watch(
  poEntries,
  (entries) => {
    for (const entry of entries) {
      if (!specColorsCache.value.has(entry.style_id)) {
        fetchSpecColors(entry.style_id)
      }
    }
  },
  { immediate: true },
)

const handleAddStyle = () => {
  if (!selectedStyleId.value || !props.po.items) return
  const poItem = props.po.items.find((item) => item.style_id === selectedStyleId.value)
  if (!poItem?.style) return

  emit('add-style', {
    id: poItem.style.id,
    style_code: poItem.style.style_code,
    style_name: poItem.style.style_name,
    po_id: props.po.id,
    po_number: props.po.po_number,
  })

  selectedStyleId.value = null
}

const handleAddAllStyles = () => {
  if (!props.po.items) return
  const addedStyleIds = new Set(poEntries.value.map((e) => e.style_id))

  for (const item of props.po.items) {
    if (addedStyleIds.has(item.style_id) || !item.style) continue

    emit('add-style', {
      id: item.style.id,
      style_code: item.style.style_code,
      style_name: item.style.style_name,
      po_id: props.po.id,
      po_number: props.po.po_number,
    })
  }
}
</script>
