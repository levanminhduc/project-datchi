<template>
  <AppDialog
    :model-value="modelValue"
    width="700px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Mượn chỉ cho tuần {{ toWeekName }}
    </template>

    <div class="q-gutter-md">
      <AppSelect
        v-model="form.from_week_id"
        :options="weekOptions"
        label="Mượn từ tuần *"
        :loading="weeksLoading"
        :rules="[val => !!val || 'Vui lòng chọn tuần cho mượn']"
        emit-value
        map-options
      />

      <div v-if="form.from_week_id && !typesLoading && mergedRows.length > 0">
        <div class="text-subtitle2 q-mb-sm">
          Chọn loại chỉ cần mượn
        </div>
        <q-markup-table
          flat
          bordered
          dense
          separator="horizontal"
        >
          <thead>
            <tr>
              <th style="width: 40px" />
              <th class="text-left">
                Loại chỉ
              </th>
              <th class="text-right">
                Nguồn có
              </th>
              <th class="text-right">
                Đích thiếu
              </th>
              <th
                class="text-right"
                style="width: 120px"
              >
                Số mượn
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in mergedRows"
              :key="row.thread_type_id"
              :class="{ 'bg-grey-2': !row.can_borrow }"
            >
              <td>
                <q-checkbox
                  v-model="row.selected"
                  :disable="!row.can_borrow"
                  dense
                  @update:model-value="onCheckboxChange(row)"
                />
              </td>
              <td>{{ row.display_name }}</td>
              <td class="text-right">
                {{ row.source_available }}
              </td>
              <td class="text-right">
                <q-badge
                  :color="row.target_shortage > 0 ? 'orange' : 'grey'"
                  :label="row.target_shortage"
                />
              </td>
              <td class="text-right">
                <AppInput
                  v-if="row.selected"
                  v-model.number="row.quantity"
                  type="number"
                  dense
                  :min="1"
                  :max="row.max_borrowable"
                  :rules="[
                    (v: number) => v > 0 || 'Phải > 0',
                    (v: number) => v <= row.max_borrowable || `Tối đa ${row.max_borrowable}`,
                  ]"
                  style="max-width: 100px"
                />
                <span
                  v-else
                  class="text-grey"
                >—</span>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

      <div
        v-else-if="form.from_week_id && typesLoading"
        class="text-center q-pa-md"
      >
        <q-spinner
          size="24px"
          class="q-mr-sm"
        />
        Đang tải danh sách chỉ...
      </div>

      <div
        v-else-if="form.from_week_id && !typesLoading && mergedRows.length === 0"
        class="text-center q-pa-md text-grey"
      >
        Tuần nguồn không có chỉ khả dụng
      </div>

      <AppInput
        v-model="form.reason"
        label="Lý do"
        type="textarea"
        autogrow
      />
    </div>

    <template #actions>
      <div class="row items-center justify-between full-width">
        <span
          v-if="selectedCount > 0"
          class="text-caption text-grey-7"
        >
          Đã chọn {{ selectedCount }} loại, tổng {{ totalCones }} cuộn
        </span>
        <span v-else />
        <div class="q-gutter-x-sm">
          <AppButton
            v-close-popup
            flat
            label="Hủy"
            :disable="loading"
          />
          <AppButton
            color="primary"
            label="Xác nhận mượn"
            :loading="loading"
            :disable="!isValid"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import { formatThreadTypeDisplay } from '@/utils/thread-format'
import type { ThreadOrderWeek, ReservedCone } from '@/types/thread'

interface MergedRow {
  thread_type_id: number
  code: string
  name: string
  display_name: string
  source_available: number
  target_shortage: number
  max_borrowable: number
  can_borrow: boolean
  selected: boolean
  quantity: number
}

