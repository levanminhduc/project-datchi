<template>
  <div>
    <!-- Header -->
    <div class="row q-mb-md items-center">
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">
          Định mức theo màu hàng
        </div>
        <div class="text-caption text-grey-6">
          Chọn màu chỉ cụ thể cho từng công đoạn, theo từng màu hàng
        </div>
      </div>
      <div
        v-if="specs.length > 0"
        class="col-auto"
      >
        <q-btn
          color="primary"
          icon="add"
          label="Tạo màu hàng mới"
          unelevated
          dense
          @click="showCreateColorDialog = true"
        />
      </div>
    </div>

    <!-- Empty: no specs yet -->
    <div
      v-if="specs.length === 0"
      class="text-center q-py-xl"
    >
      <q-icon
        name="palette"
        size="xl"
        color="grey-5"
      />
      <p class="text-grey-6 q-mt-md">
        Vui lòng thêm định mức chỉ trước khi thiết lập màu
      </p>
      <q-btn
        outline
        color="primary"
        label="Đi đến Định mức chỉ"
        @click="emit('go-to-specs')"
      />
    </div>

    <!-- Empty: no color groups yet -->
    <div
      v-if="specs.length > 0 && colorGroups.length === 0 && !colorSpecsLoading"
      class="text-center q-py-xl"
    >
      <q-icon
        name="palette"
        size="xl"
        color="grey-5"
      />
      <p class="text-grey-6 q-mt-md">
        Chưa có màu hàng nào. Bấm "Tạo màu hàng mới" để bắt đầu.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="colorSpecsLoading"
      class="row justify-center q-py-xl"
    >
      <q-spinner
        size="lg"
        color="primary"
      />
    </div>

    <!-- Color Groups -->
    <div
      v-else
      class="q-gutter-md"
    >
      <q-card
        v-for="group in colorGroups"
        :key="group.color.id"
        flat
        bordered
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center q-gutter-sm">
            <div
              class="color-swatch-lg"
              :style="{ backgroundColor: group.color.hex_code || '#ccc' }"
            />
            <div
              v-if="hasSubArts && parseColorName(group.color.color_name).subArt"
              class="text-caption text-grey-7"
            >
              {{ parseColorName(group.color.color_name).subArt }}
            </div>
            <div class="text-subtitle2 text-weight-medium">
              {{ parseColorName(group.color.color_name).color }}
            </div>
            <q-space />
            <q-btn
              flat
              round
              dense
              icon="content_copy"
              color="primary"
              size="sm"
              @click="openCloneDialog(group.color.id)"
            >
              <q-tooltip>Copy màu hàng này</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              size="sm"
              @click="handleDeleteColorGroup(group.color)"
            >
              <q-tooltip>Xóa tất cả định mức cho màu này</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <q-card-section>
          <q-table
            :rows="group.rows"
            :columns="colorTableColumns"
            row-key="specId"
            flat
            bordered
            dense
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
          >
            <template #body-cell-stt="props">
              <q-td :props="props">
                {{ props.rowIndex + 1 }}
              </q-td>
            </template>

            <!-- Màu chỉ column - editable via popup -->
            <template #body-cell-thread_color="props">
              <q-td
                :props="props"
                class="cursor-pointer editable-cell"
              >
                <q-spinner-dots
                  v-if="inlineEditLoading[getColorCellKey(props.row.specId, group.color.id)]"
                  size="sm"
                  color="primary"
                />
                <template v-else>
                  <span class="cell-value">
                    {{ getColorDisplayName(props.row) }}
                  </span>
                  <q-icon
                    name="edit"
                    size="xs"
                    class="edit-hint q-ml-xs text-grey-5"
                  />
                  <q-popup-edit
                    v-slot="scope"
                    v-model="props.row.threadColorId"
                    buttons
                    label-set="Lưu"
                    label-cancel="Hủy"
                    @save="(val: number | null, initialVal: number | null) => handleColorSpecEdit(props.row, group.color, val, initialVal)"
                  >
                    <q-select
                      v-model="scope.value"
                      :options="getFilteredColorOptions(props.row.spec)"
                      option-value="value"
                      option-label="label"
                      emit-value
                      map-options
                      dense
                      autofocus
                      clearable
                      use-input
                      fill-input
                      hide-selected
                      label="Chọn màu chỉ"
                      style="min-width: 250px"
                      @filter="(val, update) => filterColorOptions(val, update, props.row.spec)"
                    />
                  </q-popup-edit>
                </template>
              </q-td>
            </template>

            <!-- Chiều dài cuộn column - from thread type -->
            <template #body-cell-meters_per_cone="props">
              <q-td
                :props="props"
                class="text-right"
              >
                {{ props.row.spec.thread_types?.meters_per_cone
                  ? new Intl.NumberFormat('vi-VN').format(props.row.spec.thread_types.meters_per_cone)
                  : '-' }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Create New Color Dialog -->
    <q-dialog v-model="showCreateColorDialog">
      <q-card style="min-width: 350px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">
            Tạo màu hàng mới
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <AppSelect
            v-model="sourceColorId"
            :options="sourceColorOptions"
            label="Copy từ màu hàng (tùy chọn)"
            dense
            clearable
          />
          <AppSelect
            v-if="hasSubArts"
            v-model="selectedSubArt"
            :options="subArts.map(s => ({ label: s.sub_art_code, value: s.sub_art_code }))"
            label="Chọn Sub-Art *"
            dense
            required
          />
          <q-input
            v-model="newColorName"
            label="Tên màu *"
            outlined
            dense
            placeholder="VD: Đỏ đậm, Xanh navy..."
          />
          <div
            v-if="hasSubArts && selectedSubArt && newColorName.trim()"
            class="text-caption text-grey-7 q-mt-xs"
          >
            Tên đầy đủ: <strong>{{ selectedSubArt }} - {{ newColorName.trim() }}</strong>
          </div>
          <q-input
            v-model="newColorHex"
            label="Mã màu (HEX)"
            outlined
            dense
            placeholder="#FFFFFF"
          >
            <template #prepend>
              <div
                class="color-swatch"
                :style="{ backgroundColor: newColorHex || '#ccc' }"
              />
            </template>
            <template #append>
              <q-icon
                name="colorize"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-color v-model="newColorHex" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-separator />

        <q-card-actions
          align="right"
          class="q-pa-md"
        >
          <q-btn
            v-close-popup
            flat
            label="Hủy"
            color="grey"
          />
          <q-btn
            unelevated
            :label="sourceColorId ? 'Copy' : 'Tạo'"
            color="primary"
            :disable="!newColorName.trim() || !newColorHex || (hasSubArts && !selectedSubArt)"
            :loading="creatingColor"
            @click="handleCreateColor"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStyleThreadSpecs, useConfirm, useSnackbar } from '@/composables'
