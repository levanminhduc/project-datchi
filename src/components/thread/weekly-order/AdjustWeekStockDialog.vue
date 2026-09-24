<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 560px">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">
          Điều chỉnh tồn kho theo số đếm thực tế
        </div>
        <div
          v-if="row"
          class="text-caption text-grey-7"
        >
          {{ row.thread_type_name }} — {{ row.thread_color || 'Không màu' }}
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-4">
            <div class="text-caption text-grey-7">
              Tồn kho hệ thống
            </div>
            <div class="text-h6">
              {{ currentCones }} cuộn
            </div>
          </div>
          <div class="col-4">
            <AppInput
              v-model.number="actualCones"
              label="Số đếm thực tế"
              type="number"
              min="0"
              outlined
              dense
            />
          </div>
          <div class="col-4">
            <div class="text-caption text-grey-7">
              Sẽ loại bỏ
            </div>
            <div
              class="text-h6"
              :class="writeOffCones > 0 ? 'text-negative' : 'text-grey-6'"
            >
              {{ writeOffCones > 0 ? writeOffCones : 0 }} cuộn
            </div>
          </div>
        </div>

        <q-banner
          v-if="lockedCones > 0"
          dense
          class="bg-blue-1 text-blue-9 q-mb-md"
        >
          <template #avatar>
            <q-icon name="info" />
          </template>
          Còn {{ lockedCones }} cuộn đã xuất, đã chuyển đi hoặc đã loại bỏ — những cuộn này không nằm trong tồn kho trên và không bị đụng tới.
        </q-banner>

        <q-banner
          v-if="actualCones > currentCones"
          dense
          class="bg-red-1 text-red-9 q-mb-md"
        >
          <template #avatar>
            <q-icon name="error" />
          </template>
          Số đếm thực tế lớn hơn tồn kho hệ thống. Muốn thêm cuộn thì phải nhập kho theo đơn giao hàng.
        </q-banner>

        <AppInput
          v-model="reason"
          label="Lý do điều chỉnh"
          type="textarea"
          rows="2"
          outlined
          dense
          class="q-mb-md"
        />

        <div
          v-if="previewCones.length > 0"
          class="text-caption text-grey-7 q-mb-xs"
        >
          Các cuộn sẽ bị loại bỏ (mới nhất trước)
        </div>
        <q-markup-table
          v-if="previewCones.length > 0"
          dense
          flat
          bordered
          style="max-height: 220px"
        >
          <thead>
            <tr>
              <th class="text-left">
                Mã cuộn
              </th>
              <th class="text-left">
                Kho
              </th>
              <th class="text-left">
                Ngày nhập
              </th>
              <th class="text-left">
                Lô
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cone in previewCones"
              :key="cone.id"
            >
              <td>{{ cone.cone_id }}</td>
              <td>{{ cone.warehouse_name || '—' }}</td>
              <td>{{ cone.received_date || '—' }}</td>
              <td>{{ cone.lot_number || '—' }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>

      <q-card-actions align="right">
        <AppButton
          flat
          label="Đóng"
          @click="emit('update:modelValue', false)"
        />
        <AppButton
          color="negative"
          label="Xác nhận điều chỉnh"
          :loading="isSubmitting"
          :disable="!canSubmit"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { weeklyOrderStockAdjustService } from '@/services/weeklyOrderStockAdjustService'
import { ApiError } from '@/services/api'
import type { StockAdjustConeRow } from '@/services/weeklyOrderStockAdjustService'
import type { AggregatedRow } from '@/types/thread'

const props = defineProps<{
  modelValue: boolean
  weekId: number
  row: AggregatedRow | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  adjusted: []
}>()

const snackbar = useSnackbar()

const currentCones = ref(0)
const lockedCones = ref(0)
const actualCones = ref(0)
const reason = ref('')
const previewCones = ref<StockAdjustConeRow[]>([])
const isSubmitting = ref(false)

let previewTimer: ReturnType<typeof setTimeout> | null = null

const writeOffCones = computed(() => currentCones.value - actualCones.value)

const canSubmit = computed(
  () => writeOffCones.value > 0 && reason.value.trim().length > 0 && !isSubmitting.value,
)

async function loadPreview(target: number) {
  if (!props.row) return
  try {
    const result = await weeklyOrderStockAdjustService.preview(
      props.weekId,
      props.row.thread_type_id,
      props.row.thread_color_id ?? null,
      target,
    )
    currentCones.value = result.current_cones
    lockedCones.value = result.locked_cones
    previewCones.value = result.cones
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể xem trước điều chỉnh tồn kho')
  }
}

async function handleSubmit() {
  if (!props.row || !canSubmit.value) return

  isSubmitting.value = true
  try {
    const result = await weeklyOrderStockAdjustService.adjust(
      props.weekId,
      props.row.thread_type_id,
      props.row.thread_color_id ?? null,
      actualCones.value,
      reason.value.trim(),
      currentCones.value,
    )
    snackbar.success(`Đã loại bỏ ${result.written_off} cuộn, tồn kho còn ${actualCones.value} cuộn`)
    emit('adjusted')
    emit('update:modelValue', false)
  } catch (error) {
    snackbar.error(error instanceof Error ? error.message : 'Không thể điều chỉnh tồn kho')
    if (error instanceof ApiError && error.status === 409) {
      await loadPreview(actualCones.value)
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.row) return
    const initial = props.row.inventory_cones ?? 0
    currentCones.value = initial
    lockedCones.value = 0
    actualCones.value = initial
    reason.value = ''
    previewCones.value = []
    loadPreview(initial)
  },
)

watch(actualCones, (value) => {
  if (previewTimer) clearTimeout(previewTimer)
  if (!props.modelValue || value == null || value < 0) return
  previewTimer = setTimeout(() => loadPreview(value), 300)
})
</script>
