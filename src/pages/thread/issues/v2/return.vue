<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { date } from 'quasar'
import { useReturnV2 } from '@/composables/thread/useReturnV2'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { ReturnGroup } from '@/types/thread/issueV2'

const {
  returnGroups,
  selectedGroup,
  returnLogs,
  isLoading,
  completionInfo,
  loadReturnGroups,
  selectGroup,
  submitGroupedReturn,
  validateReturnQuantities,
  confirmBatchCompletion,
  clearCompletionInfo,
} = useReturnV2()

const selectedGroupKey = ref<string | null>(null)
const returnInputs = ref<Map<number, { full: number; partial: number }>>(new Map())
const validationErrors = ref<string[]>([])
const showWeekDialog = ref(false)
const selectedWeekIds = ref<number[]>([])

const pendingWeeks = computed(() => completionInfo.value?.pending_selection || [])

const groupOptions = computed(() =>
  returnGroups.value.map((g) => ({
    value: g.group_key,
    label: `${g.po_number} / ${g.style_code} / ${g.color_name} (${g.issue_count} phiếu)`,
  }))
)

const hasReturnInputs = computed(() => {
  for (const [, v] of returnInputs.value) {
    if (v.full > 0 || v.partial > 0) return true
  }
  return false
})

function formatDate(dateStr: string) {
  return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
}

function getReturnInput(threadTypeId: number) {
  if (!returnInputs.value.has(threadTypeId)) {
    returnInputs.value.set(threadTypeId, { full: 0, partial: 0 })
  }
  return returnInputs.value.get(threadTypeId)!
}

function handleReset() {
  returnInputs.value = new Map()
  validationErrors.value = []
}

async function handleSubmit() {
  if (!selectedGroup.value) return

  const lines = Array.from(returnInputs.value.entries()).map(([ttId, v]) => ({
    thread_type_id: ttId,
    returned_full: v.full || 0,
    returned_partial: v.partial || 0,
  }))

  const validation = validateReturnQuantities(lines, selectedGroup.value.threads)
  if (!validation.valid) {
    validationErrors.value = validation.errors
    return
  }

  validationErrors.value = []
  const result = await submitGroupedReturn(selectedGroup.value, lines)
  handleReset()

  if (result?.completion_info?.pending_selection?.length) {
    selectedWeekIds.value = result.completion_info.pending_selection.map((w) => w.week_id)
    showWeekDialog.value = true
  }
}

async function handleConfirmWeeks() {
  const itemIds: number[] = []
  for (const week of pendingWeeks.value) {
    if (selectedWeekIds.value.includes(week.week_id)) {
      itemIds.push(...week.item_ids)
    }
  }
  await confirmBatchCompletion(itemIds)
  showWeekDialog.value = false
}

function handleDismissDialog() {
  showWeekDialog.value = false
  clearCompletionInfo()
}

watch(selectedGroupKey, (key) => {
  const group = key ? returnGroups.value.find((g: ReturnGroup) => g.group_key === key) || null : null
  selectGroup(group)
  handleReset()
})

