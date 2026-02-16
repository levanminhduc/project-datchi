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
          label="Thêm màu hàng"
          unelevated
          dense
          @click="showAddColorDialog = true"
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
      v-else-if="colorGroups.length === 0 && !colorSpecsLoading"
      class="text-center q-py-xl"
    >
      <q-icon
        name="palette"
        size="xl"
        color="grey-5"
      />
      <p class="text-grey-6 q-mt-md">
        Chưa có màu hàng nào. Bấm "Thêm màu hàng" để bắt đầu.
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
            <div class="text-subtitle2 text-weight-medium">
              {{ group.color.name }}
            </div>
            <q-space />
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
                    {{ getThreadDisplayName(props.row) }}
                  </span>
                  <q-icon
                    name="edit"
                    size="xs"
                    class="edit-hint q-ml-xs text-grey-5"
                  />
                  <q-popup-edit
                    v-slot="scope"
                    v-model="props.row.threadTypeId"
                    buttons
                    label-set="Lưu"
                    label-cancel="Hủy"
                    @save="(val: number | null, initialVal: number | null) => handleColorSpecEdit(props.row, group.color, val, initialVal)"
                  >
                    <q-select
                      v-model="scope.value"
                      :options="getThreadOptionsForSpec(props.row.spec)"
                      option-value="value"
                      option-label="label"
                      emit-value
                      map-options
                      dense
                      autofocus
                      clearable
                      label="Chọn màu chỉ"
                      style="min-width: 250px"
                    />
                  </q-popup-edit>
                </template>
              </q-td>
            </template>

            <!-- Chiều dài cuộn column - auto-fill from thread type -->
            <template #body-cell-meters_per_cone="props">
              <q-td
                :props="props"
                class="text-right"
              >
                {{ props.row.threadType?.meters_per_cone != null
                  ? Number(props.row.threadType.meters_per_cone).toLocaleString()
                  : '-' }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Add Color Dialog -->
    <q-dialog v-model="showAddColorDialog">
      <q-card style="min-width: 350px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">
            Thêm màu hàng
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

        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-btn-toggle
              v-model="showNewColorForm"
              spread
              no-caps
              unelevated
              toggle-color="primary"
              :options="[
                { label: 'Chọn màu có sẵn', value: false },
                { label: 'Tạo màu mới', value: true },
              ]"
              class="full-width"
              dense
            />
          </div>

          <!-- Mode 1: Select existing color -->
          <div v-if="!showNewColorForm">
            <q-select
              v-model="selectedNewColorId"
              :options="availableColorOptions"
              label="Chọn màu hàng"
              outlined
              dense
              emit-value
              map-options
            >
              <template #option="{ itemProps, opt }">
                <q-item v-bind="itemProps">
                  <q-item-section side>
                    <div
                      class="color-swatch"
                      :style="{ backgroundColor: getColorHex(opt.value) }"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Mode 2: Create new color manually -->
          <div
            v-else
            class="q-gutter-sm"
          >
            <q-input
              v-model="newColorName"
              label="Tên màu *"
              outlined
              dense
              placeholder="VD: Đỏ đậm, Xanh navy..."
            />
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
          </div>
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
            v-if="!showNewColorForm"
            unelevated
            label="Thêm"
            color="primary"
            :disable="!selectedNewColorId"
            @click="handleAddColor"
          />
          <q-btn
            v-else
            unelevated
            label="Tạo &amp; Thêm"
            color="primary"
            :disable="!newColorName.trim() || !newColorHex"
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
import type { ThreadType } from '@/types/thread'
import type { Color } from '@/types/thread'
import { colorService } from '@/services/colorService'

interface Props {
  styleId: number
  specs: StyleThreadSpec[]
  threadTypes: ThreadType[]
  colors: Color[]
}

interface ColorGroupColor {
  id: number
  name: string
  hex_code: string | null
}