import type { QTableColumn } from 'quasar'
import type { StyleThreadSpec } from '@/types/thread'
import type { StyleColor } from '@/types/thread'
import { styleColorService } from '@/services/styleColorService'
import { supplierService } from '@/services/supplierService'
import { subArtService } from '@/services/subArtService'
import { AppSelect } from '@/components/ui/inputs'

interface Props {
  styleId: number
  specs: StyleThreadSpec[]
  styleColors: StyleColor[]
}

interface ColorGroupColor {
  id: number
  color_name: string
  hex_code: string | null
}

interface ColorSpecRow {
  specId: number
  spec: StyleThreadSpec
  colorSpecId: number | null
  threadColorId: number | null
  threadColor: {
    id: number
    name: string
    hex_code: string
  } | null
}

interface ColorGroup {
  color: ColorGroupColor
  rows: ColorSpecRow[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'go-to-specs': []
  'color-created': []
}>()

const confirm = useConfirm()
const snackbar = useSnackbar()

const {
  colorSpecs,
  fetchAllColorSpecsByStyle,
  addColorSpec,
  updateColorSpec,
  deleteColorSpec,
} = useStyleThreadSpecs()

// Local state
const colorSpecsLoading = ref(false)
const inlineEditLoading = ref<Record<string, boolean>>({})
const showCreateColorDialog = ref(false)
const newColorName = ref('')
const newColorHex = ref('#cccccc')
const creatingColor = ref(false)
const sourceColorId = ref<number | null>(null)

const subArts = ref<{ id: number; sub_art_code: string }[]>([])
const selectedSubArt = ref<string | null>(null)
const hasSubArts = computed(() => subArts.value.length > 0)

const sourceColorOptions = computed(() =>
  props.styleColors
    .filter(c => c.is_active)
    .map(c => ({ label: c.color_name, value: c.id }))
)

const openCloneDialog = (colorId: number) => {
  sourceColorId.value = colorId
  showCreateColorDialog.value = true
}

const supplierColorsCache = ref<Record<number, { id: number; name: string; hex_code: string }[]>>({})

const fetchSupplierColors = async (supplierId: number) => {
  if (supplierColorsCache.value[supplierId]) return
  try {
    const data = await supplierService.getColors(supplierId)
    supplierColorsCache.value[supplierId] = (data as Array<{ color: { id: number; name: string; hex_code: string; is_active: boolean } }>)
      .filter((link: { color: { id: number; name: string; hex_code: string; is_active: boolean } }) => link.color?.is_active)
      .map((link: { color: { id: number; name: string; hex_code: string; is_active: boolean } }) => link.color)
  } catch {
    supplierColorsCache.value[supplierId] = []
  }
}

// Helpers
const getColorCellKey = (specId: number, colorId: number): string =>
  `${specId}-${colorId}`

const getColorDisplayName = (row: ColorSpecRow): string => {
  if (!row.threadColor) return '-'
  return row.threadColor.name
}

const parseColorName = (colorName: string): { subArt: string | null; color: string } => {
  if (!hasSubArts.value) return { subArt: null, color: colorName }
  const idx = colorName.indexOf(' - ')
  if (idx === -1) return { subArt: null, color: colorName }
  return { subArt: colorName.substring(0, idx), color: colorName.substring(idx + 3) }
}

const getColorOptionsForSpec = (spec: StyleThreadSpec): { label: string; value: number }[] => {
  if (!spec.supplier_id) return []
  const colors = supplierColorsCache.value[spec.supplier_id] || []
  return colors.map(c => ({
    label: c.name,
    value: c.id,
  }))
}

const filteredColorOptionsMap = ref<Record<number, { label: string; value: number }[]>>({})
const getFilteredColorOptions = (spec: StyleThreadSpec): { label: string; value: number }[] => {
  if (!spec.supplier_id) return []
  return filteredColorOptionsMap.value[spec.supplier_id] ?? getColorOptionsForSpec(spec)
}
const filterColorOptions = (val: string, update: (fn: () => void) => void, spec: StyleThreadSpec) => {
  update(() => {
    const allOptions = getColorOptionsForSpec(spec)
    if (!val) {
      filteredColorOptionsMap.value[spec.supplier_id] = allOptions
      return
    }
    const needle = val.toLowerCase()
    filteredColorOptionsMap.value[spec.supplier_id] = allOptions.filter(o => o.label.toLowerCase().includes(needle))
  })
}

const colorGroups = computed<ColorGroup[]>(() => {
  if (props.specs.length === 0) return []

  const activeColors = props.styleColors.filter(c => c.is_active)

  return activeColors.map(colorData => {
    const rows: ColorSpecRow[] = props.specs.map(spec => {
      const match = colorSpecs.value.find(
        cs => cs.style_thread_spec_id === spec.id && cs.style_color_id === colorData.id
      )

      return {
        specId: spec.id,
        spec,
        colorSpecId: match?.id ?? null,
        threadColorId: match?.thread_color_id ?? null,
        threadColor: match?.thread_color ? {
          id: match.thread_color.id,
          name: match.thread_color.name,
          hex_code: match.thread_color.hex_code,
        } : null,
      }
    })

    return {
      color: {
        id: colorData.id,
        color_name: colorData.color_name,
        hex_code: colorData.hex_code,
      },
      rows,
    }
  }).sort((a, b) => a.color.color_name.localeCompare(b.color.color_name))
})

// Table columns
const colorTableColumns: QTableColumn[] = [
  {
    name: 'stt',
    label: 'STT',
    field: '',
    align: 'center',
    style: 'width: 50px',
  },
  {
    name: 'process_name',
    label: 'Công đoạn',
    field: (row: ColorSpecRow) => row.spec.process_name,
    align: 'left',
  },
  {
    name: 'supplier',
    label: 'NCC',
    field: (row: ColorSpecRow) => row.spec.suppliers?.name || '-',
    align: 'left',
  },
  {
    name: 'tex',
    label: 'Tex',
    field: (row: ColorSpecRow) => row.spec.thread_types?.tex_label || row.spec.thread_types?.tex_number || '-',
    align: 'left',
  },
  {
    name: 'meters_per_unit',
    label: 'Định mức (Mét/SP)',
    field: (row: ColorSpecRow) => row.spec.meters_per_unit?.toFixed(2) || '-',
    align: 'right',
  },
  {
    name: 'meters_per_cone',
    label: 'Chiều dài cuộn (Mét)',
    field: (row: ColorSpecRow) => row.spec.thread_types?.meters_per_cone ?? null,
    align: 'right',
  },
  {
    name: 'thread_color',
    label: 'Màu chỉ',
    field: 'thread_color',
    align: 'left',
  },
]

// Load data
const loadColorSpecs = async () => {
  colorSpecsLoading.value = true
  try {
    await fetchAllColorSpecsByStyle(props.styleId)
  } finally {
    colorSpecsLoading.value = false
  }
}

onMounted(async () => {
  await loadColorSpecs()
  const supplierIds = [...new Set(props.specs.map(s => s.supplier_id).filter(Boolean))]
  await Promise.all([
    ...supplierIds.map(id => fetchSupplierColors(id)),
    subArtService.getByStyleId(props.styleId).then(data => { subArts.value = data }).catch(() => { subArts.value = [] }),
  ])
})

watch(() => props.styleId, loadColorSpecs)

watch(showCreateColorDialog, (val) => {
  if (!val) {
    selectedSubArt.value = null
    newColorName.value = ''
    newColorHex.value = '#cccccc'
    sourceColorId.value = null
  }
})

// Handlers
const handleCreateColor = async () => {
  const colorPart = newColorName.value.trim()
  if (!colorPart || !newColorHex.value) return

  if (hasSubArts.value && !selectedSubArt.value) return

  const finalColorName = hasSubArts.value && selectedSubArt.value
    ? `${selectedSubArt.value} - ${colorPart}`
    : colorPart

  const isClone = !!sourceColorId.value
  creatingColor.value = true
  try {
    let newColor: StyleColor | null = null

    if (isClone) {
      newColor = await styleColorService.clone(props.styleId, {
        source_color_id: sourceColorId.value!,
        color_name: finalColorName,
        hex_code: newColorHex.value,
      })
    } else {
      newColor = await styleColorService.create(props.styleId, {
        color_name: finalColorName,
        hex_code: newColorHex.value,
      })
    }

    if (newColor) {
      showCreateColorDialog.value = false
      newColorName.value = ''
      newColorHex.value = '#cccccc'
      selectedSubArt.value = null
      sourceColorId.value = null
      emit('color-created')
      await loadColorSpecs()
      snackbar.success(isClone ? 'Copy màu hàng thành công' : 'Tạo màu mới thành công')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tạo màu mới'
    snackbar.error(message)
  } finally {
    creatingColor.value = false
  }
}

const handleDeleteColorGroup = async (color: ColorGroupColor) => {
  const confirmed = await confirm.confirmDelete({
    itemName: `tất cả định mức màu cho "${color.color_name}"`,
  })

  if (!confirmed) return

  const toDelete = colorSpecs.value.filter(cs => cs.style_color_id === color.id)

  for (const cs of toDelete) {
    await deleteColorSpec(cs.id)
  }

  // Re-fetch to sync
  await loadColorSpecs()
}

/**
 * Handle inline edit of "Màu chỉ" column.
 * - New mapping (colorSpecId is null, new value selected) → CREATE with thread_type_id
 * - Existing mapping updated → UPDATE with thread_type_id
 * - Existing mapping cleared → UPDATE with thread_color_id: null, keep thread_type_id
 */
const handleColorSpecEdit = async (
  row: ColorSpecRow,
  color: ColorGroupColor,
  newValue: number | null,
  originalValue: number | null
) => {
  if (newValue === originalValue) return

  const cellKey = getColorCellKey(row.specId, color.id)
  inlineEditLoading.value[cellKey] = true

  const threadTypeId = row.spec.thread_type_id ?? undefined

  try {
    if (row.colorSpecId === null && newValue !== null) {
      await addColorSpec(row.specId, {
        style_thread_spec_id: row.specId,
        style_color_id: color.id,
        thread_color_id: newValue,
        thread_type_id: threadTypeId,
      })
    } else if (row.colorSpecId !== null && newValue !== null) {
      await updateColorSpec(row.colorSpecId, {
        thread_color_id: newValue,
        thread_type_id: threadTypeId,
      })
    } else if (row.colorSpecId !== null && newValue === null) {
      await updateColorSpec(row.colorSpecId, {
        thread_color_id: null,
        thread_type_id: threadTypeId,
      })
    }

  } catch {
    // Error notification handled by composable
    // Revert the optimistic v-model update
    row.threadColorId = originalValue
  } finally {
    inlineEditLoading.value[cellKey] = false
  }
}
</script>

<style scoped>
.color-swatch-lg {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.editable-cell:hover .edit-hint {
  opacity: 1 !important;
}

.edit-hint {
  opacity: 0;
  transition: opacity 0.2s;
}
</style>
