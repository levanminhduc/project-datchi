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
        <div
          v-if="hasAnySubArts"
          class="col-12 col-sm-4 col-md-3"
        >
          <AppSelect
            v-model="selectedSubArt"
            :options="subArtOptions"
            label="Tìm theo Sub-art"
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
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Không tìm thấy sub-art
                </q-item-section>
              </q-item>
            </template>
          </AppSelect>
        </div>
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
        :key="`${entry.po_id}_${entry.style_id}_${entry.sub_art_id ?? 'null'}`"
        :entry="entry"
        :color-options="getColorOptionsForStyle(entry.style_id)"
        :po-quantity="getPoQuantity(entry.style_id)"
        :already-ordered="getAlreadyOrdered(entry.style_id)"
        :has-sub-arts="getHasSubArts(entry.style_id)"
        :initial-sub-art-code="entry.sub_art_code"
        @remove="(styleId, poId, subArtId) => $emit('remove-style', styleId, poId, subArtId)"
        @add-color="(styleId, color, poId, subArtId) => $emit('add-color', styleId, color, poId, subArtId)"
        @remove-color="(styleId, colorId, poId, subArtId) => $emit('remove-color', styleId, colorId, poId, subArtId)"
        @update-quantity="(styleId, colorId, qty, poId, subArtId) => $emit('update-quantity', styleId, colorId, qty, poId, subArtId)"
        @update-sub-art="(styleId, poId, subArtId, subArtCode, oldSubArtId) => $emit('update-sub-art', styleId, poId, subArtId, subArtCode, oldSubArtId)"
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
import type { StyleOrderEntry, PurchaseOrderWithItems, OrderedQuantityInfo } from '@/types/thread'
import { styleService } from '@/services/styleService'

const props = withDefaults(defineProps<{
  po: PurchaseOrderWithItems
  entries: StyleOrderEntry[]
  orderedQuantities?: Map<string, OrderedQuantityInfo>
  subArtRequired?: Map<number, boolean>
}>(), {
  orderedQuantities: () => new Map(),
  subArtRequired: () => new Map(),
})

const emit = defineEmits<{
  'remove-po': [poId: number]
  'add-style': [style: { id: number; style_code: string; style_name: string; po_id: number; po_number: string; sub_art_id?: number; sub_art_code?: string }]
  'remove-style': [styleId: number, poId: number | null, subArtId?: number | null]
  'add-color': [styleId: number, color: { color_id: number; color_name: string; hex_code: string; style_color_id: number }, poId: number | null, subArtId?: number | null]
  'remove-color': [styleId: number, colorId: number, poId: number | null, subArtId?: number | null]
  'update-quantity': [styleId: number, colorId: number, quantity: number, poId: number | null, subArtId?: number | null]
  'update-sub-art': [styleId: number, poId: number | null, subArtId: number | null, subArtCode: string | undefined, oldSubArtId: number | null | undefined]
}>()

const selectedStyleId = ref<number | null>(null)
const selectedSubArt = ref<string | null>(null)

const hasAnySubArts = computed(() =>
  props.po.items?.some(item => item.has_sub_arts) ?? false
)

const subArtOptions = computed(() => {
  if (!props.po.items) return []
  const addedStyleIds = new Set(poEntries.value.map(e => e.style_id))
  return props.po.items
    .filter(item => item.sub_arts?.length && !addedStyleIds.has(item.style_id))
    .filter(item => !selectedStyleId.value || item.style_id === selectedStyleId.value)
    .flatMap(item =>
      item.sub_arts!.map(sa => ({
        label: `${sa.code} (${item.style?.style_code ?? '?'})`,
        value: `${item.style_id}_${sa.id}`,
        styleId: item.style_id,
        subArtId: sa.id,
        subArtCode: sa.code,
      }))
    )
})

watch(selectedSubArt, (compositeKey) => {
  if (!compositeKey) return
  const opt = subArtOptions.value.find(o => o.value === compositeKey)
  if (opt) selectedStyleId.value = opt.styleId
})

watch(selectedStyleId, (newStyleId) => {
  if (!selectedSubArt.value) return
  if (!newStyleId) {
    selectedSubArt.value = null
    return
  }
  const opt = subArtOptions.value.find(o => o.value === selectedSubArt.value)
  if (!opt) selectedSubArt.value = null
})

const specColorsCache = ref<Record<number, Array<{ id: number; name: string; hex_code: string }>>>({})

const fetchSpecColors = async (styleId: number) => {
  if (styleId in specColorsCache.value) return
  try {
    const colors = await styleService.getSpecColors(styleId)
    specColorsCache.value[styleId] = colors.map(c => ({ id: c.id, name: c.color_name, hex_code: c.hex_code }))
  } catch (err) {
    console.error(`Error fetching spec colors for style ${styleId}:`, err)
    specColorsCache.value[styleId] = []
  }
}

const poEntries = computed(() => {
  return props.entries.filter((e) => e.po_id === props.po.id)
})

const getPoQuantity = (styleId: number): number | null => {
  const key = `${props.po.id}_${styleId}`
  const info = props.orderedQuantities.get(key)
  if (info) return info.po_quantity
  const poItem = props.po.items?.find((item) => item.style_id === styleId)
  return poItem?.quantity ?? null
}

const getAlreadyOrdered = (styleId: number): number => {
  const key = `${props.po.id}_${styleId}`
  return props.orderedQuantities.get(key)?.ordered_quantity ?? 0
}

const availableStyleOptions = computed(() => {
  if (!props.po.items) return []
  const addedStyleIds = new Set(poEntries.value.map((e) => e.style_id))
  return props.po.items
    .filter((item) => !addedStyleIds.has(item.style_id))
    .filter((item) => item.style)
    .map((item) => {
      const key = `${props.po.id}_${item.style_id}`
      const info = props.orderedQuantities.get(key)
      const remaining = info ? info.remaining_quantity : item.quantity
      return {
        label: `${item.style!.style_code} - ${item.style!.style_name} (SL: ${item.quantity} | Còn lại: ${remaining})`,
        value: item.style_id,
      }
    })
})

const getColorOptionsForStyle = (styleId: number): Array<{ id: number; name: string; hex_code: string }> => {
  return specColorsCache.value[styleId] || []
}

const getHasSubArts = (styleId: number): boolean => {
  if (!props.po.items) return false
  const poItem = props.po.items.find(item => item.style_id === styleId)
  return poItem?.has_sub_arts === true
}

watch(() => props.po.items, (items) => {
  if (!items) return
  for (const item of items) {
    if (item.has_sub_arts !== undefined) {
      props.subArtRequired.set(item.style_id, item.has_sub_arts)
    }
  }
}, { immediate: true })

watch(
  poEntries,
  (entries) => {
    for (const entry of entries) {
      if (!(entry.style_id in specColorsCache.value)) {
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

  const subArtOpt = selectedSubArt.value
    ? subArtOptions.value.find(o => o.value === selectedSubArt.value)
    : undefined

  emit('add-style', {
    id: poItem.style.id,
    style_code: poItem.style.style_code,
    style_name: poItem.style.style_name,
    po_id: props.po.id,
    po_number: props.po.po_number,
    sub_art_id: subArtOpt?.subArtId,
    sub_art_code: subArtOpt?.subArtCode,
  })

  selectedStyleId.value = null
  selectedSubArt.value = null
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
  selectedSubArt.value = null
}
</script>