onMounted(() => {
  loadReturnGroups()
})
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-ma-none">
        Nhập Lại Chỉ
      </h5>
    </div>

    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <AppSelect
          v-model="selectedGroupKey"
          :options="groupOptions"
          label="Chọn nhóm PO / Style / Màu"
          :loading="isLoading"
          clearable
          use-input
          fill-input
          hide-selected
          style="max-width: 600px"
        />
      </q-card-section>
    </q-card>

    <q-card
      v-if="selectedGroup"
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">
          {{ selectedGroup.po_number }} / {{ selectedGroup.style_code }} / {{ selectedGroup.color_name }}
          <q-badge
            color="blue-grey"
            class="q-ml-sm"
          >
            {{ selectedGroup.issue_count }} phiếu
          </q-badge>
        </div>
      </q-card-section>

      <q-card-section>
        <q-banner
          v-if="validationErrors.length > 0"
          class="bg-negative text-white q-mb-md"
          rounded
        >
          <div
            v-for="(err, i) in validationErrors"
            :key="i"
          >
            {{ err }}
          </div>
        </q-banner>

        <q-table
          :rows="selectedGroup.threads"
          :columns="[
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' as const },
            { name: 'outstanding_full', label: 'Còn nguyên', field: 'outstanding_full', align: 'center' as const },
            { name: 'outstanding_partial', label: 'Còn lẻ', field: 'outstanding_partial', align: 'center' as const },
            { name: 'return_full', label: 'Trả nguyên', field: 'outstanding_full', align: 'center' as const },
            { name: 'return_partial', label: 'Trả lẻ', field: 'outstanding_partial', align: 'center' as const },
          ]"
          row-key="thread_type_id"
          flat
          bordered
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
        >
          <template #body-cell-thread="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ props.row.thread_name }}
              </div>
              <div class="text-caption text-grey-6">
                {{ props.row.thread_code }}
              </div>
            </q-td>
          </template>

          <template #body-cell-return_full="props">
            <q-td :props="props">
              <AppInput
                v-model.number="getReturnInput(props.row.thread_type_id).full"
                type="number"
                dense
                :min="0"
                :max="props.row.outstanding_full"
                style="max-width: 80px"
              />
            </q-td>
          </template>

          <template #body-cell-return_partial="props">
            <q-td :props="props">
              <AppInput
                v-model.number="getReturnInput(props.row.thread_type_id).partial"
                type="number"
                dense
                :min="0"
                :max="props.row.outstanding_partial"
                style="max-width: 80px"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
        <AppButton
          variant="flat"
          label="Đặt lại"
          @click="handleReset"
        />
        <AppButton
          label="Nhập lại kho"
          color="primary"
          :loading="isLoading"
          :disable="!hasReturnInputs"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>

    <q-card
      v-if="selectedGroup && returnLogs.length > 0"
      flat
      bordered
      class="q-mt-md"
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">
          Lịch Sử Trả Kho
        </div>
        <q-table
          :rows="returnLogs"
          :columns="[
            { name: 'index', label: '#', field: 'id', align: 'center' as const },
            { name: 'issue_code', label: 'Phiếu', field: 'issue_code', align: 'left' as const },
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' as const },
            { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' as const },
            { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' as const },
            { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' as const },
          ]"
          row-key="id"
          flat
          bordered
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
        >
          <template #body-cell-index="props">
            <q-td :props="props">
              {{ props.rowIndex + 1 }}
            </q-td>
          </template>
          <template #body-cell-thread="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ props.row.thread_name }}
              </div>
              <div class="text-caption text-grey-6">
                {{ props.row.thread_code }}
              </div>
            </q-td>
          </template>
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="!isLoading && !selectedGroupKey"
      flat
      bordered
    >
      <q-card-section class="text-center text-grey q-pa-xl">
        <q-icon
          name="assignment_return"
          size="64px"
          class="q-mb-md"
        />
        <div>Chọn một nhóm PO / Style / Màu để nhập lại chỉ về kho</div>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="isLoading && selectedGroupKey"
      flat
      bordered
    >
      <q-card-section class="text-center q-pa-xl">
        <q-spinner
          color="primary"
          size="48px"
        />
        <div class="q-mt-md text-grey">
          Đang tải...
        </div>
      </q-card-section>
    </q-card>

    <q-dialog
      v-model="showWeekDialog"
      persistent
    >
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            Đánh dấu hoàn tất xuất chỉ
          </div>
          <div class="text-body2 text-grey q-mt-sm">
            PO-Style-Màu này có nhiều tuần. Chọn tuần muốn đánh dấu hoàn tất:
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-for="week in pendingWeeks"
            :key="week.week_id"
            class="q-mb-sm"
          >
            <q-checkbox
              :model-value="selectedWeekIds.includes(week.week_id)"
              :label="week.week_name"
              @update:model-value="(val: boolean | null) => {
                if (val) selectedWeekIds.push(week.week_id)
                else selectedWeekIds.splice(selectedWeekIds.indexOf(week.week_id), 1)
              }"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <AppButton
            variant="flat"
            label="Bỏ qua"
            @click="handleDismissDialog"
          />
          <AppButton
            label="Xác nhận"
            color="primary"
            :disable="selectedWeekIds.length === 0"
            @click="handleConfirmWeeks"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