interface ColorSpecRow {
  specId: number
  spec: StyleThreadSpec
  colorSpecId: number | null
  threadTypeId: number | null
  threadType: {
    id: number
    name: string
    color_data?: { name: string; hex_code: string } | null
    meters_per_cone: number | null
    tex_number: string
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
const showAddColorDialog = ref(false)
const selectedNewColorId = ref<number | null>(null)
const addedColors = ref<number[]>([]) // Manually added colors not yet in DB
const showNewColorForm = ref(false)
const newColorName = ref('')
const newColorHex = ref('#cccccc')
const creatingColor = ref(false)

// Helpers
const getColorCellKey = (specId: number, colorId: number): string =>
  `${specId}-${colorId}`

const getColorHex = (colorId: number): string => {
  const c = props.colors.find(cl => cl.id === colorId)
  return c?.hex_code || '#ccc'
}

const getThreadDisplayName = (row: ColorSpecRow): string => {
  if (!row.threadType) return '-'
  return row.threadType.color_data?.name || row.threadType.name || '-'
}

/**
 * Get thread type dropdown options for a given spec row.
 * Filters by BOTH supplier_id AND tex_number (bug fix from previous version).
 */
const getThreadOptionsForSpec = (spec: StyleThreadSpec): { label: string; value: number }[] => {
  if (!spec.supplier_id) return []

  const specTexNumber = spec.thread_types?.tex_number
  if (!specTexNumber) return []

  return props.threadTypes
    .filter(t =>
      t.supplier_id === spec.supplier_id &&
      t.tex_number !== null &&
      String(t.tex_number) === String(specTexNumber) &&
      t.is_active
    )
    .map(t => ({
      label: `${t.color_data?.name || t.name || t.code}`,
      value: t.id,
    }))
}

// Computed: unique color IDs that have data in colorSpecs or were manually added
const usedColorIds = computed<number[]>(() => {
  const fromDb = new Set(colorSpecs.value.map(cs => cs.color_id))
  const fromManual = new Set(addedColors.value)
  return [...new Set([...fromDb, ...fromManual])]
})

// Computed: color groups built from colorSpecs + addedColors + specs
const colorGroups = computed<ColorGroup[]>(() => {
  const groups: ColorGroup[] = []

  for (const colorId of usedColorIds.value) {
    const colorData = props.colors.find(c => c.id === colorId)
    if (!colorData) continue

    const rows: ColorSpecRow[] = props.specs.map(spec => {
      // Find matching color spec for this (spec, color) combination
      const match = colorSpecs.value.find(
        cs => cs.style_thread_spec_id === spec.id && cs.color_id === colorId
      )

      return {
        specId: spec.id,
        spec,
        colorSpecId: match?.id ?? null,
        threadTypeId: match?.thread_type_id ?? null,
        threadType: match?.thread_types
          ? {
              id: match.thread_types.id,
              name: match.thread_types.name,
              color_data: match.thread_types.color_data ?? null,
              meters_per_cone: match.thread_types.meters_per_cone ?? null,
              tex_number: match.thread_types.tex_number,
            }
          : null,
      }
    })

    groups.push({
      color: {
        id: colorData.id,
        name: colorData.name,
        hex_code: colorData.hex_code,
      },
      rows,
    })
  }

  return groups.sort((a, b) => a.color.name.localeCompare(b.color.name))
})

// Available colors for "add color" dialog (exclude already-used)
const availableColorOptions = computed(() =>
  props.colors
    .filter(c => c.is_active && !usedColorIds.value.includes(c.id))
    .map(c => ({ label: c.name, value: c.id }))
)

// Table columns
const colorTableColumns: QTableColumn[] = [
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
    field: (row: ColorSpecRow) => row.spec.thread_types?.tex_number || '-',
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
    field: 'meters_per_cone',
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

onMounted(loadColorSpecs)

watch(() => props.styleId, loadColorSpecs)

// Handlers
const handleAddColor = () => {
  if (!selectedNewColorId.value) return

  addedColors.value.push(selectedNewColorId.value)
  showAddColorDialog.value = false
  selectedNewColorId.value = null
}

const handleCreateColor = async () => {
  if (!newColorName.value.trim() || !newColorHex.value) return
  creatingColor.value = true
  try {
    const newColor = await colorService.create({
      name: newColorName.value.trim(),
      hex_code: newColorHex.value,
    })
    addedColors.value.push(newColor.id)
    showNewColorForm.value = false
    newColorName.value = ''
    newColorHex.value = '#cccccc'
    showAddColorDialog.value = false
    emit('color-created')
    snackbar.success('Tạo màu mới thành công')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tạo màu mới'
    snackbar.error(message)
  } finally {
    creatingColor.value = false
  }
}

const handleDeleteColorGroup = async (color: ColorGroupColor) => {
  const confirmed = await confirm.confirmDelete({
    itemName: `tất cả định mức màu cho "${color.name}"`,
  })

  if (!confirmed) return

  // Find all color specs for this color
  const toDelete = colorSpecs.value.filter(cs => cs.color_id === color.id)

  for (const cs of toDelete) {
    await deleteColorSpec(cs.id)
  }

  // Remove from addedColors if manually added
  addedColors.value = addedColors.value.filter(id => id !== color.id)

  // Re-fetch to sync
  await loadColorSpecs()
}

/**
 * Handle inline edit of "Màu chỉ" column.
 * - New mapping (colorSpecId is null, new value selected) → CREATE
 * - Existing mapping updated → UPDATE
 * - Existing mapping cleared → DELETE
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

  try {
    if (row.colorSpecId === null && newValue !== null) {
      // CREATE new color spec
      await addColorSpec(row.specId, {
        style_thread_spec_id: row.specId,
        color_id: color.id,
        thread_type_id: newValue,
      })
    } else if (row.colorSpecId !== null && newValue !== null) {
      // UPDATE existing
      await updateColorSpec(row.colorSpecId, {
        thread_type_id: newValue,
      })
    } else if (row.colorSpecId !== null && newValue === null) {
      // DELETE (cleared)
      await deleteColorSpec(row.colorSpecId)
    }

    // Re-fetch to get updated joined data
    await fetchAllColorSpecsByStyle(props.styleId)
  } catch {
    // Error notification handled by composable
    // Revert the optimistic v-model update
    row.threadTypeId = originalValue
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