const props = defineProps<{
  modelValue: boolean
  toWeekId: number
  toWeekName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const snackbar = useSnackbar()

const loading = ref(false)
const weeksLoading = ref(false)
const typesLoading = ref(false)
const weeks = ref<ThreadOrderWeek[]>([])
const mergedRows = ref<MergedRow[]>([])

const form = reactive({
  from_week_id: null as number | null,
  reason: '',
})

const selectedCount = computed(() => mergedRows.value.filter(r => r.selected).length)
const totalCones = computed(() =>
  mergedRows.value.filter(r => r.selected).reduce((sum, r) => sum + r.quantity, 0)
)

const isValid = computed(() => {
  if (!form.from_week_id) return false
  const selected = mergedRows.value.filter(r => r.selected)
  if (selected.length === 0) return false
  return selected.every(r => r.quantity > 0 && r.quantity <= r.max_borrowable)
})

const weekOptions = computed(() =>
  weeks.value
    .filter(w => w.id !== props.toWeekId)
    .map(w => ({ label: w.week_name, value: w.id }))
)

const onCheckboxChange = (row: MergedRow) => {
  if (row.selected && row.quantity === 0) {
    row.quantity = 1
  }
}

const resetForm = () => {
  form.from_week_id = null
  form.reason = ''
  mergedRows.value = []
}

const loadWeeks = async () => {
  weeksLoading.value = true
  try {
    weeks.value = await weeklyOrderService.getAll({ status: 'CONFIRMED' })
  } catch {
    weeks.value = []
  } finally {
    weeksLoading.value = false
  }
}

const loadMergedData = async (fromWeekId: number) => {
  typesLoading.value = true
  try {
    const [reservations, targetSummary] = await Promise.all([
      weeklyOrderService.getReservations(fromWeekId),
      weeklyOrderService.getReservationSummary(props.toWeekId),
    ])

    const sourceMap = new Map<number, { code: string; name: string; display_name: string; count: number }>()
    for (const cone of reservations.cones) {
      const tt = cone.thread_type as ReservedCone['thread_type']
      if (!tt) continue
      const existing = sourceMap.get(tt.id)
      if (existing) {
        existing.count++
      } else {
        const displayName = formatThreadTypeDisplay(tt.supplier?.name, tt.tex_number, tt.color?.name, tt.name)
        sourceMap.set(tt.id, { code: tt.code, name: tt.name, display_name: displayName, count: 1 })
      }
    }

    const targetMap = new Map<number, number>()
    for (const s of targetSummary) {
      targetMap.set(s.thread_type_id, Math.max(0, s.shortage))
    }

    const rows: MergedRow[] = []
    for (const [ttId, src] of sourceMap) {
      const targetShortage = targetMap.get(ttId) ?? 0
      const maxBorrowable = Math.min(src.count, targetShortage)
      rows.push({
        thread_type_id: ttId,
        code: src.code,
        name: src.name,
        display_name: src.display_name,
        source_available: src.count,
        target_shortage: targetShortage,
        max_borrowable: maxBorrowable,
        can_borrow: maxBorrowable > 0,
        selected: false,
        quantity: 0,
      })
    }

    mergedRows.value = rows.sort((a, b) => a.code.localeCompare(b.code))
  } catch {
    mergedRows.value = []
  } finally {
    typesLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!isValid.value || !form.from_week_id) return

  const selectedItems = mergedRows.value
    .filter(r => r.selected && r.quantity > 0)
    .map(r => ({
      thread_type_id: r.thread_type_id,
      quantity_cones: r.quantity,
    }))

  if (selectedItems.length === 0) return

  loading.value = true
  try {
    await weeklyOrderService.createBatchLoan(props.toWeekId, {
      from_week_id: form.from_week_id,
      items: selectedItems,
      reason: form.reason || undefined,
    })
    snackbar.success(`Mượn ${selectedItems.length} loại chỉ thành công`)
    emit('created')
    resetForm()
  } catch (err: any) {
    snackbar.error(err?.message || 'Không thể mượn chỉ')
  } finally {
    loading.value = false
  }
}

watch(
  () => form.from_week_id,
  (weekId) => {
    mergedRows.value = []
    if (weekId) {
      loadMergedData(weekId)
    }
  }
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      resetForm()
      loadWeeks()
    }
  }
)
</script>
